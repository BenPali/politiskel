//! Sign-up, sign-in, sessions and passwords.

use std::sync::OnceLock;
use argon2::password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString};
use argon2::Argon2;
use axum::extract::State;
use axum::http::StatusCode;
use axum::Json;
use axum_extra::extract::cookie::{Cookie, CookieJar, SameSite};
use rand::RngCore;
use serde::Deserialize;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};

use crate::state::{Signup, AppState, ClientIp};
use crate::error::{ApiError, ApiResult, bad};
use crate::{now, validate};

pub(crate) const SESSION_COOKIE: &str = "politiskel_session";

pub(crate) const SESSION_DAYS: i64 = 30;

/// Login attempts that may fail within the window, per name and address,
/// before that address is paused on that name. There is deliberately no cap
/// per name across addresses: any such cap is a way to lock the owner out,
/// and every member of a group knows the others' pseudonyms. What guards
/// against guessing from many addresses is argon2's cost and the ten-character
/// minimum; IPv6 addresses count per /64, since one host holds a whole block.
pub(crate) const MAX_FAILURES: u32 = 5;

pub(crate) const FAILURE_WINDOW: i64 = 15 * 60;

/// Accounts one address may open per hour. Each sign-up runs argon2, so an
/// unbounded endpoint is both a way to fill the database and to spend the
/// server's processor.
pub(crate) const MAX_SIGNUPS: u32 = 5;

pub(crate) const SIGNUP_WINDOW: i64 = 60 * 60;

pub(crate) fn random_hex(bytes: usize) -> String {
    let mut buf = vec![0u8; bytes];
    OsRng.fill_bytes(&mut buf);
    buf.iter().map(|b| format!("{b:02x}")).collect()
}

pub(crate) fn token_hash(token: &str) -> Vec<u8> {
    Sha256::digest(token.as_bytes()).to_vec()
}

/// Argon2id is deliberately slow: it runs off the async threads.
pub async fn hash_password(password: String) -> ApiResult<String> {
    tokio::task::spawn_blocking(move || {
        let salt = SaltString::generate(&mut OsRng);
        Argon2::default().hash_password(password.as_bytes(), &salt).map(|h| h.to_string())
    })
    .await
    .map_err(|_| ApiError(StatusCode::INTERNAL_SERVER_ERROR, "internal"))?
    .map_err(|_| ApiError(StatusCode::INTERNAL_SERVER_ERROR, "internal"))
}

pub(crate) async fn verify_password(password: String, hash: String) -> bool {
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
pub(crate) fn dummy_hash() -> &'static str {
    static H: OnceLock<String> = OnceLock::new();
    H.get_or_init(|| {
        let salt = SaltString::generate(&mut OsRng);
        Argon2::default().hash_password(b"not-a-real-password", &salt).unwrap().to_string()
    })
}

pub(crate) async fn start_session(state: &AppState, jar: CookieJar, user_id: i64) -> ApiResult<CookieJar> {
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
pub(crate) async fn current_user(state: &AppState, jar: &CookieJar) -> ApiResult<(i64, String)> {
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

/// What the page needs to know before anyone signs in: who may sign up, and
/// whether the site is still empty (its first account is always let in).
pub(crate) async fn config(State(state): State<AppState>) -> ApiResult<Json<Value>> {
    let (accounts,): (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users").fetch_one(&state.db).await?;
    Ok(Json(json!({ "signup": match state.signup { Signup::Open => "open", Signup::Invite => "invite" },
                    "empty": accounts == 0 })))
}

#[derive(Deserialize)]
pub(crate) struct Register {
    username: String,
    password: String,
    consent: bool,
    #[serde(default)]
    invite: Option<String>,
}

pub(crate) async fn register(State(state): State<AppState>, ClientIp(ip): ClientIp, jar: CookieJar,
                  Json(body): Json<Register>) -> ApiResult<(StatusCode, CookieJar, Json<Value>)>
{
    // Consent to the processing of political opinions, explicit and recorded:
    // art. 9(2)(a) GDPR is what makes storing them lawful at all.
    if !body.consent {
        return Err(bad("consent_required"));
    }
    let name = validate::username(&body.username).map_err(bad)?;
    validate::password(&body.password).map_err(bad)?;
    // A closed site opens an account only to someone holding a live
    // invitation; joining the group is still asked for afterwards.
    // The very first account is always allowed: on a closed site nobody could
    // otherwise open the account that creates the first group and its link.
    let (accounts,): (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users").fetch_one(&state.db).await?;
    if state.signup == Signup::Invite && accounts > 0 {
        let code = body.invite.as_deref().unwrap_or("").trim().to_string();
        let row: Option<(i64,)> = sqlx::query_as("SELECT id FROM groups WHERE invite_code = ?")
            .bind(&code).fetch_optional(&state.db).await?;
        if code.is_empty() || row.is_none() {
            return Err(ApiError(StatusCode::FORBIDDEN, "signup_invite_only"));
        }
    }
    // Counted before argon2 runs, like login attempts, so a burst cannot slip
    // past the check while the first hash is still being computed.
    {
        let t = now();
        let mut m = state.signups.lock().unwrap();
        m.retain(|_, (_, since)| t - *since < SIGNUP_WINDOW);
        let e = m.entry(ip).or_insert((0, t));
        if e.0 >= MAX_SIGNUPS {
            return Err(ApiError(StatusCode::TOO_MANY_REQUESTS, "too_many_signups"));
        }
        e.0 += 1;
    }
    let hash = hash_password(body.password).await?;
    let t = now();
    // One transaction: an account without its profile row would answer 500
    // on every call and keep its name taken.
    let mut tx = state.db.begin().await?;
    let res = sqlx::query(
        "INSERT INTO users (username, username_key, pw_hash, consent_at, created_at) VALUES (?, ?, ?, ?, ?)")
        .bind(&name).bind(validate::username_key(&name)).bind(&hash).bind(t).bind(t)
        .execute(&mut *tx).await;
    let id = match res {
        Ok(r) => r.last_insert_rowid(),
        Err(sqlx::Error::Database(e)) if e.is_unique_violation() =>
            return Err(ApiError(StatusCode::CONFLICT, "username_taken")),
        Err(e) => return Err(e.into()),
    };
    sqlx::query("INSERT INTO profiles (user_id, updated_at) VALUES (?, ?)")
        .bind(id).bind(t).execute(&mut *tx).await?;
    tx.commit().await?;
    let jar = start_session(&state, jar, id).await?;
    Ok((StatusCode::CREATED, jar, Json(json!({ "username": name }))))
}

#[derive(Deserialize)]
pub(crate) struct Login { username: String, password: String }

pub(crate) async fn login(State(state): State<AppState>, ClientIp(ip): ClientIp, jar: CookieJar,
               Json(body): Json<Login>) -> ApiResult<(CookieJar, Json<Value>)>
{
    let name_key = validate::username_key(&body.username);
    let pair = format!("{name_key}\u{0}{ip}");
    let t = now();
    // The attempt is counted BEFORE the password is checked, and handed back
    // if it succeeds: counted after, a burst of parallel requests would all
    // pass the check while argon2 was still running on the first.
    {
        let mut f = state.failures.lock().unwrap();
        f.retain(|_, (_, since)| t - *since < FAILURE_WINDOW);
        if f.get(&pair).is_some_and(|(n, _)| *n >= MAX_FAILURES) {
            return Err(ApiError(StatusCode::TOO_MANY_REQUESTS, "too_many_attempts"));
        }
        f.entry(pair.clone()).or_insert((0, t)).0 += 1;
    }
    let row: Option<(i64, String, String)> =
        sqlx::query_as("SELECT id, username, pw_hash FROM users WHERE username_key = ?")
            .bind(&name_key).fetch_optional(&state.db).await?;
    let hash = row.as_ref().map(|r| r.2.clone()).unwrap_or_else(|| dummy_hash().to_string());
    let ok = verify_password(body.password, hash).await && row.is_some();
    if !ok {
        return Err(ApiError(StatusCode::UNAUTHORIZED, "bad_credentials"));
    }
    state.failures.lock().unwrap().remove(&pair);
    sqlx::query("DELETE FROM sessions WHERE expires_at <= ?").bind(t).execute(&state.db).await?;
    let (id, name, _) = row.unwrap();
    let jar = start_session(&state, jar, id).await?;
    Ok((jar, Json(json!({ "username": name }))))
}

pub(crate) async fn logout(State(state): State<AppState>, jar: CookieJar) -> ApiResult<(StatusCode, CookieJar)> {
    if let Some(c) = jar.get(SESSION_COOKIE) {
        sqlx::query("DELETE FROM sessions WHERE token_hash = ?")
            .bind(token_hash(c.value())).execute(&state.db).await?;
    }
    Ok((StatusCode::NO_CONTENT, jar.remove(Cookie::build(SESSION_COOKIE).path("/"))))
}

#[derive(Deserialize)]
pub(crate) struct NewPassword { current: String, new: String }

/// Changes the password and ends every other session: whoever might have
/// known the old one is signed out wherever they were.
pub(crate) async fn change_password(State(state): State<AppState>, jar: CookieJar, Json(body): Json<NewPassword>)
    -> ApiResult<StatusCode>
{
    let (id, _) = current_user(&state, &jar).await?;
    let (hash,): (String,) = sqlx::query_as("SELECT pw_hash FROM users WHERE id = ?")
        .bind(id).fetch_one(&state.db).await?;
    if !verify_password(body.current, hash).await {
        return Err(ApiError(StatusCode::UNAUTHORIZED, "bad_credentials"));
    }
    validate::password(&body.new).map_err(bad)?;
    let new_hash = hash_password(body.new).await?;
    let mut tx = state.db.begin().await?;
    sqlx::query("UPDATE users SET pw_hash = ? WHERE id = ?")
        .bind(new_hash).bind(id).execute(&mut *tx).await?;
    end_sessions_but(&mut tx, id, &jar).await?;
    tx.commit().await?;
    Ok(StatusCode::NO_CONTENT)
}

/// Signs the account out everywhere but here.
pub(crate) async fn end_other_sessions(State(state): State<AppState>, jar: CookieJar) -> ApiResult<StatusCode> {
    let (id, _) = current_user(&state, &jar).await?;
    let mut tx = state.db.begin().await?;
    end_sessions_but(&mut tx, id, &jar).await?;
    tx.commit().await?;
    Ok(StatusCode::NO_CONTENT)
}

pub(crate) async fn end_sessions_but(tx: &mut sqlx::SqliteConnection, user: i64, jar: &CookieJar) -> ApiResult<()> {
    let keep = jar.get(SESSION_COOKIE).map(|c| token_hash(c.value())).unwrap_or_default();
    sqlx::query("DELETE FROM sessions WHERE user_id = ? AND token_hash != ?")
        .bind(user).bind(keep).execute(&mut *tx).await?;
    Ok(())
}
