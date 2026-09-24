//! One's own account: the profile, the export of everything held, and the
//! deletion of everything.

use axum::extract::State;
use axum::http::StatusCode;
use axum::Json;
use axum_extra::extract::cookie::{Cookie, CookieJar};
use serde::Deserialize;
use serde_json::{json, Value};

use crate::state::AppState;
use crate::error::{ApiError, ApiResult, bad};
use crate::auth::{SESSION_COOKIE, verify_password, current_user};
use crate::groups::{settle_groups, groups_of};
use crate::{now, parse_json, validate};

pub(crate) async fn profile_of(state: &AppState, user: i64) -> ApiResult<Value> {
    let (ps, answers, flag): (Option<String>, String, Option<String>) =
        sqlx::query_as("SELECT politiscales, answers, flag FROM profiles WHERE user_id = ?")
            .bind(user).fetch_one(&state.db).await?;
    Ok(json!({ "politiscales": parse_json(ps), "answers": parse_json(Some(answers)), "flag": flag }))
}

pub(crate) async fn me(State(state): State<AppState>, jar: CookieJar) -> ApiResult<Json<Value>> {
    let (id, name) = current_user(&state, &jar).await?;
    Ok(Json(json!({
        "username": name,
        "groups": groups_of(&state, id).await?,
        "profile": profile_of(&state, id).await?,
    })))
}

#[derive(Deserialize)]
pub(crate) struct ProfileUpdate {
    #[serde(default, deserialize_with = "some_or_null")]
    politiscales: Option<Value>,
    answers: Option<Value>,
    #[serde(default, deserialize_with = "some_or_null")]
    flag: Option<Value>,
}

/// Distinguishes a missing field (leave as is) from an explicit null (clear).
pub(crate) fn some_or_null<'de, D: serde::Deserializer<'de>>(d: D) -> Result<Option<Value>, D::Error> {
    Value::deserialize(d).map(Some)
}

pub(crate) async fn put_profile(State(state): State<AppState>, jar: CookieJar, Json(body): Json<ProfileUpdate>)
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
    if let Some(f) = &body.flag {
        let text = match f {
            Value::Null => None,
            Value::String(s) => { validate::flag(s).map_err(bad)?; Some(s.clone()) }
            _ => return Err(bad("flag_not_png")),
        };
        sqlx::query("UPDATE profiles SET flag = ?, updated_at = ? WHERE user_id = ?")
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
pub(crate) async fn export(State(state): State<AppState>, jar: CookieJar) -> ApiResult<Json<Value>> {
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
pub(crate) struct Confirm { password: String }

/// Deletes the account and, by cascade, its sessions, memberships and
/// profile; then any group left with no member (art. 17).
pub(crate) async fn delete_me(State(state): State<AppState>, jar: CookieJar, Json(body): Json<Confirm>)
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
    settle_groups(&mut tx).await?;
    tx.commit().await?;
    Ok((StatusCode::NO_CONTENT, jar.remove(Cookie::build(SESSION_COOKIE).path("/"))))
}
