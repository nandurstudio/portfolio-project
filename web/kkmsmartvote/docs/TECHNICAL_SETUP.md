# 🔧 Email OTP Voting System - Technical Implementation Guide

**For:** Developers/DevOps
**Version:** 1.0
**Date:** April 5, 2026

---

## 📋 Quick Setup (5 minutes)

### 1. Run Database Migrations

```bash
cd backend

# Check migration status
php artisan migrate:status

# Run all pending migrations
php artisan migrate

# Output should show:
# ✓ 2024_01_01_000001_create_users_table
# ✓ 2024_01_01_000002_create_members_table
# ...
# ✓ 2024_04_05_000006_add_email_to_members_and_create_email_otps
```

### 2. Configure Email Service

**File:** `.env` (backend directory)

```bash
# Option A: Gmail (Free, Recommended for testing)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your.email@gmail.com
MAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx    # App-specific password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your.email@gmail.com
MAIL_FROM_NAME="KKM Voting 2026"
QUEUE_CONNECTION=sync  # Process emails immediately (for small scale)

# Option B: Mailgun (Better for production, 25k free emails/month)
MAIL_MAILER=mailgun
MAILGUN_SECRET=key-xxxxxxxxxxxx
MAILGUN_DOMAIN=mg.kkmsmartvote.web.id
MAIL_FROM_ADDRESS=voting@kkmsmartvote.web.id
MAIL_FROM_NAME="KKM Voting 2026"
QUEUE_CONNECTION=database
```

### 3. Test Email Configuration

```bash
# Enter Tinker shell
php artisan tinker

# Send test email
Mail::to('test@example.com')->send(new \App\Mail\VotingOtpMail(
    \App\Models\Member::first(),
    '123456'
));

# Output: true = success, Exception = error
```

### 4. Update Member Emails

```bash
# If members table already has data, add emails
php artisan db:seed --class=MemberEmailSeeder

# Or manually in Excel:
# - Column: NIK, name, email
# - Import via member import endpoint
```

---

## 📊 Database Schema

### New/Modified Tables

```sql
-- Members table (modified)
ALTER TABLE members ADD COLUMN (
    email VARCHAR(255) NULLABLE AFTER name,
    INDEX(email)
);

-- Email OTPs table (new)
CREATE TABLE email_otps (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    member_id BIGINT NULLABLE,
    otp_code VARCHAR(255) NOT NULL,           -- Hashed
    is_used BOOLEAN DEFAULT false,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,             -- +15 minutes
    verified_at TIMESTAMP NULLABLE,
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL,
    INDEX(email),
    INDEX(member_id),
    INDEX(expires_at)
);
```

### Sample Data

```sql
-- Add test member with email
INSERT INTO members (nik, name, email, site, is_eligible)
VALUES ('123456789', 'John Doe', 'john@example.com', 'Site A', true);

-- Verify
SELECT id, nik, name, email FROM members WHERE email IS NOT NULL LIMIT 5;
```

---

## 🔌 API Endpoints

### 1. Request OTP

**Endpoint:** `POST /api/voting/request-otp`

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response (Success - 200):**
```json
{
  "message": "OTP sent to your email",
  "masked_email": "joh***@example.com",
  "expires_in": 900,
  "otp_id": 123
}
```

**Response (Error - 404):**
```json
{
  "error": "Email not found"
}
```

**Response (Rate Limited - 429):**
```json
{
  "error": "Too many OTP requests. Please try again in 10 minutes.",
  "retry_after": 45
}
```

### 2. Verify OTP

**Endpoint:** `POST /api/voting/verify-otp`

**Request:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response (Success - 200):**
```json
{
  "message": "OTP verified. You can now vote.",
  "voting_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "member": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "expires_in": 1800
}
```

**Response (Wrong OTP - 401):**
```json
{
  "error": "Invalid OTP",
  "attempts_left": 2
}
```

### 3. Cast Vote

**Endpoint:** `POST /api/voting/cast-vote`

**Headers:**
```
Authorization: Bearer [voting_token]
Content-Type: application/json
```

**Request:**
```json
{
  "candidate_id": 1,
  "nik": "123456789"  // Optional, for audit trail
}
```

**Response:**
```json
{
  "message": "Vote recorded",
  "vote_id": 999,
  "timestamp": "2026-04-10T10:30:00Z"
}
```

---

## 🔐 Rate Limiting

Built-in protection against abuse:

```php
// In VotingController.php

// OTP Request: Max 3 per email per 10 minutes
$rateLimitKey = 'otp-request:' . $email;
RateLimiter::tooManyAttempts($rateLimitKey, 3) ? throw : RateLimiter::hit($rateLimitKey, 600);

// OTP Verify: Max 5 attempts per email per 10 minutes
$rateLimitKey = 'otp-verify:' . $email;
RateLimiter::tooManyAttempts($rateLimitKey, 5) ? throw : RateLimiter::hit($rateLimitKey, 600);
```

**Custom Rate Limits (if needed):**

```php
// .env
RATE_LIMIT_OTP_REQUEST_PER_EMAIL=3
RATE_LIMIT_OTP_REQUEST_WINDOW=600  // seconds
RATE_LIMIT_OTP_VERIFY_PER_EMAIL=5
RATE_LIMIT_OTP_VERIFY_WINDOW=600
```

---

##🚀 Deployment Checklist

### Pre-Production

```
□ Database migration tested on staging
□ Email service tested (test email sent successfully)
□ API endpoints tested (Postman/curl)
□ Frontend pages tested (all browsers)
□ Load test: 100 concurrent users
□ Security audit: No logs with sensitive data
□ Backup: Database backup created
□ Rollback plan: Keep previous version ready
```

### Production Deployment

```bash
# 1. SSH to server
ssh deployment@kkmsmartvote.web.id

# 2. Pull latest code
cd /var/www/kkmsmartvote
git pull origin main

# 3. Install dependencies
cd backend
composer install --no-dev --optimize-autoloader

# 4. Run migrations
php artisan migrate --force

# 5. Clear caches
php artisan optimize
php artisan cache:clear
php artisan config:cache

# 6. Frontend build
cd ../frontend
npm ci
npm run build

# 7. Restart queue worker (for email)
sudo systemctl restart voting-queue

# 8. Verify
curl -X POST https://kkmsmartvote.web.id/api/voting/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

## 📈 Monitoring & Debugging

### Monitor OTP Volume

```bash
# Watch OTP requests in real-time
php artisan tinker
DB::table('email_otps')->where('created_at', '>', now()->subHour())->count();

# Should be roughly 1-1.5x the number of members voting
# (some members retry if forgot OTP)
```

### Check Email Queue Status

```bash
# View failed emails
DB::table('failed_jobs')->get();

# Retry failed emails
php artisan queue:retry all

# Clear old failed jobs
DB::table('failed_jobs')->delete();
```

### Debug OTP Issues

```bash
# Check specific email
DB::table('email_otps')
  ->where('email', 'john@example.com')
  ->latest()
  ->first();

// Output:
// {
//   "id": 123,
//   "email": "john@example.com",
//   "otp_code": "$2y$10$...",  // hashed
//   "is_used": false,
//   "sent_at": "2026-04-10 10:30:00",
//   "expires_at": "2026-04-10 10:45:00",
//   "verified_at": null,
//   "attempts": 1
// }
```

### Database Optimization for 1300+ Users

```bash
# 1. Analyze tables
php artisan db:analyze members email_otps votes

# 2. Optimize tables
php artisan db:optimize members email_otps votes

# 3. Check indexes
php artisan db:show-indexes

# Should see indexes on:
# - members(email)
# - email_otps(email)
# - email_otps(member_id)
# - email_otps(expires_at)
```

---

## 🆘 Troubleshooting

### Issue: Emails Not Sending

```bash
# 1. Check SMTP config
cat .env | grep MAIL_

# 2. Check queue worker
ps aux | grep queue

# 3. Look at error log
tail -100 storage/logs/laravel.log

# 4. Test email directly
php artisan tinker
Mail::raw('Test', fn($msg) => $msg->to('test@email.com')->subject('Test'));

# 5. Check Gmail app password (if using Gmail)
# Must be 16 chars, generated from: myaccount.google.com/apppasswords
```

### Issue: OTP Expired Immediately

```bash
# Check system time
date

# If timezone wrong:
# In .env: APP_TIMEZONE=Asia/Jakarta

# In database:
ALTER TABLE email_otps MODIFY COLUMN expires_at TIMESTAMP;

# Verify expiry time calculation
php artisan tinker
now()->addMinutes(15)->toDateTimeString();
```

### Issue: Rate Limiting Too Strict

```php
// In VotingController.php
// Increase limits temporarily
RateLimiter::tooManyAttempts('otp-request:' . $email, 10) // was 3
RateLimiter::tooManyAttempts('otp-verify:' . $email, 10)  // was 5
```

### Issue: Members Cannot Find Email

```bash
# Verify members have emails
SELECT nik, name, email FROM members WHERE email IS NULL;

# If NULL, bulk update:
UPDATE members SET email = CONCAT(
  LOWER(REPLACE(name, ' ', '.')),
  '@company.com'
) WHERE email IS NULL;
```

---

## 📝 Logging & Audit

All voting activity is logged:

```sql
-- View OTP requests
SELECT email, sent_at, is_used FROM email_otps LIMIT 20;

-- View all attempts (including failed)
SELECT email, attempts, verified_at FROM email_otps
WHERE attempts > 0 OR is_used = true;

-- Audit trail (votes)
SELECT member_nik, candidate_id, created_at FROM votes LIMIT 20;
```

---

## 🔄 Rollback Procedure

If something goes wrong:

```bash
# 1. Stop the application
sudo systemctl stop voting-service

# 2. Rollback migrations
php artisan migrate:rollback --step=1

# 3. Restore previous code
git revert HEAD

# 4. Clear caches
php artisan optimize:clear

# 5. Restart
sudo systemctl start voting-service

# 6. Verify
curl https://kkmsmartvote.web.id/api/voting/request-otp
```

---

## 📞 Support

**For technical issues:** support@kkmsmartvote.web.id
**For voting issues:** panitia@kkm.or.id

---

**Happy voting! 🎉**
