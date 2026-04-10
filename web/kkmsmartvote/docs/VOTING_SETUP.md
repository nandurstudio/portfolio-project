# 🗳️ KKM Voting System Setup Guide

**Version:** 1.0
**Last Updated:** April 5, 2026
**For:** 1300+ Members Online Voting with Email OTP

---

## 📋 Table of Contents

1. [Pre-Launch Checklist](#pre-launch-checklist)
2. [Member Email Collection](#member-email-collection)
3. [Email Configuration](#email-configuration)
4. [Voting Timeline](#voting-timeline)
5. [Admin Guide](#admin-guide)
6. [Member Guide](#member-guide)
7. [Troubleshooting](#troubleshooting)

---

## ✅ Pre-Launch Checklist

Before voting goes live, ensure:

```
□ Database migration run: php artisan migrate
□ All 1300+ members have emails in system
□ Email service configured (Gmail SMTP or Mailgun)
□ Test OTP email sent successfully
□ Candidates list uploaded & verified
□ Admin accounts created
□ Voting start/end times set
□ Browser testing done (Chrome, Firefox, Safari, Mobile)
□ Load testing for 1300 concurrent users
□ Backup of member list created
□ Communication sent to all members
```

---

## 📧 Member Email Collection

### Option A: Import via Excel (Recommended for Large Numbers)

**Template (members.xlsx):**
```
NIK              | Name              | Email
123456789        | John Doe          | john.doe@email.com
987654321        | Jane Smith        | jane.smith@email.com
111222333        | Bob Wilson        | bob.wilson@email.com
```

**Import Process:**
```bash
# Option 1: Manual via admin panel
- Go to: Admin › Members › Import
- Upload members.xlsx
- System validates emails
- Confirmation before save

# Option 2: Command line
php artisan import:members members.xlsx
```

### Option B: Direct Database Update

```sql
-- If you already have members, add emails manually
UPDATE members
SET email = CONCAT(
    LOWER(SUBSTRING_INDEX(name, ' ', 1)),
    '.',
    LOWER(SUBSTRING_INDEX(name, ' ', -1)),
    '@company.com'
)
WHERE email IS NULL;

-- Verify
SELECT id, name, email FROM members WHERE email IS NULL;
```

### Option C: Bulk Email Validation

```bash
# Use PHP script to validate all emails
php artisan validate:member-emails

# Output:
# ✅ 1250 valid emails
# ⚠️  50 members missing emails
# 🔴 Please add emails for: NIK xxx, xxx, ...
```

---

## 📧 Email Configuration

### Using Gmail SMTP (Free)

**.env file:**
```
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password    # NOT regular password!
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-email@gmail.com
MAIL_FROM_NAME="KKM Voting 2026"
```

**Get Gmail App Password:**
1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer"
3. Copy generated 16-char password
4. Use in MAIL_PASSWORD

### Using Mailgun (25k free emails/month)

```
MAIL_MAILER=mailgun
MAILGUN_SECRET=key-xxx
MAILGUN_DOMAIN=mg.example.com
MAIL_FROM_ADDRESS=voting@example.com
MAIL_FROM_NAME="KKM Voting 2026"
```

### Test Email Configuration

```bash
# Send test email
php artisan tinker
Mail::raw('Test email', function($msg) {
    $msg->to('test@example.com')->subject('Test');
});

# Check queued jobs (if using async)
php artisan queue:listen

# Send all queued emails
php artisan queue:retry all
```

---

## 🕐 Voting Timeline

### Recommended Schedule

```
┌─────────────────────────────────────────┐
│  VOTING PHASE: April 10-12, 2026        │
└─────────────────────────────────────────┘

Apr 10, 08:00 AM  │ Voting starts
  ↓              │ + Email sent: "Voting has started!"
  ↓              │
  ↓ (48 hours)   │ Members request OTP & vote
  ↓              │
Apr 12, 06:00 PM │ Voting closes (cutoff)
  ↓              │
  ↓ (30 min)     │ Admin counts votes, audits
  ↓              │
Apr 12, 06:30 PM │ Results announced
```

### Setting Voting Windows

**In Admin Panel:**
```
Election Settings:
├─ Voting Start: 2026-04-10 08:00
├─ Voting End:   2026-04-12 18:00
├─ Allow OTP Requests After Close: ❌ (No)
├─ Announcement Time: 2026-04-12 18:30
└─ Candidates Count: 3
```

**In Code (.env):**
```
VOTING_STARTS_AT=2026-04-10T08:00:00
VOTING_ENDS_AT=2026-04-12T18:00:00
ELECTION_TITLE="Calon Ketua KKM 2026"
```

---

## 👨‍💼 Admin Guide

### Admin Dashboard Access

```
Login:
┌──────────────────────────────────┐
│ URL: https://kkmsmartvote.web.id │
│ › Admin Login                    │
│                                  │
│ Username: admin                  │
│ Password: (set at installation)  │
└──────────────────────────────────┘
```

### Key Admin Functions

1. **Member Management**
   - View: Voting › Members › List
   - Import: Voting › Members › Import Excel
   - Verify: Check emails are correct
   - Block: Mark ineligible if needed

2. **Candidate Management**
   - Add/Edit: Voting › Candidates
   - Upload photos (optional)
   - Set position/title
   - Make active when ready

3. **Vote Monitoring (Live)**
   ```
   Voting › Dashboard
   ├─ Total votes received: 523
   ├─ Vote breakdown by candidate:
   │  ├─ Candidate A: 185 (35%)
   │  ├─ Candidate B: 198 (38%)
   │  └─ Candidate C: 140 (27%)
   ├─ Members not yet voted: 777
   ├─ OTP requests in last hour: 45
   └─ Errors/Issues: 2
   ```

4. **Audit Log** Access
   ```
   Administration › Audit Logs
   ├─ All OTP requests (timestamp, email, result)
   ├─ All vote submissions (member, time, validity)
   ├─ Failed verification attempts
   ├─ System errors
   └─ Export as CSV/PDF
   ```

5. **Results Export**
   ```
   Voting › Results › Export
   ├─ CSV: votes_results_[date].csv
   ├─ PDF: votesummary_[date].pdf
   └─ Excel: detailed_breakdown.xlsx
   ```

### During Voting (Admin Checklist)

```
Hour 1 (Start time):
□ Verify system online
□ Test OTP request yourself
□ Monitor error logs
□ Send reminder email to members (optional)

Hour 8-24 (Ongoing):
□ Check dashboard every 2-4 hours
□ Note any spikes in errors
□ Be available for member questions
□ Help members with email/OTP issues

Last 6 hours before close:
□ Send "Voting closes soon" reminder
□ Monitor vote count increase
□ Prepare announcement message

After voting closes:
□ Export results
□ Verify vote counts
□ Announce results
□ Save audit logs for records
```

### Handling Issues

**Issue: Member says "I didn't receive OTP"**
```
Troubleshooting:
1. Check system logs: https://kkmsmartvote.web.id/admin/logs
2. Verify email in database: SELECT email FROM members WHERE nik='xxx'
3. Check email service status: Dashboard › Email Status
4. Resend OTP:
   - Admin Panel › Members › [Member] › Resend OTP
   Or
   - Member tries again (system auto-generates new OTP)
```

**Issue: "My OTP is invalid"**
```
Possible causes:
- OTP expired (valid 15 min only) → Request new one
- Typed wrong 6 digits → Try again (3 attempts max)
- Used old OTP → Request new one (old one auto-deleted)

Solution: "Request new OTP by refreshing the page"
```

**Issue: Members voting from same IP (suspicious)**
```
Check Admin › Audit Logs › Filtered by IP
- Same IP multiple votes = possible fraud
- But: office/school network = normal (many people behind NAT)

Action: Review context, ask member to verify, may invalidate if fraud
```

---

## 👥 Member Guide

### For Tech-Savvy Members (50%)

**Simple 2-Step Process:**

```
1. Visit: https://kkmsmartvote.web.id
   ↓
2. Click: "Vote Now"
   ↓
3. Enter: Your email (e.g., john@email.com)
   ↓
4. Click: "Send OTP"
   ↓ (Wait 5-10 seconds)
   ↓
5. Check email → Copy OTP code (6 digits)
   ↓
6. Paste: OTP in the website
   ↓
7. Click: "Verify"
   ↓
8. Select: Your candidate choice
   ↓
9. Click: "Vote"
   ↓
✅ Done! Your vote is recorded.
```

### For Less Tech-Savvy Members (30%)

**Same 2 steps, with help:**

If confused:
- Call/WhatsApp panitia: [contact number]
- Panitia can guide via phone/video call
- Or visit office for on-site voting help

**Common Questions:**
- Q: "Where do I find OTP?"
  A: Check your email inbox (and Spam folder)

- Q: "How long do I have to vote?"
  A: Until April 12, 2026 at 6 PM

- Q: "I forgot my email address"
  A: Check employee ID card or contact HR

- Q: "Can I vote twice?"
  A: No, system blocks after first vote

### For Offline/No-Tech Members (20%)

**On-Site Voting at Office:**

```
1. Come to KKM Office
2. Tell panitia: "I want to vote"
3. Panitia: "Name please?" → Verify in list
4. Panitia: "Email address?" → Member gives email
5. Panitia: Sends OTP to that email
6. Panitia: "Check your email on your phone"
7. Member: Shows OTP from email
8. Panitia: Enters OTP + clicks "Vote"
9. Member: Selects candidate on screen
10. Panitia: Clicks submit
✅ Voted!
```

**What panitia needs:**
- Laptop/computer with internet
- Member list printed
- Calm patience 😊

---

## 🔧 Troubleshooting

### Database Migrations

```bash
# Check if migration was run
php artisan migrate:status

# If not run
php artisan migrate

# If error, rollback & retry
php artisan migrate:rollback
php artisan migrate
```

### Email Not Sending

```bash
# Check mail queue
php artisan queue:work redis

# Manually trigger queue
php artisan queue:listen --timeout=60

# Check mail log
tail -f storage/logs/laravel.log | grep -i mail

# Test directly
php artisan tinker
Mail::to('test@email.com')->send(new VotingOtpMail(...))
```

### Performance for 1300 Users

**If website is slow:**

```bash
# Clear all caches
php artisan optimize:clear

# Re-optimize
php artisan optimize

# Check database queries log
# In .env: DB_QUERY_LOG=true
# Check: storage/logs/db-queries.log
```

**Database indexing:**
```bash
# Ensure all indexes exist
php artisan db:seed --class=IndexSeeder

# Or manually:
# Already defined in migration
```

**Queue for bulk email:**
```bash
# In .env
QUEUE_CONNECTION=database  # or redis if available
QUEUE_RATE_LIMIT=60         # 60 emails per minute

# Start queue
php artisan queue:work --timeout=300
```

---

## 📊 Expected Statistics

**For 1300 members:**

| Metric | Expected | Warning Level |
|--------|----------|---|
| Total votes | 1200-1300 | <800 = issue |
| OTP requests | 1400-1600 | >3000 = spam/bots |
| Failed attempts | 10-30 | >100 = email issues |
| Completion % | 90%+ | <80% = announcement needed |
| Average time to vote | 3-5 min | >15 min = slowness |
| Peak load | ~200 concurrent | >300 = scale needed |

---

## 🔐 Security Notes

- ✅ OTP expires in 15 minutes (auto-invalidates)
- ✅ Max 3 wrong OTP attempts then blocks for 15 min
- ✅ Max 3 OTP requests per email per 10 minutes
- ✅ All votes logged with timestamp, IP address
- ✅ Passwords hashed (bcrypt)
- ✅ HTTPS only (no unencrypted communication)
- ✅ SQL injection prevention (Eloquent ORM)
- ✅ XSS prevention (React auto-escapes)

---

## 📞 Support Contacts

**Technology Issues:**
Email: support@kkm.or.id
Phone: +62-8xx-xxxx-xxxx
Hours: During voting (8 AM - 6 PM)

**Voting Procedure Questions:**
Contact: Panitia KKM
Available: At office during voting hours

---

**Good luck with your voting! 🎉**
