# KKM Smart Vote - Testing Workflow Guide (Phase 1I)

**Status:** ✅ Ready for Laragon Testing
**Date:** April 6, 2026
**Target Environment:** Laragon (Windows with PHP-FPM, MySQL)

---

## 📋 Quick Start (5 Minutes)

### Option 1: PowerShell (Windows - Recommended)

```powershell
# 1. Navigate to project
cd "E:\Portfolio Nandur\folioflix\web\kkmsmartvote"

# 2. Run full setup
.\test-kkmsmartvote.ps1 -Action setup
.\test-kkmsmartvote.ps1 -Action migrate
.\test-kkmsmartvote.ps1 -Action seed

# 3. Start backend server (Terminal 1)
.\test-kkmsmartvote.ps1 -Action serve -Port 8000

# 4. Test endpoints (Terminal 2)
.\test-kkmsmartvote.ps1 -Action test-all
```

### Option 2: Bash (WSL/Linux)

```bash
# 1. Navigate to project
cd web/kkmsmartvote

# 2. Make script executable
chmod +x test-kkmsmartvote.sh

# 3. Run full setup
./test-kkmsmartvote.sh setup
./test-kkmsmartvote.sh migrate
./test-kkmsmartvote.sh seed

# 4. Start server
./test-kkmsmartvote.sh serve

# 5. Test endpoints (in another terminal)
./test-kkmsmartvote.sh test-all
```

---

## 🔧 Detailed Setup Guide

### Step 1: Environment Prerequisites

**Required Software (in Laragon):**
- ✅ PHP 8.1+ (with extensions: openssl, pdo, pdo_mysql, json, mbstring, fileinfo)
- ✅ MySQL 8.0+ (running in Laragon)
- ✅ Composer (available in Laragon)
- ✅ Node.js + npm (for frontend testing)

**Check Prerequisites:**

```powershell
# PowerShell
php -v                    # Should show PHP version
mysqld --version         # Should show MySQL version
composer --version       # Should show Composer version
npm --version           # Should show Node.js version
```

### Step 2: Database Setup (Manual if using Laragon)

**Create MySQL Database:**

```sql
-- Connect to MySQL in Laragon
-- Use MySQL console or phpMyAdmin at http://localhost/phpmyadmin

CREATE DATABASE kkmsmartvote CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'kkmsmartvote'@'localhost' IDENTIFIED BY 'kkmsmartvote_password';
GRANT ALL PRIVILEGES ON kkmsmartvote.* TO 'kkmsmartvote'@'localhost';
FLUSH PRIVILEGES;

-- Or simpler (use root without password)
CREATE DATABASE kkmsmartvote CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 3: Backend Setup

**Option A: Using Script (Recommended)**

```powershell
cd backend
.\..\..\test-kkmsmartvote.ps1 -Action setup -BackendPath .
```

**Option B: Manual Setup**

```powershell
cd backend

# 1. Copy environment file
cp .env.example .env

# 2. Edit .env with database credentials
# Search for DB_ section and set:
# DB_HOST=127.0.0.1
# DB_DATABASE=kkmsmartvote
# DB_USERNAME=root
# DB_PASSWORD=

# 3. Generate app key
php artisan key:generate

# 4. Install dependencies
composer install --no-dev
```

### Step 4: Database Migrations

**Run Migrations:**

```powershell
# Using script
.\test-kkmsmartvote.ps1 -Action migrate

# Or manually
php artisan migrate:fresh --seed --force

# Or step by step
php artisan migrate:fresh --force          # Create tables
php artisan db:seed --force               # Populate test data
```

**Expected Output:**

```
Migration: 2024_01_01_000000_create_users_table
Migration: 2024_01_01_000001_create_members_table
Migration: 2024_01_01_000002_create_candidates_table
...
✅ Seeded SiteSeeder
✅ Seeded DepartmentSeeder
✅ Seeded UserSeeder
✅ Seeded ElectionSettingSeeder
✅ Seeded CandidateSeeder
✅ Seeded MemberSeeder
```

---

## 🚀 Running Servers

### Backend Server

**Start Laravel Development Server:**

```powershell
# Terminal 1 - Backend
cd backend
php artisan serve --host=localhost --port=8000

# Expected output:
# Laravel development server started on http://localhost:8000
```

**OR using script:**

```powershell
.\test-kkmsmartvote.ps1 -Action serve -Port 8000
```

### Frontend Server

**Start React Development Server (in another terminal):**

```powershell
# Terminal 2 - Frontend
cd frontend
npm install              # First time only
npm run dev

# Expected output:
# ✓ built in 2.34s
# ➜  Local:   http://localhost:5173/
```

### Both Servers Together

**For parallel development:**
- Terminal 1: Backend on `http://localhost:8000`
- Terminal 2: Frontend on `http://localhost:5173`
- Frontend proxies API calls to backend (configured in `vite.config.ts`)

---

## ✅ Testing API Endpoints

### 1. Health Check

```powershell
# PowerShell
Invoke-WebRequest -Uri "http://localhost:8000/api/test" -Method GET | ConvertFrom-Json

# Bash
curl http://localhost:8000/api/test | jq

# Expected Response:
# {
#   "success": true,
#   "message": "API is working",
#   "data": null
# }
```

### 2. Election Status

```powershell
# Get current election
Invoke-WebRequest -Uri "http://localhost:8000/api/election/current" | ConvertFrom-Json

# Expected Response:
# {
#   "success": true,
#   "data": {
#     "id": 1,
#     "election_name": "KKM 2026",
#     "election_status": "DRAFT",
#     "voting_method": "50_PLUS_1",
#     "threshold_percentage": 50
#   }
# }
```

### 3. Candidates List

```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/voting/candidates-with-details" | ConvertFrom-Json

# Expected Response:
# {
#   "success": true,
#   "data": [
#     {
#       "id": 1,
#       "order_display": 1,
#       "name": "Drs. Agus Supriadi, MBA",
#       "position": "Chairman",
#       "vision": "...",
#       "mission": "...",
#       "vote_count": 0
#     },
#     ...
#   ]
# }
```

### 4. Voting Progress Stats

```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/stats/voting-progress" | ConvertFrom-Json

# Expected Response:
# {
#   "success": true,
#   "data": {
#     "total_members": 40,
#     "voted_count": 0,
#     "participation_percentage": 0.0,
#     "by_site": {
#       "Jakarta": { "total": 15, "voted": 0 },
#       "Bandung": { "total": 13, "voted": 0 },
#       "Surabaya": { "total": 12, "voted": 0 }
#     }
#   }
# }
```

### 5. OTP Voting Flow (Complete Test)

**Step 1: Request OTP**

```powershell
$body = @{email="test@example.com"} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8000/api/voting/request-otp" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body

# Expected Response:
# {
#   "success": true,
#   "message": "OTP sent to test@example.com",
#   "data": {
#     "masked_email": "te***@example.com",
#     "expires_in": 900
#   }
# }
```

**Step 2: Verify OTP (Use `000000` for dev)**

```powershell
$body = @{
    email="test@example.com"
    otp_code="000000"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8000/api/voting/verify-otp" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body

# Expected Response:
# {
#   "success": true,
#   "message": "OTP verified",
#   "data": {
#     "voting_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
#     "expires_in": 3600
#   }
# }

# Save the voting_token for next step
$votingToken = $response.data.voting_token
```

**Step 3: Lookup Member (Layer 2)**

```powershell
$nik = "1001000001"  # Test NIK from MemberSeeder

$response = Invoke-WebRequest -Uri "http://localhost:8000/api/voting/member-lookup/$nik" `
    -Headers @{"Authorization"="Bearer $votingToken"}

# Expected Response:
# {
#   "success": true,
#   "data": {
#     "nik": "1001000001",
#     "name": "Test Member 1",
#     "email": "test.member.1@example.com",
#     "is_eligible": true,
#     "has_voted": false,
#     "department": {
#       "id": 1,
#       "name": "MANAGEMENT"
#     },
#     "site": {
#       "id": 1,
#       "name": "HEAD_OFFICE"
#     }
#   }
# }
```

**Step 4: Submit Vote**

```powershell
$body = @{
    member_nik="1001000001"
    candidate_id=1
    site_id=1
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8000/api/voting/submit" `
    -Method POST `
    -Headers @{
        "Content-Type"="application/json"
        "Authorization"="Bearer $votingToken"
    } `
    -Body $body

# Expected Response:
# {
#   "success": true,
#   "message": "Vote submitted successfully",
#   "data": {
#     "vote_id": 1,
#     "voucher_code": "VCH-2026-XXX-XXXX-XXXXXX",
#     "voucher_status": "GENERATED",
#     "candidate_name": "Drs. Agus Supriadi, MBA"
#   }
# }
```

---

## 📊 Test Data Reference

### Test Sites
```
ID=1, Code=HEAD_OFFICE,  Name=Kantor Pusat (Jakarta)
ID=2, Code=BRANCH_BDG,   Name=Cabang Bandung
ID=3, Code=BRANCH_SBY,   Name=Cabang Surabaya
```

### Test Departments
```
MANAGEMENT, FINANCE, OPERATIONS, HR (Jakarta)
SALES_BDG, CUSTOMER_BDG (Bandung)
SALES_SBY, LOGISTICS_SBY (Surabaya)
```

### Test Candidates
```
ID=1: Drs. Agus Supriadi, MBA (order_display=1)
ID=2: Ir. Sri Wahyuni, M.M. (order_display=2)
ID=3: Dr. Muhammad Rizki Pratama (order_display=3)
```

### Test Members (40 total)
```
NIK Pattern:
- 1001000001 to 1001000005 (5 members, HQ/MANAGEMENT)
- 1002000001 to 1002000005 (5 members, HQ/FINANCE)
- ... (5 per department)
- 3008000001 to 3008000005 (5 members, Surabaya/LOGISTICS)

All test members:
- is_eligible = true
- has_voted = false
- email = {nik}@example.com
```

### Test Admin Users
```
Email                  | Password | Role
admin@example.com      | password | ADMIN
panitia1@example.com   | password | PANITIA
panitia2@example.com   | password | PANITIA
saksi@example.com      | password | SAKSI
```

### Test Elections
```
ID=1: 2026 Election (DRAFT status)
      - Voting method: 50_PLUS_1
      - Threshold: 50%
      - Scheduled: Tomorrow → In 7 days

ID=2: 2029 Election (Future)
```

---

## 🐛 Troubleshooting

### Issue 1: "Connection Refused" on Port 8000
**Symptom:** `Connection refused` when accessing http://localhost:8000

**Causes & Solutions:**
```
1. Backend server not running
   ✓ Run: php artisan serve --port=8000

2. Port 8000 already in use
   ✓ Use different port: php artisan serve --port=8001
   ✓ Find process: netstat -ano | findstr :8000
   ✓ Kill process: taskkill /PID <PID> /F

3. Firewall blocking
   ✓ Check Windows Defender Firewall settings
   ✓ Allow PHP in firewall rules
```

### Issue 2: "Database Connection Refused"
**Symptom:** `SQLSTATE[HY000]: General error: 1030 Got error...`

**Causes & Solutions:**
```
1. MySQL not running in Laragon
   ✓ Start Laragon MySQL: Click "Start All" in Laragon panel
   ✓ Verify: mysql -u root (should connect)

2. Wrong credentials in .env
   ✓ Check .env DB_* settings match Laragon defaults:
     DB_HOST=127.0.0.1
     DB_DATABASE=kkmsmartvote
     DB_USERNAME=root
     DB_PASSWORD= (empty for Laragon)

3. Database doesn't exist
   ✓ Create manually: CREATE DATABASE kkmsmartvote;
   ✓ Or run: php artisan migrate:fresh --force
```

### Issue 3: "Table Doesn't Exist"
**Symptom:** `Base table or view not found: 1146 Table 'kkmsmartvote.members' doesn't exist`

**Causes & Solutions:**
```
1. Migrations not run
   ✓ Run: php artisan migrate

2. Partial migration
   ✓ Check: php artisan migrate:status
   ✓ Reset: php artisan migrate:fresh --force

3. Cache issues
   ✓ Clear cache: php artisan cache:clear
   ✓ Clear config: php artisan config:clear
```

### Issue 4: "SQLSTATE[HY000]: General error: 2006"
**Symptom:** MySQL server has gone away

**Causes & Solutions:**
```
1. MySQL connection timeout
   ✓ Check MySQL is still running
   ✓ Use shorter timeout or reconnect

2. Large query
   ✓ Increase max_allowed_packet in my.ini
   ✓ Or break query into smaller parts
```

### Issue 5: "Laravel key not set"
**Symptom:** `RuntimeException: No application encryption key has been specified`

**Causes & Solutions:**
```
1. APP_KEY not generated
   ✓ Run: php artisan key:generate

2. .env not loaded
   ✓ Check .env file exists in backend/
   ✓ Restart server after generating key
```

### Issue 6: "npm ERR! code ERESOLVE" on Frontend
**Symptom:** Can't install frontend dependencies

**Causes & Solutions:**
```
1. Node version mismatch
   ✓ Node 16+: npm install --legacy-peer-deps
   ✓ Clear cache: npm cache clean --force

2. Corrupted node_modules
   ✓ Delete: rm -rf node_modules package-lock.json
   ✓ Reinstall: npm install
```

### Issue 7: "CORS Error" - Frontend can't reach Backend
**Symptom:** `Access to XMLHttpRequest blocked by CORS policy`

**Causes & Solutions:**
```
1. Backend CORS not configured
   ✓ Check: config/cors.php allows localhost:5173
   ✓ Restart backend after fixing

2. Frontend proxy not working
   ✓ Check vite.config.ts has correct proxy
   ✓ Proxy target: http://localhost:8000/api
```

### Issue 8: OTP Code Always Shows as Expired
**Symptom:** "OTP has expired" even immediately after requesting

**Causes & Solutions:**
```
1. Server time mismatch
   ✓ Sync system clock
   ✓ Check database server time

2. Timezone issues
   ✓ Set in .env: APP_TIMEZONE=Asia/Jakarta
   ✓ Restart server
```

### Issue 9: "No Space Left on Device"
**Symptom:** General error: 1030 Got error

**Causes & Solutions:**
```
1. Disk full
   ✓ Check disk space: dir C:\ | grep -E ^
   ✓ Clean temp files: del %temp%\*

2. MySQL temporary disk full
   ✓ Check datadir in MySQL
   ✓ Increase disk space or clean old temp files
```

### Issue 10: Script Won't Execute (Permission Denied)

**Causes & Solutions (PowerShell):**
```powershell
1. Execution policy blocked
   ✓ Check: Get-ExecutionPolicy
   ✓ Fix: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

2. Script signed incorrectly
   ✓ Unblock: Unblock-File -Path .\test-kkmsmartvote.ps1
```

**Causes & Solutions (Bash):**
```bash
1. Script not executable
   ✓ Fix: chmod +x test-kkmsmartvote.sh
   ✓ Run: ./test-kkmsmartvote.sh
```

---

## 📈 Performance Baseline

**Expected Response Times (First Run):**
- `GET /api/test` → ~50ms (simple health check)
- `GET /api/election/current` → ~100ms (single query)
- `GET /api/voting/candidates-with-details` → ~150ms (3 candidates)
- `POST /api/voting/request-otp` → ~200ms (mail send)
- `GET /api/stats/voting-progress` → ~250ms (aggregate query)

**Database Sizes (After Seeding):**
- Sites: 3 rows
- Departments: 8 rows
- Candidates: 3 rows
- Members: 40 rows
- Users: 4 rows
- Total database: ~2 MB

---

## 🎯 Next Steps

### Phase 2: Frontend Testing
- Visit `http://localhost:5173` in browser
- Test complete voting flow (OTP → NIK → Vote → Voucher)
- Verify timer countdown (15 minutes for OTP expiry)
- Test error scenarios (invalid OTP, invalid NIK, etc)

### Phase 3: Admin Panel
- Login as admin@example.com (pending implementation)
- Create new candidates
- Manage election settings
- View voting statistics in real-time

### Phase 4: Production Deployment
- Push to production server
- Run migrations on production MySQL
- Update nginx configuration
- Test all endpoints on production domain

---

## 📝 Quick Reference Commands

```powershell
# PowerShell Quick Commands
.\test-kkmsmartvote.ps1 -Action setup      # Full setup
.\test-kkmsmartvote.ps1 -Action migrate    # Fresh migrations
.\test-kkmsmartvote.ps1 -Action seed       # Seed test data
.\test-kkmsmartvote.ps1 -Action serve      # Start server
.\test-kkmsmartvote.ps1 -Action test-all   # Run all tests
.\test-kkmsmartvote.ps1 -Action clean      # Clear cache
```

```bash
# Bash Quick Commands
./test-kkmsmartvote.sh setup               # Full setup
./test-kkmsmartvote.sh migrate             # Fresh migrations
./test-kkmsmartvote.sh seed                # Seed test data
./test-kkmsmartvote.sh serve               # Start server
./test-kkmsmartvote.sh test-all            # Run all tests
./test-kkmsmartvote.sh clean               # Clear cache
```

---

## ⚠️ Important Notes

### Source of Truth
✅ **Always edit in portfolio repo FIRST** (`E:\Portfolio Nandur\folioflix\web\kkmsmartvote\`)
❌ Do NOT edit directly in Laragon copy

### Git Tracking
- Portfolio repo: Full git history + tracked
- Laragon copy: Testing only, changes not tracked
- Always sync portfolio → Laragon before testing

### Credentials Security
- Test credentials are for DEVELOPMENT ONLY
- Change all passwords before production deployment
- Never commit real passwords in .env

### Database Seeding
- `migrate:fresh --seed` will reset database completely
- All previous votes/data will be lost
- Use with caution in production!

---

**Last Updated:** April 6, 2026
**Status:** ✅ Phase 1I Complete - Ready for Testing
**Next Phase:** Phase 1J - End-to-End Testing
