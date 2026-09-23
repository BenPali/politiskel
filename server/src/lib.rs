//! Politiskel's optional backend: accounts, groups on invitation, and one
//! saved profile per account.
//!
//! The page works without it, as a single local file. Served from here, the
//! same page finds `/api/me` and turns on accounts. The server stores what the
//! page needs and nothing more: PolitiScales percentages already read in the
//! browser (never the screenshot), and questionnaire answers. Scoring stays in
//! the browser.
//!
//! Political opinions are special-category data under GDPR art. 9, which
//! shapes the whole design: explicit consent at sign-up, pseudonymous
//! usernames, visibility limited to the groups one has joined, an export of
//! one's own data, and an account deletion that deletes everything.

pub mod validate;

use std::collections::HashMap;
use std::sync::{Arc, Mutex, OnceLock};
use std::time::{SystemTime, UNIX_EPOCH};

use argon2::password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString};
use argon2::Argon2;
use axum::extract::{DefaultBodyLimit, Path, State};
use axum::http::{header, HeaderValue, Request, StatusCode};
use axum::middleware::{self, Next};
use axum::response::{Html, IntoResponse, Response};
use axum::routing::{get, post, put};
use axum::{Json, Router};
use axum_extra::extract::cookie::{Cookie, CookieJar, SameSite};
use rand::RngCore;
use serde::Deserialize;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use sqlx::SqlitePool;

const SESSION_COOKIE: &str = "politiskel_session";
const SESSION_DAYS: i64 = 30;
/// Failed logins allowed per username within the window, before a pause.
const MAX_FAILURES: u32 = 5;
const FAILURE_WINDOW: i64 = 15 * 60;

#[derive(Clone)]
pub struct AppState {
    pub db: SqlitePool,
    /// The page, served as is: template.html already carries every script
    /// inlined and an empty data slot.
    pub page: Arc<String>,
    /// Off only for local development over plain http.
    pub secure_cookies: bool,
    failures: Arc<Mutex<HashMap<String, (u32, i64)>>>,
}

impl AppState {
    pub fn new(db: SqlitePool, page: String, secure_cookies: bool) -> Self {
        Self { db, page: Arc::new(page), secure_cookies, failures: Arc::default() }
    }
}

pub async fn migrate(db: &SqlitePool) -> Result<(), sqlx::migrate::MigrateError> {
    sqlx::migrate!("./migrations").run(db).await
}

pub fn app(state: AppState) -> Router {
    Router::new()
        .route("/", get(page))
        .route("/api/register", post(register))
        .route("/api/login", post(login))
        .route("/api/logout", post(logout))
        .route("/api/me", get(me).delete(delete_me))
        .route("/api/me/profile", put(put_profile))
        .route("/api/me/export", get(export))
        .route("/api/groups", post(create_group))
        .route("/api/groups/join", post(join_group))
        .route("/api/groups/{id}/leave", post(leave_group))
        .route("/api/groups/{id}/profiles", get(group_profiles))
        .layer(DefaultBodyLimit::max(64 * 1024))
        .layer(middleware::from_fn(security_headers))
        .with_state(state)
}

/* ------------------------------------------------------------------ errors */

pub struct ApiError(StatusCode, &'static str);

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (self.0, Json(json!({ "error": self.1 }))).into_response()
    }
}

impl From<sqlx::Error> for ApiError {
    fn from(e: sqlx::Error) -> Self {
        eprintln!("database error: {e}");
        ApiError(StatusCode::INTERNAL_SERVER_ERROR, "internal")
    }
}

type ApiResult<T> = Result<T, ApiError>;

fn bad(code: &'static str) -> ApiError {
    ApiError(StatusCode::BAD_REQUEST, code)
}

/* ----------------------------------------------------------------- helpers */

fn now() -> i64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs() as i64).unwrap_or(0)
}

fn random_hex(bytes: usize) -> String {
    let mut buf = vec![0u8; bytes];
    OsRng.fill_bytes(&mut buf);
    buf.iter().map(|b| format!("{b:02x}")).collect()
}

fn token_hash(token: &str) -> Vec<u8> {
    Sha256::digest(token.as_bytes()).to_vec()
}

/// Argon2id is deliberately slow: it runs off the async threads.
async fn hash_password(password: String) -> ApiResult<String> {
    tokio::task::spawn_blocking(move || {
        let salt = SaltString::generate(&mut OsRng);
        Argon2::default().hash_password(password.as_bytes(), &salt).map(|h| h.to_string())
    })
    .await
    .map_err(|_| ApiError(StatusCode::INTERNAL_SERVER_ERROR, "internal"))?
    .map_err(|_| ApiError(StatusCode::INTERNAL_SERVER_ERROR, "internal"))
}

async fn verify_password(password: String, hash: String) -> bool {
    tokio::task::spawn_blocking(move || {
        PasswordHash::new(&hash)
            .map(|h| Argon2::default().verify_password(password.as_bytes(), &h).is_ok())
            .unwrap_or(false)
    })
    .await
    .unwrap_or(false)
}

/// A hash to verify against when the username does not exist, so that a
/// login attempt takes as long either way and does not reveal which names
/// are taken.
fn dummy_hash() -> &'static str {
    static H: OnceLock<String> = OnceLock::new();
    H.get_or_init(|| {
        let salt = SaltString::generate(&mut OsRng);
        Argon2::default().hash_password(b"not-a-real-password", &salt).unwrap().to_string()
    })
}

async fn start_session(state: &AppState, jar: CookieJar, user_id: i64) -> ApiResult<CookieJar> {
    let token = random_hex(32);
    sqlx::query("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
        .bind(token_hash(&token))
        .bind(user_id)
        .bind(now() + SESSION_DAYS * 86400)
        .execute(&state.db)
        .await?;
    let cookie = Cookie::build((SESSION_COOKIE, token))
        .http_only(true)
        .secure(state.secure_cookies)
        .same_site(SameSite::Strict)
        .path("/")
        .max_age(time::Duration::days(SESSION_DAYS))
        .build();
    Ok(jar.add(cookie))
}

/// The signed-in user, or 401.
async fn current_user(state: &AppState, jar: &CookieJar) -> ApiResult<(i64, String)> {
    let token = jar.get(SESSION_COOKIE).map(|c| c.value().to_string())
        .ok_or(ApiError(StatusCode::UNAUTHORIZED, "not_signed_in"))?;
    let row: Option<(i64, String)> = sqlx::query_as(
        "SELECT u.id, u.username FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ? AND s.expires_at > ?")
        .bind(token_hash(&token))
        .bind(now())
        .fetch_optional(&state.db)
        .await?;
    row.ok_or(ApiError(StatusCode::UNAUTHORIZED, "not_signed_in"))
}

async fn is_member(state: &AppState, group: i64, user: i64) -> ApiResult<bool> {
    let row: Option<(i64,)> = sqlx::query_as("SELECT 1 FROM members WHERE group_id = ? AND user_id = ?")
        .bind(group).bind(user).fetch_optional(&state.db).await?;
    Ok(row.is_some())
}

fn parse_json(text: Option<String>) -> Value {
    text.and_then(|t| serde_json::from_str(&t).ok()).unwrap_or(Value::Null)
}

/* ------------------------------------------------------------------ routes */

async fn security_headers(req: Request<axum::body::Body>, next: Next) -> Response {
    let mut res = next.run(req).await;
    let api = req_is_api(&res);
    let h = res.headers_mut();
    // The page is one file with inline scripts and styles, hence
    // 'unsafe-inline'; it writes every user-supplied string with textContent.
    h.insert(header::CONTENT_SECURITY_POLICY, HeaderValue::from_static(
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; \
         img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; \
         form-action 'self'"));
    h.insert(header::X_CONTENT_TYPE_OPTIONS, HeaderValue::from_static("nosniff"));
    h.insert(header::REFERRER_POLICY, HeaderValue::from_static("no-referrer"));
    h.insert(header::X_FRAME_OPTIONS, HeaderValue::from_static("DENY"));
    if api {
        h.insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
    }
    res
}

fn req_is_api(res: &Response) -> bool {
    res.headers().get(header::CONTENT_TYPE).is_some_and(|v| v.as_bytes().starts_with(b"application/json"))
}

async fn page(State(state): State<AppState>) -> Html<String> {
    Html(state.page.as_ref().clone())
}

#[derive(Deserialize)]
struct Register { username: String, password: String, consent: bool }

async fn register(State(state): State<AppState>, jar: CookieJar, Json(body): Json<Register>)
    -> ApiResult<(StatusCode, CookieJar, Json<Value>)>
{
    // Consent to the processing of political opinions, explicit and recorded:
    // art. 9(2)(a) GDPR is what makes storing them lawful at all.
    if !body.consent {
        return Err(bad("consent_required"));
    }
    let name = validate::username(&body.username).map_err(bad)?;
    validate::password(&body.password).map_err(bad)?;
    let hash = hash_password(body.password).await?;
    let t = now();
    let res = sqlx::query("INSERT INTO users (username, pw_hash, consent_at, created_at) VALUES (?, ?, ?, ?)")
        .bind(&name).bind(&hash).bind(t).bind(t)
        .execute(&state.db).await;
    let id = match res {
        Ok(r) => r.last_insert_rowid(),
        Err(sqlx::Error::Database(e)) if e.is_unique_violation() =>
            return Err(ApiError(StatusCode::CONFLICT, "username_taken")),
        Err(e) => return Err(e.into()),
    };
    sqlx::query("INSERT INTO profiles (user_id, updated_at) VALUES (?, ?)")
        .bind(id).bind(t).execute(&state.db).await?;
    let jar = start_session(&state, jar, id).await?;
    Ok((StatusCode::CREATED, jar, Json(json!({ "username": name }))))
}

#[derive(Deserialize)]
struct Login { username: String, password: String }

async fn login(State(state): State<AppState>, jar: CookieJar, Json(body): Json<Login>)
    -> ApiResult<(CookieJar, Json<Value>)>
{
    let key = body.username.trim().to_lowercase();
    let t = now();
    {
        let mut f = state.failures.lock().unwrap();
        f.retain(|_, (_, since)| t - *since < FAILURE_WINDOW);
        if f.get(&key).is_some_and(|(n, _)| *n >= MAX_FAILURES) {
            return Err(ApiError(StatusCode::TOO_MANY_REQUESTS, "too_many_attempts"));
        }
    }
    let row: Option<(i64, String, String)> =
        sqlx::query_as("SELECT id, username, pw_hash FROM users WHERE username = ?")
            .bind(body.username.trim()).fetch_optional(&state.db).await?;
    let hash = row.as_ref().map(|r| r.2.clone()).unwrap_or_else(|| dummy_hash().to_string());
    let ok = verify_password(body.password, hash).await && row.is_some();
    if !ok {
        let mut f = state.failures.lock().unwrap();
        let e = f.entry(key).or_insert((0, t));
        e.0 += 1;
        return Err(ApiError(StatusCode::UNAUTHORIZED, "bad_credentials"));
    }
    state.failures.lock().unwrap().remove(&key);
    sqlx::query("DELETE FROM sessions WHERE expires_at <= ?").bind(t).execute(&state.db).await?;
    let (id, name, _) = row.unwrap();
    let jar = start_session(&state, jar, id).await?;
    Ok((jar, Json(json!({ "username": name }))))
}

async fn logout(State(state): State<AppState>, jar: CookieJar) -> ApiResult<(StatusCode, CookieJar)> {
    if let Some(c) = jar.get(SESSION_COOKIE) {
        sqlx::query("DELETE FROM sessions WHERE token_hash = ?")
            .bind(token_hash(c.value())).execute(&state.db).await?;
    }
    Ok((StatusCode::NO_CONTENT, jar.remove(Cookie::build(SESSION_COOKIE).path("/"))))
}

async fn groups_of(state: &AppState, user: i64) -> ApiResult<Vec<Value>> {
    let rows: Vec<(i64, String, String, i64)> = sqlx::query_as(
        "SELECT g.id, g.name, g.invite_code,
                (SELECT COUNT(*) FROM members m2 WHERE m2.group_id = g.id)
         FROM groups g JOIN members m ON m.group_id = g.id
         WHERE m.user_id = ? ORDER BY g.name")
        .bind(user).fetch_all(&state.db).await?;
    Ok(rows.into_iter()
        .map(|(id, name, invite, n)| json!({ "id": id, "name": name, "invite": invite, "members": n }))
        .collect())
}

async fn profile_of(state: &AppState, user: i64) -> ApiResult<Value> {
    let (ps, answers): (Option<String>, String) =
        sqlx::query_as("SELECT politiscales, answers FROM profiles WHERE user_id = ?")
            .bind(user).fetch_one(&state.db).await?;
    Ok(json!({ "politiscales": parse_json(ps), "answers": parse_json(Some(answers)) }))
}

async fn me(State(state): State<AppState>, jar: CookieJar) -> ApiResult<Json<Value>> {
    let (id, name) = current_user(&state, &jar).await?;
    Ok(Json(json!({
        "username": name,
        "groups": groups_of(&state, id).await?,
        "profile": profile_of(&state, id).await?,
    })))
}

#[derive(Deserialize)]
struct ProfileUpdate {
    #[serde(default, deserialize_with = "some_or_null")]
    politiscales: Option<Value>,
    answers: Option<Value>,
}

/// Distinguishes a missing field (leave as is) from an explicit null (clear).
fn some_or_null<'de, D: serde::Deserializer<'de>>(d: D) -> Result<Option<Value>, D::Error> {
    Value::deserialize(d).map(Some)
}

async fn put_profile(State(state): State<AppState>, jar: CookieJar, Json(body): Json<ProfileUpdate>)
    -> ApiResult<Json<Value>>
{
    let (id, _) = current_user(&state, &jar).await?;
    if let Some(ps) = &body.politiscales {
        if !ps.is_null() {
            validate::politiscales(ps).map_err(bad)?;
        }
        let text = if ps.is_null() { None } else { Some(ps.to_string()) };
        sqlx::query("UPDATE profiles SET politiscales = ?, updated_at = ? WHERE user_id = ?")
            .bind(text).bind(now()).bind(id).execute(&state.db).await?;
    }
    if let Some(a) = &body.answers {
        validate::answers(a).map_err(bad)?;
        sqlx::query("UPDATE profiles SET answers = ?, updated_at = ? WHERE user_id = ?")
            .bind(a.to_string()).bind(now()).bind(id).execute(&state.db).await?;
    }
    Ok(Json(profile_of(&state, id).await?))
}

/// Everything the server holds about the signed-in account (art. 15 and 20).
async fn export(State(state): State<AppState>, jar: CookieJar) -> ApiResult<Json<Value>> {
    let (id, name) = current_user(&state, &jar).await?;
    let (consent_at, created_at): (i64, i64) =
        sqlx::query_as("SELECT consent_at, created_at FROM users WHERE id = ?")
            .bind(id).fetch_one(&state.db).await?;
    Ok(Json(json!({
        "format": "politiskel-account", "version": 1,
        "username": name, "created_at": created_at, "consent_at": consent_at,
        "groups": groups_of(&state, id).await?,
        "profile": profile_of(&state, id).await?,
    })))
}

#[derive(Deserialize)]
struct Confirm { password: String }

/// Deletes the account and, by cascade, its sessions, memberships and
/// profile; then any group left with no member (art. 17).
async fn delete_me(State(state): State<AppState>, jar: CookieJar, Json(body): Json<Confirm>)
    -> ApiResult<(StatusCode, CookieJar)>
{
    let (id, _) = current_user(&state, &jar).await?;
    let (hash,): (String,) = sqlx::query_as("SELECT pw_hash FROM users WHERE id = ?")
        .bind(id).fetch_one(&state.db).await?;
    if !verify_password(body.password, hash).await {
        return Err(ApiError(StatusCode::UNAUTHORIZED, "bad_credentials"));
    }
    let mut tx = state.db.begin().await?;
    sqlx::query("DELETE FROM users WHERE id = ?").bind(id).execute(&mut *tx).await?;
    sqlx::query("DELETE FROM groups WHERE id NOT IN (SELECT group_id FROM members)")
        .execute(&mut *tx).await?;
    tx.commit().await?;
    Ok((StatusCode::NO_CONTENT, jar.remove(Cookie::build(SESSION_COOKIE).path("/"))))
}

#[derive(Deserialize)]
struct NewGroup { name: String }

async fn create_group(State(state): State<AppState>, jar: CookieJar, Json(body): Json<NewGroup>)
    -> ApiResult<(StatusCode, Json<Value>)>
{
    let (user, _) = current_user(&state, &jar).await?;
    let name = validate::group_name(&body.name).map_err(bad)?;
    let t = now();
    let invite = random_hex(16);
    let mut tx = state.db.begin().await?;
    let gid = sqlx::query("INSERT INTO groups (name, invite_code, created_at) VALUES (?, ?, ?)")
        .bind(&name).bind(&invite).bind(t).execute(&mut *tx).await?.last_insert_rowid();
    sqlx::query("INSERT INTO members (group_id, user_id, joined_at) VALUES (?, ?, ?)")
        .bind(gid).bind(user).bind(t).execute(&mut *tx).await?;
    tx.commit().await?;
    Ok((StatusCode::CREATED, Json(json!({ "id": gid, "name": name, "invite": invite, "members": 1 }))))
}

#[derive(Deserialize)]
struct Join { code: String }

async fn join_group(State(state): State<AppState>, jar: CookieJar, Json(body): Json<Join>)
    -> ApiResult<Json<Value>>
{
    let (user, _) = current_user(&state, &jar).await?;
    let row: Option<(i64, String)> = sqlx::query_as("SELECT id, name FROM groups WHERE invite_code = ?")
        .bind(body.code.trim()).fetch_optional(&state.db).await?;
    let (gid, name) = row.ok_or(ApiError(StatusCode::NOT_FOUND, "no_such_invite"))?;
    sqlx::query("INSERT OR IGNORE INTO members (group_id, user_id, joined_at) VALUES (?, ?, ?)")
        .bind(gid).bind(user).bind(now()).execute(&state.db).await?;
    Ok(Json(json!({ "id": gid, "name": name })))
}

async fn leave_group(State(state): State<AppState>, jar: CookieJar, Path(gid): Path<i64>)
    -> ApiResult<StatusCode>
{
    let (user, _) = current_user(&state, &jar).await?;
    let mut tx = state.db.begin().await?;
    sqlx::query("DELETE FROM members WHERE group_id = ? AND user_id = ?")
        .bind(gid).bind(user).execute(&mut *tx).await?;
    sqlx::query("DELETE FROM groups WHERE id = ? AND id NOT IN (SELECT group_id FROM members)")
        .bind(gid).execute(&mut *tx).await?;
    tx.commit().await?;
    Ok(StatusCode::NO_CONTENT)
}

/// A group's profiles, for its members only. A non-member gets the same 404
/// as a group that does not exist, so group ids reveal nothing.
async fn group_profiles(State(state): State<AppState>, jar: CookieJar, Path(gid): Path<i64>)
    -> ApiResult<Json<Value>>
{
    let (user, _) = current_user(&state, &jar).await?;
    if !is_member(&state, gid, user).await? {
        return Err(ApiError(StatusCode::NOT_FOUND, "no_such_group"));
    }
    let rows: Vec<(i64, String, Option<String>, String)> = sqlx::query_as(
        "SELECT u.id, u.username, p.politiscales, p.answers
         FROM members m JOIN users u ON u.id = m.user_id JOIN profiles p ON p.user_id = u.id
         WHERE m.group_id = ? ORDER BY u.username")
        .bind(gid).fetch_all(&state.db).await?;
    Ok(Json(Value::Array(rows.into_iter().map(|(uid, name, ps, a)| json!({
        "username": name, "me": uid == user,
        "politiscales": parse_json(ps), "answers": parse_json(Some(a)),
    })).collect())))
}
