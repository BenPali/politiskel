#!/bin/sh
# Builds a release on a development machine and, given a host, sends it:
# the site (site/build), the server as one static Linux binary, and
# update.sh, which installs them on the host.
#
#   server/deploy/pack.sh                   # → server/target/politiskel-release.tgz
#   server/deploy/pack.sh hisa@host         # …then copies it there (scp)
#
# Then, on the host: ~/politiskel/update.sh
#
# Needs Node, and Rust with cargo-zigbuild and zig for the Linux binary
# (see DEPLOY.md). SSH_KEY=~/.ssh/key picks a key other than the default.
set -eu

ROOT=$(cd "$(dirname "$0")/../.." && pwd)
OUT=$ROOT/server/target/release-pack
TGZ=$ROOT/server/target/politiskel-release.tgz
TARGET=x86_64-unknown-linux-musl

echo "building the site"
(cd "$ROOT/site" && npm run build >/dev/null)

echo "building the server for $TARGET"
(cd "$ROOT/server" && cargo zigbuild --release --target "$TARGET" --quiet)

echo "packing"
rm -rf "$OUT" && mkdir -p "$OUT"
cp "$ROOT/server/target/$TARGET/release/politiskel-server" "$OUT/"
cp -R "$ROOT/site/build" "$OUT/site"
cp "$ROOT/server/deploy/update.sh" "$OUT/"
chmod +x "$OUT/update.sh"
find "$OUT" -name '.DS_Store' -delete
# no macOS metadata in the archive: Linux's tar warns on every entry otherwise
COPYFILE_DISABLE=1 tar --no-xattrs --no-mac-metadata -czf "$TGZ" -C "$OUT" . 2>/dev/null \
  || COPYFILE_DISABLE=1 tar -czf "$TGZ" -C "$OUT" .
(cd "$(dirname "$TGZ")" && shasum -a 256 "$(basename "$TGZ")" > "$(basename "$TGZ").sha256")
echo "→ $TGZ ($(du -h "$TGZ" | cut -f1)), $(cut -c1-16 "$TGZ.sha256")…"

if [ $# -ge 1 ]; then
  echo "sending to $1"
  scp ${SSH_KEY:+-i "$SSH_KEY"} "$TGZ" "$TGZ.sha256" "$1:~/"
  echo "now, on the host: ~/politiskel/update.sh"
fi
