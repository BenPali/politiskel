//! Politiskel's optional backend: accounts, groups on invitation, and one
//! saved profile per account.
//!
//! It serves the built site (site/build) and its API. The server stores what
//! the site needs and nothing more: PolitiScales percentages already read in the
//! browser (never the screenshot), and questionnaire answers. Scoring stays in
//! the browser.
//!
//! Political opinions are special-category data under GDPR art. 9, which
//! shapes the whole design: explicit consent at sign-up, pseudonymous
//! usernames, visibility limited to the groups one has joined, an export of
//! one's own data, and an account deletion that deletes everything.
//!
//! The crate is split by concern: `state` (configuration and shared state),
//! `error`, `security` (the middleware on every response), `auth` (sign-up,
//! sessions, passwords), `account` (one's profile, export, deletion),
//! `groups`, `directory` (listed groups and requests to join), and `site`
//! (the built site). `validate` checks every input.

pub mod validate;
mod account;
mod directory;
mod auth;
mod error;
mod groups;
mod security;
mod site;
mod state;

pub use auth::hash_password;
pub use error::ApiError;
pub use groups::settle_groups;
pub use state::{AppState, ClientIp, Signup};

use std::time::{SystemTime, UNIX_EPOCH};
use axum::extract::DefaultBodyLimit;
use axum::middleware::{self};
use axum::routing::{get, post, put};
use axum::Router;
use serde_json::Value;
use sqlx::SqlitePool;

use crate::auth::{config, register, login, logout, change_password, end_other_sessions};
use crate::security::{same_origin_writes, security_headers};
use crate::site::site_page;
use crate::account::{me, put_profile, export, delete_me};
use crate::directory::{directory, ask_to_join, withdraw_request, requests, accept_request, decline_request, set_listed};
use crate::groups::{create_group, invite_preview, join_group, leave_group, new_invite, remove_member, hand_over_group, delete_group, group_profiles};

pub async fn migrate(db: &SqlitePool) -> Result<(), sqlx::migrate::MigrateError> {
    sqlx::migrate!("./migrations").run(db).await
}

pub fn app(state: AppState) -> Router {
    Router::new()
        .route("/", get(site_page))
        .route("/api/config", get(config))
        .route("/api/register", post(register))
        .route("/api/login", post(login))
        .route("/api/logout", post(logout))
        .route("/api/me", get(me).delete(delete_me))
        .route("/api/me/profile", put(put_profile))
        .route("/api/me/export", get(export))
        .route("/api/me/password", post(change_password))
        .route("/api/me/sessions/others", axum::routing::delete(end_other_sessions))
        .route("/api/groups", post(create_group))
        .route("/api/groups/join", post(join_group))
        .route("/api/invites/{code}", get(invite_preview))
        .route("/api/groups/{id}", axum::routing::delete(delete_group))
        .route("/api/groups/{id}/leave", post(leave_group))
        .route("/api/groups/{id}/invite", post(new_invite))
        .route("/api/groups/{id}/remove", post(remove_member))
        .route("/api/groups/{id}/owner", post(hand_over_group))
        .route("/api/groups/{id}/profiles", get(group_profiles))
        .route("/api/directory", get(directory))
        .route("/api/groups/{id}/request", post(ask_to_join).delete(withdraw_request))
        .route("/api/groups/{id}/requests", get(requests))
        .route("/api/groups/{id}/requests/accept", post(accept_request))
        .route("/api/groups/{id}/requests/decline", post(decline_request))
        .route("/api/groups/{id}/listed", post(set_listed))
        // The site's pages — /connexion, /groupes, /rejoindre/<code>… — are
        // one page that routes itself; an unknown /api/ path stays a 404.
        .fallback(site_page)
        .layer(DefaultBodyLimit::max(64 * 1024))
        .layer(middleware::from_fn_with_state(state.clone(), same_origin_writes))
        .layer(middleware::from_fn(security_headers))
        .with_state(state)
}

pub(crate) fn now() -> i64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs() as i64).unwrap_or(0)
}

pub(crate) fn parse_json(text: Option<String>) -> Value {
    text.and_then(|t| serde_json::from_str(&t).ok()).unwrap_or(Value::Null)
}
