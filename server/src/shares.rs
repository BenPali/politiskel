//! Public share links: a card of one's profile made public on purpose, at an
//! address nobody can guess, until its owner deletes it.
//!
//! This is the one place where anything about a member leaves their groups,
//! so it is narrow: a share holds a snapshot of results the site computed
//! (position, readings, badges, flag), never an answer, and the image of the
//! card. It does not follow the profile: what was shared is what stays
//! shared, and a new link is a new share. Account deletion removes them all
//! (ON DELETE CASCADE).

use axum::extract::{Path, State};
use axum::http::{header, HeaderMap, HeaderValue, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::Json;
use axum_extra::extract::cookie::CookieJar;
use serde::Deserialize;
use serde_json::{json, Value};

use crate::auth::current_user;
use crate::error::{ApiError, ApiResult, bad};
use crate::state::AppState;
use crate::{now, parse_json, validate};

/// Shares one account may keep at once.
pub(crate) const MAX_SHARES: i64 = 20;

/// 16 random bytes, base64url without padding: 22 characters.
pub(crate) fn is_share_token(s: &str) -> bool {
    s.len() == 22 && s.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
}

fn new_token() -> String {
    use base64::Engine;
    let mut b = [0u8; 16];
    rand::RngCore::fill_bytes(&mut rand::rngs::OsRng, &mut b);
    base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(b)
}

fn missing() -> ApiError {
    ApiError(StatusCode::NOT_FOUND, "no_such_share")
}

#[derive(Deserialize)]
pub(crate) struct NewShare {
    layout: String,
    theme: String,
    snapshot: Value,
    image: String,
}

pub(crate) async fn create_share(State(state): State<AppState>, jar: CookieJar, Json(body): Json<NewShare>)
    -> ApiResult<(StatusCode, Json<Value>)>
{
    let (user, username) = current_user(&state, &jar).await?;
    validate::share_label(&body.layout).map_err(bad)?;
    validate::share_label(&body.theme).map_err(bad)?;
    // The name on a share is the account's, whatever the page sent: nobody
    // publishes a card under someone else's name on this domain.
    let mut body_snapshot = body.snapshot;
    if let Some(obj) = body_snapshot.as_object_mut() {
        obj.insert("alias".into(), Value::String(username));
    }
    let snapshot = validate::share_snapshot(&body_snapshot).map_err(bad)?;
    let image = validate::share_image(&body.image).map_err(bad)?;
    let (count,): (i64,) = sqlx::query_as("SELECT COUNT(*) FROM shares WHERE user_id = ?")
        .bind(user).fetch_one(&state.db).await?;
    if count >= MAX_SHARES {
        return Err(bad("shares_too_many"));
    }
    let token = new_token();
    sqlx::query("INSERT INTO shares (token, user_id, created_at, layout, theme, snapshot, image) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .bind(&token).bind(user).bind(now()).bind(&body.layout).bind(&body.theme).bind(snapshot).bind(image)
        .execute(&state.db).await?;
    Ok((StatusCode::CREATED, Json(json!({ "token": token, "url": format!("/p/{token}") }))))
}

pub(crate) async fn shares_of(state: &AppState, user: i64, with_snapshot: bool) -> ApiResult<Vec<Value>> {
    let rows: Vec<(String, String, String, i64, String)> = sqlx::query_as(
        "SELECT token, layout, theme, created_at, snapshot FROM shares WHERE user_id = ? ORDER BY created_at DESC, rowid DESC")
        .bind(user).fetch_all(&state.db).await?;
    Ok(rows.into_iter().map(|(token, layout, theme, created_at, snapshot)| {
        let mut v = json!({ "token": token, "layout": layout, "theme": theme, "created_at": created_at });
        if with_snapshot {
            v["snapshot"] = parse_json(Some(snapshot));
        }
        v
    }).collect())
}

pub(crate) async fn list_shares(State(state): State<AppState>, jar: CookieJar) -> ApiResult<Json<Value>> {
    let (user, _) = current_user(&state, &jar).await?;
    Ok(Json(Value::Array(shares_of(&state, user, false).await?)))
}

/// Deletes one of one's own shares; another's reads as one that does not exist.
pub(crate) async fn delete_share(State(state): State<AppState>, jar: CookieJar, Path(token): Path<String>)
    -> ApiResult<StatusCode>
{
    let (user, _) = current_user(&state, &jar).await?;
    if !is_share_token(&token) {
        return Err(missing());
    }
    let res = sqlx::query("DELETE FROM shares WHERE token = ? AND user_id = ?")
        .bind(&token).bind(user).execute(&state.db).await?;
    if res.rows_affected() == 0 {
        return Err(missing());
    }
    Ok(StatusCode::NO_CONTENT)
}

/// A share, for anyone holding its address.
pub(crate) async fn public_share(State(state): State<AppState>, Path(token): Path<String>) -> ApiResult<Json<Value>> {
    if !is_share_token(&token) {
        return Err(missing());
    }
    let row: Option<(String, String, String, i64)> =
        sqlx::query_as("SELECT layout, theme, snapshot, created_at FROM shares WHERE token = ?")
            .bind(&token).fetch_optional(&state.db).await?;
    let (layout, theme, snapshot, created_at) = row.ok_or_else(missing)?;
    Ok(Json(json!({ "layout": layout, "theme": theme, "snapshot": parse_json(Some(snapshot)), "created_at": created_at })))
}

pub(crate) async fn share_image(State(state): State<AppState>, Path(token): Path<String>) -> Response {
    if !is_share_token(&token) {
        return missing().into_response();
    }
    let row: Result<Option<(Vec<u8>,)>, sqlx::Error> =
        sqlx::query_as("SELECT image FROM shares WHERE token = ?").bind(&token).fetch_optional(&state.db).await;
    match row {
        Ok(Some((image,))) => (
            [(header::CONTENT_TYPE, "image/png"),
             // short, so that a revoked link's image does not linger in caches
             (header::CACHE_CONTROL, "public, max-age=60"),
             (header::X_CONTENT_TYPE_OPTIONS, "nosniff")],
            image,
        ).into_response(),
        Ok(None) => missing().into_response(),
        Err(e) => ApiError::from(e).into_response(),
    }
}

fn escape_html(s: &str) -> String {
    s.chars().map(|c| match c {
        '&' => "&amp;".to_string(),
        '<' => "&lt;".to_string(),
        '>' => "&gt;".to_string(),
        '"' => "&quot;".to_string(),
        '\'' => "&#39;".to_string(),
        c => c.to_string(),
    }).collect()
}

/// Where browsers load the site from: POLITISKEL_ORIGIN when set, else the
/// host they asked for, over https unless cookies are insecure (local
/// development over plain http).
fn origin_of(state: &AppState, headers: &HeaderMap) -> String {
    if let Some(o) = &state.origin {
        return o.clone();
    }
    let get = |k: &str| headers.get(k).and_then(|v| v.to_str().ok()).map(str::to_string);
    let host = if state.trust_proxy { get("x-forwarded-host") } else { None }
        .or_else(|| get("host")).unwrap_or_default();
    // a Host header is the client's word: keep only what a host can hold
    let host: String = host.chars().filter(|c| c.is_ascii_alphanumeric() || ".-:[]".contains(*c)).collect();
    format!("{}://{}", if state.secure_cookies { "https" } else { "http" }, host)
}

/// The page of a share: the site's own page, which draws the card, with the
/// tags a messaging app reads to preview the link. An unknown token gets the
/// page as it is, which says the link does not exist.
pub(crate) async fn share_page(State(state): State<AppState>, headers: HeaderMap, Path(token): Path<String>) -> Response {
    let Ok(page) = tokio::fs::read_to_string(state.site_dir.join("200.html")).await else {
        return ApiError(StatusCode::INTERNAL_SERVER_ERROR, "internal").into_response();
    };
    let mut html = page;
    if is_share_token(&token) {
        let row: Option<(String,)> = sqlx::query_as("SELECT snapshot FROM shares WHERE token = ?")
            .bind(&token).fetch_optional(&state.db).await.ok().flatten();
        if let Some((snapshot,)) = row {
            let snap = parse_json(Some(snapshot));
            let alias: String = snap["alias"].as_str().unwrap_or("").chars().take(40).collect();
            let origin = origin_of(&state, &headers);
            let title = escape_html(&format!("Profil politique de {alias}"));
            let url = escape_html(&format!("{origin}/p/{token}"));
            let image = escape_html(&format!("{origin}/api/shares/{token}/image"));
            let tags = format!(
                "<meta property=\"og:title\" content=\"{title}\">\
                 <meta property=\"og:description\" content=\"Sa position, ses lectures et ses badges sur Politiskel.\">\
                 <meta property=\"og:image\" content=\"{image}\">\
                 <meta property=\"og:url\" content=\"{url}\">\
                 <meta property=\"og:type\" content=\"website\">\
                 <meta name=\"twitter:card\" content=\"summary_large_image\">\
                 <meta name=\"robots\" content=\"noindex\">");
            html = match html.find("</head>") {
                Some(i) => format!("{}{}{}", &html[..i], tags, &html[i..]),
                None => format!("{tags}{html}"),
            };
        }
    }
    let mut res = (StatusCode::OK, html).into_response();
    let h = res.headers_mut();
    h.insert(header::CONTENT_TYPE, HeaderValue::from_static("text/html; charset=utf-8"));
    h.insert(header::CACHE_CONTROL, HeaderValue::from_static("no-cache"));
    res
}
