//! Runs the Politiskel backend.
//!
//! Configuration, all optional, from the environment:
//!   POLITISKEL_ADDR   address to listen on        (default 127.0.0.1:8080)
//!   POLITISKEL_DB     SQLite database file        (default politiskel.db)
//!   POLITISKEL_PAGE   the page to serve           (default ../template.html)
//!   POLITISKEL_INSECURE_COOKIES=1   plain-http development only
//!   POLITISKEL_TRUST_PROXY=1        take the client address from the
//!                                   X-Forwarded-For the reverse proxy sets
//!   POLITISKEL_ORIGIN               the public origin, e.g. https://host —
//!                                   needed when the proxy rewrites Host
//!
//! It listens on localhost by default: put it behind a reverse proxy that
//! terminates HTTPS. Session cookies are marked Secure, so over plain http a
//! browser will not send them back unless POLITISKEL_INSECURE_COOKIES is set.

use std::str::FromStr;

use politiskel_server::{app, migrate, AppState};
use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions};

#[tokio::main]
async fn main() {
    let env = |k: &str, d: &str| std::env::var(k).unwrap_or_else(|_| d.to_string());
    let addr = env("POLITISKEL_ADDR", "127.0.0.1:8080");
    let db_path = env("POLITISKEL_DB", "politiskel.db");
    let page_path = env("POLITISKEL_PAGE", "../template.html");
    let insecure = std::env::var("POLITISKEL_INSECURE_COOKIES").is_ok_and(|v| v == "1");
    let trust_proxy = std::env::var("POLITISKEL_TRUST_PROXY").is_ok_and(|v| v == "1");

    let page = std::fs::read_to_string(&page_path)
        .unwrap_or_else(|e| panic!("cannot read the page at {page_path}: {e}"));

    let opts = SqliteConnectOptions::from_str(&format!("sqlite://{db_path}"))
        .expect("database path")
        .create_if_missing(true)
        .foreign_keys(true)                       // the cascades depend on it
        .journal_mode(SqliteJournalMode::Wal);
    let db = SqlitePoolOptions::new().max_connections(8).connect_with(opts).await
        .expect("cannot open the database");
    migrate(&db).await.expect("cannot migrate the database");

    let listener = tokio::net::TcpListener::bind(&addr).await
        .unwrap_or_else(|e| panic!("cannot listen on {addr}: {e}"));
    if insecure {
        eprintln!("warning: POLITISKEL_INSECURE_COOKIES=1 — for local development only");
    }
    eprintln!("politiskel-server listening on http://{addr}  (database {db_path})");
    let origin = std::env::var("POLITISKEL_ORIGIN").ok().filter(|v| !v.is_empty());
    let state = AppState::new(db, page, !insecure).trusting_proxy(trust_proxy).with_origin(origin);
    axum::serve(listener, app(state).into_make_service_with_connect_info::<std::net::SocketAddr>())
        .with_graceful_shutdown(async { let _ = tokio::signal::ctrl_c().await; })
        .await
        .expect("server error");
}
