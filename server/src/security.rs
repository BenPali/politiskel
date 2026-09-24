//! Middleware every response goes through: the same-origin check on writes,
//! and the security headers.

use axum::extract::State;
use axum::http::{header, HeaderValue, Request, StatusCode};
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};

use crate::state::AppState;
use crate::error::ApiError;

/// Refuses a state-changing request that another site sent. SameSite=Strict
/// keeps the session cookie from other sites, but a sibling subdomain counts
/// as the same site, and two endpoints (leave, logout) take no JSON body that
/// a form could not forge. Browsers send Origin on every such request; when
/// they do not, Sec-Fetch-Site says where it came from.
///
/// The expected origin is POLITISKEL_ORIGIN when set; otherwise the host the
/// browser asked for — X-Forwarded-Host behind a trusted proxy, else Host. A
/// proxy that rewrites Host (nginx does by default) needs one of the two.
pub(crate) async fn same_origin_writes(State(state): State<AppState>, req: Request<axum::body::Body>, next: Next)
    -> Response
{
    use axum::http::Method;
    if matches!(*req.method(), Method::POST | Method::PUT | Method::DELETE | Method::PATCH) {
        let h = req.headers();
        let header_str = |k: &str| h.get(k).and_then(|v| v.to_str().ok()).map(str::to_string);
        let host = if state.trust_proxy { header_str("x-forwarded-host") } else { None }
            .or_else(|| header_str("host")).unwrap_or_default();
        let origin_ok = match h.get(header::ORIGIN).and_then(|v| v.to_str().ok()) {
            Some(o) => match &state.origin {
                Some(expected) => o == expected,
                None => o.split_once("://").map(|(_, rest)| rest) == Some(host.as_str()),
            },
            None => !matches!(h.get("sec-fetch-site").and_then(|v| v.to_str().ok()),
                              Some("cross-site") | Some("same-site")),
        };
        if !origin_ok {
            return ApiError(StatusCode::FORBIDDEN, "cross_origin").into_response();
        }
    }
    next.run(req).await
}

pub(crate) async fn security_headers(req: Request<axum::body::Body>, next: Next) -> Response {
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

pub(crate) fn req_is_api(res: &Response) -> bool {
    res.headers().get(header::CONTENT_TYPE).is_some_and(|v| v.as_bytes().starts_with(b"application/json"))
}
