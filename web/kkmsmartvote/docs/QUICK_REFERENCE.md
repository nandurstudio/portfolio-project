# 🚀 KKM Smart Vote Quick Reference Card

**Printer-friendly testing cheat sheet**

---

## ⚡ 30-Second Setup

```powershell
cd E:\Portfolio Nandur\folioflix\web\kkmsmartvote

# Terminal 1: Setup & Run Migrations
.\test-kkmsmartvote.ps1 -Action setup
.\test-kkmsmartvote.ps1 -Action migrate
.\test-kkmsmartvote.ps1 -Action seed

# Terminal 2: Backend Server
.\test-kkmsmartvote.ps1 -Action serve

# Terminal 3: Frontend Server
cd frontend && npm run dev

# Terminal 4: Run Tests
.\test-kkmsmartvote.ps1 -Action test-all
```

---

## 🔌 API Endpoints (Quick Reference)

```
BASE URL: http://localhost:8000/api

VOTING FLOW:
1. POST /voting/request-otp
   Body: {"email":"test@example.com"}

2. POST /voting/verify-otp
   Body: {"email":"test@example.com","otp_code":"000000"}
   Get: voting_token

3. GET /voting/member-lookup/{nik}
   Header: Authorization: Bearer {voting_token}
   Use: NIK "1001000001" for testing

4. GET /voting/candidates-with-details
   Returns: 3 candidates, sorted by order_display

5. POST /voting/submit
   Body: {"member_nik":"1001000001","candidate_id":1,"site_id":1}
   Header: Authorization: Bearer {voting_token}
   Response: voucher_code (copy this!)

STATISTICS:
- GET /stats/voting-progress
- GET /stats/candidate-votes
- GET /stats/department-breakdown

ADMIN (pending token):
- POST /election/start
- POST /election/close
- POST /candidates
- GET /admin/voucher/stats
```

---

## 📊 Test Data

```
TEST OTP CODE:  000000
TEST EMAIL:     test@example.com

MEMBER NIK SAMPLES:
✓ 1001000001 (MANAGEMENT, Jakarta)
✓ 1004000001 (HR, Jakarta)
✓ 2001000001 (SALES_BDG, Bandung)
✓ 3001000001 (SALES_SBY, Surabaya)

CANDIDATES:
#1) Drs. Agus Supriadi, MBA
#2) Ir. Sri Wahyuni, M.M.
#3) Dr. Muhammad Rizki Pratama

SITES:
1 = Kantor Pusat (Jakarta)
2 = Cabang Bandung
3 = Cabang Surabaya

ADMIN USERS (TBD):
admin@example.com / password
panitia1@example.com / password
```

---

## 🧪 Common Tests

### Health Check
```powershell
curl http://localhost:8000/api/test
```

### Full OTP Flow
```powershell
# 1. Request OTP
$response = Invoke-RestMethod -Uri "http://localhost:8000/api/voting/request-otp" `
    -Method POST -Headers @{"Content-Type"="application/json"} `
    -Body '{"email":"test@example.com"}'

# 2. Verify OTP (use token from response)
$otp_response = Invoke-RestMethod -Uri "http://localhost:8000/api/voting/verify-otp" `
    -Method POST -Headers @{"Content-Type"="application/json"} `
    -Body '{"email":"test@example.com","otp_code":"000000"}'

$token = $otp_response.data.voting_token

# 3. Member Lookup
curl -H "Authorization: Bearer $token" `
    "http://localhost:8000/api/voting/member-lookup/1001000001"

# 4. Get Candidates
curl "http://localhost:8000/api/voting/candidates-with-details"

# 5. Submit Vote
Invoke-RestMethod -Uri "http://localhost:8000/api/voting/submit" `
    -Method POST -Headers @{
        "Content-Type"="application/json"
        "Authorization"="Bearer $token"
    } -Body '{"member_nik":"1001000001","candidate_id":1,"site_id":1}'
```

---

## 🌐 Frontend URLs

```
FRONTEND: http://localhost:5173

PAGES:
/ → OTP Entry (Layer 1)
/member-lookup → NIK Lookup (Layer 2)
/vote → Candidate Selection
/vote-success → Voucher Display
```

---

## 🛠️ Troubleshooting (Fast Track)

| Problem | Command | Fix |
|---------|---------|-----|
| MySQL not running | Check Laragon panel | Click "Start All" |
| Can't connect port 8000 | `netstat -ano \| findstr :8000` | Kill process, restart |
| DB table missing | `php artisan migrate:fresh --seed --force` | Rebuild DB |
| Frontend not showing | Check `vite.config.ts` proxy | Proxy → localhost:8000/api |
| OTP always "expired" | Check system time | Sync clock |
| "403 Forbidden" | Missing Bearer token | Add Auth header |
| Cache issues | `php artisan cache:clear` | Clear all caches |

---

## 📝 Workflow

```
DEVELOPMENT WORKFLOW:

1. Edit code in PORTFOLIO REPO
   E:\Portfolio Nandur\folioflix\web\kkmsmartvote\

2. Test in Laragon
   F:\laragon\www\koperasi-vote\

3. NEVER edit files directly in Laragon!
   (Changes will be lost on sync)

4. Commit to git
   git add web/kkmsmartvote/
   git commit -m "Feature: ..."

5. Deploy
   Push → Pull on server → Restart
```

---

## ⏱️ Expected Timing

```
Setup:         5 min  ✓
Migrate:       2 min  ✓
Seed:          1 min  ✓
Backend Start: 3 sec  ✓
Frontend Start: 10 sec ✓
First OTP:     200 ms ✓
Member Lookup: 100 ms ✓
Vote Submit:   150 ms ✓
Entire Flow:   <2 min ✓
```

---

## 🔑 Important Notes

⚠️ **RULE #1:** Edit portfolio repo FIRST, then sync to Laragon
⚠️ **RULE #2:** Never commit .env files with real passwords
⚠️ **RULE #3:** Always ask for approval before git commit
⚠️ **RULE #4:** Test locally before production deployment

✅ **DO:**
- Use test data provided
- Run migrations fresh for clean state
- Clear cache after code changes
- Test endpoints before committing
- Save API responses for debugging

❌ **DON'T:**
- Edit in Laragon directly
- Commit real credentials
- Use production credentials in dev
- Skip migrations (causes bugs)
- Push without testing

---

## 📞 File Locations

```
Backend:       E:\Portfolio Nandur\folioflix\web\kkmsmartvote\backend\
Frontend:      E:\Portfolio Nandur\folioflix\web\kkmsmartvote\frontend\
Public Assets: E:\Portfolio Nandur\folioflix\web\kkmsmartvote\public\

Config:
.env           → Set DB_* and JWT_SECRET
routes/api.php → API endpoints
config/cors.php → CORS settings

Code Location:
Controllers:   app\Http\Controllers\
Models:        app\Models\
Migrations:    database\migrations\
Seeders:       database\seeders\
```

---

## 🎯 Verification Checklist

After setup, verify all these work:

```
✓ PHP version: php -v
✓ MySQL running: mysql -u root
✓ Composer: composer --version
✓ Database created: SELECT * FROM information_schema.SCHEMATA;
✓ Tables migrated: php artisan migrate:status
✓ Data seeded: SELECT COUNT(*) FROM members;
✓ Backend starts: php artisan serve
✓ Frontend starts: npm run dev
✓ API responds: curl http://localhost:8000/api/test
✓ Candidates load: GET /api/voting/candidates-with-details
✓ OTP works: POST /api/voting/request-otp
✓ Vote submits: POST /api/voting/submit
✓ Voucher shows: Check vote_success page
```

---

**Print this card and keep it handy!**
**Last Updated: April 6, 2026**
