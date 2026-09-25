//! Groups on invitation, their owners, and what members see of each other.

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use axum_extra::extract::cookie::CookieJar;
use serde::Deserialize;
use serde_json::{json, Value};

use crate::state::AppState;
use crate::error::{ApiError, ApiResult, bad};
use crate::auth::{random_hex, current_user};
use crate::{now, parse_json, validate};

/// Passes for the group's owner; a member who is not gets 403, anyone else
/// the 404 of a group that does not exist.
pub(crate) async fn owned_group(state: &AppState, group: i64, user: i64) -> ApiResult<()> {
    let row: Option<(Option<i64>,)> = sqlx::query_as(
        "SELECT g.owner_id FROM groups g JOIN members m ON m.group_id = g.id
         WHERE g.id = ? AND m.user_id = ?")
        .bind(group).bind(user).fetch_optional(&state.db).await?;
    match row {
        None => Err(ApiError(StatusCode::NOT_FOUND, "no_such_group")),
        Some((owner,)) if owner == Some(user) => Ok(()),
        Some(_) => Err(ApiError(StatusCode::FORBIDDEN, "not_owner")),
    }
}

/// A group with no member left is deleted; one whose owner is gone — left,
/// or deleted their account, which the foreign key sets to NULL — passes to
/// its longest-standing member.
pub async fn settle_groups(tx: &mut sqlx::SqliteConnection) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM groups WHERE id NOT IN (SELECT group_id FROM members)")
        .execute(&mut *tx).await?;
    sqlx::query(
        "UPDATE groups SET owner_id = (
             SELECT m.user_id FROM members m WHERE m.group_id = groups.id
             ORDER BY m.joined_at, m.user_id LIMIT 1)
         WHERE owner_id IS NULL
            OR owner_id NOT IN (SELECT m2.user_id FROM members m2 WHERE m2.group_id = groups.id)")
        .execute(&mut *tx).await?;
    Ok(())
}

pub(crate) async fn is_member(state: &AppState, group: i64, user: i64) -> ApiResult<bool> {
    let row: Option<(i64,)> = sqlx::query_as("SELECT 1 FROM members WHERE group_id = ? AND user_id = ?")
        .bind(group).bind(user).fetch_optional(&state.db).await?;
    Ok(row.is_some())
}

pub(crate) async fn groups_of(state: &AppState, user: i64) -> ApiResult<Vec<Value>> {
    let rows: Vec<(i64, String, String, i64, Option<i64>, Option<String>)> = sqlx::query_as(
        "SELECT g.id, g.name, g.invite_code,
                (SELECT COUNT(*) FROM members m2 WHERE m2.group_id = g.id), g.owner_id,
                (SELECT u.username FROM users u WHERE u.id = g.owner_id)
         FROM groups g JOIN members m ON m.group_id = g.id
         WHERE m.user_id = ? ORDER BY g.name")
        .bind(user).fetch_all(&state.db).await?;
    Ok(rows.into_iter()
        .map(|(id, name, invite, n, owner, owner_name)| json!({ "id": id, "name": name, "invite": invite,
                                                    "members": n, "owner": owner == Some(user),
                                                    "owner_name": owner_name }))
        .collect())
}

#[derive(Deserialize)]
pub(crate) struct NewGroup { name: String }

pub(crate) async fn create_group(State(state): State<AppState>, jar: CookieJar, Json(body): Json<NewGroup>)
    -> ApiResult<(StatusCode, Json<Value>)>
{
    let (user, _) = current_user(&state, &jar).await?;
    let name = validate::group_name(&body.name).map_err(bad)?;
    let t = now();
    let invite = random_hex(16);
    let mut tx = state.db.begin().await?;
    let gid = sqlx::query("INSERT INTO groups (name, invite_code, created_at, owner_id) VALUES (?, ?, ?, ?)")
        .bind(&name).bind(&invite).bind(t).bind(user).execute(&mut *tx).await?.last_insert_rowid();
    sqlx::query("INSERT INTO members (group_id, user_id, joined_at) VALUES (?, ?, ?)")
        .bind(gid).bind(user).bind(t).execute(&mut *tx).await?;
    tx.commit().await?;
    Ok((StatusCode::CREATED, Json(json!({ "id": gid, "name": name, "invite": invite, "members": 1,
                                          "owner": true }))))
}

/// What an invitation leads to, so the page can ask before joining: joining
/// shows one's profile to every member, which is not something a link should
/// do on its own. Signed-in only, and the code is 128 random bits.
pub(crate) async fn invite_preview(State(state): State<AppState>, jar: CookieJar, Path(code): Path<String>)
    -> ApiResult<Json<Value>>
{
    let (user, _) = current_user(&state, &jar).await?;
    let row: Option<(i64, String, i64)> = sqlx::query_as(
        "SELECT g.id, g.name, (SELECT COUNT(*) FROM members m WHERE m.group_id = g.id)
         FROM groups g WHERE g.invite_code = ?")
        .bind(code.trim()).fetch_optional(&state.db).await?;
    let (gid, name, n) = row.ok_or(ApiError(StatusCode::NOT_FOUND, "no_such_invite"))?;
    Ok(Json(json!({ "id": gid, "name": name, "members": n,
                    "member": is_member(&state, gid, user).await? })))
}

#[derive(Deserialize)]
pub(crate) struct Join { code: String }

pub(crate) async fn join_group(State(state): State<AppState>, jar: CookieJar, Json(body): Json<Join>)
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

pub(crate) async fn leave_group(State(state): State<AppState>, jar: CookieJar, Path(gid): Path<i64>)
    -> ApiResult<StatusCode>
{
    let (user, _) = current_user(&state, &jar).await?;
    let mut tx = state.db.begin().await?;
    sqlx::query("DELETE FROM members WHERE group_id = ? AND user_id = ?")
        .bind(gid).bind(user).execute(&mut *tx).await?;
    settle_groups(&mut tx).await?;
    tx.commit().await?;
    Ok(StatusCode::NO_CONTENT)
}

/// A new invitation link: the old one stops working at once. For when a link
/// went further than meant.
pub(crate) async fn new_invite(State(state): State<AppState>, jar: CookieJar, Path(gid): Path<i64>)
    -> ApiResult<Json<Value>>
{
    let (user, _) = current_user(&state, &jar).await?;
    owned_group(&state, gid, user).await?;
    let invite = random_hex(16);
    sqlx::query("UPDATE groups SET invite_code = ? WHERE id = ?")
        .bind(&invite).bind(gid).execute(&state.db).await?;
    Ok(Json(json!({ "invite": invite })))
}

#[derive(Deserialize)]
pub(crate) struct Member { username: String }

/// The member of `gid` named `name`, other than `user`.
pub(crate) async fn member_named(state: &AppState, gid: i64, user: i64, name: &str) -> ApiResult<i64> {
    let row: Option<(i64,)> = sqlx::query_as(
        "SELECT u.id FROM users u JOIN members m ON m.user_id = u.id
         WHERE m.group_id = ? AND u.username_key = ? AND u.id != ?")
        .bind(gid).bind(validate::username_key(name)).bind(user)
        .fetch_optional(&state.db).await?;
    row.map(|r| r.0).ok_or(ApiError(StatusCode::NOT_FOUND, "no_such_member"))
}

/// Shows a member out. They lose sight of the group at once; with the link
/// changed as well, they cannot come back on their own.
pub(crate) async fn remove_member(State(state): State<AppState>, jar: CookieJar, Path(gid): Path<i64>,
                       Json(body): Json<Member>) -> ApiResult<StatusCode>
{
    let (user, _) = current_user(&state, &jar).await?;
    owned_group(&state, gid, user).await?;
    let target = member_named(&state, gid, user, &body.username).await?;
    sqlx::query("DELETE FROM members WHERE group_id = ? AND user_id = ?")
        .bind(gid).bind(target).execute(&state.db).await?;
    Ok(StatusCode::NO_CONTENT)
}

/// Hands the group to another member, who becomes its owner.
pub(crate) async fn hand_over_group(State(state): State<AppState>, jar: CookieJar, Path(gid): Path<i64>,
                         Json(body): Json<Member>) -> ApiResult<StatusCode>
{
    let (user, _) = current_user(&state, &jar).await?;
    owned_group(&state, gid, user).await?;
    let target = member_named(&state, gid, user, &body.username).await?;
    sqlx::query("UPDATE groups SET owner_id = ? WHERE id = ?")
        .bind(target).bind(gid).execute(&state.db).await?;
    Ok(StatusCode::NO_CONTENT)
}

/// Deletes the group for everyone. Profiles stay with their accounts: only
/// the memberships go.
pub(crate) async fn delete_group(State(state): State<AppState>, jar: CookieJar, Path(gid): Path<i64>)
    -> ApiResult<StatusCode>
{
    let (user, _) = current_user(&state, &jar).await?;
    owned_group(&state, gid, user).await?;
    sqlx::query("DELETE FROM groups WHERE id = ?").bind(gid).execute(&state.db).await?;
    Ok(StatusCode::NO_CONTENT)
}

/// A group's profiles, for its members only. A non-member gets the same 404
/// as a group that does not exist, so group ids reveal nothing.
pub(crate) async fn group_profiles(State(state): State<AppState>, jar: CookieJar, Path(gid): Path<i64>)
    -> ApiResult<Json<Value>>
{
    let (user, _) = current_user(&state, &jar).await?;
    if !is_member(&state, gid, user).await? {
        return Err(ApiError(StatusCode::NOT_FOUND, "no_such_group"));
    }
    let rows: Vec<(i64, String, Option<String>, String, Option<String>, bool)> = sqlx::query_as(
        "SELECT u.id, u.username, p.politiscales, p.answers, p.flag, g.owner_id IS u.id
         FROM members m JOIN users u ON u.id = m.user_id JOIN profiles p ON p.user_id = u.id
         JOIN groups g ON g.id = m.group_id
         WHERE m.group_id = ? ORDER BY u.username")
        .bind(gid).fetch_all(&state.db).await?;
    Ok(Json(Value::Array(rows.into_iter().map(|(uid, name, ps, a, flag, owner)| json!({
        "username": name, "me": uid == user, "owner": owner,
        "politiscales": parse_json(ps), "answers": parse_json(Some(a)), "flag": flag,
    })).collect())))
}
