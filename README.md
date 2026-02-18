# Portfolio Project - Nandang Duryat

**Live:** https://nandurstudio.com  
**Status:** ✅ Fully Operational  
**Deployed:** January 21, 2026  
**Stack:** Docker + nginx + Laravel + n8n  

Personal portfolio website showcasing 3D art and development projects with dynamic contact form and workflow automation.

## What's new (since Feb 16, 2026)
- Deployed `undangan` site → **https://kkmrat.web.id**; imported SQL dump and verified data.
- Fixed production SQL runtime error (ONLY_FULL_GROUP_BY) in `web/kkmrat/index.php` (aggregation query corrected).
- Added `scripts/deploy-undangan.sh`, `scripts/create-undangan-db.sh`, `scripts/monitor-cert-undangan.ps1`, and `scripts/cleanup-undangan.sh` for safe deploy / DB provisioning / cert automation.
- Introduced `backups/` (encrypted backups of local sensitive files); `backups/` is gitignored.
- Moved all real secrets to `/.env` (local) and `/opt/stack/.env` (server); added `.env.sample` for repo-friendly placeholders.
- Removed tracked `vendor/` from the `undangan` project and marked several legacy scripts DEPRECATED.

> Note: secrets are NOT committed. Always update `/.env` or use `scripts/deploy-undangan.sh` with a local `.env.kkmrat` for secure deploy.

---

## 🚀 Quick Start

### Access Production Services

- **Portfolio Website:** https://nandurstudio.com
- **Undangan site:** https://kkmrat.web.id
- **Laravel API:** https://nandurstudio.com/api/
- **Flask API:** https://nandurstudio.com/flask/
- **n8n Automation:** https://nandurstudio.com/n8n/ (configured via environment — rotate credentials after deploy)

### SSH Access to Server

```bash
# Via Cloudflare WARP (if ISP blocks port 22)
ssh portfolio-droplet

# Direct (if port 22 open)
ssh root@146.190.87.175

# Via DigitalOcean Console (always works)
# Login to https://cloud.digitalocean.com → Droplet → Console
```

---

## 📁 Project Structure

```
folioflix/
├── index.html              # Main portfolio HTML
├── assets/                 # Frontend assets (CSS, JS, images)
├── backend/                # Laravel 10 API
├── apps/flask/             # Flask API service
├── services/               # Docker service configs
│   ├── nginx/              # nginx reverse proxy
│   ├── mysql/              # MySQL database
│   ├── postgres/           # PostgreSQL for n8n
│   ├── flask/              # Flask Dockerfile
│   └── php/                # PHP-FPM Dockerfile
├── docker-compose.yml      # Docker orchestration (6 services)
├── nginx-with-n8n.conf     # nginx configuration (synced with server)
└── docs/                   # Documentation
    ├── DEPLOYMENT-STATUS.md      # Current deployment state
    ├── N8N-SETUP-GUIDE.md        # n8n configuration & usage
    ├── NGINX-N8N-CONFIG.md       # nginx proxy configuration details
    ├── CONFIG-SYNC-STATUS.md     # Sync status local ↔ server
    ├── DOCKER-DEPLOYMENT.md      # Docker setup guide
    └── SSH-Port-ISP-Blocking-Explanation.md  # SSH troubleshooting
```

---

## 🐳 Docker Services

| Service | Container | Image | Status | Port |
|---------|-----------|-------|--------|------|
| nginx | portfolio_nginx | nginx:1.24-alpine | ✅ Running | 80, 443 |
| PHP-FPM | portfolio_php | php:8.3-fpm | ✅ Running | 9000 |
| MySQL | portfolio_db | mysql:8.0 | ✅ Healthy | 3306 |
| PostgreSQL | portfolio_postgres | postgres:16-alpine | ✅ Healthy | 5432 |
| Flask | portfolio_flask | python:3.12-slim | ✅ Healthy | 5000 |
| n8n | portfolio_n8n | n8nio/n8n:latest | ✅ Healthy | 5678 |

---

## 🔧 Development Workflow

### Branches
- **prod** - Production branch (main development branch)
- All work happens on `prod` branch

### New / important scripts
- `scripts/deploy-undangan.sh` / `scripts/deploy-undangan.ps1` — deploy `undangan/` → `/opt/stack/web/kkmrat` (supports `--create-db`, `--import-sql`).
- `scripts/create-undangan-db.sh` — idempotent DB + user creation for `kkmrat`.
- `scripts/monitor-cert-undangan.ps1` — monitor DNS and request Let's Encrypt for `kkmrat.web.id`.
- `scripts/monitor-services.sh` — periodic health checks for core services (runs via cron; writes to `/opt/stack/logs/monitor-services.log`).
- `scripts/cleanup-undangan.sh` — remove temp artifacts (dry‑run by default).
- `backups/` — encrypted local backups (gitignored).

### Standard Workflow
1. **Development**: Work on `prod` branch in VSCode
2. **Commit Changes**: 
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```
3. **Push to GitHub**: 
   ```bash
   git push origin prod
   ```
4. **Deploy to Production**: 
   ```bash
   ssh portfolio-droplet "cd /opt/stack && git pull && sudo docker compose up -d"
   ```

### Deploy Configuration Changes

**Docker Compose:**
```bash
scp docker-compose.yml portfolio-droplet:/opt/stack/
ssh portfolio-droplet "cd /opt/stack && sudo docker compose up -d"
```

**nginx Configuration:**
```bash
scp nginx-with-n8n.conf portfolio-droplet:/opt/stack/services/nginx/conf.d/default.conf
ssh portfolio-droplet "cd /opt/stack && sudo docker compose restart nginx"
```

---

---

## 📚 Documentation

### Quick References
- **[DEPLOYMENT-STATUS.md](DEPLOYMENT-STATUS.md)** - Current deployment state, all services status
- **[CONFIG-SYNC-STATUS.md](CONFIG-SYNC-STATUS.md)** - Configuration sync status (local ↔ server)
- **[N8N-SETUP-GUIDE.md](N8N-SETUP-GUIDE.md)** - n8n workflow automation setup & usage
- **[NGINX-N8N-CONFIG.md](NGINX-N8N-CONFIG.md)** - Detailed nginx configuration for n8n subpath
- **[DOCKER-DEPLOYMENT.md](DOCKER-DEPLOYMENT.md)** - Docker stack deployment guide
- **[SSH-Port-ISP-Blocking-Explanation.md](SSH-Port-ISP-Blocking-Explanation.md)** - SSH troubleshooting

### Architecture Documents
- **[Architecture.md](Architecture.md)** - Planned architecture & tech stack
- **[SourceOfTruth.md](SourceOfTruth.md)** - Authoritative project state
- **[.github/copilot-instructions.md](.github/copilot-instructions.md)** - AI coding assistant guidelines

---

## 🎯 Common Tasks

### View Container Logs
```bash
ssh portfolio-droplet "cd /opt/stack && sudo docker compose logs -f [service_name]"

# Examples:
sudo docker compose logs -f n8n        # n8n logs
sudo docker compose logs -f nginx      # nginx logs
sudo docker compose logs -f php        # Laravel PHP-FPM logs
```

### Restart Services
```bash
ssh portfolio-droplet "cd /opt/stack && sudo docker compose restart [service_name]"

# Restart all services:
ssh portfolio-droplet "cd /opt/stack && sudo docker compose restart"
```

### Check Service Health
```bash
# All containers
ssh portfolio-droplet "cd /opt/stack && sudo docker compose ps"

# Test endpoints
curl https://nandurstudio.com                # Static site
curl https://nandurstudio.com/flask/health   # Flask API
curl https://nandurstudio.com/api/test       # Laravel API
curl https://nandurstudio.com/n8n/healthz    # n8n health
```

### Database Access
```bash
# MySQL (Laravel database)
ssh portfolio-droplet "cd /opt/stack && sudo docker compose exec db mysql -u portfolio_user -p portfolio"

# PostgreSQL (n8n database)
ssh portfolio-droplet "cd /opt/stack && sudo docker compose exec postgres psql -U n8n -d n8n"
```

---

## 🚨 Troubleshooting

### SSH Connection Issues
If `ssh portfolio-droplet` fails:
1. Try via Cloudflare WARP (bypass ISP port 22 blocking)
2. Use DigitalOcean Console (web-based terminal, always works)
3. See [SSH-Port-ISP-Blocking-Explanation.md](SSH-Port-ISP-Blocking-Explanation.md)

### Service Not Responding
1. Check container status: `sudo docker compose ps`
2. View logs: `sudo docker compose logs [service] --tail 50`
3. Restart service: `sudo docker compose restart [service]`

### n8n Not Loading
1. Check nginx config: `sudo docker exec portfolio_nginx nginx -t`
2. Verify n8n container: `sudo docker compose logs n8n --tail 20`
3. Test health: `curl https://nandurstudio.com/n8n/healthz`
4. See [NGINX-N8N-CONFIG.md](NGINX-N8N-CONFIG.md) for detailed troubleshooting

---

## 🔐 Security Notes

### Credentials
- **n8n Basic Auth:** configured via `N8N_PASSWORD` in `/opt/stack/.env` — **rotate immediately after deploy** (do not commit credentials).
- **MySQL Root & app DB passwords:** stored in `/opt/stack/.env` on server — rotate securely and do not commit.
- **SSH Key:** `~/.ssh/id_ed25519_portfolio` (Ed25519 key)

### SSL/TLS
- **Certificate:** Let's Encrypt (auto-renewed)
- **Protocols:** TLSv1.2, TLSv1.3
- **HSTS:** Enabled (max-age=31536000)

### Firewall (UFW)
- Port 22: SSH (may be blocked by ISP)
- Port 80: HTTP → HTTPS redirect
- Port 443: HTTPS (all services)
- Port 5678: n8n (CLOSED - only via nginx proxy)

---

## 📊 Server Information

**Provider:** DigitalOcean  
**Region:** Singapore (sgp1)  
**Droplet:**
- OS: Ubuntu 24.04 LTS
- RAM: 2GB
- vCPU: 1
- Storage: 50GB SSD
- IP: 146.190.87.175

**Domain:**
- Primary: nandurstudio.com
- DNS: Cloudflare (managed via DigitalOcean)

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Repository

- **GitHub**: [https://github.com/nandurstudio/portfolio-project](https://github.com/nandurstudio/portfolio-project)
- **Author**: Nandang Duryat (nandurstudio)
- **Email**: nandang.dhe@gmail.com