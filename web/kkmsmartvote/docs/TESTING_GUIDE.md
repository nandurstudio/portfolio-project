# KKM Smart Vote - Laragon Testing Guide

## Step 1: Prepare Backend Directory

```powershell
# Navigate to laragon kkmsmartvote
cd f:\laragon\www\koperasi-vote\backend

# Or if you prefer the portfolio repo:
cd E:\Portfolio Nandur\folioflix\web\kkmsmartvote\backend
```

## Step 2: Setup Environment (.env)

Create `.env` file with database credentials:

```env
APP_NAME="KKM Smart Vote"
APP_ENV=local
APP_KEY=base64:YOUR_APP_KEY_HERE
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=kkmsmartvote
DB_USERNAME=root
DB_PASSWORD=

MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_mailtrap_username
MAIL_PASSWORD=your_mailtrap_password
MAIL_FROM_ADDRESS=voting@kkmsmartvote.web.id
MAIL_FROM_NAME="KKM Smart Vote"
```

## Step 3: Generate App Key

```powershell
php artisan key:generate
```

## Step 4: Run Migrations

```powershell
# Fresh migration (useful for development)
php artisan migrate:fresh

# OR regular migrate
php artisan migrate
```

## Step 5: Seed Database

```powershell
php artisan db:seed --class=DatabaseSeeder

# Or seed individual seeders:
php artisan db:seed --class=SiteSeeder
php artisan db:seed --class=DepartmentSeeder
php artisan db:seed --class=UserSeeder
php artisan db:seed --class=ElectionSettingSeeder
php artisan db:seed --class=CandidateSeeder
php artisan db:seed --class=MemberSeeder
```

## Step 6: Start Dev Server

```powershell
# Terminal 1: Start Laravel backend
php artisan serve --host=localhost --port=8000

# Terminal 2: Start frontend (from frontend directory)
cd ..\frontend
npm run dev
```

Expected output:
```
Laravel development server started: http://localhost:8000
Frontend running at http://localhost:5173
```

## Step 7: Quick API Tests

### Health Check
```powershell
curl -X GET http://localhost:8000/api/test
```

Expected response:
```json
{"success": true, "message": "API is working"}
```

### Get Current Election
```powershell
curl -X GET http://localhost:8000/api/election/current
```

### Get All Candidates
```powershell
curl -X GET http://localhost:8000/api/voting/candidates-with-details
```

### Request OTP
```powershell
$body = @{email="test@example.com"} | ConvertTo-Json
curl -X POST http://localhost:8000/api/voting/request-otp `
  -H "Content-Type: application/json" `
  -d $body
```

### Get Voting Progress Stats
```powershell
curl -X GET http://localhost:8000/api/stats/voting-progress
```

## Step 8: Access Frontend

Open browser:
```
http://localhost:5173
```

Then follow voting flow:
1. Enter email (e.g., test@example.com)
2. Verify OTP (check console or test email)
3. Enter NIK (e.g., 1001000001)
4. Select candidate
5. Get voucher

## Troubleshooting

### Database Connection Error
```powershell
# Check if MySQL is running in Laragon
# Start MySQL via Laragon control panel

# Or test connection:
php artisan tinker
DB::connection()->getPdo()
```

### Migration Errors
```powershell
# Rollback and retry
php artisan migrate:rollback
php artisan migrate:fresh --seed
```

### Port Already in Use
```powershell
# Use different port
php artisan serve --port=8001

# Or kill process using port 8000
Get-NetTCPConnection -LocalPort 8000 | Stop-Process -Force
```

### Clear cached files
```powershell
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## Testing Test Data

Test accounts created:
- Admin: admin@kkmsmartvote.web.id / admin123
- Panitia: panitia1@kkmsmartvote.web.id / panitia123
- Saksi: saksi1@kkmsmartvote.web.id / saksi123

Test member NIKs:
- 1001000001 (Bambang Sutrisno - Management)
- 1001000002 (Eka Prasetya - Management)
- 2001000001 (Yadi Gunawan - Sales Bandung)
- 3001000001 (Indra Kusuma - Sales Surabaya)

## API Endpoints to Test

### PUBLIC (No Auth)
- GET /api/test
- POST /api/voting/request-otp
- POST /api/voting/verify-otp
- GET /api/voting/member-lookup/{nik}
- GET /api/voting/candidates-with-details
- GET /api/voting/election-status
- GET /api/stats/voting-progress
- GET /api/stats/candidate-votes
- GET /api/stats/department-breakdown

### PROTECTED (Requires voting_token in Authorization header)
- POST /api/voting/submit
- GET /api/user
- POST /api/logout

### ADMIN ONLY (Requires auth:api)
- GET /api/election/current
- POST /api/election/start
- POST /api/election/close
- PUT /api/election/update
- GET /api/candidates
- POST /api/candidates
- PUT /api/candidates/{id}
- DELETE /api/candidates/{id}
- POST /api/candidates/{id}/upload-photo
- GET /api/admin/voucher/redeem
- GET /api/admin/voucher/verify/{code}
- GET /api/admin/voucher/stats
- GET /api/admin/voucher/list
