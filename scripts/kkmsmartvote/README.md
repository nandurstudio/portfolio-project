# KKM Smart Vote Scripts

All scripts untuk development & deployment KKM Smart Vote (koperasi-vote) di folder `web/kkmsmartvote/`.

## 🚀 Quick Start (Recommended)

```powershell
# Windows PowerShell - Sync + Install + Start Dev Server
.\scripts\kkmsmartvote\run-and-sync.ps1 -Dev

# Or just sync without starting dev
.\scripts\kkmsmartvote\run-and-sync.ps1
```

## 📋 Available Scripts

### 1. **run-and-sync.ps1** (⭐ RECOMMENDED)
**All-in-one script untuk development**

```powershell
# Basic sync (install deps + sync to Laragon)
.\scripts\kkmsmartvote\run-and-sync.ps1

# Sync + start dev server
.\scripts\kkmsmartvote\run-and-sync.ps1 -Dev

# Sync + start frontend dev only
.\scripts\kkmsmartvote\run-and-sync.ps1 -Dev -Frontend

# Sync + start & open browser
.\scripts\kkmsmartvote\run-and-sync.ps1 -Dev -LaunchBrowser

# Skip npm install (faster if already installed)
.\scripts\kkmsmartvote\run-and-sync.ps1 -Dev -NoInstall
```

**Features:**
- ✅ Checks Node.js dependencies
- ✅ Installs npm packages if needed
- ✅ Syncs files to Laragon
- ✅ Optionally starts Vite dev server
- ✅ Color-coded output
- ✅ Progress indicators

**Output:**
- Frontend dev server: http://localhost:5173
- Backend API: http://localhost:8000/api (via Laragon)
- Live reload: Automatic when files change

---

### 2. **sync-to-laragon.ps1**
**File synchronization only (no npm, no dev server)**

```powershell
# Sync files to f:\laragon\www\koperasi-vote\
.\scripts\kkmsmartvote\sync-to-laragon.ps1
```

**Use when:**
- Files already edited in VS Code
- Dependencies already installed
- Just need to push changes to Laragon

---

### 3. **run-local.ps1**
**Start dev server on Laragon (after manual sync)**

```powershell
# Run with auto-sync
.\scripts\kkmsmartvote\run-local.ps1 -Sync

# Run without sync (manual sync first)
.\scripts\kkmsmartvote\run-local.ps1

# Fresh database reset
.\scripts\kkmsmartvote\run-local.ps1 -Fresh

# Backend only
.\scripts\kkmsmartvote\run-local.ps1 -Mode backend
```

---

### 4. **setup-laragon-koperasi.ps1**
**Initial setup of Laragon directories**

```powershell
# Setup Laragon for testing
.\scripts\kkmsmartvote\setup-laragon-koperasi.ps1
```

**Use once for:**
- Create initial Laragon folders
- Setup database
- Initial configuration

---

## 📊 Workflow Comparison

| Scenario | Command | Time |
|----------|---------|------|
| **First time setup** | `run-and-sync.ps1 -Dev` | ~45s |
| **Sync only** | `sync-to-laragon.ps1` | ~2s |
| **Sync + dev server** | `run-and-sync.ps1 -Dev` | ~3s |
| **Fresh test** | `run-local.ps1 -Fresh` | ~15s |

---

## 🔄 Typical Development Workflow

```powershell
# 1️⃣ Start of day - Full setup with dev server
.\scripts\kkmsmartvote\run-and-sync.ps1 -Dev

# 2️⃣ Edit files in VS Code
# File changes auto-reload in browser (Vite hot reload)

# 3️⃣ Every 30 min - Sync changes to Laragon
.\scripts\kkmsmartvote\sync-to-laragon.ps1

# 4️⃣ Test on Laragon with php artisan serve
.\scripts\kkmsmartvote\run-local.ps1 -Sync

# 5️⃣ Ready to push? Commit and push
git add web/kkmsmartvote/
git commit -m "Feature: Email OTP verification"
git push origin main
```

---

## 🎯 Common Tasks

### ✏️ Edit Backend Code
```powershell
# 1. Edit in web/kkmsmartvote/backend/
# 2. Sync to Laragon
.\scripts\kkmsmartvote\sync-to-laragon.ps1

# 3. Test endpoints
curl -X POST http://localhost:8000/api/voting/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### 🎨 Edit Frontend Code
```powershell
# 1. Start dev server
.\scripts\kkmsmartvote\run-and-sync.ps1 -Dev

# 2. Edit in web/kkmsmartvote/frontend/
# 3. Browser auto-reloads (Vite HMR)

# 4. When ready, sync to Laragon
.\scripts\kkmsmartvote\sync-to-laragon.ps1
```

### 💾 Database Changes
```powershell
# 1. Create migration in web/kkmsmartvote/backend/
php artisan make:migration add_new_table

# 2. Edit migration file

# 3. Run migration in Laragon
cd f:\laragon\www\koperasi-vote\backend
php artisan migrate

# 4. Sync changes back to portfolio
.\scripts\kkmsmartvote\sync-to-laragon.ps1
```

---

## 📁 Directory Structure

```
scripts/kkmsmartvote/
├── run-and-sync.ps1              ⭐ Use this (all-in-one)
├── run-and-sync.sh               (Linux/Mac alternative)
├── sync-to-laragon.ps1           (Sync only)
├── run-local.ps1                 (Dev server on Laragon)
├── setup-laragon-koperasi.ps1    (Initial setup)
└── README.md                      (This file)
```

---

## 🐛 Troubleshooting

### Problem: "npm: command not found"
**Solution:** Install Node.js from https://nodejs.org/

### Problem: "Laragon not found at f:\laragon"
**Solution:** Check your Laragon installation path and update scripts

### Problem: "Port 5173 already in use"
**Solution:** Kill the process or use different port
```powershell
.\scripts\kkmsmartvote\run-and-sync.ps1 -Dev -FrontendPort 5174
```

### Problem: "sync-to-laragon.ps1: command not found"
**Solution:** Make sure you're in the portfolio root directory
```powershell
cd "e:\Portfolio Nandur\folioflix"
.\scripts\kkmsmartvote\run-and-sync.ps1 -Dev
```

---

## ✅ Checklist Before Push

Before pushing changes to production:

- [ ] All syntax errors fixed (VS Code shows 0 errors)
- [ ] Tested locally on Laragon with `run-local.ps1 -Fresh`
- [ ] Database migrations run successfully
- [ ] Frontend loads without console errors
- [ ] Email OTP system tested with real email
- [ ] Rate limiting tested (3 requests/10min OTP)
- [ ] Changes synced: `sync-to-laragon.ps1`
- [ ] Changes committed: `git add . && git commit -m "..."`
- [ ] Changes pushed: `git push origin main`

---

## 📞 Support

For issues with scripts:
1. Check error messages (usually in red)
2. Verify paths in `run-and-sync.ps1`
3. Check Laragon is running: `laragon` app or `valet start`
4. Check Node.js version: `node --version`
5. Check npm version: `npm --version`

---

**Last Updated:** April 5, 2026
**Maintainer:** GitHub Copilot
**Project:** KKM Smart Vote (kkmsmartvote.web.id)
