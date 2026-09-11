#!/usr/bin/env bash
#
# Deploy Noteracy on the VM. Run as the app user, not with sudo.
#
#   ./deploy/deploy.sh                 fetch the tracked branch, build, reload
#   ./deploy/deploy.sh --no-pull       rebuild what is already checked out
#   ./deploy/deploy.sh --skip-build    server-only change
#

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

DO_PULL=1
DO_BUILD=1
while [ $# -gt 0 ]; do
  case "$1" in
    --no-pull)    DO_PULL=0; shift ;;
    --skip-build) DO_BUILD=0; shift ;;
    -h|--help)    sed -n '2,7p' "$0"; exit 0 ;;
    *)            echo "Unknown flag: $1" >&2; exit 2 ;;
  esac
done

# ── Config ────────────────────────────────────────────────────────────────────
# Read from .env rather than sourcing it, so values cannot execute.
env_get() { sed -n "s|^$1=||p" .env 2>/dev/null | head -1 | sed -e "s|^['\"]||" -e "s|['\"]$||"; }

PORT="$(env_get PORT)";           PORT="${PORT:-3175}"
BASE_PATH="$(env_get BASE_PATH)"; BASE_PATH="${BASE_PATH:-/notes}"
BRANCH="$(env_get DEPLOY_BRANCH)"; BRANCH="${BRANCH:-main}"
HEALTH_URL="http://127.0.0.1:${PORT}${BASE_PATH}/healthz"

if [ -t 1 ]; then B=$'\033[1m'; G=$'\033[32m'; Y=$'\033[33m'; R=$'\033[31m'; N=$'\033[0m'
else B=""; G=""; Y=""; R=""; N=""; fi
step() { printf '\n%s▸ %s%s\n' "$B" "$*" "$N"; }
ok()   { printf '  %s✓%s %s\n' "$G" "$N" "$*"; }
warn() { printf '  %s!%s %s\n' "$Y" "$N" "$*"; }
die()  { printf '\n%s✗ %s%s\n\n' "$R" "$*" "$N" >&2; exit 1; }

# ── Lock ──────────────────────────────────────────────────────────────────────
LOCK_DIR="$APP_DIR/.deploy.lock"
# Treat a lock older than 30 minutes as left behind by a crashed run.
if [ -d "$LOCK_DIR" ] && [ -z "$(find "$LOCK_DIR" -maxdepth 0 -mmin -30 2>/dev/null)" ]; then
  warn "clearing a stale lock (older than 30 minutes)"
  rmdir "$LOCK_DIR" 2>/dev/null || true
fi
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "A deploy is already running — skipping this one." >&2
  exit 75   # EX_TEMPFAIL: the caller should treat this as "try again", not a failure
fi
trap 'rmdir "$LOCK_DIR" 2>/dev/null || true' EXIT

printf '\n%s┌─ noteracy deploy ──────────────────────────────────%s\n' "$B" "$N"
printf '%s│%s  %s\n' "$B" "$N" "$(date '+%Y-%m-%d %H:%M:%S %Z')"
printf '%s│%s  branch  %s\n' "$B" "$N" "$BRANCH"
printf '%s│%s  health  %s\n' "$B" "$N" "$HEALTH_URL"
printf '%s└────────────────────────────────────────────────────%s\n' "$B" "$N"

PREV_SHA="$(git rev-parse HEAD)"

# ── 1. Code ───────────────────────────────────────────────────────────────────
if [ "$DO_PULL" -eq 1 ]; then
  step "Fetching origin/$BRANCH"
  git fetch --prune origin "$BRANCH"
  # reset --hard, not pull: nobody is here to resolve a merge conflict.
  git reset --hard "origin/$BRANCH"
  ok "$(git rev-parse --short HEAD)  $(git log -1 --pretty=%s | cut -c1-60)"
  if [ "$(git rev-parse HEAD)" = "$PREV_SHA" ]; then
    ok "already up to date — rebuilding anyway to stay idempotent"
  fi
else
  step "Skipping fetch (--no-pull)"
  ok "$(git rev-parse --short HEAD)"
fi

# ── 2. Dependencies ───────────────────────────────────────────────────────────
# No lockfiles committed, so `npm ci` is unavailable. Flags are explicit: the
# client build needs devDependencies, the server does not.
step "Installing server dependencies"
npm install --omit=dev --no-audit --no-fund
ok "done"

# ── 3. Client build ───────────────────────────────────────────────────────────
if [ "$DO_BUILD" -eq 1 ]; then
  step "Installing client dependencies"
  npm install --prefix client --include=dev --no-audit --no-fund
  ok "done"

  step "Building client"
  rm -rf client/build.new
  # Build aside from the live directory, then swap it in below.
  BUILD_PATH="$APP_DIR/client/build.new" npm run build --prefix client
  [ -f client/build.new/index.html ] || die "build produced no index.html"

  rm -rf client/build.old
  [ -d client/build ] && mv client/build client/build.old
  mv client/build.new client/build
  ok "client/build swapped in (previous kept as client/build.old)"
else
  step "Skipping client build (--skip-build)"
fi

# ── 4. Restart ────────────────────────────────────────────────────────────────
step "Reloading the app"
mkdir -p logs
# --only noteracy: a bare reload would restart the webhook running this script.
pm2 startOrReload ecosystem.config.js --only noteracy --update-env
ok "pm2 reloaded noteracy"

# ── 5. Health gate ────────────────────────────────────────────────────────────
# The client's catch-all answers 200 for any unmatched path, so require the
# health endpoint's own JSON rather than trusting the status code.
LAST_CODE="000"
LAST_BODY=""
healthy() {
  local out
  out="$(curl -s -m 5 -w '|%{http_code}' "$HEALTH_URL" 2>/dev/null)" || out="|000"
  LAST_CODE="${out##*|}"
  LAST_BODY="${out%|*}"
  [ "$LAST_CODE" = "200" ] || return 1
  # Pattern, not a literal: do not depend on the JSON's spacing.
  printf '%s' "$LAST_BODY" | grep -q '"ok"[[:space:]]*:[[:space:]]*true'
}

step "Waiting for a healthy response"
HEALTHY=0
for _ in $(seq 1 30); do
  if healthy; then HEALTHY=1; break; fi
  sleep 2
done

if [ "$HEALTHY" -eq 1 ]; then
  ok "healthy — $LAST_BODY"
  printf '\n%sDeployed.%s  %s\n\n' "$B" "$N" "$(git rev-parse --short HEAD)"
  exit 0
fi

# ── 6. Rollback ───────────────────────────────────────────────────────────────
warn "no healthy response after 60s (last: $LAST_CODE $(printf '%.80s' "$LAST_BODY"))"

# A 503 is the health endpoint answering: the app runs, the database does not.
# Rolling back code cannot fix that, and would strand the box on old code.
if [ "$LAST_CODE" = "503" ]; then
  die "Not rolling back — the app is running and answering, so this is the
    environment, not the commit. Almost always MONGODB_URI or this VM's IP
    missing from the MongoDB Atlas access list.
    Status: $LAST_BODY
    Logs:   pm2 logs noteracy --lines 50"
fi
step "Rolling back to $(git rev-parse --short "$PREV_SHA")"

git reset --hard "$PREV_SHA" || warn "git rollback failed"
if [ -d client/build.old ]; then
  rm -rf client/build
  mv client/build.old client/build
  ok "previous client/build restored"
fi
npm install --omit=dev --no-audit --no-fund >/dev/null 2>&1 || warn "dependency rollback failed"
pm2 startOrReload ecosystem.config.js --only noteracy --update-env || warn "pm2 reload failed"

for _ in $(seq 1 15); do
  if healthy; then
    die "Deploy failed and was rolled back. The previous version is serving again.
    Logs:  pm2 logs noteracy --lines 50
    Retry: ./deploy/deploy.sh"
  fi
  sleep 2
done

die "Deploy failed and the rollback did not come up healthy either.
    The code is probably not the problem. Check whether the process is
    restarting in a loop (pm2 status) — if it is, MongoDB is unreachable and
    this VM's public IP needs to be on the Atlas access list.
    Logs:  pm2 logs noteracy --lines 50"
