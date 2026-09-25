//! The one error type every handler returns: a status and a short code the
//! page turns into a sentence.

use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde_json::json;


pub struct ApiError(pub(crate) StatusCode, pub(crate) &'static str);

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (self.0, Json(json!({ "error": self.1 }))).into_response()
    }
}

impl From<sqlx::Error> for ApiError {
    fn from(e: sqlx::Error) -> Self {
        eprintln!("database error: {e}");
        ApiError(StatusCode::INTERNAL_SERVER_ERROR, "internal")
    }
}

pub(crate) type ApiResult<T> = Result<T, ApiError>;

pub(crate) fn bad(code: &'static str) -> ApiError {
    ApiError(StatusCode::BAD_REQUEST, code)
}
