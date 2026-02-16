#!/bin/bash
# Create/ensure kkmrat database and user (safe to run multiple times)
# NOTE: now parameterized — values are read from /opt/stack/.env (KKMRAT_*) or sensible defaults.
set -euo pipefail
cd /opt/stack

# load stack env (if present)
set -o allexport
if [ -f .env ]; then . .env; fi
set +o allexport

# values (can be set in /opt/stack/.env or passed in environment)
KKMRAT_DB_USER="${KKMRAT_DB_USER:-kkmrat_user}"
KKMRAT_DB_PASS="${KKMRAT_DB_PASS:-kkmrat_pass}"
KKMRAT_DB_NAME="${KKMRAT_DB_NAME:-db_undangan_rat}"

# Safety: refuse to run with placeholder defaults
if [ "${KKMRAT_DB_PASS}" = "kkmrat_pass" ] || [ "${KKMRAT_AES_KEY:-}" = "change_me_replace_this_key" ]; then
  echo "ERROR: KKMRAT_* contains placeholder values. Update /opt/stack/.env or .env.kkmrat before running." >&2
  exit 1
fi

sudo docker compose exec -T db mysql -u root -p"$MYSQL_ROOT_PASSWORD" <<SQL
CREATE DATABASE IF NOT EXISTS ${KKMRAT_DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${KKMRAT_DB_USER}'@'%' IDENTIFIED BY '${KKMRAT_DB_PASS}';
ALTER USER '${KKMRAT_DB_USER}'@'%' IDENTIFIED BY '${KKMRAT_DB_PASS}';
GRANT ALL PRIVILEGES ON ${KKMRAT_DB_NAME}.* TO '${KKMRAT_DB_USER}'@'%';
FLUSH PRIVILEGES;
SQL

echo "kkmrat DB + user ensured (user=${KKMRAT_DB_USER}, db=${KKMRAT_DB_NAME})"
