//! The site: the SvelteKit build, served at / and at every path it routes.

use axum::extract::State;
use axum::http::{header, HeaderValue, Method, Request, StatusCode};
use axum::response::{IntoResponse, Response};
use tower::ServiceExt;
use tower_http::services::ServeFile;

use crate::error::ApiError;
use crate::state::AppState;

pub(crate) async fn site_page(State(state): State<AppState>, req: Request<axum::body::Body>) -> Response {
    let path = req.uri().path().to_string();
    if !matches!(*req.method(), Method::GET | Method::HEAD) || path.starts_with("/api/") {
        return ApiError(StatusCode::NOT_FOUND, "not_found").into_response();
    }
    let dir = state.site_dir.clone();
    // A prerendered page is /x.html or /x/index.html; an asset is itself;
    // anything else — a member, a group, an invitation — is the fallback
    // page, which routes in the browser. No "..", no hidden file.
    let rel = path.trim_start_matches('/');
    if rel.split('/').any(|seg| seg == ".." || seg.starts_with('.')) {
        return ApiError(StatusCode::NOT_FOUND, "not_found").into_response();
    }
    let candidates: Vec<String> = if rel.is_empty() {
        vec!["index.html".into()]
    } else {
        vec![rel.to_string(), format!("{rel}.html"), format!("{rel}/index.html")]
    };
    let found = candidates.into_iter().map(|c| dir.join(c)).find(|p| p.is_file());
    let file = found.unwrap_or_else(|| dir.join("200.html"));
    let html = file.extension().is_some_and(|e| e == "html");
    let mut res = match ServeFile::new(&file).oneshot(req).await {
        Ok(r) => r.into_response(),
        Err(_) => return ApiError(StatusCode::INTERNAL_SERVER_ERROR, "internal").into_response(),
    };
    // Built assets carry a hash in their name and never change; pages do.
    let cache = if path.starts_with("/_app/immutable/") {
        "public, max-age=31536000, immutable"
    } else if html {
        "no-cache"
    } else {
        "public, max-age=3600"
    };
    res.headers_mut().insert(header::CACHE_CONTROL, HeaderValue::from_static(cache));
    res
}
