#!/usr/bin/env bash
set -euo pipefail

# Serves the exact published Website/ directory for local review.
#
#   ./scripts/dev-server.sh          # http://127.0.0.1:4173/
#
# The server intentionally binds to loopback only, so nothing is exposed to the local network.
# For a private, bookmarkable URL on other personal devices, front this port with Tailscale
# (`tailscale serve --bg 4173`); see the "Working locally" section of AGENTS.md.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${AGELY_SITE_DEV_PORT:-4173}"

exec python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$ROOT_DIR/Website"
