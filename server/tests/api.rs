//! End-to-end checks of the API against an in-memory database: the whole
//! path from sign-up to account deletion, and each guard on the way.

use axum::body::Body;
use axum::http::{header, Request, StatusCode};
use http_body_util::BodyExt;
use politiskel_server::{app, migrate, set_admin, AppState, Signup};
use serde_json::{json, Value};
use sqlx::sqlite::SqlitePoolOptions;
use tower::ServiceExt;

/// A stand-in for site/build: a home page and the fallback page, written once.
fn test_site() -> std::path::PathBuf {
    static DIR: std::sync::OnceLock<std::path::PathBuf> = std::sync::OnceLock::new();
    DIR.get_or_init(|| {
        let dir = std::env::temp_dir().join(format!("politiskel-test-site-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(dir.join("index.html"), "<!doctype html><title>Politiskel</title>").unwrap();
        std::fs::write(dir.join("200.html"), "<!doctype html><title>Politiskel</title>").unwrap();
        dir
    }).clone()
}

async fn server() -> axum::Router { server_with(false).await }

async fn server_with(trust_proxy: bool) -> axum::Router { server_full(trust_proxy, Signup::Open).await }

async fn server_full(trust_proxy: bool, signup: Signup) -> axum::Router {
    // One connection: an in-memory SQLite database lives per connection.
    let db = SqlitePoolOptions::new().max_connections(1)
        .connect("sqlite::memory:").await.unwrap();
    sqlx::query("PRAGMA foreign_keys = ON").execute(&db).await.unwrap();
    migrate(&db).await.unwrap();
    app(AppState::new(db, test_site(), true)
        .trusting_proxy(trust_proxy).with_signup(signup))
}

/// A client that keeps its session cookie between requests.
struct Client { app: axum::Router, cookie: Option<String>, headers: Vec<(&'static str, String)> }

impl Client {
    fn new(app: &axum::Router) -> Self { Self { app: app.clone(), cookie: None, headers: vec![] } }

    fn from_ip(app: &axum::Router, ip: &str) -> Self {
        let mut c = Self::new(app);
        c.headers.push(("x-forwarded-for", format!("10.9.9.9, {ip}")));
        c
    }

    async fn call(&mut self, method: &str, uri: &str, body: Option<Value>) -> (StatusCode, Value) {
        let mut req = Request::builder().method(method).uri(uri);
        if let Some(c) = &self.cookie { req = req.header(header::COOKIE, c); }
        for (k, v) in &self.headers { req = req.header(*k, v); }
        let req = match body {
            Some(b) => req.header(header::CONTENT_TYPE, "application/json").body(Body::from(b.to_string())),
            None => req.body(Body::empty()),
        }.unwrap();
        let res = self.app.clone().oneshot(req).await.unwrap();
        let status = res.status();
        if let Some(set) = res.headers().get(header::SET_COOKIE) {
            let pair = set.to_str().unwrap().split(';').next().unwrap().to_string();
            self.cookie = if pair.ends_with('=') { None } else { Some(pair) };
        }
        let bytes = res.into_body().collect().await.unwrap().to_bytes();
        (status, serde_json::from_slice(&bytes).unwrap_or(Value::Null))
    }

    async fn register(&mut self, name: &str) -> StatusCode {
        self.call("POST", "/api/register",
                  Some(json!({ "username": name, "password": "correct horse battery", "consent": true })))
            .await.0
    }
}

#[tokio::test]
async fn sign_up_requires_consent_and_a_real_password() {
    let app = server().await;
    let mut c = Client::new(&app);
    let (s, b) = c.call("POST", "/api/register",
        Some(json!({ "username": "Zoé", "password": "correct horse battery", "consent": false }))).await;
    assert_eq!((s, b["error"].as_str()), (StatusCode::BAD_REQUEST, Some("consent_required")));
    let (s, b) = c.call("POST", "/api/register",
        Some(json!({ "username": "Zoé", "password": "short", "consent": true }))).await;
    assert_eq!((s, b["error"].as_str()), (StatusCode::BAD_REQUEST, Some("password_short")));
    assert_eq!(c.register("Zoé").await, StatusCode::CREATED);
    // usernames are unique regardless of case
    assert_eq!(Client::new(&app).register("zoé").await, StatusCode::CONFLICT);
}

#[tokio::test]
async fn sessions_sign_in_and_out() {
    let app = server().await;
    let mut c = Client::new(&app);
    c.register("Ben").await;
    assert_eq!(c.call("GET", "/api/me", None).await.0, StatusCode::OK);
    assert_eq!(c.call("POST", "/api/logout", None).await.0, StatusCode::NO_CONTENT);
    assert_eq!(c.call("GET", "/api/me", None).await.0, StatusCode::UNAUTHORIZED);
    let (s, b) = c.call("POST", "/api/login",
        Some(json!({ "username": "ben", "password": "correct horse battery" }))).await;
    assert_eq!((s, b["username"].as_str()), (StatusCode::OK, Some("Ben")));
    assert_eq!(c.call("GET", "/api/me", None).await.0, StatusCode::OK);
}

#[tokio::test]
async fn repeated_failed_logins_are_paused() {
    let app = server().await;
    Client::new(&app).register("Line").await;
    let mut c = Client::new(&app);
    for _ in 0..5 {
        let (s, _) = c.call("POST", "/api/login", Some(json!({ "username": "Line", "password": "nope nope nope" }))).await;
        assert_eq!(s, StatusCode::UNAUTHORIZED);
    }
    // even the right password waits out the pause
    let (s, b) = c.call("POST", "/api/login",
        Some(json!({ "username": "Line", "password": "correct horse battery" }))).await;
    assert_eq!((s, b["error"].as_str()), (StatusCode::TOO_MANY_REQUESTS, Some("too_many_attempts")));
    // an unknown name fails like a wrong password, revealing nothing
    let (s, b) = c.call("POST", "/api/login", Some(json!({ "username": "Nobody", "password": "whatever123" }))).await;
    assert_eq!((s, b["error"].as_str()), (StatusCode::UNAUTHORIZED, Some("bad_credentials")));
}

#[tokio::test]
async fn groups_show_profiles_to_members_only() {
    let app = server().await;
    let (mut a, mut b, mut out) = (Client::new(&app), Client::new(&app), Client::new(&app));
    a.register("Adrien").await;
    b.register("Baptiste").await;
    out.register("Outsider").await;

    let (s, g) = a.call("POST", "/api/groups", Some(json!({ "name": "Les copains" }))).await;
    assert_eq!(s, StatusCode::CREATED);
    let (gid, invite) = (g["id"].as_str().unwrap().to_string(), g["invite"].as_str().unwrap().to_string());
    assert_eq!(invite.len(), 32);

    a.call("PUT", "/api/me/profile",
           Some(json!({ "politiscales": { "com": 60, "cap": 20 }, "answers": { "ess.gincdif": 0 } }))).await;
    assert_eq!(b.call("POST", "/api/groups/join", Some(json!({ "code": invite }))).await.0, StatusCode::OK);
    assert_eq!(b.call("POST", "/api/groups/join", Some(json!({ "code": "nope" }))).await.0, StatusCode::NOT_FOUND);

    let (s, list) = b.call("GET", &format!("/api/groups/{gid}/profiles"), None).await;
    assert_eq!(s, StatusCode::OK);
    let names: Vec<&str> = list.as_array().unwrap().iter().map(|p| p["username"].as_str().unwrap()).collect();
    assert_eq!(names, ["Adrien", "Baptiste"]);
    assert_eq!(list[0]["answers"]["ess.gincdif"], 0);
    assert_eq!(list[1]["me"], true);

    // a non-member cannot tell the group from one that does not exist
    let (s, e) = out.call("GET", &format!("/api/groups/{gid}/profiles"), None).await;
    assert_eq!((s, e["error"].as_str()), (StatusCode::NOT_FOUND, Some("no_such_group")));
    let (s, _) = out.call("GET", "/api/groups/999/profiles", None).await;
    assert_eq!(s, StatusCode::NOT_FOUND);

    // leaving: the last member out takes the group with them
    b.call("POST", &format!("/api/groups/{gid}/leave"), None).await;
    assert_eq!(b.call("GET", &format!("/api/groups/{gid}/profiles"), None).await.0, StatusCode::NOT_FOUND);
    a.call("POST", &format!("/api/groups/{gid}/leave"), None).await;
    assert_eq!(a.call("GET", "/api/me", None).await.1["groups"], json!([]));
}

#[tokio::test]
async fn profile_updates_are_checked() {
    let app = server().await;
    let mut c = Client::new(&app);
    c.register("Hippo").await;
    let put = |v: Value| v;
    for (body, err) in [
        (put(json!({ "politiscales": { "com": 70, "cap": 40 } })), "politiscales_over_hundred"),
        (put(json!({ "politiscales": { "who": 1 } })), "politiscales_unknown_pole"),
        (put(json!({ "answers": { "ess.gincdif": 99 } })), "answers_bad_value"),
        (put(json!({ "answers": [1, 2] })), "answers_not_object"),
    ] {
        let (s, b) = c.call("PUT", "/api/me/profile", Some(body)).await;
        assert_eq!((s, b["error"].as_str()), (StatusCode::BAD_REQUEST, Some(err)));
    }
    let (s, p) = c.call("PUT", "/api/me/profile",
        Some(json!({ "answers": { "ess.gincdif": 2, "issp.obey": "dk" } }))).await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(p["answers"]["issp.obey"], "dk");
    assert_eq!(p["politiscales"], Value::Null);
    // the flag: a PNG data URL, or null to clear it; nothing else
    let (s, p) = c.call("PUT", "/api/me/profile", Some(json!({ "flag": "data:image/png;base64,iVBORw0KGgo=" }))).await;
    assert_eq!((s, p["flag"].as_str()), (StatusCode::OK, Some("data:image/png;base64,iVBORw0KGgo=")));
    let (s, b) = c.call("PUT", "/api/me/profile", Some(json!({ "flag": "javascript:alert(1)" }))).await;
    assert_eq!((s, b["error"].as_str()), (StatusCode::BAD_REQUEST, Some("flag_not_png")));
    let (_, p) = c.call("PUT", "/api/me/profile", Some(json!({ "flag": null }))).await;
    assert_eq!(p["flag"], Value::Null);
    // answers alone leave PolitiScales values as they were, null clears them
    c.call("PUT", "/api/me/profile", Some(json!({ "politiscales": { "com": 50 } }))).await;
    let (_, p) = c.call("PUT", "/api/me/profile", Some(json!({ "answers": {} }))).await;
    assert_eq!(p["politiscales"]["com"], 50);
    let (_, p) = c.call("PUT", "/api/me/profile", Some(json!({ "politiscales": null }))).await;
    assert_eq!(p["politiscales"], Value::Null);
}

#[tokio::test]
async fn export_and_deletion_cover_everything() {
    let app = server().await;
    let (mut a, mut b) = (Client::new(&app), Client::new(&app));
    a.register("Theo").await;
    b.register("Victor").await;
    let (_, g) = a.call("POST", "/api/groups", Some(json!({ "name": "Deux" }))).await;
    b.call("POST", "/api/groups/join", Some(json!({ "code": g["invite"] }))).await;
    a.call("PUT", "/api/me/profile", Some(json!({ "answers": { "ess.gincdif": 1 } }))).await;

    let (s, e) = a.call("GET", "/api/me/export", None).await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(e["format"], "politiskel-account");
    assert_eq!(e["profile"]["answers"]["ess.gincdif"], 1);
    assert!(e["consent_at"].as_i64().unwrap() > 0);

    // deletion wants the password again
    let (s, _) = a.call("DELETE", "/api/me", Some(json!({ "password": "wrong password" }))).await;
    assert_eq!(s, StatusCode::UNAUTHORIZED);
    let (s, _) = a.call("DELETE", "/api/me", Some(json!({ "password": "correct horse battery" }))).await;
    assert_eq!(s, StatusCode::NO_CONTENT);
    assert_eq!(a.call("GET", "/api/me", None).await.0, StatusCode::UNAUTHORIZED);

    // gone from the group, and the name is free again
    let gid = g["id"].as_str().unwrap().to_string();
    let (_, list) = b.call("GET", &format!("/api/groups/{gid}/profiles"), None).await;
    assert_eq!(list.as_array().unwrap().len(), 1);
    assert_eq!(Client::new(&app).register("Theo").await, StatusCode::CREATED);
}

#[tokio::test]
async fn the_page_is_served_with_security_headers() {
    let app = server().await;
    let res = app.oneshot(Request::get("/").body(Body::empty()).unwrap()).await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let h = res.headers();
    assert!(h.get(header::CONTENT_SECURITY_POLICY).unwrap().to_str().unwrap().contains("frame-ancestors 'none'"));
    assert_eq!(h.get(header::X_CONTENT_TYPE_OPTIONS).unwrap(), "nosniff");
}

#[tokio::test]
async fn session_cookie_is_locked_down() {
    let app = server().await;
    let req = Request::post("/api/register").header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(json!({ "username": "Krmn", "password": "correct horse battery", "consent": true }).to_string()))
        .unwrap();
    let res = app.oneshot(req).await.unwrap();
    let set = res.headers().get(header::SET_COOKIE).unwrap().to_str().unwrap().to_string();
    for part in ["HttpOnly", "Secure", "SameSite=Strict", "Path=/"] {
        assert!(set.contains(part), "{part} missing from {set}");
    }
}


#[tokio::test]
async fn a_burst_of_parallel_guesses_is_still_capped() {
    let app = server().await;
    Client::new(&app).register("Jc").await;
    let tries = (0..20).map(|_| {
        let app = app.clone();
        tokio::spawn(async move {
            let mut c = Client::new(&app);
            c.call("POST", "/api/login", Some(json!({ "username": "Jc", "password": "guess guess guess" }))).await.0
        })
    });
    let codes: Vec<StatusCode> = futures_join(tries).await;
    let wrong = codes.iter().filter(|s| **s == StatusCode::UNAUTHORIZED).count();
    assert!(wrong <= 5, "{wrong} passwords were checked, the cap is 5");
    assert!(codes.iter().all(|s| *s == StatusCode::UNAUTHORIZED || *s == StatusCode::TOO_MANY_REQUESTS));
}

async fn futures_join<T>(handles: impl Iterator<Item = tokio::task::JoinHandle<T>>) -> Vec<T> {
    let mut out = vec![];
    for h in handles.collect::<Vec<_>>() { out.push(h.await.unwrap()); }
    out
}

#[tokio::test]
async fn a_forged_forwarded_for_line_is_not_trusted() {
    let app = server_with(true).await;
    Client::new(&app).register("Victor").await;
    // the client sends its own line first; the proxy adds the real address last
    for n in 0..6 {
        let mut c = Client::new(&app);
        c.headers.push(("x-forwarded-for", format!("198.51.100.{n}")));
        c.headers.push(("x-forwarded-for", "203.0.113.9".into()));
        c.call("POST", "/api/login", Some(json!({ "username": "Victor", "password": "wrong wrong wrong" }))).await;
    }
    let mut c = Client::new(&app);
    c.headers.push(("x-forwarded-for", "198.51.100.200".into()));
    c.headers.push(("x-forwarded-for", "203.0.113.9".into()));
    let (s, _) = c.call("POST", "/api/login",
        Some(json!({ "username": "Victor", "password": "correct horse battery" }))).await;
    assert_eq!(s, StatusCode::TOO_MANY_REQUESTS, "a fresh first line must not buy fresh attempts");
}

#[tokio::test]
async fn many_addresses_cannot_lock_the_owner_out() {
    let app = server_with(true).await;
    Client::from_ip(&app, "192.0.2.1").register("Baptiste").await;
    for n in 0..30 {
        Client::from_ip(&app, &format!("203.0.113.{n}")).call("POST", "/api/login",
            Some(json!({ "username": "Baptiste", "password": "wrong wrong wrong" }))).await;
    }
    let (s, _) = Client::from_ip(&app, "192.0.2.1").call("POST", "/api/login",
        Some(json!({ "username": "Baptiste", "password": "correct horse battery" }))).await;
    assert_eq!(s, StatusCode::OK);
}

#[tokio::test]
async fn ipv6_neighbours_share_a_limit() {
    let app = server_with(true).await;
    Client::new(&app).register("Ben").await;
    for n in 0..5 {
        Client::from_ip(&app, &format!("2001:db8:1:2::{n:x}")).call("POST", "/api/login",
            Some(json!({ "username": "Ben", "password": "wrong wrong wrong" }))).await;
    }
    let (s, _) = Client::from_ip(&app, "2001:db8:1:2::ffff").call("POST", "/api/login",
        Some(json!({ "username": "Ben", "password": "correct horse battery" }))).await;
    assert_eq!(s, StatusCode::TOO_MANY_REQUESTS);
}

#[tokio::test]
async fn a_configured_origin_replaces_the_host_check() {
    let db = SqlitePoolOptions::new().max_connections(1).connect("sqlite::memory:").await.unwrap();
    migrate(&db).await.unwrap();
    let app = app(AppState::new(db, test_site(), true)
        .with_origin(Some("https://politiskel.example.org/".into())));
    // behind nginx, Host arrives as the upstream address
    let mut c = Client { app: app.clone(), cookie: None, headers: vec![
        ("host", "127.0.0.1:8080".into()), ("origin", "https://politiskel.example.org".into())] };
    assert_eq!(c.register("Line").await, StatusCode::CREATED);
    let mut evil = Client { app: app.clone(), cookie: None, headers: vec![
        ("host", "127.0.0.1:8080".into()), ("origin", "http://127.0.0.1:8080".into())] };
    assert_eq!(evil.register("Theo").await, StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn guessing_from_one_address_does_not_lock_the_owner_out() {
    let app = server_with(true).await;
    Client::from_ip(&app, "192.0.2.1").register("Theo").await;
    let mut attacker = Client::from_ip(&app, "203.0.113.66");
    for _ in 0..6 {
        attacker.call("POST", "/api/login", Some(json!({ "username": "Theo", "password": "not his password" }))).await;
    }
    let (s, _) = attacker.call("POST", "/api/login",
        Some(json!({ "username": "Theo", "password": "correct horse battery" }))).await;
    assert_eq!(s, StatusCode::TOO_MANY_REQUESTS);
    let (s, _) = Client::from_ip(&app, "192.0.2.1").call("POST", "/api/login",
        Some(json!({ "username": "Theo", "password": "correct horse battery" }))).await;
    assert_eq!(s, StatusCode::OK);
}

#[tokio::test]
async fn look_alike_names_cannot_both_exist() {
    let app = server().await;
    assert_eq!(Client::new(&app).register("Zoé").await, StatusCode::CREATED);
    for twin in ["ZOÉ", "Zoe", "zoe\u{0301}"] {
        assert_eq!(Client::new(&app).register(twin).await, StatusCode::CONFLICT, "{twin}");
    }
    let (s, b) = Client::new(&app).call("POST", "/api/register",
        Some(json!({ "username": "\u{0417}oé", "password": "correct horse battery", "consent": true }))).await;
    assert_eq!((s, b["error"].as_str()), (StatusCode::BAD_REQUEST, Some("username_chars")));
    let (s, b) = Client::new(&app).call("POST", "/api/login",
        Some(json!({ "username": "ZOE", "password": "correct horse battery" }))).await;
    assert_eq!((s, b["username"].as_str()), (StatusCode::OK, Some("Zoé")));
}

#[tokio::test]
async fn writes_from_another_origin_are_refused() {
    let app = server().await;
    let mut c = Client::new(&app);
    c.register("Hippo").await;
    let (_, g) = c.call("POST", "/api/groups", Some(json!({ "name": "G" }))).await;
    let gid = g["id"].as_str().unwrap().to_string();
    let mut evil = Client { app: app.clone(), cookie: c.cookie.clone(),
        headers: vec![("host", "politiskel.example.org".into()), ("origin", "https://evil.example.org".into())] };
    let (s, b) = evil.call("POST", &format!("/api/groups/{gid}/leave"), None).await;
    assert_eq!((s, b["error"].as_str()), (StatusCode::FORBIDDEN, Some("cross_origin")));
    let mut sibling = Client { app: app.clone(), cookie: c.cookie.clone(),
        headers: vec![("sec-fetch-site", "same-site".into())] };
    assert_eq!(sibling.call("POST", "/api/logout", None).await.0, StatusCode::FORBIDDEN);
    let mut same = Client { app: app.clone(), cookie: c.cookie.clone(),
        headers: vec![("host", "politiskel.example.org".into()), ("origin", "https://politiskel.example.org".into())] };
    assert_eq!(same.call("POST", &format!("/api/groups/{gid}/leave"), None).await.0, StatusCode::NO_CONTENT);
}

#[tokio::test]
async fn an_invitation_can_be_read_before_it_is_accepted() {
    let app = server().await;
    let (mut a, mut b) = (Client::new(&app), Client::new(&app));
    a.register("Krmn").await;
    let (_, g) = a.call("POST", "/api/groups", Some(json!({ "name": "Atelier" }))).await;
    let code = g["invite"].as_str().unwrap();
    assert_eq!(b.call("GET", &format!("/api/invites/{code}"), None).await.0, StatusCode::UNAUTHORIZED);
    b.register("Line").await;
    let (s, p) = b.call("GET", &format!("/api/invites/{code}"), None).await;
    assert_eq!((s, p["name"].as_str(), p["members"].as_i64(), p["member"].as_bool()),
               (StatusCode::OK, Some("Atelier"), Some(1), Some(false)));
    // reading it joined nothing
    assert_eq!(b.call("GET", "/api/me", None).await.1["groups"], json!([]));
}

#[tokio::test]
async fn site_paths_serve_the_page_and_unknown_api_paths_do_not() {
    let app = server().await;
    for path in ["/connexion", "/groupes", "/compte", "/rejoindre/abc", "/questionnaire/economy"] {
        let res = app.clone().oneshot(Request::get(path).body(Body::empty()).unwrap()).await.unwrap();
        assert_eq!(res.status(), StatusCode::OK, "{path}");
    }
    let res = app.clone().oneshot(Request::get("/api/nope").body(Body::empty()).unwrap()).await.unwrap();
    assert_eq!(res.status(), StatusCode::NOT_FOUND);
    let res = app.oneshot(Request::post("/groupes").body(Body::empty()).unwrap()).await.unwrap();
    assert_eq!(res.status(), StatusCode::NOT_FOUND);
}

/// A group created by `owner`, joined by the others; returns (id, invite).
async fn group_of(owner: &mut Client, others: &mut [&mut Client]) -> (String, String) {
    let (_, g) = owner.call("POST", "/api/groups", Some(json!({ "name": "Les copains" }))).await;
    let (id, invite) = (g["id"].as_str().unwrap().to_string(), g["invite"].as_str().unwrap().to_string());
    for c in others.iter_mut() {
        assert_eq!(c.call("POST", "/api/groups/join", Some(json!({ "code": invite }))).await.0, StatusCode::OK);
    }
    (id, invite)
}

#[tokio::test]
async fn only_the_owner_manages_a_group() {
    let app = server().await;
    let (mut ben, mut zoe, mut jc) = (Client::new(&app), Client::new(&app), Client::new(&app));
    ben.register("Ben").await; zoe.register("Zoé").await; jc.register("Jc").await;
    let (gid, old) = group_of(&mut ben, &mut [&mut zoe, &mut jc]).await;
    let (_, me) = ben.call("GET", "/api/me", None).await;
    assert_eq!(me["groups"][0]["owner"], json!(true));
    let (_, me) = zoe.call("GET", "/api/me", None).await;
    assert_eq!(me["groups"][0]["owner"], json!(false));

    // a member who is not the owner is refused, an outsider sees no group
    let uri = format!("/api/groups/{gid}/invite");
    assert_eq!(zoe.call("POST", &uri, None).await.0, StatusCode::FORBIDDEN);
    let mut out = Client::new(&app); out.register("Line").await;
    assert_eq!(out.call("POST", &uri, None).await.0, StatusCode::NOT_FOUND);

    // a new link retires the old one
    let (s, b) = ben.call("POST", &uri, None).await;
    assert_eq!(s, StatusCode::OK);
    let new = b["invite"].as_str().unwrap().to_string();
    assert_ne!(new, old);
    assert_eq!(out.call("POST", "/api/groups/join", Some(json!({ "code": old }))).await.0, StatusCode::NOT_FOUND);

    // removing a member takes the group out of their sight
    let rm = format!("/api/groups/{gid}/remove");
    assert_eq!(zoe.call("POST", &rm, Some(json!({ "username": "Jc" }))).await.0, StatusCode::FORBIDDEN);
    assert_eq!(ben.call("POST", &rm, Some(json!({ "username": "Ben" }))).await.0, StatusCode::NOT_FOUND);
    assert_eq!(ben.call("POST", &rm, Some(json!({ "username": "jc" }))).await.0, StatusCode::NO_CONTENT);
    let list = format!("/api/groups/{gid}/profiles");
    assert_eq!(jc.call("GET", &list, None).await.0, StatusCode::NOT_FOUND);
    let (_, p) = ben.call("GET", &list, None).await;
    assert_eq!(p.as_array().unwrap().len(), 2);
    assert_eq!(p.as_array().unwrap().iter().filter(|m| m["owner"] == json!(true)).count(), 1);

    // handing over, then deleting: only the new owner can
    let own = format!("/api/groups/{gid}/owner");
    assert_eq!(ben.call("POST", &own, Some(json!({ "username": "Zoé" }))).await.0, StatusCode::NO_CONTENT);
    let del = format!("/api/groups/{gid}");
    assert_eq!(ben.call("DELETE", &del, None).await.0, StatusCode::FORBIDDEN);
    assert_eq!(zoe.call("DELETE", &del, None).await.0, StatusCode::NO_CONTENT);
    assert_eq!(ben.call("GET", &list, None).await.0, StatusCode::NOT_FOUND);
    // profiles outlive the group
    assert_eq!(ben.call("GET", "/api/me", None).await.0, StatusCode::OK);
}

#[tokio::test]
async fn an_owner_leaving_or_deleting_hands_the_group_over() {
    let app = server().await;
    let (mut ben, mut zoe, mut jc) = (Client::new(&app), Client::new(&app), Client::new(&app));
    ben.register("Ben").await; zoe.register("Zoé").await; jc.register("Jc").await;
    let (gid, _) = group_of(&mut ben, &mut [&mut zoe, &mut jc]).await;
    assert_eq!(ben.call("POST", &format!("/api/groups/{gid}/leave"), None).await.0, StatusCode::NO_CONTENT);
    // the longest-standing member takes over
    let (_, me) = zoe.call("GET", "/api/me", None).await;
    assert_eq!(me["groups"][0]["owner"], json!(true));
    // and when that owner deletes their account, the next one does
    let (s, _) = zoe.call("DELETE", "/api/me", Some(json!({ "password": "correct horse battery" }))).await;
    assert_eq!(s, StatusCode::NO_CONTENT);
    let (_, me) = jc.call("GET", "/api/me", None).await;
    assert_eq!(me["groups"][0]["owner"], json!(true));
    assert_eq!(jc.call("POST", &format!("/api/groups/{gid}/invite"), None).await.0, StatusCode::OK);
}

#[tokio::test]
async fn sign_ups_are_limited_per_address() {
    let app = server_with(true).await;
    for n in 0..5 {
        assert_eq!(Client::from_ip(&app, "198.51.100.7").register(&format!("Membre {n}")).await, StatusCode::CREATED);
    }
    let mut c = Client::from_ip(&app, "198.51.100.7");
    let (s, b) = c.call("POST", "/api/register",
        Some(json!({ "username": "Encore", "password": "correct horse battery", "consent": true }))).await;
    assert_eq!((s, b["error"].as_str()), (StatusCode::TOO_MANY_REQUESTS, Some("too_many_signups")));
    // another address is not held back
    assert_eq!(Client::from_ip(&app, "198.51.100.8").register("Ailleurs").await, StatusCode::CREATED);
}

#[tokio::test]
async fn a_closed_site_opens_accounts_only_on_invitation() {
    let app = server_full(false, Signup::Invite).await;
    let (_, cfg) = Client::new(&app).call("GET", "/api/config", None).await;
    assert_eq!((&cfg["signup"], &cfg["empty"]), (&json!("invite"), &json!(true)));
    // the first account is let in, to create the first group
    let mut host = Client::new(&app);
    assert_eq!(host.register("Hôte").await, StatusCode::CREATED);
    let (_, g) = host.call("POST", "/api/groups", Some(json!({ "name": "Premier" }))).await;
    let invite = g["invite"].as_str().unwrap().to_string();
    let mut c = Client::new(&app);
    let (s, b) = c.call("POST", "/api/register",
        Some(json!({ "username": "Zoé", "password": "correct horse battery", "consent": true }))).await;
    assert_eq!((s, b["error"].as_str()), (StatusCode::FORBIDDEN, Some("signup_invite_only")));
    let (s, _) = c.call("POST", "/api/register", Some(json!({ "username": "Zoé",
        "password": "correct horse battery", "consent": true, "invite": "0123456789abcdef0123456789abcdef" }))).await;
    assert_eq!(s, StatusCode::FORBIDDEN);
    // a live invitation opens the door, without joining by itself
    let (s, _) = c.call("POST", "/api/register", Some(json!({ "username": "Zoé",
        "password": "correct horse battery", "consent": true, "invite": invite }))).await;
    assert_eq!(s, StatusCode::CREATED);
    let (_, me) = c.call("GET", "/api/me", None).await;
    assert_eq!(me["groups"].as_array().unwrap().len(), 0);
}

#[tokio::test]
async fn changing_the_password_signs_out_everywhere_else() {
    let app = server().await;
    let mut here = Client::new(&app);
    here.register("Ben").await;
    let mut there = Client::new(&app);
    let login = json!({ "username": "Ben", "password": "correct horse battery" });
    assert_eq!(there.call("POST", "/api/login", Some(login)).await.0, StatusCode::OK);
    let (s, _) = here.call("POST", "/api/me/password",
        Some(json!({ "current": "wrong wrong wrong", "new": "another good password" }))).await;
    assert_eq!(s, StatusCode::UNAUTHORIZED);
    let (s, _) = here.call("POST", "/api/me/password",
        Some(json!({ "current": "correct horse battery", "new": "short" }))).await;
    assert_eq!(s, StatusCode::BAD_REQUEST);
    let (s, _) = here.call("POST", "/api/me/password",
        Some(json!({ "current": "correct horse battery", "new": "another good password" }))).await;
    assert_eq!(s, StatusCode::NO_CONTENT);
    assert_eq!(here.call("GET", "/api/me", None).await.0, StatusCode::OK);
    assert_eq!(there.call("GET", "/api/me", None).await.0, StatusCode::UNAUTHORIZED);
    let mut again = Client::new(&app);
    let (s, _) = again.call("POST", "/api/login",
        Some(json!({ "username": "Ben", "password": "another good password" }))).await;
    assert_eq!(s, StatusCode::OK);
    // and ending the other sessions keeps this one
    assert_eq!(here.call("DELETE", "/api/me/sessions/others", None).await.0, StatusCode::NO_CONTENT);
    assert_eq!(here.call("GET", "/api/me", None).await.0, StatusCode::OK);
    assert_eq!(again.call("GET", "/api/me", None).await.0, StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn a_built_site_is_served_page_by_page() {
    let dir = std::env::temp_dir().join(format!("politiskel-site-{}", std::process::id()));
    std::fs::create_dir_all(dir.join("_app/immutable")).unwrap();
    for (f, body) in [("index.html", "home"), ("connexion.html", "sign-in"), ("200.html", "fallback"),
                      ("_app/immutable/app.1a2b.js", "js"), ("robots.txt", "robots"), (".secret", "no")] {
        std::fs::write(dir.join(f), body).unwrap();
    }
    let db = SqlitePoolOptions::new().max_connections(1).connect("sqlite::memory:").await.unwrap();
    migrate(&db).await.unwrap();
    let app = app(AppState::new(db, dir.clone(), true));
    let get = |uri: &'static str| {
        let app = app.clone();
        async move {
            let res = app.oneshot(Request::builder().uri(uri).body(Body::empty()).unwrap()).await.unwrap();
            let status = res.status();
            let cache = res.headers().get(header::CACHE_CONTROL).map(|v| v.to_str().unwrap().to_string());
            let body = res.into_body().collect().await.unwrap().to_bytes();
            (status, String::from_utf8_lossy(&body).to_string(), cache)
        }
    };
    assert_eq!(get("/").await.1, "home");
    let (s, body, cache) = get("/connexion").await;
    assert_eq!((s, body.as_str(), cache.as_deref()), (StatusCode::OK, "sign-in", Some("no-cache")));
    // an address with an id routes in the browser, from the fallback page
    assert_eq!(get("/boussole/zoe").await.1, "fallback");
    assert_eq!(get("/rejoindre/0123abcd").await.1, "fallback");
    let (_, body, cache) = get("/_app/immutable/app.1a2b.js").await;
    assert_eq!((body.as_str(), cache.as_deref()), ("js", Some("public, max-age=31536000, immutable")));
    assert_eq!(get("/robots.txt").await.1, "robots");
    // a missing file is a 404, not the fallback page
    assert_eq!(get("/favicon.ico").await.0, StatusCode::NOT_FOUND);
    assert_eq!(get("/_app/immutable/gone.js").await.0, StatusCode::NOT_FOUND);
    // but a member whose name holds a dot is still an address
    assert_eq!(get("/boussole/jean.dupont").await.1, "fallback");
    // no hidden file, no way out of the directory, and the API keeps its 404s
    assert_eq!(get("/.secret").await.0, StatusCode::NOT_FOUND);
    assert_eq!(get("/_app/../.secret").await.0, StatusCode::NOT_FOUND);
    let (s, body, _) = get("/api/nope").await;
    assert_eq!((s, body.contains("not_found")), (StatusCode::NOT_FOUND, true));
    std::fs::remove_dir_all(&dir).ok();
}

#[tokio::test]
async fn a_listed_group_can_be_asked_to_join_and_only_its_owner_answers() {
    let app = server().await;
    let (mut ben, mut zoe, mut jc) = (Client::new(&app), Client::new(&app), Client::new(&app));
    ben.register("Ben").await; zoe.register("Zoe").await; jc.register("Jc").await;
    let (gid, _) = group_of(&mut ben, &mut []).await;

    // secret by default: not in the directory, and not to be asked
    assert_eq!(zoe.call("GET", "/api/directory", None).await.1, json!([]));
    assert_eq!(zoe.call("POST", &format!("/api/groups/{gid}/request"), None).await.0, StatusCode::NOT_FOUND);

    // listed: its name and size, nothing more
    assert_eq!(zoe.call("POST", &format!("/api/groups/{gid}/listed"), Some(json!({ "listed": true }))).await.0,
               StatusCode::NOT_FOUND);
    assert_eq!(ben.call("POST", &format!("/api/groups/{gid}/listed"), Some(json!({ "listed": true }))).await.0,
               StatusCode::NO_CONTENT);
    let (_, dir) = zoe.call("GET", "/api/directory", None).await;
    assert_eq!(dir, json!([{ "id": gid, "name": "Les copains", "members": 1, "member": false, "requested": false }]));

    // two ask; only the owner sees who
    assert_eq!(zoe.call("POST", &format!("/api/groups/{gid}/request"), None).await.0, StatusCode::NO_CONTENT);
    assert_eq!(jc.call("POST", &format!("/api/groups/{gid}/request"), None).await.0, StatusCode::NO_CONTENT);
    assert_eq!(zoe.call("GET", "/api/directory", None).await.1[0]["requested"], json!(true));
    assert_eq!(zoe.call("GET", &format!("/api/groups/{gid}/requests"), None).await.0, StatusCode::NOT_FOUND);
    let (_, waiting) = ben.call("GET", &format!("/api/groups/{gid}/requests"), None).await;
    assert_eq!(waiting.as_array().unwrap().len(), 2);
    assert_eq!(ben.call("GET", "/api/me", None).await.1["groups"][0]["requests"], json!(2));

    // accepted: a member, who sees the group; declined: nothing
    assert_eq!(ben.call("POST", &format!("/api/groups/{gid}/requests/accept"), Some(json!({ "username": "Zoe" }))).await.0,
               StatusCode::NO_CONTENT);
    assert_eq!(zoe.call("GET", &format!("/api/groups/{gid}/profiles"), None).await.0, StatusCode::OK);
    assert_eq!(zoe.call("POST", &format!("/api/groups/{gid}/request"), None).await.0, StatusCode::CONFLICT);
    assert_eq!(ben.call("POST", &format!("/api/groups/{gid}/requests/decline"), Some(json!({ "username": "Jc" }))).await.0,
               StatusCode::NO_CONTENT);
    assert_eq!(jc.call("GET", &format!("/api/groups/{gid}/profiles"), None).await.0, StatusCode::NOT_FOUND);

    // a member who is not the owner answers nothing
    jc.call("POST", &format!("/api/groups/{gid}/request"), None).await;
    assert_eq!(zoe.call("POST", &format!("/api/groups/{gid}/requests/accept"), Some(json!({ "username": "Jc" }))).await.0,
               StatusCode::FORBIDDEN);

    // taken out of the directory: gone from it, and its requests with it
    ben.call("POST", &format!("/api/groups/{gid}/listed"), Some(json!({ "listed": false }))).await;
    assert_eq!(jc.call("GET", "/api/directory", None).await.1, json!([]));
    assert_eq!(ben.call("GET", &format!("/api/groups/{gid}/requests"), None).await.1, json!([]));
}

#[tokio::test]
async fn the_tour_is_seen_once_per_account() {
    let app = server().await;
    let mut a = Client::new(&app);
    a.register("Ana").await;
    assert_eq!(a.call("GET", "/api/me", None).await.1["tour_seen"], json!(false));
    assert_eq!(a.call("POST", "/api/me/tour", Some(json!({ "seen": true }))).await.0, StatusCode::NO_CONTENT);
    assert_eq!(a.call("GET", "/api/me", None).await.1["tour_seen"], json!(true));
    // another session of the same account knows it too
    let mut again = Client::new(&app);
    again.call("POST", "/api/login", Some(json!({ "username": "Ana", "password": "correct horse battery" }))).await;
    assert_eq!(again.call("GET", "/api/me", None).await.1["tour_seen"], json!(true));
}

#[tokio::test]
async fn health_answers_while_the_database_does() {
    let app = server().await;
    let res = app.oneshot(Request::get("/api/health").body(Body::empty()).unwrap()).await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let body = res.into_body().collect().await.unwrap().to_bytes();
    assert_eq!(serde_json::from_slice::<Value>(&body).unwrap(), json!({ "ok": true }));
}

#[tokio::test]
async fn the_model_check_is_for_admins_and_only_counts_consenting_members() {
    let db = SqlitePoolOptions::new().max_connections(1).connect("sqlite::memory:").await.unwrap();
    sqlx::query("PRAGMA foreign_keys = ON").execute(&db).await.unwrap();
    migrate(&db).await.unwrap();
    // the model the site was built with, as the build writes it
    let fixture: Value = serde_json::from_str(include_str!("fixtures/scoring.json")).unwrap();
    let site = test_site();
    std::fs::write(site.join("model.json"), fixture["model"].to_string()).unwrap();
    let app = app(AppState::new(db.clone(), site, true));

    let mut admin = Client::new(&app);
    admin.register("admin").await;
    // named from the host's command line, matched however it is typed
    assert_eq!(set_admin(&db, "Admin", true).await.unwrap().as_deref(), Some("admin"));
    assert_eq!(set_admin(&db, "nobody", true).await.unwrap(), None);
    let mut member = Client::new(&app);
    member.register("Zoé").await;

    // off unless given, and said so
    let (_, me) = member.call("GET", "/api/me", None).await;
    assert_eq!((me["model_check"].as_bool(), me["admin"].as_bool()), (Some(false), Some(false)));
    assert_eq!(admin.call("GET", "/api/me", None).await.1["admin"], json!(true));

    // a member is refused; so is anyone signed out
    assert_eq!(member.call("GET", "/api/admin/model-check", None).await.0, StatusCode::FORBIDDEN);
    assert_eq!(Client::new(&app).call("GET", "/api/admin/model-check", None).await.0, StatusCode::UNAUTHORIZED);

    // answers without consent do not count
    let answers = fixture["profiles"][3]["answers"].clone();
    member.call("PUT", "/api/me/profile", Some(json!({ "answers": answers }))).await;
    let (s, r) = admin.call("GET", "/api/admin/model-check", None).await;
    // under 10, not even the count
    assert_eq!((s, r["consenting"].is_null(), r["ready"].as_bool()), (StatusCode::OK, true, Some(false)));

    // with it, they do; below the minimum, only the count comes back
    assert_eq!(member.call("POST", "/api/me/model-check", Some(json!({ "on": true }))).await.0, StatusCode::NO_CONTENT);
    let (_, r) = admin.call("GET", "/api/admin/model-check", None).await;
    assert_eq!((r["consenting"].is_null(), r["profiles"].is_null(), r["ready"].as_bool()), (true, true, Some(false)));
    assert!(r.get("axes").is_none());
    let (_, ex) = member.call("GET", "/api/me/export", None).await;
    assert!(ex["model_check_consent_at"].is_number());

    // withdrawn, it stops counting at once
    member.call("POST", "/api/me/model-check", Some(json!({ "on": false }))).await;
    assert!(admin.call("GET", "/api/admin/model-check", None).await.1["consenting"].is_null());
    let (_, ex) = member.call("GET", "/api/me/export", None).await;
    assert!(ex["model_check_consent_at"].is_null());

    // and an admin removed is refused at once
    set_admin(&db, "admin", false).await.unwrap();
    assert_eq!(admin.call("GET", "/api/admin/model-check", None).await.0, StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn groups_go_by_a_uuid_and_their_owner_can_rename_them() {
    let app = server().await;
    let (mut ben, mut zoe) = (Client::new(&app), Client::new(&app));
    ben.register("Ben").await;
    zoe.register("Zoe").await;
    let (gid, _) = group_of(&mut ben, &mut [&mut zoe]).await;
    // a version-4 UUID, never the row number
    assert_eq!(gid.len(), 36);
    assert_eq!(&gid[14..15], "4");
    assert_eq!(ben.call("GET", "/api/groups/1/profiles", None).await.0, StatusCode::NOT_FOUND);
    // signed out, a real group and a made-up one answer alike
    let mut out = Client::new(&app);
    assert_eq!(out.call("GET", &format!("/api/groups/{gid}/profiles"), None).await.0, StatusCode::UNAUTHORIZED);
    assert_eq!(out.call("GET", "/api/groups/00000000-0000-4000-8000-000000000000/profiles", None).await.0,
               StatusCode::UNAUTHORIZED);
    assert_eq!(ben.call("GET", "/api/groups/00000000-0000-4000-8000-000000000000/profiles", None).await.0,
               StatusCode::NOT_FOUND);
    assert_eq!(ben.call("GET", &format!("/api/groups/{gid}/profiles"), None).await.0, StatusCode::OK);
    assert_eq!(ben.call("GET", "/api/me", None).await.1["groups"][0]["id"], json!(gid));

    // the owner renames it; a member cannot; the name is checked as at creation
    let uri = format!("/api/groups/{gid}/name");
    assert_eq!(zoe.call("POST", &uri, Some(json!({ "name": "Chez Zoé" }))).await.0, StatusCode::FORBIDDEN);
    let (s, b) = ben.call("POST", &uri, Some(json!({ "name": "   " }))).await;
    assert_eq!((s, b["error"].as_str()), (StatusCode::BAD_REQUEST, Some("group_name_length")));
    let (s, b) = ben.call("POST", &uri, Some(json!({ "name": "  Le jeudi  " }))).await;
    assert_eq!((s, b["name"].as_str()), (StatusCode::OK, Some("Le jeudi")));
    let (_, me) = zoe.call("GET", "/api/me", None).await;
    assert_eq!((me["groups"][0]["name"].as_str(), me["groups"][0]["id"].as_str()), (Some("Le jeudi"), Some(gid.as_str())));
}

/// A share's body: the eight bytes of a PNG signature are all the server checks.
const PNG_B64: &str = "iVBORw0KGgoAAAANSUhEUg==";

fn new_share(alias: &str) -> Value {
    json!({ "layout": "wide", "theme": "clair", "image": PNG_B64,
            "snapshot": { "alias": alias, "x": -40, "y": 12, "badges": [{ "key": "atom", "level": 2 }] } })
}

/// A GET with no session, returning the raw response.
async fn raw_get(app: &axum::Router, uri: &str) -> (StatusCode, axum::http::HeaderMap, Vec<u8>) {
    let res = app.clone().oneshot(Request::get(uri).header(header::HOST, "politiskel.test").body(Body::empty()).unwrap())
        .await.unwrap();
    let (status, headers) = (res.status(), res.headers().clone());
    (status, headers, res.into_body().collect().await.unwrap().to_bytes().to_vec())
}

#[tokio::test]
async fn a_share_is_public_by_its_link_only() {
    let app = server().await;
    let mut a = Client::new(&app);
    a.register("Nadia").await;
    // signed out, no share can be made
    assert_eq!(Client::new(&app).call("POST", "/api/me/shares", Some(new_share("x"))).await.0, StatusCode::UNAUTHORIZED);
    let (s, made) = a.call("POST", "/api/me/shares", Some(new_share("Nadia"))).await;
    assert_eq!(s, StatusCode::CREATED);
    let token = made["token"].as_str().unwrap().to_string();
    assert_eq!(token.len(), 22);
    assert_eq!(made["url"], format!("/p/{token}"));

    let (s, list) = a.call("GET", "/api/me/shares", None).await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(list[0]["token"], token.as_str());
    assert_eq!(list[0]["layout"], "wide");
    assert!(list[0].get("snapshot").is_none());

    // anyone with the link reads it, without a session
    let (s, h, body) = raw_get(&app, &format!("/api/shares/{token}")).await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(h.get(header::CACHE_CONTROL).unwrap(), "no-store");
    let v: Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(v["snapshot"]["alias"], "Nadia");
    assert_eq!(v["theme"], "clair");

    let (s, h, body) = raw_get(&app, &format!("/api/shares/{token}/image")).await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(h.get(header::CONTENT_TYPE).unwrap(), "image/png");
    assert!(body.starts_with(b"\x89PNG\r\n\x1a\n"));

    // an unknown or malformed token is a 404
    assert_eq!(raw_get(&app, "/api/shares/AAAAAAAAAAAAAAAAAAAAAA").await.0, StatusCode::NOT_FOUND);
    assert_eq!(raw_get(&app, "/api/shares/nope").await.0, StatusCode::NOT_FOUND);

    // it is in the export, snapshot included
    let (_, e) = a.call("GET", "/api/me/export", None).await;
    assert_eq!(e["shares"][0]["snapshot"]["alias"], "Nadia");
}

#[tokio::test]
async fn shares_are_bounded() {
    let app = server().await;
    let mut a = Client::new(&app);
    a.register("Omar").await;
    let mut bad = new_share("Omar");
    bad["image"] = json!("R0lGODlhAQABAAAAACw=");
    let (s, b) = a.call("POST", "/api/me/shares", Some(bad)).await;
    assert_eq!((s, b["error"].as_str()), (StatusCode::BAD_REQUEST, Some("share_image_not_png")));
    let mut big = new_share("Omar");
    big["snapshot"]["pad"] = json!("x".repeat(33 * 1024));
    let (s, b) = a.call("POST", "/api/me/shares", Some(big)).await;
    assert_eq!((s, b["error"].as_str()), (StatusCode::BAD_REQUEST, Some("share_snapshot_too_large")));
    let mut label = new_share("Omar");
    label["layout"] = json!("Wide Card");
    assert_eq!(a.call("POST", "/api/me/shares", Some(label)).await.0, StatusCode::BAD_REQUEST);
    for _ in 0..20 {
        assert_eq!(a.call("POST", "/api/me/shares", Some(new_share("Omar"))).await.0, StatusCode::CREATED);
    }
    let (s, b) = a.call("POST", "/api/me/shares", Some(new_share("Omar"))).await;
    assert_eq!((s, b["error"].as_str()), (StatusCode::BAD_REQUEST, Some("shares_too_many")));
}

#[tokio::test]
async fn only_its_owner_deletes_a_share_and_deleting_the_account_deletes_them() {
    let app = server().await;
    let (mut a, mut b) = (Client::new(&app), Client::new(&app));
    a.register("Paula").await;
    b.register("Quentin").await;
    let (_, one) = a.call("POST", "/api/me/shares", Some(new_share("Paula"))).await;
    let (_, two) = a.call("POST", "/api/me/shares", Some(new_share("Paula"))).await;
    let (one, two) = (one["token"].as_str().unwrap().to_string(), two["token"].as_str().unwrap().to_string());
    // another member's share reads as one that does not exist
    assert_eq!(b.call("DELETE", &format!("/api/me/shares/{one}"), None).await.0, StatusCode::NOT_FOUND);
    assert_eq!(a.call("DELETE", &format!("/api/me/shares/{one}"), None).await.0, StatusCode::NO_CONTENT);
    assert_eq!(raw_get(&app, &format!("/api/shares/{one}")).await.0, StatusCode::NOT_FOUND);
    assert_eq!(a.call("DELETE", &format!("/api/me/shares/{one}"), None).await.0, StatusCode::NOT_FOUND);
    // the other one goes with the account
    assert_eq!(raw_get(&app, &format!("/api/shares/{two}")).await.0, StatusCode::OK);
    a.call("DELETE", "/api/me", Some(json!({ "password": "correct horse battery" }))).await;
    assert_eq!(raw_get(&app, &format!("/api/shares/{two}")).await.0, StatusCode::NOT_FOUND);
    assert_eq!(raw_get(&app, &format!("/api/shares/{two}/image")).await.0, StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn a_share_page_carries_escaped_preview_tags() {
    let app = server().await;
    let mut a = Client::new(&app);
    a.register("Rose").await;
    let (_, made) = a.call("POST", "/api/me/shares", Some(new_share("<Rose> \"R\""))).await;
    let token = made["token"].as_str().unwrap().to_string();
    let (s, h, body) = raw_get(&app, &format!("/p/{token}")).await;
    assert_eq!(s, StatusCode::OK);
    assert!(h.get(header::CONTENT_TYPE).unwrap().to_str().unwrap().starts_with("text/html"));
    let html = String::from_utf8(body).unwrap();
    assert!(html.contains("<meta property=\"og:title\" content=\"Profil politique de &lt;Rose&gt; &quot;R&quot;\">"));
    assert!(!html.contains("<Rose>"));
    assert!(html.contains(&format!("content=\"https://politiskel.test/api/shares/{token}/image\"")));
    assert!(html.contains("noindex"));
    assert!(html.contains("<title>Politiskel</title>"));
    // an unknown link is the plain page, which says so itself
    let (s, _, body) = raw_get(&app, "/p/AAAAAAAAAAAAAAAAAAAAAA").await;
    assert_eq!(s, StatusCode::OK);
    assert!(!String::from_utf8(body).unwrap().contains("og:title"));
}
