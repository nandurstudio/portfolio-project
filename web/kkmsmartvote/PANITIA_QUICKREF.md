# 🗳️ Panitia Quick Reference - During Voting

**Print this and keep with you during voting!**

---

## ⚡ Quick Links

- **Voting Website:** https://kkmsmartvote.web.id
- **Admin Dashboard:** https://kkmsmartvote.web.id/admin (login required)
- **Results:** https://kkmsmartvote.web.id/results
- **Support Email:** support@kkm.or.id
- **Support WhatsApp:** [Contact Number]

---

## ❓ Common Member Questions & Answers

### Q: "I don't see the voting website"
**A:** Make sure you're connected to internet. Try:
- Clear browser cache (Ctrl+Shift+Delete)
- Try different browser (Chrome, Firefox)
- Try on phone mobile data (not WiFi if WiFi slow)

### Q: "It says 'Email not found'"
**A:** Email not registered in system. Options:
- Check spelling (jika self-typing)
- Call HR untuk verify email address
- Ask panitia untuk bantu cek di database

### Q: "I didn't receive the OTP email"
**A:** Checklist:
1. Wait 1-2 minutes (email sometimes slow)
2. Check SPAM folder
3. Check PROMOTIONS folder
4. Try again ("Request OTP" button)
5. If still nothing, call support

### Q: "OTP says 'expired'"
**A:** OTP valid hanya 15 menit. Solution:
- Click "Kembali" (back)
- Enter email again
- Request new OTP
- Type OTP within 15 minutes

### Q: "I got OTP but it says 'invalid'"
**A:** Wrong OTP code entered. Options:
- Copy-paste OTP dari email (more accurate)
- Max 3 attempts, then system locks (ask panitia/support)
- Request brand new OTP

### Q: "The website is very slow"
**A:**
- Try on different device
- Refresh page (F5)
- If still slow, inform panitia (they'll check server)
- Try again in few minutes

### Q: "I already voted, but want to change my vote"
**A:** ❌ SORRY, tidak bisa. Setiap orang hanya bisa vote 1x.
- Suara Anda sudah tercatat
- Tidak ada amend/change

### Q: "Can I vote on behalf of my friend?"
**A:** ❌ NO. Setiap orang vote sendiri untuk maintain integrity.
- Teman harus bawa email sendiri
- Teman masuk OTP sendiri

---

## 🛠️ Admin Tasks During Voting

### Every Hour

```
□ Check dashboard for vote progress
  Go to: Admin › Dashboard
  Look for: "Total votes received" count

□ Check for errors
  Go to: Admin › Logs
  Red entries = problems

□ Monitor server
  Check: CPU/RAM/Disk not 100%

□ Respond to member messages
  WhatsApp/Email if any issues
```

### If Vote Count Stalls

```
1. Check internet connection
2. Try refresh browser (Ctrl+F5)
3. Check if voting time already ended
4. Restart web server (if authorized)
5. Check database (might be full?)
6. Call technical support if issue persists
```

### If Member Says "Email Sent Wrong Time"

```
1. Assure them that's normal (async email delivery 2-5 sec)
2. Tell them to wait 2 minutes
3. Check email spam folder
4. If still nothing, can request panitia resend
```

### If Spam/Fraud Detected

```
Report to Admin:
- Too many OTP from same IP
- Too many votes same time
- Suspicious voting patterns

Admin will:
1. Review audit logs
2. Mark votes as invalid if needed
3. Investigate member
4. Document for compliance
```

---

## 📱 Member Off-Script Help

### If Member Needs to Vote At Office With Your Help

```
Step 1: Member comes to office
"Nama siapa? Kira-kira sudah ada di sistem?"

Step 2: Verify in list
Member: "Itu ya, nama aku John Doe, NIK 123456789"
Panitia: (check list) "Oke, John Doe terdaftar"

Step 3: Ask for email
Panitia: "Email kamu apa?"
Member: "john.doe@email.com"

Step 4: Send OTP
Panitia: (click "Send OTP"  on website)
Website: "OTP dikirim ke john***@email.com"

Step 5: Member check email
Panitia: "Cek email kamu, lihat kode 6 angka"
Member: (check phone) "Sudah dapat, 123456"

Step 6: Enter OTP
Panitia: (member dictate OTP or type himself)
  - If panitia type: "Nanti saya ketik, Member: (read code)"
  - If member type: "Silakan ketik 6 angka di sini"

Step 7: Vote
Website: "Pilih calon"
Panitia: "Silakan pilih favorite kamu"
Member: (click candidate)

Step 8: Submit
Panitia: "Sekarang klik 'Vote' untuk finalize"
Member: (click)

Step 9: Confirmation
Website: "Vote recorded!"
Panitia: "Done! Terima kasih sudah vote. Semoga menang!"
```

---

## ☎️ Escalation Path

**Problem Level 1** (Member Questions)
→ Panitia handles
```
"Email not found" / "OTP wrong" / "Slow website"
```

**Problem Level 2** (Technical Issues)
→ IT Support / Technical Staff
```
"Whole website down" / "Email not sending" / "Database error"
Contact: support@kkm.or.id or +62-8xx-xxxx-xxxx
```

**Problem Level 3** (Fraud/Compliance)
→ Pimpinan Panitia / Administrator
```
"Same IP multiple votes" / "Duplicate member" / "Suspicious pattern"
Document and report post-voting
```

---

## 📊 Live Dashboard Explained

**Admin › Dashboard shows:**

```
│ Total Votes         │ 523 / 1300 (40%)     │
├─ Vote by Candidate:
│  ├─ Candidate A     │ 185 votes (35%)      │
│  ├─ Candidate B     │ 198 votes (38%)      │
│  └─ Candidate C     │ 140 votes (27%)      │
├─ System Stats:
│  ├─ OTP Sent        │ 578 (some retry)     │
│  ├─ Failed Attempts │ 15 (normal %)        │
│  └─ Errors         │ 2 (network glitches) │
```

**What's Normal:**
- Vote count increases throughout day
- Some votes same-time (spikes ~5%)
- OTP requests > vote count (reqs, expired, retry)
- Few failed attempts (users typo OTP)

**What's NOT Normal:**
- Vote count suddenly jumps 100x (fraud)
- Massive OTP requests in 1 minute (spam bot)
- Consistent errors (system issue)

---

## 🆘 Common Issues & Quick Fixes

| Problem | Quick Fix |
|---------|-----------|
| Website won't load | Clear browser cache, try different browser |
| Email very slow | Normal, wait 5 sec. Check spam folder |
| OTP "invalid",tried 3x | Request new OTP (old one auto-deleted) |
| "Email not found" | Check spelling, call HR if unsure |
| Dashboard shows 0 votes | Refresh page (F5), restart browser |
| Can't login admin | Reset password OR call IT support |
| Website down (error 503) | Tell users voting paused, call IT ASAP |
| Too many same IP (fraud?) | Document case, report to admin |

---

## 📝 During Voting Checklist

**8:00 AM - Voting Opens**
```
□ System online? Visit https://kkmsmartvote.web.id
□ Test OTP request (yourself)
□ Email received? (check spam)
□ Test complete flow (login to vote)
□ Dashboard accessible? (admin login)
```

**Every 2 Hours**
```
□ Check vote count (dashboard)
□ Check error log (admin › logs)
□ Answer member questions
□ Monitor no major issues
```

**6:00 PM - Voting Closes**
```
□ STOP accepting votes (system auto-closes)
□ Announce: "Voting has ended!"
□ Save logs
□ Export results
□ Count votes (verification)
```

**6:30 PM - Announcement**
```
□ Verify final vote count
□ Announce winner(s)
□ Thank all members
```

---

## 💡 Pro Tips

1. **Keep phone charged** - members might call
2. **Have internet hotspot** - backup if WiFi down
3. **Bookmark key links** - save time
4. **Print member list** - physical backup
5. **Note any issues** - report after voting
6. **Be patient** - some members gaptek, take time
7. **Smile!** - voting day is exciting for members

---

## 📞 Emergency Contacts

**If Website Fully Down:**
- Call: [Technical Support Phone]
- Email: support@kkm.or.id

**If Member Privacy Concern:**
- Report to: Pimpinan Panitia
- Do NOT discuss with other members

**If Unusual Activity Detected:**
- Screenshot evidence
- Note down NIK / email / time
- Report to admin immediately

---

**Good luck, Panitia! You've got this! 🎉**
