//! End-to-end checks of the API against an in-memory database: the whole
//! path from sign-up to account deletion, and each guard on the way.

use axum::body::Body;
use axum::http::{header, Request, StatusCode};
use http_body_util::BodyExt;
use politiskel_server::{app, migrate, AppState};
use serde_json::{json, Value};
use sqlx::sqlite::SqlitePoolOptions;
use tower::ServiceExt;

async fn server() -> axum::Router {
    // One connection: an in-memory SQLite database lives per connection.
    let db = SqlitePoolOptions::new().max_connections(1)
        .connect("sqlite::memory:").await.unwrap();
    sqlx::query("PRAGMA foreign_keys = ON").execute(&db).await.unwrap();
    migrate(&db).await.unwrap();
    app(AppState::new(db, "<!doctype html><title>Politiskel</title>".into(), true))
}

/// A client that keeps its session cookie between requests.
struct Client { app: axum::Router, cookie: Option<String> }

impl Client {
    fn new(app: &axum::Router) -> Self { Self { app: app.clone(), cookie: None } }

    async fn call(&mut self, method: &str, uri: &str, body: Option<Value>) -> (StatusCode, Value) {
        let mut req = Request::builder().method(method).uri(uri);
        if let Some(c) = &self.cookie { req = req.header(header::COOKIE, c); }
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
