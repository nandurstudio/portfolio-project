# 🚀 Laragon Local Testing Setup - KKM Smart Vote (koperasi-vote)

## ✅ Status: Siap untuk Testing

Project sudah di-copy ke `F:\laragon\www\koperasi-vote` dengan:
- ✅ Semua source files (backend + frontend)
- ✅ npm dependencies (96 packages)
- ✅ Composer dependencies (Laravel + JWT)
- ✅ .env files configured untuk Laragon
- ✅ Scripts untuk sync otomatis

---

## 🔧 Setup Steps (1-5 minutes)

### **Step 1: Start Laragon**
```powershell
# Open Laragon aplikasi
# Click "Start All" button (atau double-click Laragon tray icon)

# Tunggu sampai semua services hijau:
# ✅ Apache (atau Nginx)
# ✅ MySQL
# ✅ PHP
```

### **Step 2: Jalankan Setup Script (Run as Administrator)**

```powershell
# Open PowerShell as Administrator
# Navigate ke project folder
cd "e:\Portfolio Nandur\folioflix-personal-portfolio-html-template-2023-11-27-05-37-14-utc\folioflix"

# Run setup script
.\scripts\setup-laragon-koperasi.ps1

# Script akan:
# ✅ Add 127.0.0.1 koperasi-vote.local ke hosts file
# ✅ Create Laragon vhost configuration
# ✅ Create database: koperasi_vote
```

### **Step 3: Restart Laragon**

```powershell
# Di Laragon aplikasi:
# 1. Click "Stop All"
# 2. Wait 3-5 detik
# 3. Click "Start All" lagi

# Atau gunakan Laragon menu: Tools > Restart Apache (atau Nginx)
```

### **Step 4: Run Database Migrations**

```powershell
cd "f:\laragon\www\koperasi-vote\backend"

# Install dependencies (jika belum)
composer install

# Run migrations
php artisan migrate

# Output harus menunjukkan:
# Migrating: 20XX_XX_XX_XXXXXX_create_users_table
# Migrated: 20XX_XX_XX_XXXXXX_create_users_table [OK]
# ... dst
```

### **Step 5: Test Backend API**

```powershell
# Opsi 1: Development server
cd "f:\laragon\www\koperasi-vote\backend"
php artisan serve

# Opsi 2: Via Laragon Apache/Nginx
# Just access via browser
```

Buka di browser:
```
http://koperasi-vote.local/api/test
```

Expect respons: `{"status":"success","message":"API is working"}`

---

## 🎨 Frontend Testing

### **Start Dev Server**

```powershell
cd "e:\Portfolio Nandur\folioflix-personal-portfolio-html-template-2023-11-27-05-37-14-utc\folioflix\web\kkmsmartvote\frontend"

# Install deps (jika belum)
npm install

# Start Vite dev server
npm run dev

# Output:
#   VITE v5.x.x  ready in XXX ms
#   ➜  Local:   http://localhost:5173/
```

Buka di browser: `http://localhost:5173`

### **Build untuk Production**

```powershell
npm run build

# Output: dist folder ready
```

---

## 🔄 Workflow: Editing Code

### **Scenario 1: Backend changes**

```powershell
# 1. Edit file di sini:
# e:\...\folioflix\web\kkmsmartvote\backend\app\Http\Controllers\...

# 2. Sync ke Laragon:
.\scripts\sync-to-laragon.ps1

# 3. Test di Laragon:
# http://koperasi-vote.local/api/test
```

### **Scenario 2: Frontend changes**

```powershell
# 1. Edit file di sini:
# web\kkmsmartvote\frontend\src\pages\...

# 2. Dev server sudah auto-refresh
# (No need to sync, dev server watches files)

# 3. Untuk production:
npm run build
.\scripts\sync-to-laragon.ps1
```

### **Scenario 3: Watch for changes (Auto-sync)**

```powershell
# Terminal 1: Sync dengan watch mode
.\scripts\sync-to-laragon.ps1 -Watch

# Terminal 2: Run Laragon + Dev server
cd .\web\kkmsmartvote\backend && php artisan serve

# Setiap kali save → auto-sync ke Laragon!
```

---

## 🗄️ Database Management

### **Access Database**

```powershell
# Via Laragon GUI:
# 1. Click "Database" → "MySQL Admin"
# 2. Login: root / (no password)
# 3. Select database: koperasi_vote

# Via command line:
mysql -u root

# Show databases
SHOW DATABASES;

# Select database
USE koperasi_vote;

# Show tables
SHOW TABLES;

# Exit
EXIT;
```

### **Reset Database**

```powershell
cd "f:\laragon\www\koperasi-vote\backend"

# Drop & recreate
php artisan migrate:refresh

# Dengan seeding (jika ada)
php artisan migrate:refresh --seed
```

---

## 🧪 Testing Features

### **Test User Credentials**

Dari `.env` backup, default users:
- **Admin**: username=`admin`, password=`admin123`
- **Panitia**: username=`panitia1`, password=`panitia123`
- **Member**: (created via database)

### **API Endpoints to Test**

```bash
# Test health
curl http://koperasi-vote.local/api/test

# Login
curl -X POST http://koperasi-vote.local/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get candidates
curl http://koperasi-vote.local/api/candidates

# Get votes
curl http://koperasi-vote.local/api/votes
```

---

## 📊 Laragon Folder Structure

```
F:\laragon\www\koperasi-vote\
├── backend/                    # Laravel API
│   ├── app/
│   ├── config/
│   ├── database/migrations/
│   ├── public/index.php
│   ├── routes/api.php
│   ├── .env                    # ⚠️ Local config (not in git)
│   ├── vendor/                 # ⚠️ Dependencies
│   └── ..
├── frontend/                   # Vite + React/Vue
│   ├── src/
│   ├── dist/                   # Build output
│   ├── package.json
│   ├── vite.config.ts
│   ├── node_modules/           # ⚠️ Dependencies
│   └── ..
├── public/                     # Static files
├── README.md
├── docker-compose.yml
└── ..
```

---

## 🔗 Quick Links

| Component | URL |
|-----------|-----|
| Backend API | http://koperasi-vote.local/api/test |
| Backend Health | http://koperasi-vote.local/api/health |
| Frontend Dev | http://localhost:5173 |
| Frontend Prod | http://koperasi-vote.local (after build) |
| Database Admin | Via Laragon GUI → Database → MySQL Admin |
| Laravel Logs | f:\laragon\www\koperasi-vote\backend\storage\logs\ |

---

## 🐛 Troubleshooting

### **"Connection refused" for koperasi-vote.local**

```powershell
# 1. Check hosts file
cat C:\Windows\System32\drivers\etc\hosts | findstr "koperasi-vote"

# 2. Check Laragon service
# Should see: Apache/Nginx, MySQL running (green)

# 3. Restart Laragon:
# Click Stop All → Wait → Start All

# 4. Test connection
ping koperasi-vote.local
nslookup koperasi-vote.local
```

### **"Database does not exist"**

```powershell
# 1. Check if database created
mysql -u root -e "SHOW DATABASES LIKE 'koperasi_vote';"

# 2. If not, create manually
mysql -u root -e "CREATE DATABASE koperasi_vote CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 3. Run migrations
cd f:\laragon\www\koperasi-vote\backend
php artisan migrate
```

### **"Permission denied" for .env or vendor**

```powershell
# Change folder ownership (if needed)
icacls "f:\laragon\www\koperasi-vote" /grant Users:(F) /T

# Or just move folder:
robocopy "f:\laragon\www\koperasi-vote" "f:\laragon\www\koperasi-vote-backup" /E
rmdir "f:\laragon\www\koperasi-vote"
.\scripts\sync-to-laragon.ps1 -Full
```

### **npm/composer install fails**

```powershell
# Clear cache
npm cache clean --force
composer clear-cache

# Reinstall
npm install -g npm@latest
composer install --no-cache
```

---

## 📝 Notes

- **Local .env**: Not in git (in .gitignore). Keep `DATABASE`, `JWT_SECRET`, etc.
- **Dependencies**: `node_modules/` & `vendor/` excluded from git
- **Sync Script**: `.sync-to-laragon.ps1` copies changes BUT excludes deps + .env
- **For Production**: Always use Docker on server instead of local Laragon

---

## ✨ Next Steps

1. ✅ Complete setup above
2. Test all features locally
3. Commit app changes: `git add . && git commit -m "Feature: ..."`
4. Push: `git push origin feature/kkmsmartvote-domain-2026`
5. Deploy to server: merge to `prod` → server pulls & deploys

---

**Questions?** Check copilot-instructions.md for full architecture docs.
