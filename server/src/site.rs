//! The page itself, served at / and at every site path it routes on its own.

use axum::extract::State;
use axum::http::{Request, StatusCode};
use axum::response::{Html, IntoResponse, Response};

use crate::state::AppState;
use crate::error::ApiError;

pub(crate) async fn page(State(state): State<AppState>) -> Html<String> {
    Html(state.page.as_ref().clone())
}

pub(crate) async fn site_page(State(state): State<AppState>, req: Request<axum::body::Body>) -> Response {
    let path = req.uri().path();
    if req.method() != axum::http::Method::GET || path.starts_with("/api/") {
        return ApiError(StatusCode::NOT_FOUND, "not_found").into_response();
    }
    Html(state.page.as_ref().clone()).into_response()
}
