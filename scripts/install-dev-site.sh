#!/usr/bin/env bash
set -euo pipefail

# Installs a launchd LaunchAgent that keeps scripts/dev-server.sh running across logins and
# reboots, turning the local preview into a permanent, bookmarkable dev site.
#
#   ./scripts/install-dev-site.sh              # install or update, then start
#   ./scripts/install-dev-site.sh --uninstall  # stop and remove
#
# The plist is generated here rather than committed so this public repository never contains
# machine-specific paths. The server binds to loopback only; pair it with Tailscale for private
# access from other personal devices (see AGENTS.md, "Working locally").

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LABEL="com.agely.dev-site"
PLIST_PATH="$HOME/Library/LaunchAgents/${LABEL}.plist"
LOG_PATH="/tmp/${LABEL}.log"
PORT="${AGELY_SITE_DEV_PORT:-4173}"

uninstall() {
  launchctl bootout "gui/$(id -u)/${LABEL}" 2>/dev/null || true
  rm -f "$PLIST_PATH"
  printf 'Removed %s\n' "$PLIST_PATH"
}

if [[ "${1:-}" == "--uninstall" ]]; then
  uninstall
  exit 0
fi

mkdir -p "$(dirname "$PLIST_PATH")"
cat > "$PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${ROOT_DIR}/scripts/dev-server.sh</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>AGELY_SITE_DEV_PORT</key>
    <string>${PORT}</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${LOG_PATH}</string>
  <key>StandardErrorPath</key>
  <string>${LOG_PATH}</string>
</dict>
</plist>
PLIST

# Reload cleanly if a previous version is already running.
launchctl bootout "gui/$(id -u)/${LABEL}" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST_PATH"

cat <<DONE
Dev site installed and running.

  Mac:    http://127.0.0.1:${PORT}/
  Logs:   ${LOG_PATH}

For a private URL that also works on your iPhone (no public exposure):
  1. Install Tailscale on this Mac and your iPhone and sign in to the same tailnet.
  2. Run once on this Mac:  tailscale serve --bg ${PORT}
  3. Bookmark the printed https://<this-mac>.<tailnet>.ts.net address on both devices.
The URL is reachable only by devices signed into your tailnet. To stop sharing later:
  tailscale serve --https=443 off
DONE
