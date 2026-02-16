#!/usr/bin/env bash
# Deploy helper for kkmrat.web.id
# - syncs local `undangan/` -> /opt/stack/web/kkmrat on server
# - uploads docker-compose + nginx vhost, updates /opt/stack/.env with KKMRAT_* values
# - optionally creates MySQL database/user (uses server's MYSQL_ROOT_PASSWORD from /opt/stack/.env)
# Usage: ./scripts/deploy-kkmrat.sh [--create-db]

set -euo pipefail
IFS=$'\n\t'

SSH_HOST=${SSH_HOST:-portfolio-droplet}
REMOTE_STACK_DIR=/opt/stack
LOCAL_SITE_DIR=undangan
LOCAL_ENV_FILE=.env.kkmrat
CREATE_DB=0

usage() {
  cat <<EOF
Usage: $0 [--create-db] [--help]

Options:
  --create-db   Create MySQL database + user on the server (uses KKMRAT_* values from server .env)
  --help        Show this help

Notes:
  - Script will read ${LOCAL_ENV_FILE} if present to pick KKMRAT_* values.
  - ${LOCAL_ENV_FILE} must NOT be committed to git (it's ignored by .gitignore).
  - This script requires ssh/scp access as configured (uses SSH host '${SSH_HOST}').
EOF
}

while [[ ${#} -gt 0 ]]; do
  case "$1" in
    --create-db) CREATE_DB=1; shift ;;
    --help) usage; exit 0 ;;
    *) echo "Unknown arg: $1"; usage; exit 1 ;;
  esac
done

if ! command -v ssh >/dev/null 2>&1 || ! command -v scp >/dev/null 2>&1; then
  echo "Error: ssh/scp required but not found in PATH." >&2
  exit 2
fi

if [[ ! -d "$LOCAL_SITE_DIR" ]]; then
  echo "Error: local site directory '$LOCAL_SITE_DIR' not found." >&2
  echo "If the site lives elsewhere, update LOCAL_SITE_DIR in this script or run from workspace root." >&2
  exit 3
fi

# read local env values if available
KK_USER_DEFAULT=kkmrat_user
KK_PASS_DEFAULT=kkmrat_pass
KK_DB_DEFAULT=db_undangan_rat
KK_AES_DEFAULT="change_me_replace_this_key"

if [[ -f "$LOCAL_ENV_FILE" ]]; then
  echo "Found $LOCAL_ENV_FILE — reading KKMRAT_* values from it (will not be committed)."
  KKMRAT_DB_USER=$(grep -E '^KKMRAT_DB_USER=' "$LOCAL_ENV_FILE" || true | cut -d'=' -f2-)
  KKMRAT_DB_PASS=$(grep -E '^KKMRAT_DB_PASS=' "$LOCAL_ENV_FILE" || true | cut -d'=' -f2-)
  KKMRAT_DB_NAME=$(grep -E '^KKMRAT_DB_NAME=' "$LOCAL_ENV_FILE" || true | cut -d'=' -f2-)
  KKMRAT_AES_KEY=$(grep -E '^KKMRAT_AES_KEY=' "$LOCAL_ENV_FILE" || true | cut -d'=' -f2-)
fi

# fallback to defaults
: ${KKMRAT_DB_USER:=$KK_USER_DEFAULT}
: ${KKMRAT_DB_PASS:=$KK_PASS_DEFAULT}
: ${KKMRAT_DB_NAME:=$KK_DB_DEFAULT}
: ${KKMRAT_AES_KEY:=$KK_AES_DEFAULT}

echo "Preparing deploy to ${SSH_HOST} — site: ${LOCAL_SITE_DIR} → ${REMOTE_STACK_DIR}/web/kkmrat"
TMP_NAME="kkmrat-site-$$"

echo "Uploading site files..."
scp -r "$LOCAL_SITE_DIR" "$SSH_HOST:/tmp/${TMP_NAME}"

echo "Uploading docker-compose.yml and nginx vhost (if present)..."
scp docker-compose.yml "$SSH_HOST:/tmp/docker-compose.yml"
if [[ -f services/nginx/conf.d/default.conf ]]; then
  scp services/nginx/conf.d/default.conf "$SSH_HOST:/tmp/default.conf"
fi

echo "Applying files on server and updating environment..."
ssh "$SSH_HOST" bash -lc "sudo mkdir -p ${REMOTE_STACK_DIR}/web/kkmrat && sudo rm -rf ${REMOTE_STACK_DIR}/web/kkmrat/* || true && sudo mv /tmp/${TMP_NAME}/* ${REMOTE_STACK_DIR}/web/kkmrat/ || true && sudo rm -rf /tmp/${TMP_NAME} || true; if [ -f /tmp/docker-compose.yml ]; then sudo mv /tmp/docker-compose.yml ${REMOTE_STACK_DIR}/docker-compose.yml || true; fi; if [ -f /tmp/default.conf ]; then sudo mv /tmp/default.conf ${REMOTE_STACK_DIR}/services/nginx/conf.d/default.conf || true; fi"

# update /opt/stack/.env with KKMRAT_* values (replace if exists)
REMOTE_UPDATE_CMDS=""
for K in KKMRAT_DB_USER KKMRAT_DB_PASS KKMRAT_DB_NAME KKMRAT_AES_KEY; do
  V=
  case "$K" in
    KKMRAT_DB_USER) V="$KKMRAT_DB_USER";;
    KKMRAT_DB_PASS) V="$KKMRAT_DB_PASS";;
    KKMRAT_DB_NAME) V="$KKMRAT_DB_NAME";;
    KKMRAT_AES_KEY) V="$KKMRAT_AES_KEY";;
  esac
  # escape slashes and single quotes for safe sed/echo usage
  V_ESC=
  V_ESC=$(printf "%s" "$V" | sed "s/'/'\\''/g")
  REMOTE_UPDATE_CMDS+="if grep -q '^${K}=' ${REMOTE_STACK_DIR}/.env 2>/dev/null; then sudo sed -i \"s/^${K}=.*/${K}='${V_ESC}'/\" ${REMOTE_STACK_DIR}/.env; else echo '${K}=${V_ESC}' | sudo tee -a ${REMOTE_STACK_DIR}/.env >/dev/null; fi; ";
done

ssh "$SSH_HOST" bash -lc "$REMOTE_UPDATE_CMDS"

# restart services
echo "Starting containers on server (php + nginx)..."
ssh "$SSH_HOST" "cd ${REMOTE_STACK_DIR} && sudo docker compose up -d php nginx && sudo docker compose exec nginx nginx -t && sudo docker compose restart nginx"

if [[ "$CREATE_DB" -eq 1 ]]; then
  echo "Creating MySQL database and user on server using values from /opt/stack/.env ..."
  ssh "$SSH_HOST" bash -lc "cd ${REMOTE_STACK_DIR} && set -o allexport; if [ -f .env ]; then . .env; fi; set +o allexport; sudo docker compose exec -T db mysql -u root -p\"\$MYSQL_ROOT_PASSWORD\" -e \"CREATE DATABASE IF NOT EXISTS ${KKMRAT_DB_NAME}; CREATE USER IF NOT EXISTS '${KKMRAT_DB_USER}'@'%' IDENTIFIED BY '${KKMRAT_DB_PASS}'; GRANT ALL ON ${KKMRAT_DB_NAME}.* TO '${KKMRAT_DB_USER}'@'%'; FLUSH PRIVILEGES;\""
  echo "Database creation complete (if not already present)."
fi

echo "Done — test: https://kkmrat.web.id (after DNS + SSL) or run the health checks locally via SSH."
exit 0
