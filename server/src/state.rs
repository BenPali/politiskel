//! Configuration and the state every handler shares: the database, the
//! built site, how the server sits behind its proxy, and who may sign up.

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use sqlx::SqlitePool;


/// Who may open an account.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Signup {
    /// Anyone who reaches the site.
    Open,
    /// Only someone holding a valid invitation link: the site then grows
    /// only through its groups. The first account, on an empty database, is
    /// the exception — someone has to create the first group.
    Invite,
}

#[derive(Clone)]
pub struct AppState {
    pub db: SqlitePool,
    /// The built site (site/build), served page by page.
    pub site_dir: std::path::PathBuf,
    /// Off only for local development over plain http.
    pub secure_cookies: bool,
    /// Whether to read the client's address from X-Forwarded-For, as set by
    /// the reverse proxy in front; otherwise the socket's address is used.
    pub trust_proxy: bool,
    /// The public origin browsers load the page from ("https://host"), when
    /// the proxy does not pass the Host header through (nginx by default).
    pub origin: Option<String>,
    pub signup: Signup,
    pub(crate) failures: Arc<Mutex<HashMap<String, (u32, i64)>>>,
    pub(crate) signups: Arc<Mutex<HashMap<String, (u32, i64)>>>,
}

impl AppState {
    pub fn new(db: SqlitePool, site_dir: std::path::PathBuf, secure_cookies: bool) -> Self {
        Self { db, site_dir, secure_cookies, trust_proxy: false, origin: None,
               signup: Signup::Open, failures: Arc::default(), signups: Arc::default() }
    }

    pub fn with_signup(mut self, signup: Signup) -> Self {
        self.signup = signup;
        self
    }

    pub fn trusting_proxy(mut self, yes: bool) -> Self {
        self.trust_proxy = yes;
        self
    }

    pub fn with_origin(mut self, origin: Option<String>) -> Self {
        self.origin = origin.map(|o| o.trim_end_matches('/').to_string());
        self
    }
}

/// The client's address: the socket's, or behind a trusted proxy the last
/// X-Forwarded-For entry across every such header line — the one the proxy
/// itself added, which a client cannot forge. Some proxies add a line of their
/// own rather than appending to the client's, so the first line alone could be
/// the client's invention. IPv6 addresses are cut to their /64.
pub struct ClientIp(pub String);

pub(crate) fn address_key(ip: &str) -> String {
    match ip.parse::<std::net::IpAddr>() {
        Ok(std::net::IpAddr::V6(v6)) => {
            let s = v6.segments();
            format!("{:x}:{:x}:{:x}:{:x}::/64", s[0], s[1], s[2], s[3])
        }
        Ok(v4) => v4.to_string(),
        Err(_) => ip.to_string(),
    }
}

impl axum::extract::FromRequestParts<AppState> for ClientIp {
    type Rejection = std::convert::Infallible;
    async fn from_request_parts(parts: &mut axum::http::request::Parts, state: &AppState)
        -> Result<Self, Self::Rejection>
    {
        if state.trust_proxy {
            let last = parts.headers.get_all("x-forwarded-for").iter()
                .filter_map(|v| v.to_str().ok())
                .flat_map(|v| v.split(','))
                .map(str::trim).filter(|v| !v.is_empty())
                .last().map(str::to_string);
            if let Some(ip) = last {
                return Ok(ClientIp(address_key(&ip)));
            }
        }
        let ip = parts.extensions.get::<axum::extract::ConnectInfo<std::net::SocketAddr>>()
            .map(|c| c.0.ip().to_string()).unwrap_or_else(|| "unknown".into());
        Ok(ClientIp(address_key(&ip)))
    }
}
