//! What the server tells its log (stderr, so the journal under systemd): a
//! line for every request that failed or was slow, and nothing personal.
//!
//!   http 403 POST /api/groups/{id}/remove 4ms not_owner
//!
//! The path is the route's shape: a number or a group's UUID reads {id} and
//! an invitation code {code}, so no group, member or invitation can be read off the log. No
//! address, no name, no body. Left out as noise: the 401 every signed-out
//! visit gets from /api/me, and a missing file outside the API (robots
//! probing for /wp-login.php).

use std::time::Instant;

use axum::extract::State;
use axum::http::{Method, Request, StatusCode};
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde_json::json;

use crate::state::AppState;

/// The error code an ApiError answered with, for the log line.
#[derive(Clone, Copy)]
pub(crate) struct ErrorCode(pub(crate) &'static str);

/// A request's path with what identifies anyone taken out.
pub(crate) fn route_of(path: &str) -> String {
    let parts: Vec<String> = path.split('/').map(|seg| {
        if !seg.is_empty() && seg.bytes().all(|b| b.is_ascii_digit()) {
            "{id}".to_string()
        } else if crate::groups::is_public_id(seg) {
            "{id}".to_string()
        } else if seg.len() >= 16 && seg.bytes().all(|b| b.is_ascii_hexdigit()) {
            "{code}".to_string()
        } else {
            seg.to_string()
        }
    }).collect();
    let route = parts.join("/");
    // outside the API, an address may hold a member's name: say only where
    if !route.starts_with("/api/") {
        return match route.split('/').nth(1) {
            Some(first) if !first.is_empty() => format!("/{first}/…"),
            _ => route,
        };
    }
    route
}

pub(crate) async fn log_errors(req: Request<axum::body::Body>, next: Next) -> Response {
    let start = Instant::now();
    let method = req.method().clone();
    let path = req.uri().path().to_string();
    let res = next.run(req).await;
    let status = res.status();
    let ms = start.elapsed().as_millis();
    let api = path.starts_with("/api/");
    let noise = (status == StatusCode::UNAUTHORIZED && method == Method::GET && path == "/api/me")
        || (status == StatusCode::NOT_FOUND && !api);
    if (status.as_u16() >= 400 && !noise) || ms >= 1000 {
        let code = res.extensions().get::<ErrorCode>().map(|c| c.0).unwrap_or("");
        eprintln!("http {} {} {} {}ms {}", status.as_u16(), method, route_of(&path), ms, code);
    }
    res
}

/// For a monitor: 200 while the database answers, 503 when it does not.
pub(crate) async fn health(State(state): State<AppState>) -> Response {
    match sqlx::query_scalar::<_, i64>("SELECT 1").fetch_one(&state.db).await {
        Ok(_) => Json(json!({ "ok": true })).into_response(),
        Err(e) => {
            eprintln!("health: database does not answer: {e}");
            (StatusCode::SERVICE_UNAVAILABLE, Json(json!({ "ok": false }))).into_response()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::route_of;

    #[test]
    fn a_route_keeps_nothing_that_identifies() {
        assert_eq!(route_of("/api/groups/42/remove"), "/api/groups/{id}/remove");
        assert_eq!(route_of("/api/groups/1b4e28ba-2fa1-41d2-883f-0016d3cca427/remove"), "/api/groups/{id}/remove");
        assert_eq!(route_of("/api/invites/0123456789abcdef0123456789abcdef"), "/api/invites/{code}");
        assert_eq!(route_of("/boussole/jean.dupont"), "/boussole/…");
        assert_eq!(route_of("/rejoindre/0123456789abcdef0123456789abcdef"), "/rejoindre/…");
        assert_eq!(route_of("/api/me"), "/api/me");
    }
}
