param(
  [switch]$CreateDb,
  [switch]$ImportSql,
  [switch]$Force
)

# Windows PowerShell deploy helper for undangan (deploys local `undangan/` → server `/opt/stack/web/kkmrat`)
# Requires OpenSSH (ssh/scp) available in PATH.
# Usage: .\scripts\deploy-undangan.ps1 [-CreateDb] [-ImportSql] [-Force]
# Note: script will refuse to run if .env.kkmrat contains placeholder values unless -Force is supplied.

$ErrorActionPreference = 'Stop'
if ($env:SSH_HOST -and $env:SSH_HOST.Trim() -ne '') { `
  $sshHost = $env:SSH_HOST `
} else { `
  $sshHost = 'portfolio-droplet' `
}
$remoteStack = '/opt/stack'
$localSite = 'undangan'
$localEnvFile = '.env.kkmrat'

if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
  Write-Error "ssh not found in PATH. Install OpenSSH or ensure ssh/scp are available."
  exit 2
}
if (-not (Test-Path $localSite -PathType Container)) {
  Write-Error "Local site folder '$localSite' not found."
  exit 3
}

# collect KKMRAT_* values from local env file if present
$KKMRAT_DB_USER = $env:KKMRAT_DB_USER
$KKMRAT_DB_PASS = $env:KKMRAT_DB_PASS
$KKMRAT_DB_NAME = $env:KKMRAT_DB_NAME
$KKMRAT_AES_KEY = $env:KKMRAT_AES_KEY
# Defaults should be provided via .env.kkmrat or /opt/stack/.env; do NOT hard-code secrets in scripts.
if (Test-Path $localEnvFile) {
  $lines = Get-Content $localEnvFile
  foreach ($l in $lines) {
    if ($l -match '^KKMRAT_DB_USER=(.*)') { $KKMRAT_DB_USER = $matches[1].Trim('"',"'") }
    if ($l -match '^KKMRAT_DB_PASS=(.*)') { $KKMRAT_DB_PASS = $matches[1].Trim('"',"'") }
    if ($l -match '^KKMRAT_DB_NAME=(.*)') { $KKMRAT_DB_NAME = $matches[1].Trim('"',"'") }
    if ($l -match '^KKMRAT_AES_KEY=(.*)') { $KKMRAT_AES_KEY = $matches[1].Trim('"',"'") }
  }
  Write-Host "Read KKMRAT_* values from $localEnvFile"
}

$timestamp = [int][double]::Parse((Get-Date -UFormat %s))
$tmpName = "kkmrat-site-$timestamp"

Write-Host "Uploading site folder to ${sshHost}:/tmp/${tmpName} ..."
scp -r $localSite "${sshHost}:/tmp/${tmpName}"
Write-Host "Uploading docker-compose.yml and nginx vhost (if present) ..."
scp docker-compose.yml "${sshHost}:/tmp/docker-compose.yml"
if (Test-Path 'services/nginx/conf.d/default.conf') { scp 'services/nginx/conf.d/default.conf' "${sshHost}:/tmp/default.conf" }

$remoteCmd = @"
sudo mkdir -p $remoteStack/web/kkmrat && sudo rm -rf $remoteStack/web/kkmrat/* || true
sudo mv /tmp/$tmpName/* $remoteStack/web/kkmrat/ || true
sudo rm -rf /tmp/$tmpName || true
if [ -f /tmp/docker-compose.yml ]; then sudo mv /tmp/docker-compose.yml $remoteStack/docker-compose.yml || true; fi
if [ -f /tmp/default.conf ]; then sudo mv /tmp/default.conf $remoteStack/services/nginx/conf.d/default.conf || true; fi
"@

ssh $sshHost $remoteCmd

# update .env entries for KKMRAT_*
$updateScript = @"
set -e
FILE=$remoteStack/.env
update_or_append() {
  KEY="$1"; VAL="$2"
  if grep -q "^$KEY=" "$FILE" 2>/dev/null; then
    sudo sed -i "s/^$KEY=.*/$KEY='$VAL'/" "$FILE"
  else
    echo "$KEY=$VAL" | sudo tee -a "$FILE" >/dev/null
  fi
}
update_or_append 'KKMRAT_DB_USER' '$KKMRAT_DB_USER'
update_or_append 'KKMRAT_DB_PASS' '$KKMRAT_DB_PASS'
update_or_append 'KKMRAT_DB_NAME' '$KKMRAT_DB_NAME'
update_or_append 'KKMRAT_AES_KEY' '$KKMRAT_AES_KEY'
"@

ssh $sshHost $updateScript

Write-Host "Restarting php + nginx containers on server..."
ssh $sshHost "cd $remoteStack && sudo docker compose up -d php nginx && sudo docker compose exec nginx nginx -t && sudo docker compose restart nginx"

if ($CreateDb) {
  Write-Host "Creating MySQL database + user on server (reads MYSQL_ROOT_PASSWORD from $remoteStack/.env)..."
  $dbCmd = @"
cd $remoteStack
set -o allexport
if [ -f .env ]; then . .env; fi
set +o allexport
sudo docker compose exec -T db mysql -u root -p\"\$MYSQL_ROOT_PASSWORD\" -e \"CREATE DATABASE IF NOT EXISTS $KKMRAT_DB_NAME; CREATE USER IF NOT EXISTS '$KKMRAT_DB_USER'@'%' IDENTIFIED BY '$KKMRAT_DB_PASS'; GRANT ALL ON $KKMRAT_DB_NAME.* TO '$KKMRAT_DB_USER'@'%'; FLUSH PRIVILEGES;\"
"@
  ssh $sshHost $dbCmd
  Write-Host "Database create step finished."
}

Write-Host "deploy-undangan finished. Test site after DNS + SSL issuance."