# KKMSmartVote VPS Deployment Plan
## April 16, 2026 - Target: https://kkmsmartvote.web.id

---

## 📋 Pre-Deployment Checklist

### Server Prerequisites
- [ ] PostgreSQL 16 running di VPS (146.190.87.175)
- [ ] Database `koperasi_vote` sudah exist
- [ ] Laravel dapat connect ke PostgreSQL
- [ ] Nginx vhost `kkmsmartvote.web.id` sudah configured
- [ ] SSL certificate untuk kkmsmartvote.web.id sudah installed
- [ ] Docker volumes properly mounted

### Application Code Ready
- [ ] Backend code di `web/kkmsmartvote/backend/` - READY ✓
- [ ] Frontend code di `web/kkmsmartvote/frontend/` - READY ✓
- [ ] Public folder di `web/kkmsmartvote/public/` - READY ✓
- [ ] .env configuration file ready for server

---

## 🚀 Deployment Steps (Sequential)

### PHASE 1: Database Preparation (Execute on VPS)

**STEP 1.1: SSH to VPS**
```bash
ssh -i ~/.ssh/id_ed25519_portfolio root@146.190.87.175
# OR use DigitalOcean Console if SSH blocked
```

**STEP 1.2: Navigate to project directory**
```bash
cd /opt/stack/web/kkmsmartvote
```

**STEP 1.3: Verify PostgreSQL connection**
```bash
PGPASSWORD="$KOPERASI_DB_PASS" psql \
  -h localhost \
  -p 5432 \
  -U koperasi \
  -d koperasi_vote \
  -c "SELECT version();"
```

**STEP 1.4: Create backup (BEFORE cleanup)**
```bash
mkdir -p backups
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
PGPASSWORD="$KOPERASI_DB_PASS" pg_dump \
  -h localhost \
  -p 5432 \
  -U koperasi \
  koperasi_vote > backups/koperasi_vote_before_cleanup_${BACKUP_DATE}.sql
```

**STEP 1.5: Execute cleanup script**
```bash
# Show data BEFORE cleanup
PGPASSWORD="$KOPERASI_DB_PASS" psql \
  -h localhost -p 5432 -U koperasi -d koperasi_vote \
  -c "SELECT 'voter_vouchers' as table_name, COUNT(*) as row_count FROM voter_vouchers
      UNION ALL
      SELECT 'vouchers', COUNT(*) FROM vouchers
      UNION ALL
      SELECT 'votes', COUNT(*) FROM votes
      UNION ALL
      SELECT 'email_otps', COUNT(*) FROM email_otps
      UNION ALL
      SELECT 'audit_logs', COUNT(*) FROM audit_logs
      ORDER BY table_name;"

# Execute cleanup
PGPASSWORD="$KOPERASI_DB_PASS" psql \
  -h localhost -p 5432 -U koperasi -d koperasi_vote \
  -f cleanup_before_deploy.sql

# Show data AFTER cleanup (should be all 0)
PGPASSWORD="$KOPERASI_DB_PASS" psql \
  -h localhost -p 5432 -U koperasi -d koperasi_vote \
  -c "SELECT 'voter_vouchers' as table_name, COUNT(*) as row_count FROM voter_vouchers
      UNION ALL
      SELECT 'vouchers', COUNT(*) FROM vouchers
      UNION ALL
      SELECT 'votes', COUNT(*) FROM votes
      UNION ALL
      SELECT 'email_otps', COUNT(*) FROM email_otps
      UNION ALL
      SELECT 'audit_logs', COUNT(*) FROM audit_logs
      ORDER BY table_name;"
```

**STEP 1.6: Create backup (AFTER cleanup)**
```bash
PGPASSWORD="$KOPERASI_DB_PASS" pg_dump \
  -h localhost \
  -p 5432 \
  -U koperasi \
  koperasi_vote > backups/koperasi_vote_after_cleanup_${BACKUP_DATE}.sql
```

---

### PHASE 2: Application Code Deployment

**STEP 2.1: Upload application code** (from local machine)
```powershell
# Windows PowerShell
scp -r web/kkmsmartvote root@146.190.87.175:/opt/stack/web/

# Or if SSH blocked, use SCP via Cloudflare WARP
# Make sure WARP is connected first
```

**STEP 2.2: Set proper permissions**
```bash
# SSH to server
ssh root@146.190.87.175

cd /opt/stack/web/kkmsmartvote
chmod -R 755 backend public
chmod -R 755 frontend
chown -R www-data:www-data backend storage
```

**STEP 2.3: Create/Update server .env file**
```bash
# SSH to server
cd /opt/stack/web/kkmsmartvote/backend

# Create .env from .env.example
cp .env.example .env

# Edit .env with server configuration
nano .env
```

**Server .env Settings:**
```
APP_NAME="Koperasi Karya Mandiri"
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:... # Keep existing or generate new
APP_URL=https://kkmsmartvote.web.id

LOG_CHANNEL=single

# PostgreSQL Configuration (IMPORTANT!)
DB_CONNECTION=pgsql
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=koperasi_vote
DB_USERNAME=koperasi
DB_PASSWORD=... # Set proper password from /opt/stack/.env

JWT_SECRET=... # Keep existing
JWT_TTL=60
JWT_REFRESH_TTL=20160

CORS_ALLOWED_ORIGINS=https://kkmsmartvote.web.id

# Mail Configuration (Brevo)
MAIL_MAILER=smtp
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_USERNAME=a729fa001@smtp-brevo.com
MAIL_PASSWORD=... # Keep existing
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=nandang.dhe@gmail.com
MAIL_FROM_NAME="KKM Voting Admin"
```

---

### PHASE 3: Laravel Migrations & Setup

**STEP 3.1: Install PHP dependencies**
```bash
cd /opt/stack/web/kkmsmartvote/backend

# If using PHP directly (not Docker)
php composer.phar install --no-dev --optimize-autoloader

# OR if using Docker
docker compose exec php composer install --no-dev --optimize-autoloader
```

**STEP 3.2: Generate APP_KEY (if needed)**
```bash
cd /opt/stack/web/kkmsmartvote/backend

# If using PHP directly
php artisan key:generate

# OR if using Docker
docker compose exec php php artisan key:generate
```

**STEP 3.3: Run migrations**
```bash
# IMPORTANT: Migrations will create tables, our data (members, candidates, etc.)
# should already exist in the database from the backup
php artisan migrate --force
```

**STEP 3.4: Cache config**
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

### PHASE 4: Frontend Build (if needed)

**STEP 4.1: Build frontend assets**
```bash
cd /opt/stack/web/kkmsmartvote/frontend

npm install --production
npm run build
```

**STEP 4.2: Verify frontend files**
```bash
ls -la dist/
# Should contain index.html, assets/, etc.
```

---

### PHASE 5: Nginx Configuration & Testing

**STEP 5.1: Verify nginx vhost configuration**
```bash
# Check if vhost is configured
cat /opt/stack/services/nginx/conf.d/default.conf | grep -A 20 "kkmsmartvote"

# Should include:
# - server_name kkmsmartvote.web.id www.kkmsmartvote.web.id
# - ssl_certificate ... kkmsmartvote.fullchain.pem
# - ssl_certificate_key ... kkmsmartvote.privkey.pem
# - Proper proxy_pass to backend
# - Static file serving for frontend
```

**STEP 5.2: Test nginx configuration**
```bash
docker compose exec nginx nginx -t
# Should return: "nginx: configuration file test is successful"
```

**STEP 5.3: Reload nginx**
```bash
docker compose restart nginx
```

---

### PHASE 6: Testing & Verification

**STEP 6.1: Test API endpoints**
```bash
# Health check
curl https://kkmsmartvote.web.id/api/test

# Expected response: JSON with status "ok" or similar

# Check database connection
curl https://kkmsmartvote.web.id/api/candidates
# Should return list of candidates (if data exists)
```

**STEP 6.2: Test frontend access**
```bash
# Open in browser
https://kkmsmartvote.web.id

# Should display frontend home page (or voting interface)
```

**STEP 6.3: Verify database (no test data)**
```bash
PGPASSWORD="..." psql -h localhost -p 5432 -U koperasi -d koperasi_vote \
  -c "SELECT 'voter_vouchers' as t, COUNT(*) as c FROM voter_vouchers
      UNION ALL
      SELECT 'vouchers', COUNT(*) FROM vouchers
      UNION ALL
      SELECT 'votes', COUNT(*) FROM votes
      UNION ALL
      SELECT 'email_otps', COUNT(*) FROM email_otps
      UNION ALL
      SELECT 'audit_logs', COUNT(*) FROM audit_logs;"

# All should show 0 (cleaned)
```

**STEP 6.4: Check logs for errors**
```bash
docker compose logs -f nginx --tail=50
docker compose logs -f php --tail=50
# OR container-specific if not using Docker
tail -f /var/log/nginx/error.log
tail -f /var/log/php.log
```

---

## ⚠️ Rollback Plan

If something goes wrong:

**Rollback to pre-cleanup state:**
```bash
cd /opt/stack/web/kkmsmartvote

PGPASSWORD="..." psql -h localhost -p 5432 -U koperasi -d koperasi_vote \
  < backups/koperasi_vote_before_cleanup_TIMESTAMP.sql
```

**Rollback to pre-deployment state:**
```bash
cd /opt/stack
git checkout web/kkmsmartvote  # If tracked in git
docker compose restart php
```

---

## 📝 Deployment Notes

- **Database**: PostgreSQL (not MySQL) - ensure .env uses `pgsql`
- **Backups**: Always keep backups before major changes
- **DNS**: `kkmsmartvote.web.id` should point to 146.190.87.175
- **SSL**: Certificate must be valid for kkmsmartvote.web.id
- **Cleanup**: Verified all sensitive tables are empty before deployment
- **Migrations**: Fresh tables created by migrations will match schema

---

## ✅ Post-Deployment Checklist

- [ ] Database connection working
- [ ] All cleanup data truncated (0 rows)
- [ ] Migrations completed successfully
- [ ] Frontend accessible at https://kkmsmartvote.web.id
- [ ] API responding at /api/test
- [ ] No error logs in nginx/php
- [ ] SSL certificate valid
- [ ] Backups stored safely

---

**Status**: Ready for deployment approval
**Created**: April 16, 2026
**Target URL**: https://kkmsmartvote.web.id
