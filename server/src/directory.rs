//! The directory of listed groups, and asking to join one.
//!
//! A group is secret unless its owner lists it. A listed group shows its
//! name and its number of members to anyone signed in — never who they are
//! or what they answered. A request to join is seen by the owner alone, who
//! accepts it (the requester becomes a member, and their profile is then
//! shown to the group, as for anyone who joins) or declines it.

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use axum_extra::extract::cookie::CookieJar;
use serde::Deserialize;
use serde_json::{json, Value};

use crate::auth::current_user;
use crate::error::{ApiError, ApiResult};
use crate::groups::{is_member, owned_group};
use crate::now;
use crate::state::AppState;

/// Listed groups, with where the viewer stands in each.
pub(crate) async fn directory(State(state): State<AppState>, jar: CookieJar) -> ApiResult<Json<Value>> {
    let (user, _) = current_user(&state, &jar).await?;
    let rows: Vec<(i64, String, i64, bool, bool)> = sqlx::query_as(
        "SELECT g.id, g.name,
                (SELECT COUNT(*) FROM members m WHERE m.group_id = g.id),
                EXISTS (SELECT 1 FROM members m WHERE m.group_id = g.id AND m.user_id = ?),
                EXISTS (SELECT 1 FROM join_requests r WHERE r.group_id = g.id AND r.user_id = ?)
         FROM groups g WHERE g.listed = 1 ORDER BY g.name")
        .bind(user).bind(user).fetch_all(&state.db).await?;
    Ok(Json(Value::Array(rows.into_iter().map(|(id, name, n, member, requested)| json!({
        "id": id, "name": name, "members": n, "member": member, "requested": requested,
    })).collect())))
}

/// A listed group, or the 404 of a group that does not exist: an unlisted
/// one is not there for anyone outside it.
async fn listed_group(state: &AppState, gid: i64) -> ApiResult<()> {
    let row: Option<(i64,)> = sqlx::query_as("SELECT 1 FROM groups WHERE id = ? AND listed = 1")
        .bind(gid).fetch_optional(&state.db).await?;
    row.map(|_| ()).ok_or(ApiError(StatusCode::NOT_FOUND, "no_such_group"))
}

pub(crate) async fn ask_to_join(State(state): State<AppState>, jar: CookieJar, Path(gid): Path<i64>)
    -> ApiResult<StatusCode>
{
    let (user, _) = current_user(&state, &jar).await?;
    listed_group(&state, gid).await?;
    if is_member(&state, gid, user).await? {
        return Err(ApiError(StatusCode::CONFLICT, "already_member"));
    }
    sqlx::query("INSERT OR IGNORE INTO join_requests (group_id, user_id, created_at) VALUES (?, ?, ?)")
        .bind(gid).bind(user).bind(now()).execute(&state.db).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub(crate) async fn withdraw_request(State(state): State<AppState>, jar: CookieJar, Path(gid): Path<i64>)
    -> ApiResult<StatusCode>
{
    let (user, _) = current_user(&state, &jar).await?;
    sqlx::query("DELETE FROM join_requests WHERE group_id = ? AND user_id = ?")
        .bind(gid).bind(user).execute(&state.db).await?;
    Ok(StatusCode::NO_CONTENT)
}

/// The requests waiting on a group, for its owner.
pub(crate) async fn requests(State(state): State<AppState>, jar: CookieJar, Path(gid): Path<i64>)
    -> ApiResult<Json<Value>>
{
    let (user, _) = current_user(&state, &jar).await?;
    owned_group(&state, gid, user).await?;
    let rows: Vec<(String, i64)> = sqlx::query_as(
        "SELECT u.username, r.created_at FROM join_requests r JOIN users u ON u.id = r.user_id
         WHERE r.group_id = ? ORDER BY r.created_at")
        .bind(gid).fetch_all(&state.db).await?;
    Ok(Json(Value::Array(rows.into_iter().map(|(name, at)| json!({ "username": name, "at": at })).collect())))
}

#[derive(Deserialize)]
pub(crate) struct Requester { username: String }

async fn requester(state: &AppState, gid: i64, name: &str) -> ApiResult<i64> {
    let row: Option<(i64,)> = sqlx::query_as(
        "SELECT u.id FROM join_requests r JOIN users u ON u.id = r.user_id
         WHERE r.group_id = ? AND u.username_key = ?")
        .bind(gid).bind(crate::validate::username_key(name)).fetch_optional(&state.db).await?;
    row.map(|r| r.0).ok_or(ApiError(StatusCode::NOT_FOUND, "no_such_request"))
}

pub(crate) async fn accept_request(State(state): State<AppState>, jar: CookieJar, Path(gid): Path<i64>,
                                   Json(body): Json<Requester>) -> ApiResult<StatusCode>
{
    let (user, _) = current_user(&state, &jar).await?;
    owned_group(&state, gid, user).await?;
    let who = requester(&state, gid, &body.username).await?;
    let mut tx = state.db.begin().await?;
    sqlx::query("INSERT OR IGNORE INTO members (group_id, user_id, joined_at) VALUES (?, ?, ?)")
        .bind(gid).bind(who).bind(now()).execute(&mut *tx).await?;
    sqlx::query("DELETE FROM join_requests WHERE group_id = ? AND user_id = ?")
        .bind(gid).bind(who).execute(&mut *tx).await?;
    tx.commit().await?;
    Ok(StatusCode::NO_CONTENT)
}

pub(crate) async fn decline_request(State(state): State<AppState>, jar: CookieJar, Path(gid): Path<i64>,
                                    Json(body): Json<Requester>) -> ApiResult<StatusCode>
{
    let (user, _) = current_user(&state, &jar).await?;
    owned_group(&state, gid, user).await?;
    let who = requester(&state, gid, &body.username).await?;
    sqlx::query("DELETE FROM join_requests WHERE group_id = ? AND user_id = ?")
        .bind(gid).bind(who).execute(&state.db).await?;
    Ok(StatusCode::NO_CONTENT)
}

#[derive(Deserialize)]
pub(crate) struct Listing { listed: bool }

/// Lists a group in the directory, or takes it out. Taken out, the requests
/// waiting on it go: nobody can find it to ask any more.
pub(crate) async fn set_listed(State(state): State<AppState>, jar: CookieJar, Path(gid): Path<i64>,
                               Json(body): Json<Listing>) -> ApiResult<StatusCode>
{
    let (user, _) = current_user(&state, &jar).await?;
    owned_group(&state, gid, user).await?;
    let mut tx = state.db.begin().await?;
    sqlx::query("UPDATE groups SET listed = ? WHERE id = ?").bind(body.listed).bind(gid).execute(&mut *tx).await?;
    if !body.listed {
        sqlx::query("DELETE FROM join_requests WHERE group_id = ?").bind(gid).execute(&mut *tx).await?;
    }
    tx.commit().await?;
    Ok(StatusCode::NO_CONTENT)
}
