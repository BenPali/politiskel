# Deploying the Politiskel server

A Linux host (x86_64 here), a reverse proxy that terminates HTTPS, and one
SQLite file. The files this guide refers to are in `deploy/`.

## 1. Build

The site, with Node, on any machine — the result is static files, the same
everywhere:

```
cd site && npm install && npm run build      # → site/build
```

The server, **on the host**, with Rust installed (`rustup`), from a checkout:

```
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
sudo cp -r site/build /opt/politiskel/site            # the built site
sudo install -m 640 -g politiskel deploy/politiskel.env.example /etc/politiskel/politiskel.env
sudoedit /etc/politiskel/politiskel.env          # the public address, sign-up mode
sudo cp deploy/politiskel.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now politiskel
journalctl -u politiskel -f                       # "listening on http://127.0.0.1:8080"
```

The database is created and migrated on start.

### Without root

On a host where you have an account but no `sudo` — the proxy belongs to
someone else — the service runs as a systemd *user* service, everything under
your home directory:

```
mkdir -p ~/politiskel/data ~/politiskel/backups && chmod 700 ~/politiskel ~/politiskel/data ~/politiskel/backups
# politiskel-server, the built site as ~/politiskel/site, and a
# politiskel.env with absolute paths under /home/<you>/politiskel
mkdir -p ~/.config/systemd/user
# politiskel.service, politiskel-backup.service and .timer: the deploy/ ones,
# with User/Group and the hardening lines dropped and paths as %h/politiskel/…
systemctl --user daemon-reload
systemctl --user enable --now politiskel.service politiskel-backup.timer
loginctl show-user $USER -p Linger     # must be yes, or the service stops at logout
```

`Linger=no` needs the host's `sudo loginctl enable-linger <you>` once. Ask the
host which local port their proxy sends your name to, and set
`POLITISKEL_ADDR` to it. Open the first account from the server itself
before the name goes public — on a closed site the first account is the only
one taken without an invitation:

```
 curl -s -X POST http://127.0.0.1:PORT/api/register -H 'Content-Type: application/json' \
      -H 'Origin: http://127.0.0.1:PORT' -d '{"username":"…","password":"…","consent":true}'
```

(the leading space keeps the password out of the shell's history). Packing
the files on a Mac, set `COPYFILE_DISABLE=1` before `tar`, or macOS adds
`._*` files.

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

Back up, replace the binary and the site, restart:

```
sudo systemctl start politiskel-backup
sudo install -m 755 politiskel-server /opt/politiskel/
sudo rm -rf /opt/politiskel/site && sudo cp -r site/build /opt/politiskel/site
sudo systemctl restart politiskel
```

The site's files are read on each request, so replacing them alone needs no
restart; the binary does. New database migrations run on their own.

## 8. The legal side

Whoever runs an instance is the data controller: the answers are political
opinions (GDPR art. 9), stored on explicit consent given at sign-up. Fill in
`deploy/mentions-legales.md` — who hosts, how to reach them, how long backups
are kept — and publish it where the members can read it.
