# Deploying the Politiskel server

A Linux host (x86_64 here), a reverse proxy that terminates HTTPS, and one
SQLite file. The files this guide refers to are in `deploy/`.

## 1. Build

**On the server**, with Rust installed (`rustup`), from a checkout:

```
node tools/extract.js            # builds template.html (no profile in it)
cd server && cargo build --release
```

**Or from another machine**, as one static binary that needs no library on
the server:

```
rustup target add x86_64-unknown-linux-musl
cargo install cargo-zigbuild      # a cross-linker; needs `zig` (brew install zig)
cd server && cargo zigbuild --release --target x86_64-unknown-linux-musl
# → target/x86_64-unknown-linux-musl/release/politiskel-server
```

## 2. Install

```
sudo useradd --system --home /var/lib/politiskel --shell /usr/sbin/nologin politiskel
sudo install -d -o politiskel -g politiskel -m 700 /var/lib/politiskel /var/backups/politiskel
sudo install -d -m 755 /opt/politiskel /etc/politiskel
sudo install -m 755 politiskel-server /opt/politiskel/
sudo install -m 644 template.html /opt/politiskel/
sudo install -m 640 -g politiskel deploy/politiskel.env.example /etc/politiskel/politiskel.env
sudoedit /etc/politiskel/politiskel.env          # the public address, sign-up mode
sudo cp deploy/politiskel.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now politiskel
journalctl -u politiskel -f                       # "listening on http://127.0.0.1:8080"
```

The database is created and migrated on start.

## 3. The reverse proxy

- **nginx**: `deploy/nginx.conf` into `/etc/nginx/sites-available/`, enable
  it, then `sudo certbot --nginx -d your.host`. It passes the Host header and
  appends the client's address to `X-Forwarded-For`, which the server needs.
- **Caddy**: `deploy/Caddyfile`; certificates come on their own.

With either, keep `POLITISKEL_TRUST_PROXY=1`: sign-in and sign-up limits then
count per visitor rather than treating everyone as the proxy. Never set it
when the server is reachable without the proxy — the header could then be
forged. If the proxy rewrites Host, `POLITISKEL_ORIGIN` must be the public
address, or every write is refused as coming from another site.

## 4. Who may sign up

`POLITISKEL_SIGNUP=invite` (the example's default): an account needs a
group's invitation link, so the site grows only through its groups. The very
first account is always allowed — the host's, to create the first group.
`POLITISKEL_SIGNUP=open` lets anyone in. Either way, one address may open
five accounts an hour.

Group owners can issue a new invitation link from the groups page; the old
one stops working at once. That is the answer to a link that went too far.

## 5. Backups

```
sudo cp deploy/politiskel-backup.service deploy/politiskel-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now politiskel-backup.timer
```

A dated copy each day in `/var/backups/politiskel/`, the last 14 kept. By hand:
`politiskel-server backup /some/new/file.db` (it never overwrites). A backup
holds political opinions: keep it on the server, or encrypted.

To restore: stop the service, put the copy in place of `politiskel.db`
(remove the `-wal` and `-shm` files next to it), start the service.

## 6. A forgotten password

There is no e-mail, so nobody can reset their own. On the server:

```
sudo -u politiskel POLITISKEL_DB=/var/lib/politiskel/politiskel.db \
    /opt/politiskel/politiskel-server reset-password <username>
```

It prints a new random password once and signs the account out everywhere.
Hand it over privately; they change it from their account page.

## 7. Updating

Back up, replace the binary and `template.html`, restart:

```
sudo systemctl start politiskel-backup
sudo install -m 755 politiskel-server /opt/politiskel/ && sudo install -m 644 template.html /opt/politiskel/
sudo systemctl restart politiskel
```

The server reads the page only at start, hence the restart. New database
migrations run on their own.

## 8. The legal side

Whoever runs an instance is the data controller: the answers are political
opinions (GDPR art. 9), stored on explicit consent given at sign-up. Fill in
`deploy/mentions-legales.md` — who hosts, how to reach them, how long backups
are kept — and publish it where the members can read it.
