//! End-to-end checks of the API against an in-memory database: the whole
//! path from sign-up to account deletion, and each guard on the way.

use axum::body::Body;
use axum::http::{header, Request, StatusCode};
use http_body_util::BodyExt;
use politiskel_server::{app, migrate, AppState};
use serde_json::{json, Value};
use sqlx::sqlite::SqlitePoolOptions;
use tower::ServiceExt;

async fn server() -> axum::Router { server_with(false).await }

async fn server_with(trust_proxy: bool) -> axum::Router {
    // One connection: an in-memory SQLite database lives per connection.
    let db = SqlitePoolOptions::new().max_connections(1)
        .connect("sqlite::memory:").await.unwrap();
    sqlx::query("PRAGMA foreign_keys = ON").execute(&db).await.unwrap();
    migrate(&db).await.unwrap();
    app(AppState::new(db, "<!doctype html><title>Politiskel</title>".into(), true).trusting_proxy(trust_proxy))
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
    let (gid, invite) = (g["id"].as_i64().unwrap(), g["invite"].as_str().unwrap().to_string());
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
    let gid = g["id"].as_i64().unwrap();
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
    let app = app(AppState::new(db, String::new(), true)
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
    let gid = g["id"].as_i64().unwrap();
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
