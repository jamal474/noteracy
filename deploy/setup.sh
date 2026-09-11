#!/usr/bin/env bash
#
# One-command provisioning for Noteracy on a fresh VM.
# ────────────────────────────────────────────────────
#   sudo bash deploy/setup.sh --domain noteracy.shabbirjamal.com --email you@example.com
#
# Idempotent: re-run it whenever the templates in deploy/ change. See README.md.
#
# Flags:
#   --domain <name>     vhost server_name        (default: noteracy.shabbirjamal.com)
#   --email  <addr>     Let's Encrypt contact    (required to issue a certificate)
#   --port   <n>        port the app binds       (default: 3175)
#   --hook-port <n>     port the webhook binds   (default: 3176)
#   --branch <name>     branch to auto-deploy    (default: main)
#   --no-ssl            stay on plain HTTP
#   --no-firewall       skip all firewall changes
#   --skip-deps         don't touch apt/dnf
#   --skip-build        don't rebuild the client

set -euo pipefail

# ── Defaults ──────────────────────────────────────────────────────────────────
DOMAIN="noteracy.shabbirjamal.com"
EMAIL=""
APP_PORT="3175"
HOOK_PORT="3176"
BRANCH="main"
RUN_SSL="auto"
DO_FIREWALL=1
SKIP_DEPS=0
SKIP_BUILD=0
NODE_MAJOR="22"
APP_NAME="noteracy"

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$APP_DIR/.env"

# ── Output helpers ────────────────────────────────────────────────────────────
if [ -t 1 ]; then B=$'\033[1m'; G=$'\033[32m'; Y=$'\033[33m'; R=$'\033[31m'; D=$'\033[2m'; N=$'\033[0m'
else B=""; G=""; Y=""; R=""; D=""; N=""; fi
step() { printf '\n%s▸ %s%s\n' "$B" "$*" "$N"; }
ok()   { printf '  %s✓%s %s\n' "$G" "$N" "$*"; }
warn() { printf '  %s!%s %s\n' "$Y" "$N" "$*"; }
note() { printf '    %s%s%s\n' "$D" "$*" "$N"; }
die()  { printf '\n%s✗ %s%s\n\n' "$R" "$*" "$N" >&2; exit 1; }

# ── Args ──────────────────────────────────────────────────────────────────────
while [ $# -gt 0 ]; do
  case "$1" in
    --domain)      DOMAIN="$2"; shift 2 ;;
    --email)       EMAIL="$2"; shift 2 ;;
    --port)        APP_PORT="$2"; shift 2 ;;
    --hook-port)   HOOK_PORT="$2"; shift 2 ;;
    --branch)      BRANCH="$2"; shift 2 ;;
    --ssl)         RUN_SSL="yes"; shift ;;
    --no-ssl)      RUN_SSL="no"; shift ;;
    --no-firewall) DO_FIREWALL=0; shift ;;
    --skip-deps)   SKIP_DEPS=1; shift ;;
    --skip-build)  SKIP_BUILD=1; shift ;;
    -h|--help)     sed -n '2,21p' "$0"; exit 0 ;;
    *)             die "Unknown flag: $1  (try --help)" ;;
  esac
done
[ "$RUN_SSL" = "auto" ] && { [ -n "$EMAIL" ] && RUN_SSL="yes" || RUN_SSL="no"; }

# ── Root + target user ────────────────────────────────────────────────────────
[ "$(id -u)" -eq 0 ] || die "Run with sudo:  sudo bash deploy/setup.sh --domain $DOMAIN"

RUN_USER="${SUDO_USER:-root}"
RUN_HOME="$(getent passwd "$RUN_USER" | cut -d: -f6)"
[ -n "$RUN_HOME" ] || RUN_HOME="/root"
as_user() { sudo -u "$RUN_USER" -H env "PATH=$PATH" "$@"; }

printf '\n%s┌─ noteracy setup ───────────────────────────────────%s\n' "$B" "$N"
printf '%s│%s  domain     %s\n' "$B" "$N" "$DOMAIN"
printf '%s│%s  app dir    %s\n' "$B" "$N" "$APP_DIR"
printf '%s│%s  app port   %s\n' "$B" "$N" "$APP_PORT"
printf '%s│%s  hook port  %s\n' "$B" "$N" "$HOOK_PORT"
printf '%s│%s  branch     %s\n' "$B" "$N" "$BRANCH"
printf '%s│%s  user       %s\n' "$B" "$N" "$RUN_USER"
printf '%s│%s  https      %s\n' "$B" "$N" "$RUN_SSL"
printf '%s└────────────────────────────────────────────────────%s\n' "$B" "$N"

# ── Platform ──────────────────────────────────────────────────────────────────
step "Detecting platform"
if   command -v apt-get >/dev/null 2>&1; then PKG="apt"
elif command -v dnf     >/dev/null 2>&1; then PKG="dnf"
elif command -v yum     >/dev/null 2>&1; then PKG="yum"
else die "No supported package manager (need apt, dnf or yum)."
fi
. /etc/os-release 2>/dev/null || true
ok "${PRETTY_NAME:-unknown} · $(uname -m) · package manager: $PKG"

pkg_install() {
  case "$PKG" in
    apt) DEBIAN_FRONTEND=noninteractive apt-get install -y -q "$@" ;;
    *)   $PKG install -y -q "$@" ;;
  esac
}

# ── 1. System packages ────────────────────────────────────────────────────────
if [ "$SKIP_DEPS" -eq 1 ]; then
  step "Skipping package installation (--skip-deps)"
else
  step "Installing system packages"
  [ "$PKG" = "apt" ] && DEBIAN_FRONTEND=noninteractive apt-get update -q
  pkg_install curl ca-certificates openssl git nginx >/dev/null
  ok "curl, openssl, git, nginx"

  CURRENT_NODE=""
  command -v node >/dev/null 2>&1 && CURRENT_NODE="$(node -v | sed 's/^v//;s/\..*//')"
  if [ -z "$CURRENT_NODE" ] || [ "$CURRENT_NODE" -lt 20 ]; then
    note "installing Node.js ${NODE_MAJOR}.x from NodeSource"
    if [ "$PKG" = "apt" ]; then
      curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash - >/dev/null
    else
      curl -fsSL "https://rpm.nodesource.com/setup_${NODE_MAJOR}.x" | bash - >/dev/null
    fi
    pkg_install nodejs >/dev/null
  fi
  ok "node $(node -v) · npm $(npm -v)"
fi

command -v git >/dev/null 2>&1 || die "git is required (the deploy webhook fetches with it)."
[ -d "$APP_DIR/.git" ] || warn "$APP_DIR is not a git checkout — auto-deploy will not work"

# ── 2. .env — the single place you edit configuration on this box ─────────────
step "Writing $ENV_FILE"

# Single-quoted: dotenv truncates an unquoted value at the first "#".
# sed metacharacters are escaped so | & \ in a value cannot corrupt the file.
set_env() { # set_env KEY VALUE
  local key="$1" value="$2" quoted escaped
  case "$value" in
    *"'"*) die "Value for $key contains a single quote; pick one without it." ;;
  esac
  quoted="'$value'"
  escaped="$(printf '%s' "$quoted" | sed -e 's/[\\|&]/\\&/g')"
  if grep -qE "^${key}=" "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${escaped}|" "$ENV_FILE"
  else
    printf "%s=%s\n" "$key" "$quoted" >> "$ENV_FILE"
  fi
}
get_env() {
  sed -n "s|^$1=||p" "$ENV_FILE" 2>/dev/null | head -1 | sed -e "s|^['\"]||" -e "s|['\"]$||"
}

if [ ! -f "$ENV_FILE" ]; then
  cp "$APP_DIR/.env.example" "$ENV_FILE"
  ok "created from .env.example"
else
  ok "existing .env kept (values below are updated in place)"
fi

set_env NODE_ENV production
set_env PORT "$APP_PORT"
set_env BASE_PATH "/notes"
set_env TRUST_PROXY 1
set_env DEPLOY_WEBHOOK_PORT "$HOOK_PORT"
set_env DEPLOY_BRANCH "$BRANCH"

# Secrets are generated once and then left alone, so re-running this script
# never invalidates live sessions or breaks the configured GitHub webhook.
GENERATED_HOOK_SECRET=""
if [ -z "$(get_env SESSION_SECRET)" ] || [ "$(get_env SESSION_SECRET)" = "your_session_secret" ]; then
  set_env SESSION_SECRET "$(openssl rand -hex 32)"
  ok "SESSION_SECRET generated"
else
  ok "SESSION_SECRET already set, left alone"
fi
if [ -z "$(get_env DEPLOY_WEBHOOK_SECRET)" ]; then
  GENERATED_HOOK_SECRET="$(openssl rand -hex 32)"
  set_env DEPLOY_WEBHOOK_SECRET "$GENERATED_HOOK_SECRET"
  ok "DEPLOY_WEBHOOK_SECRET generated (shown at the end)"
else
  GENERATED_HOOK_SECRET="$(get_env DEPLOY_WEBHOOK_SECRET)"
  ok "DEPLOY_WEBHOOK_SECRET already set, left alone"
fi

chown "$RUN_USER" "$ENV_FILE"
chmod 600 "$ENV_FILE"

# Things only you can supply. The app starts without them but will not work.
MISSING=""
for key in MONGODB_URI GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET GOOGLE_CALLBACK_URL CLIENT_URL; do
  v="$(get_env "$key")"
  case "$v" in
    ""|your_*|*your_google*) MISSING="$MISSING $key" ;;
  esac
done
[ -n "$MISSING" ] && warn "still to fill in by hand:$MISSING" && note "nano $ENV_FILE   then: pm2 reload $APP_NAME"

# ── 3. App dependencies and client build ──────────────────────────────────────
step "Installing dependencies"
chown -R "$RUN_USER" "$APP_DIR"
# No lockfiles committed, so `npm ci` is unavailable. Flags are explicit: the
# client build needs devDependencies, the server does not.
( cd "$APP_DIR" && as_user npm install --omit=dev --no-audit --no-fund >/dev/null )
ok "server dependencies"

if [ "$SKIP_BUILD" -eq 1 ]; then
  step "Skipping client build (--skip-build)"
else
  ( cd "$APP_DIR" && as_user npm install --prefix client --include=dev --no-audit --no-fund >/dev/null )
  ok "client dependencies"
  step "Building the client (a minute or two)"
  ( cd "$APP_DIR" && as_user npm run build --prefix client >/dev/null )
  [ -f "$APP_DIR/client/build/index.html" ] || die "client build produced no index.html"
  ok "client/build ready"
fi

as_user mkdir -p "$APP_DIR/logs"

# ── 4. PM2 ────────────────────────────────────────────────────────────────────
step "Configuring PM2"
command -v pm2 >/dev/null 2>&1 || npm install -g pm2 >/dev/null
( cd "$APP_DIR" && as_user pm2 startOrReload ecosystem.config.js --update-env >/dev/null )
as_user pm2 save >/dev/null
env PATH="$PATH" pm2 startup systemd -u "$RUN_USER" --hp "$RUN_HOME" >/dev/null 2>&1 || \
  warn "pm2 startup failed — run it manually: pm2 startup"
ok "$APP_NAME + $APP_NAME-deploy running under pm2, restored on reboot"

# ── 5. Nginx ──────────────────────────────────────────────────────────────────
step "Configuring Nginx"
install -d -m 755 /etc/nginx/conf.d /var/www/html
cp "$APP_DIR/deploy/nginx-http.conf" /etc/nginx/conf.d/noteracy-http.conf

# Real client IP. Without it every request looks like it came from Cloudflare
# and the rate limiter treats all visitors as one.
REALIP_FILE=/etc/nginx/conf.d/noteracy-realip.conf
{
  echo "# Real client IP from Cloudflare. Generated by deploy/setup.sh on $(date -u +%F)."
  echo "# Re-run setup.sh to refresh; Cloudflare's ranges change rarely."
  CF_OK=0
  for url in https://www.cloudflare.com/ips-v4 https://www.cloudflare.com/ips-v6; do
    if RANGES="$(curl -fsS --max-time 10 "$url" 2>/dev/null)" && [ -n "$RANGES" ]; then
      printf '%s\n' "$RANGES" | while IFS= read -r cidr; do
        [ -n "$cidr" ] && echo "set_real_ip_from $cidr;"
      done
      CF_OK=1
    fi
  done
  if [ "$CF_OK" -eq 1 ]; then
    echo "real_ip_header CF-Connecting-IP;"
    echo "real_ip_recursive off;"
  else
    echo "# Could not fetch Cloudflare's ranges — left empty on purpose."
  fi
} > "$REALIP_FILE"
if grep -q "^set_real_ip_from" "$REALIP_FILE"; then
  ok "Cloudflare ranges → $(grep -c '^set_real_ip_from' "$REALIP_FILE") entries, real_ip_header CF-Connecting-IP"
else
  warn "could not fetch Cloudflare IP ranges — client IPs will be Cloudflare's"
  note "re-run this script when the VM has outbound network access"
fi

if [ -d /etc/nginx/sites-available ]; then
  VHOST_FILE="/etc/nginx/sites-available/$DOMAIN"      # Debian / Ubuntu
  VHOST_LINK="/etc/nginx/sites-enabled/$DOMAIN"
else
  VHOST_FILE="/etc/nginx/conf.d/$DOMAIN.conf"          # RHEL / Oracle Linux
  VHOST_LINK=""
fi

# nginx dropped the `http2` listen parameter for a standalone directive in
# 1.25.1; emitting the wrong one fails `nginx -t` outright.
NGINX_VER="$(nginx -v 2>&1 | sed -n 's|.*nginx/\([0-9.]*\).*|\1|p')"
if [ "$(printf '1.25.1\n%s\n' "$NGINX_VER" | sort -V | head -1)" = "1.25.1" ]; then
  H2_PARAM=""; HTTP2_ON="    http2 on;"
else
  H2_PARAM="http2"; HTTP2_ON=""
fi

render_vhost() { # render_vhost http|https
  sed -e "s|__DOMAIN__|$DOMAIN|g" \
      -e "s|__PORT__|$APP_PORT|g" \
      -e "s|__HOOK_PORT__|$HOOK_PORT|g" \
      -e "s|__H2__|$H2_PARAM|g" \
      -e "s|__HTTP2ON__|$HTTP2_ON|g" \
      "$APP_DIR/deploy/nginx-site.$1.conf.template" > "$VHOST_FILE"
  [ -n "$VHOST_LINK" ] && ln -sfn "$VHOST_FILE" "$VHOST_LINK"
  return 0
}

# Always start from HTTP; swapped to HTTPS below once a certificate exists.
# A run with a missing or expired certificate still leaves a working site.
render_vhost http
ok "vhost → $VHOST_FILE"

# ── 5a. Clear the way for our default_server ──────────────────────────────────
# The distro's placeholder claims default_server on :80 and collides with ours.
# nginx includes sites-enabled/* unfiltered, so backups must go outside it.
BACKUP_DIR=/etc/nginx/noteracy-disabled
install -d -m 755 "$BACKUP_DIR"

# One domain per box. The templates hardcode the upstream names, so a vhost
# left over from a previous --domain would collide with "duplicate upstream".
for other in /etc/nginx/sites-enabled/*; do
  [ -e "$other" ] || continue
  name="$(basename "$other")"
  [ "$name" = "$(basename "$VHOST_FILE")" ] && continue
  target="$(readlink -f "$other")"
  if [ -f "$target" ] && grep -q "managed-by: noteracy-setup" "$target" 2>/dev/null; then
    mv "$other" "$BACKUP_DIR/$name"
    note "retired our older vhost for $name"
  fi
done

DISABLED=0
for f in /etc/nginx/sites-enabled/default /etc/nginx/conf.d/default.conf; do
  [ -e "$f" ] || continue
  mv "$f" "$BACKUP_DIR/$(basename "$f")"
  DISABLED=1
done

# Any other vhost claiming default_server collides with ours. Strip the keyword
# rather than disabling someone's site.
for other in /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf; do
  [ -e "$other" ] || continue
  name="$(basename "$other")"
  case "$name" in
    "$(basename "$VHOST_FILE")"|noteracy-http.conf|noteracy-realip.conf) continue ;;
    *.bak|*.bak-*|*.disabled-by-*) continue ;;
  esac
  # Resolve the symlink: sed -i on a link replaces the link with a real file.
  target="$(readlink -f "$other")"
  [ -f "$target" ] || continue
  if grep -q "default_server" "$target" 2>/dev/null; then
    cp -n "$target" "$BACKUP_DIR/$name.bak" 2>/dev/null || true
    sed -i 's/[[:space:]]*default_server//g' "$target"
    note "removed default_server from $name (backup in $BACKUP_DIR)"
    DISABLED=1
  fi
done

# RHEL-family images keep the default server block inside nginx.conf itself.
if grep -qE '^[[:space:]]*server[[:space:]]*\{' /etc/nginx/nginx.conf; then
  cp -n /etc/nginx/nginx.conf "$BACKUP_DIR/nginx.conf.bak" || true
  awk '
    BEGIN { depth = 0; inblock = 0 }
    {
      line = $0
      if (inblock == 0 && line ~ /^[[:space:]]*server[[:space:]]*\{/) { inblock = 1; depth = 0 }
      if (inblock) {
        depth += gsub(/\{/, "{")
        depth -= gsub(/\}/, "}")
        print "#noteracy# " line
        if (depth <= 0) inblock = 0
        next
      }
      print line
    }
  ' /etc/nginx/nginx.conf > /etc/nginx/nginx.conf.new
  mv /etc/nginx/nginx.conf.new /etc/nginx/nginx.conf
  note "commented out the default server block in /etc/nginx/nginx.conf"
  note "original kept at $BACKUP_DIR/nginx.conf.bak"
  DISABLED=1
fi
[ "$DISABLED" -eq 1 ] && ok 'default "Welcome to nginx" site disabled' || ok "no default site in the way"

reload_nginx() { # reload_nginx <label>; returns non-zero if the config is bad
  if ! nginx -t 2>/tmp/nginx-test.log; then
    warn "nginx config test failed ($1):"
    sed 's/^/      /' /tmp/nginx-test.log >&2
    return 1
  fi
  systemctl enable nginx >/dev/null 2>&1 || true
  systemctl reload nginx 2>/dev/null || systemctl restart nginx
  return 0
}

reload_nginx "http" || die "Nothing was reloaded. Fix the errors above and re-run."
ok "nginx serving $DOMAIN over HTTP"

# ── 6. SELinux (Oracle Linux / RHEL) ──────────────────────────────────────────
if command -v getenforce >/dev/null 2>&1 && [ "$(getenforce)" = "Enforcing" ]; then
  step "Adjusting SELinux"
  # Without this nginx cannot open a socket to 127.0.0.1:$APP_PORT and every
  # request comes back 502.
  setsebool -P httpd_can_network_connect 1
  ok "httpd_can_network_connect enabled"
fi

# ── 7. Firewall ───────────────────────────────────────────────────────────────
if [ "$DO_FIREWALL" -eq 1 ]; then
  step "Opening ports 80 and 443"

  if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q "Status: active"; then
    ufw allow 80/tcp >/dev/null && ufw allow 443/tcp >/dev/null
    ok "ufw: 80/tcp, 443/tcp allowed"
  fi

  if command -v firewall-cmd >/dev/null 2>&1 && systemctl is-active --quiet firewalld; then
    firewall-cmd --permanent --add-service=http  >/dev/null
    firewall-cmd --permanent --add-service=https >/dev/null
    firewall-cmd --reload >/dev/null
    ok "firewalld: http, https allowed"
  fi

  # Oracle Cloud images ship a raw iptables ruleset with a REJECT at the end of
  # INPUT that blackholes 80/443 even when ufw/firewalld look fine.
  if command -v iptables >/dev/null 2>&1; then
    REJECT_LINE="$(iptables -L INPUT --line-numbers -n 2>/dev/null | awk '$2 == "REJECT" { print $1; exit }')"
    CHANGED=0
    for port in 80 443; do
      if ! iptables -C INPUT -p tcp --dport "$port" -j ACCEPT 2>/dev/null; then
        if [ -n "$REJECT_LINE" ]; then
          iptables -I INPUT "$REJECT_LINE" -p tcp --dport "$port" -m state --state NEW -j ACCEPT
        else
          iptables -A INPUT -p tcp --dport "$port" -m state --state NEW -j ACCEPT
        fi
        CHANGED=1
      fi
    done
    if [ "$CHANGED" -eq 1 ]; then
      if command -v netfilter-persistent >/dev/null 2>&1; then
        netfilter-persistent save >/dev/null 2>&1 || true
      elif [ -d /etc/iptables ]; then
        iptables-save > /etc/iptables/rules.v4
      elif [ -f /etc/sysconfig/iptables ]; then
        iptables-save > /etc/sysconfig/iptables
      else
        warn "iptables rules added but NOT persisted — they vanish on reboot."
      fi
      ok "iptables: 80/tcp, 443/tcp accepted (inserted above the REJECT rule)"
    else
      ok "iptables: 80/tcp, 443/tcp already allowed"
    fi
  fi
else
  step "Skipping firewall changes (--no-firewall)"
fi

# ── 8. HTTPS ──────────────────────────────────────────────────────────────────
CERT_DIR="/etc/letsencrypt/live/$DOMAIN"
HTTPS_LIVE=0

if [ "$RUN_SSL" = "yes" ]; then
  step "HTTPS for $DOMAIN"

  if ! command -v certbot >/dev/null 2>&1; then
    pkg_install certbot >/dev/null 2>&1 || \
      warn "could not install certbot automatically — install it and re-run"
  fi

  if [ -f "$CERT_DIR/fullchain.pem" ]; then
    ok "certificate already present, reusing it"
  elif command -v certbot >/dev/null 2>&1; then
    # certonly never edits the nginx config, which is what keeps re-runs safe.
    if certbot certonly --webroot -w /var/www/html -d "$DOMAIN" \
         --non-interactive --agree-tos -m "$EMAIL" \
         --deploy-hook "systemctl reload nginx"; then
      ok "certificate issued"
    else
      warn "certbot could not issue a certificate."
      note "almost always DNS: $DOMAIN must already resolve to this VM's public IP,"
      note "and the OCI Security List must allow inbound TCP 80."
      note "if the record is proxied through Cloudflare, set it to DNS-only first."
      note "once that's true, just re-run this script."
    fi
  fi

  if [ -f "$CERT_DIR/fullchain.pem" ]; then
    render_vhost https
    if reload_nginx "https"; then
      HTTPS_LIVE=1
      ok "HTTPS live · port 80 now redirects to 443"
    else
      warn "HTTPS config failed to validate — rolling back to HTTP."
      render_vhost http
      reload_nginx "http rollback" || die "nginx is now in a bad state; check nginx -t"
    fi
  fi
else
  step "Skipping HTTPS (pass --email you@example.com to enable)"
fi

# ── 9. Verify ─────────────────────────────────────────────────────────────────
step "Verifying"
sleep 3
HEALTH_PATH="/notes/healthz"
APP_BODY="$(curl -s --max-time 5 "http://127.0.0.1:$APP_PORT$HEALTH_PATH" || echo '')"
APP_CODE="$(curl -s -o /dev/null --max-time 5 -w '%{http_code}' "http://127.0.0.1:$APP_PORT$HEALTH_PATH" || echo 000)"
# 200 alone is not proof: the client's catch-all serves index.html for any
# unmatched path under the mount. Look for the health endpoint's own JSON.
if ! printf '%s' "$APP_BODY" | grep -q '"ok"[[:space:]]*:[[:space:]]*true'; then
  [ "$APP_CODE" = "200" ] && APP_CODE="200-but-not-json"
fi
if [ "$APP_CODE" = "200" ]; then
  ok "app healthy on :$APP_PORT  $APP_BODY"
elif [ "$APP_CODE" = "200-but-not-json" ]; then
  warn "$HEALTH_PATH answered 200 but not with the health JSON"
  note "the running process is probably older code — pm2 reload $APP_NAME"
elif [ "$APP_CODE" = "503" ]; then
  warn "app is up but the database is not connected:  $APP_BODY"
  note "check MONGODB_URI in $ENV_FILE, and that this VM's IP is on the"
  note "MongoDB Atlas access list (Atlas → Network Access → Add IP Address)"
else
  warn "app returned $APP_CODE"
  note "the cause is almost always MongoDB. Without it the app either exits"
  note "(the session store rejects unhandled) or answers 500 on every route"
  note "(express-session stops attaching req.session, so passport throws)."
  note "check MONGODB_URI in $ENV_FILE, and add this VM's IP to the"
  note "MongoDB Atlas access list (Atlas → Network Access → Add IP Address)."
  note "logs: pm2 logs $APP_NAME --lines 50"
fi

HOOK_CODE="$(curl -s -o /dev/null --max-time 5 -w '%{http_code}' "http://127.0.0.1:$HOOK_PORT/__deploy" || echo 000)"
[ "$HOOK_CODE" = "405" ] && ok "deploy webhook listening on :$HOOK_PORT" \
                         || warn "deploy webhook returned $HOOK_CODE (expected 405 for GET) — pm2 logs $APP_NAME-deploy"

if [ "$HTTPS_LIVE" -eq 1 ]; then
  EDGE_CODE="$(curl -sk -o /dev/null -w '%{http_code}' -H "Host: $DOMAIN" "https://127.0.0.1$HEALTH_PATH" || echo 000)"
  REDIR="$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $DOMAIN" "http://127.0.0.1$HEALTH_PATH" || echo 000)"
  [ "$EDGE_CODE" = "200" ] && ok "nginx → app over TLS" || warn "nginx (443) returned $EDGE_CODE"
  [ "$REDIR" = "301" ]     && ok "port 80 redirects to HTTPS" || warn "port 80 returned $REDIR (expected 301)"
else
  EDGE_CODE="$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $DOMAIN" "http://127.0.0.1$HEALTH_PATH" || echo 000)"
  [ "$EDGE_CODE" = "200" ] && ok "nginx → app over HTTP" || warn "nginx returned $EDGE_CODE"
fi

PUBLIC_IP="$(curl -s --max-time 5 https://api.ipify.org || echo '<your-ip>')"
SCHEME=$([ "$HTTPS_LIVE" -eq 1 ] && echo https || echo http)

cat <<EOF

${B}Done.${N}

  App          $SCHEME://$DOMAIN/notes/
  Health       $SCHEME://$DOMAIN/notes/healthz
  Public URL   https://sabo.sh/notes/   ${D}(once the worker points here)${N}

${B}Still to do outside the VM:${N}
  1. DNS          A record  $DOMAIN → $PUBLIC_IP   ${D}(DNS-only, not proxied, so certbot can validate)${N}
  2. ${Y}OCI Security List${N} — the VM firewall is only half of it.
     OCI console → Networking → VCN → Subnet → Security List → Add Ingress Rules
     Source 0.0.0.0/0, TCP, ports 80 and 443. Requests time out until this exists.
  3. ${Y}MongoDB Atlas${N} → Network Access → Add IP Address → $PUBLIC_IP
     The old Render IPs will not cover this box; the app answers 503 until it is added.
  4. GitHub → repo → Settings → Webhooks → Add webhook
       Payload URL   $SCHEME://$DOMAIN/__deploy
       Content type  application/json
       Secret        ${B}$GENERATED_HOOK_SECRET${N}
       Events        Just the push event
  5. Point the Cloudflare worker's /notes target at https://$DOMAIN and deploy it.

${B}Everyday commands:${N}
  ./deploy/deploy.sh            deploy manually (what the webhook runs)
  pm2 logs $APP_NAME            tail application logs
  tail -f logs/deploy.log       watch a deploy in progress
  pm2 reload $APP_NAME          restart after editing .env
  nano $ENV_FILE
  sudo bash deploy/setup.sh --domain $DOMAIN --email "${EMAIL:-you@example.com}"

EOF
