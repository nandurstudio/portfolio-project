# Scripts Organization

All automation scripts organized by project. Each subfolder contains scripts relevant to that specific project.

---

## 📁 Directory Structure

### 🪴 **portfolio/** - Main Portfolio Site (nandurstudio.com)
Production deployment & monitoring scripts for the main portfolio website.

- `deploy-docker.sh` - Docker compose deployment
- `deploy.sh` - Main deployment script
- `monitor-services.sh` - Monitor running services
- `server-setup.sh` - Initial server setup

**Usage:**
```bash
# Deploy to production
./portfolio/deploy.sh

# Monitor services
./portfolio/monitor-services.sh
```

---

### 🗳️ **kkmsmartvote/** - KKM Smart Vote (Local Testing on Laragon)
Local development & testing scripts for the voting application.

- `setup-laragon-koperasi.ps1` - Configure Laragon environment (hosts, vhost, database)
- `sync-to-laragon.ps1` - Sync files from portfolio repo → Laragon testing directory
- `run-local.ps1` - Start backend API + frontend dev server locally

**Usage:**
```powershell
# First time setup
.\kkmsmartvote\setup-laragon-koperasi.ps1

# Sync changes
.\kkmsmartvote\sync-to-laragon.ps1

# Run application
.\kkmsmartvote\run-local.ps1

# Watch mode (auto-sync)
.\kkmsmartvote\sync-to-laragon.ps1 -Watch
```

**⚠️ CRITICAL RULE:**
- **EDIT in:** `E:\Portfolio Nandur\folioflix\web\kkmsmartvote\` (source of truth)
- **SYNC to:** `F:\laragon\www\koperasi-vote\` (testing only)
- **COMMIT from:** Portfolio repo (never from Laragon!)

---

### 📋 **undangan/** - Undangan / kkmrat.web.id (Invitation Site)
Deployment & management scripts for the digital invitation platform.

- `deploy-undangan.ps1` - Deploy to server (PowerShell)
- `deploy-undangan.sh` - Deploy to server (Bash)
- `check-undangan.ps1` - Check undangan repo status (PowerShell)
- `check-undangan.sh` - Check undangan repo status (Bash)
- `create-undangan-db.sh` - Create MySQL database & user
- `monitor-cert-undangan.ps1` - Monitor SSL certificate expiration
- `undangan-init.sql` - Database initialization script
- `show-undangan.sql` - Show database contents

**Usage:**
```powershell
# Deploy with database setup
.\undangan\deploy-undangan.ps1 -CreateDb

# Check status
.\undangan\check-undangan.ps1

# Monitor SSL certificate
.\undangan\monitor-cert-undangan.ps1
```

**Bash Usage:**
```bash
./undangan/deploy-undangan.sh --create-db
./undangan/check-undangan.sh
```

---

### 🔧 **shared/** - Shared Utilities
Utility scripts used across multiple projects.

- `git-info.ps1` - Display Git repository information
- `create-junctions-and-hosts.ps1` - Set up Windows junctions & hosts file (DEPRECATED)
- `reorganize-structure.sh` - Reorganize directory structure (DEPRECATED)

**Usage:**
```powershell
# Show git status
./shared/git-info.ps1
```

---

## 🚀 Quick Start

### 1️⃣ First Time Setup (KKM Smart Vote)
```powershell
cd e:\Portfolio Nandur\folioflix-personal-portfolio-html-template-2023-11-27-05-37-14-utc\folioflix
.\scripts\kkmsmartvote\setup-laragon-koperasi.ps1
```

### 2️⃣ Daily Development Workflow
```powershell
# 1. Make changes in portfolio repo
# 2. Sync to Laragon
.\scripts\kkmsmartvote\sync-to-laragon.ps1

# 3. Run local app
.\scripts\kkmsmartvote\run-local.ps1

# 4. Test in browser (http://localhost:5173)

# 5. Commit when ready
git add web/kkmsmartvote/...
git commit -m "Feature: ..."
```

### 3️⃣ Deploy Undangan Site
```powershell
.\scripts\undangan\deploy-undangan.ps1 -CreateDb
```

### 4️⃣ Monitor Production
```bash
./scripts/portfolio/monitor-services.sh
```

---

## 📝 Script Naming Convention

| Prefix | Usage | Example |
|--------|-------|---------|
| `deploy-` | Deploy/push to server | `deploy-undangan.ps1` |
| `setup-` | Initial configuration | `setup-laragon-koperasi.ps1` |
| `run-` | Start/execute service | `run-local.ps1` |
| `sync-` | Copy/synchronize files | `sync-to-laragon.ps1` |
| `check-` | Verify status | `check-undangan.ps1` |
| `monitor-` | Track/watch service | `monitor-cert-undangan.ps1` |
| `create-` | Create infrastructure | `create-undangan-db.sh` |

---

## 🔐 Security Notes

- Never commit `.env` files (they contain credentials)
- Store secrets in environment variables on servers
- Keep production credentials out of version control
- Use `--CreateDb` flag carefully (only on first deploy)

---

## 📖 Documentation References

- [Laragon Local Testing Guide](../docs/LARAGON-LOCAL-TESTING.md)
- [Deployment Status](../docs/DEPLOYMENT-STATUS.md)
- [Project Structure](../docs/PROJECT-STRUCTURE.md)
- [Critical Rules](../.github/copilot-instructions.md)

---

**Last Updated:** April 5, 2026
**Maintainer:** Nandang Duryat
