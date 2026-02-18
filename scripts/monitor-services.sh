#!/bin/sh
# scripts/monitor-services.sh — simple health monitor for FolioFlix stack
# - Writes to /opt/stack/logs/monitor-services.log
# - Designed to run from root's cron (*/5 * * * *)

set -eu
LOG_DIR="/opt/stack/logs"
LOG_FILE="$LOG_DIR/monitor-services.log"
mkdir -p "$LOG_DIR"

timestamp() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
log() { echo "$(timestamp) $*" >> "$LOG_FILE"; }

log "monitor: starting"

# Load stack env if present (so script can use MYSQL_ROOT_PASSWORD, N8N_PASSWORD, etc.)
if [ -f /opt/stack/.env ]; then
  # shellcheck disable=SC1090
  set -o allexport
  . /opt/stack/.env
  set +o allexport
fi

# ensure working dir so `docker compose` finds the stack file
cd /opt/stack || true

failures=0

check_url() {
  url="$1"; name="$2"; auth="$3"
  if [ -n "$auth" ]; then
    status=$(curl -s -S -k -m 10 -u "$auth" -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
  else
    status=$(curl -s -S -k -m 10 -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
  fi
  log "check http: $name -> $url status=$status"
  [ "$status" = "200" ] || failures=$((failures+1))
}

# Basic HTTP checks (local + public)
check_url "https://localhost/api/test" "Laravel API (local)" ""
check_url "https://localhost/flask/health" "Flask (local)" ""
check_url "https://localhost/n8n/healthz" "n8n (local)" "admin:${N8N_PASSWORD:-}" || true
check_url "https://nandurstudio.com/" "Main site (public)" ""
check_url "https://nandurstudio.com/n8n/healthz" "n8n (public)" "admin:${N8N_PASSWORD:-}" || true
check_url "https://kkmrat.web.id/" "Undangan site (public)" ""

# Docker container health/status
for c in portfolio_db portfolio_postgres portfolio_php portfolio_nginx portfolio_flask portfolio_n8n; do
  status=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$c" 2>/dev/null || echo "unknown")
  log "container: $c status=$status"
  case "$status" in
    unhealthy|dead|exited) failures=$((failures+1)) ;;
  esac
done

# DB checks
if docker compose exec -T db mysqladmin ping -uroot -p"$MYSQL_ROOT_PASSWORD" >/dev/null 2>&1; then
  log "db: mysql ping OK"
else
  log "db: mysql ping FAILED"; failures=$((failures+1))
fi

if docker compose exec -T postgres pg_isready -U "${N8N_DB_USER:-n8n}" >/dev/null 2>&1; then
  log "db: postgres ready"
else
  log "db: postgres NOT READY"; failures=$((failures+1))
fi

if [ "$failures" -gt 0 ]; then
  log "ALERT: $failures checks failed"
  # optional webhook/alert (set MONITOR_ALERT_WEBHOOK in /opt/stack/.env)
  if [ -n "${MONITOR_ALERT_WEBHOOK:-}" ]; then
    payload="{\"text\":\"FolioFlix monitor: $failures checks failed on $(hostname)\"}"
    curl -s -X POST -H 'Content-Type: application/json' -d "$payload" "$MONITOR_ALERT_WEBHOOK" >/dev/null 2>&1 || true
    log "alert: webhook fired"
  fi
else
  log "monitor: all checks OK"
fi

exit $failures
