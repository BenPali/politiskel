//! Runs the Politiskel backend.
//!
//! Configuration, all optional, from the environment:
//!   POLITISKEL_ADDR   address to listen on        (default 127.0.0.1:8080)
//!   POLITISKEL_DB     SQLite database file        (default politiskel.db)
//!   POLITISKEL_PAGE   the page to serve           (default ../template.html)
//!   POLITISKEL_SITE   the built site (site/build), served instead of the page
//!   POLITISKEL_INSECURE_COOKIES=1   plain-http development only
//!   POLITISKEL_TRUST_PROXY=1        take the client address from the
//!                                   X-Forwarded-For the reverse proxy sets
//!   POLITISKEL_ORIGIN               the public origin, e.g. https://host —
//!                                   needed when the proxy rewrites Host
//!   POLITISKEL_SIGNUP=invite        accounts only from an invitation link
//!                                   (default: open to anyone)
//!
//! Two maintenance commands, run beside the service on the same database:
//!   politiskel-server reset-password <username>
//!       sets a new random password, prints it once, and signs the account
//!       out everywhere — there is no e-mail, so this is how a lost password
//!       is recovered, by whoever runs the server;
//!   politiskel-server backup <file>
//!       writes a consistent copy of the database, safe while it runs.
//!
//! It listens on localhost by default: put it behind a reverse proxy that
//! terminates HTTPS. Session cookies are marked Secure, so over plain http a
//! browser will not send them back unless POLITISKEL_INSECURE_COOKIES is set.

use std::str::FromStr;

use politiskel_server::{app, hash_password, migrate, AppState, Signup};
use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions};

#[tokio::main]
async fn main() {
    let env = |k: &str, d: &str| std::env::var(k).unwrap_or_else(|_| d.to_string());
    let addr = env("POLITISKEL_ADDR", "127.0.0.1:8080");
    let db_path = env("POLITISKEL_DB", "politiskel.db");
    let page_path = env("POLITISKEL_PAGE", "../template.html");
    let insecure = std::env::var("POLITISKEL_INSECURE_COOKIES").is_ok_and(|v| v == "1");
    let trust_proxy = std::env::var("POLITISKEL_TRUST_PROXY").is_ok_and(|v| v == "1");

    let args: Vec<String> = std::env::args().skip(1).collect();

    let opts = SqliteConnectOptions::from_str(&format!("sqlite://{db_path}"))
        .expect("database path")
        .create_if_missing(true)
        .foreign_keys(true)                       // the cascades depend on it
        .journal_mode(SqliteJournalMode::Wal);
    let db = SqlitePoolOptions::new().max_connections(8).connect_with(opts).await
        .expect("cannot open the database");
    migrate(&db).await.expect("cannot migrate the database");

    match args.first().map(String::as_str) {
        Some("reset-password") => return reset_password(&db, args.get(1)).await,
        Some("backup") => return backup(&db, args.get(1)).await,
        Some(other) => {
            eprintln!("unknown command {other:?}: expected reset-password <username> or backup <file>");
            std::process::exit(2);
        }
        None => {}
    }

    // The built site, when there is one; else the single page of the first version.
    let site_dir = std::env::var("POLITISKEL_SITE").ok().filter(|v| !v.is_empty()).map(std::path::PathBuf::from);
    if let Some(dir) = &site_dir {
        assert!(dir.join("200.html").is_file(), "POLITISKEL_SITE={}: no 200.html there — build the site first", dir.display());
    }
    let page = if site_dir.is_some() { String::new() } else {
        std::fs::read_to_string(&page_path)
            .unwrap_or_else(|e| panic!("cannot read the page at {page_path}: {e}"))
    };
    let signup = match env("POLITISKEL_SIGNUP", "open").as_str() {
        "open" => Signup::Open,
        "invite" => Signup::Invite,
        other => panic!("POLITISKEL_SIGNUP must be open or invite, not {other:?}"),
    };

    let listener = tokio::net::TcpListener::bind(&addr).await
        .unwrap_or_else(|e| panic!("cannot listen on {addr}: {e}"));
    if insecure {
        eprintln!("warning: POLITISKEL_INSECURE_COOKIES=1 — for local development only");
    }
    eprintln!("politiskel-server listening on http://{addr}  (database {db_path})");
    let origin = std::env::var("POLITISKEL_ORIGIN").ok().filter(|v| !v.is_empty());
    let state = AppState::new(db, page, !insecure).trusting_proxy(trust_proxy).with_origin(origin)
        .with_signup(signup).serving_site(site_dir);
    if signup == Signup::Invite {
        eprintln!("sign-up: by invitation only");
    }
    axum::serve(listener, app(state).into_make_service_with_connect_info::<std::net::SocketAddr>())
        .with_graceful_shutdown(async { let _ = tokio::signal::ctrl_c().await; })
        .await
        .expect("server error");
}

async fn reset_password(db: &sqlx::SqlitePool, name: Option<&String>) {
    let Some(name) = name else {
        eprintln!("usage: politiskel-server reset-password <username>");
        std::process::exit(2);
    };
    let key = politiskel_server::validate::username_key(name);
    let row: Option<(i64, String)> = sqlx::query_as("SELECT id, username FROM users WHERE username_key = ?")
        .bind(&key).fetch_optional(db).await.expect("database");
    let Some((id, username)) = row else {
        eprintln!("no account named {name:?}");
        std::process::exit(1);
    };
    // 16 random bytes, hex: well past the ten-character minimum.
    let mut buf = [0u8; 16];
    rand::RngCore::fill_bytes(&mut rand::rngs::OsRng, &mut buf);
    let password: String = buf.iter().map(|b| format!("{b:02x}")).collect();
    let hash = hash_password(password.clone()).await.unwrap_or_else(|_| panic!("cannot hash"));
    let mut tx = db.begin().await.expect("database");
    sqlx::query("UPDATE users SET pw_hash = ? WHERE id = ?").bind(hash).bind(id)
        .execute(&mut *tx).await.expect("database");
    sqlx::query("DELETE FROM sessions WHERE user_id = ?").bind(id)
        .execute(&mut *tx).await.expect("database");
    tx.commit().await.expect("database");
    println!("new password for {username}: {password}");
    println!("(signed out everywhere; they should change it from their account page)");
}

async fn backup(db: &sqlx::SqlitePool, file: Option<&String>) {
    let Some(file) = file else {
        eprintln!("usage: politiskel-server backup <file>");
        std::process::exit(2);
    };
    if std::path::Path::new(file).exists() {
        eprintln!("{file} already exists: pick a new name, a backup never overwrites");
        std::process::exit(1);
    }
    // VACUUM INTO writes a consistent, compacted copy while the service runs.
    sqlx::query("VACUUM INTO ?").bind(file).execute(db).await
        .unwrap_or_else(|e| panic!("backup failed: {e}"));
    println!("database copied to {file}");
}
