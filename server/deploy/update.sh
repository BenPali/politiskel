#!/bin/sh
# Installs a release made by pack.sh, on the host, then checks it — and puts
# the previous version back on its own if anything fails.
#
#   ~/politiskel/update.sh [archive]      (default ~/politiskel-release.tgz)
#
# In order: the archive's checksum (when its .sha256 is beside it), a dated
# backup of the database, the new binary and site put in place, a restart,
# and three checks — the service is up, the API answers, a page answers.
# The previous binary and site are kept as .prev, for one step back.
#
# Set for a system service instead of a user one:
#   APP_DIR=/opt/politiskel ENV_FILE=/etc/politiskel/politiskel.env SYSTEMCTL="sudo systemctl"
# The archive carries this script too, so every release updates it.
set -eu

ARCHIVE=${1:-$HOME/politiskel-release.tgz}
APP_DIR=${APP_DIR:-$HOME/politiskel}
ENV_FILE=${ENV_FILE:-$APP_DIR/politiskel.env}
BACKUP_DIR=${BACKUP_DIR:-$APP_DIR/backups}
SERVICE=${SERVICE:-politiskel}
SYSTEMCTL=${SYSTEMCTL:-systemctl --user}
WORK=$(mktemp -d "${TMPDIR:-/tmp}/politiskel-release.XXXXXX")
trap 'rm -rf "$WORK"' EXIT

say() { printf '\033[1m%s\033[0m\n' "$*"; }
fail() { printf '\033[31m%s\033[0m\n' "$*" >&2; exit 1; }

[ -f "$ARCHIVE" ] || fail "no archive at $ARCHIVE"
[ -f "$ENV_FILE" ] || fail "no settings at $ENV_FILE"

if [ -f "$ARCHIVE.sha256" ]; then
  say "checksum"
  (cd "$(dirname "$ARCHIVE")" && sha256sum -c "$(basename "$ARCHIVE").sha256") || fail "the archive does not match its checksum"
fi

say "unpacking"
tar xzf "$ARCHIVE" -C "$WORK" 2>/dev/null
[ -x "$WORK/politiskel-server" ] && [ -f "$WORK/site/200.html" ] || fail "the archive holds no politiskel-server and site/"

# where the service listens, for the checks
ADDR=$( (set -a; . "$ENV_FILE"; printf '%s' "${POLITISKEL_ADDR:-127.0.0.1:8080}") )

say "backing up the database"
mkdir -p "$BACKUP_DIR"
(set -a; . "$ENV_FILE"; set +a; cd "$APP_DIR" && ./politiskel-server backup "$BACKUP_DIR/politiskel-$(date +%F-%H%M%S).db")

say "putting the new version in place"
cd "$APP_DIR"
cp politiskel-server politiskel-server.prev
# a running binary cannot be overwritten: copy beside it, then rename over it
cp "$WORK/politiskel-server" politiskel-server.new && mv -f politiskel-server.new politiskel-server
rm -rf site.new site.prev
cp -r "$WORK/site" site.new
[ -d site ] && mv site site.prev
mv site.new site
[ -f "$WORK/update.sh" ] && cp "$WORK/update.sh" update.sh.new && chmod +x update.sh.new && mv -f update.sh.new update.sh

# The site's address in the settings: the first version's page setting goes.
ENV_CHANGED=0
if grep -q '^POLITISKEL_PAGE=' "$ENV_FILE" || ! grep -q '^POLITISKEL_SITE=' "$ENV_FILE"; then
  cp "$ENV_FILE" "$ENV_FILE.prev"
  ENV_CHANGED=1
  sed -i '/^POLITISKEL_PAGE=/d' "$ENV_FILE"
fi
grep -q '^POLITISKEL_SITE=' "$ENV_FILE" || echo "POLITISKEL_SITE=$APP_DIR/site" >> "$ENV_FILE"

rollback() {
  printf '\033[31m%s\033[0m\n' "$1 — putting the previous version back" >&2
  cd "$APP_DIR"
  cp politiskel-server.prev politiskel-server.new && mv -f politiskel-server.new politiskel-server
  if [ -d site.prev ]; then rm -rf site && mv site.prev site; fi
  [ "$ENV_CHANGED" = 1 ] && cp "$ENV_FILE.prev" "$ENV_FILE"
  $SYSTEMCTL restart "$SERVICE"
  sleep 1
  $SYSTEMCTL is-active --quiet "$SERVICE" && echo "previous version running again" >&2 || echo "the previous version does not start either: see journalctl" >&2
  exit 1
}

say "restarting"
$SYSTEMCTL restart "$SERVICE"
# a few tries: the server opens its database and binds before it answers
ok=0
for _ in 1 2 3 4 5 6 7 8 9 10; do
  sleep 1
  if curl -fsS -o /dev/null "http://$ADDR/api/config"; then ok=1; break; fi
done
$SYSTEMCTL is-active --quiet "$SERVICE" || rollback "the service is not running"
[ "$ok" = 1 ] || rollback "the API does not answer on $ADDR"
case $(curl -fsS -o /dev/null -w '%{http_code} %{content_type}' "http://$ADDR/boussole") in
  "200 text/html"*) ;;
  *) rollback "the site's pages do not answer" ;;
esac

say "done: $(curl -fsS "http://$ADDR/api/config")"
