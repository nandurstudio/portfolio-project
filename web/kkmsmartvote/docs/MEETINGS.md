# 📝 Meeting Notes & Decisions

**Date:** April 2, 2026
**Attendees:** Tia Handayani (Lead), Rudy, Gunawan
**Topic:** KKM Smart Vote - New Features & Requirements
**Status:** ✅ Decisions Finalized

---

## 🎤 **Tia Handayani's Feature Requests**

### 1. 🎁 **Voucher/Reward System untuk Pemilih**

**Tia:**
> "Tambahin untuk redeem voucher para pemilih yang sudah melakukan pemilihan, untuk meningkatkan partisipasi pemilih."

**Purpose:** Increase voter participation by incentivizing voting with rewards

**What:** Pemilih yang sudah voting dapat voucher/reward code
**Example:** Voting → Dapat voucher Rp 50k → Bisa redeem di merchant
**Implementation:** Phase 1 (Week 1-2)

**Specs:**
- ✅ Voucher code generation (unique, encrypted)
- ✅ One-time use enforcement
- ✅ Expiration dates
- ✅ Redemption audit trail
- ✅ Admin management CRUD
- ✅ Voter receives after voting success

**Benefit:** Boosts participation + incentivizes completion

---

### 2. 📢 **Notification System**

**Tia:**
> "Buat sistem notifikasi untuk mengingatkan pemilih tentang tanggal pemilihan dan cara menggunakan voucher."

**Purpose:** Keep voters informed about election & voucher usage

**What:** Send reminders to voters (Email/SMS/In-app)
**Examples:**
- "Pemilihan dimulai hari Minggu jam 08:00"
- "Anda telah mendapat voucher Rp 50k, begini cara redeem: ..."
- "Pemilihan berakhir dalam 2 jam! Segera pilih."

**Implementation:** Phase 2 (Week 2-3)

**Channels:** Email, SMS, In-app notifications
**Features:**
- ✅ Notification templates
- ✅ Scheduled sending
- ✅ Delivery tracking (optional)

**Benefit:** Better communication + higher completion rate

---

### 3. 👤 **Saksi (Witness) Role dengan Role-Based Access**

**Tia:**
> "Buatkan role based untuk saksi yang mana bisa akses untuk melihat data pemilih yang sudah melakukan pemilihan, namun tidak bisa melihat data pemilih yang belum melakukan pemilihan."

**Purpose:** Enable election observers to monitor voting TRANSPARENTLY without compromising PRIVACY

**Current Roles:** Admin, Panitia
**New Role:** Saksi (Witness/Observer)

**What Saksi Can See:**
- ✅ Results & standings
- ✅ Members who HAVE voted (transparency)
- ✅ Audit logs
- ✅ Candidates

**What Saksi CANNOT See:**
- ❌ Members who HAVEN'T voted (privacy protection!)
- ❌ Vote choices (voting is secret)
- ❌ Individual vote details

**What Saksi CANNOT Do:**
- ❌ Edit candidates
- ❌ Edit members
- ❌ Invalidate votes
- ❌ Manage settings
- ❌ Manage users

**Implementation:** Phase 1 (Week 1 - PRIORITY)

**Benefit:** Transparency + Trust + Observer oversight

---

### 4. 📊 **Real-Time Participation Monitor**

**Tia:**
> "Tambahkan fitur untuk memantau jumlah pemilih yang sudah melakukan pemilihan secara real-time, sehingga bisa memberikan informasi yang akurat kepada pihak penyelenggara."

**Purpose:** Give organizers live voting statistics

**What:** Dashboard showing live participation stats
**Examples:**
- "250 / 500 anggota sudah memilih (50%)"
- Progress bar: ████████░░░ 50%
- Graph: votes per minute (trending)
- Per-site breakdown (if multi-site)
- Estimated completion time

**Implementation:** Phase 2 (Week 2)

**Tech:** Polling every 5-10 seconds OR WebSocket real-time

**Benefit:** Organizers can monitor progress + adjust timeline if needed

---

### 5. 🛡️ **Enhanced Security System**

**Tia:**
> "Buatkan sistem keamanan yang lebih baik untuk melindungi data pemilih dan mencegah penyalahgunaan voucher."

**Purpose:** Better data protection + fraud prevention

**Features:**
- ✅ Rate limiting (prevent brute force)
- ✅ Login audit logs (see who logged in when/from where)
- ✅ Data encryption (sensitive data protected)
- ✅ Voucher one-time use enforcement (no double-redeem)
- ✅ Session timeout (auto-logout after 30 mins)
- ✅ API rate limiting (prevent abuse)

**Implementation:** Phase 3 (Week 3+)

**Benefit:** Security + Compliance + Trust

---

## 📊 **Voting Method Discussion**

### The Question:
**How should we determine the winner?**

**Method 1: Plurality (Simple Majority)**
- Winner = Candidate with most votes
- No minimum threshold required
- ❌ **Problem:** Can win with 30% if divided among 3+ candidates
- ❌ **Not fair** - minority can rule

**Method 2: Qualified Majority (Consensus)**
- Winner = Candidate with most votes + Minimum 50%+1
- Ensures consensus
- ✅ **Fair** - must have majority support
- ✅ **Democratic** - well-established in cooperatives

### Panel Discussion:

**Tia (Presenting):**
"Ada 2 metode umum. Method 2 lebih adil."

**Rudy (Stakeholder):**
"Dari Rudy. Namun poin 2 lebih adil. Setuju."

**Gunawan (Stakeholder):**
"Setuju."

### ✅ **DECISION: Qualified Majority (50%+1) - APPROVED BY ALL**

**Implementation:**
- **Threshold:** Total votes × 50% + 1 = minimum to win
- **Winner Status:**
  - ✅ **WINNER:** Candidate ≥ threshold
  - ⚠️ **TIE:** 2+ candidates tied
  - ⚠️ **NO_MAJORITY:** Highest votes < threshold

**Example:**
```
Total votes: 100
Threshold: 51 votes (50%+1)

Candidate A: 55 votes → WINNER ✅
Candidate B: 45 votes → Not qualified

If Candidate A: 40, Candidate B: 40 (with 100 total)
→ Both < 50 → NO_MAJORITY (need runoff)
```

**Why This Method?**
- Standard in cooperative governance
- More democratic
- Prevents minority rule
- All stakeholders agree

---

## 📋 **Decision Summary Table**

| Aspect | Decision | Approved By | Status |
|--------|----------|-------------|--------|
| **Voting Method** | 50%+1 Qualified Majority | All | ✅ FINAL |
| **Phase 1 Features** | Voucher + Saksi + 50%+1 | All | ✅ FINAL |
| **Timeline** | 2-3 weeks (Apr 2-23) | All | ✅ FINAL |
| **Priority** | Saksi & 50%+1 first | All | ✅ FINAL |

---

## 🎯 **Action Items from Meeting**

**Immediate (This Week):**
- [x] Document all requirements ✅
- [x] Create implementation roadmap ✅
- [ ] Schedule development kickoff
- [ ] Create database migrations

**Phase 1 Development:**
- [ ] Start Saksi role (Week 1)
- [ ] Start 50%+1 voting method (Week 1)
- [ ] Start Voucher system (Week 2)
- [ ] Testing & QA (Week 3)

**Ongoing:**
- [ ] Keep audit logs
- [ ] Monitor progress
- [ ] Weekly standup meetings

---

## 🔐 **Key Considerations Discussed**

### Voucher Security:
- One-time use only (prevent duplicate redemption)
- Expiration dates (prevent indefinite validity)
- Audit trail (track who redeemed when)
- Rate limiting (prevent bulk redemption)

### Saksi Privacy & Trust:
- **Privacy:** Cannot see who HASN'T voted (protects voters)
- **Transparency:** Can see who HAS voted (ensures fairness)
- **Integrity:** Cannot edit/delete (prevents manipulation)
- **Oversight:** Can see audit logs (monitors admins)

### Voting Method Fairness:
- Majority consensus (not plurality)
- Clear winner determination
- Fair representation
- Handles edge cases (TIE, NO_MAJORITY)

---

## 📞 **Attendee Info**

| Name | Role | Email | Notes |
|------|------|-------|-------|
| Tia Handayani | Product Lead | | Primary request owner |
| Rudy | Stakeholder | | Supports 50%+1 method |
| Gunawan | Stakeholder | | General oversight |

---

## 📅 **Next Meeting**

**When:** After Phase 1 completion (Apr 23+)
**Topics:** Phase 1 review, Phase 2 planning, Phase 3 scope

---

**Document Status:** ✅ FINALIZED
**Implementation Status:** 🚀 Ready to start
**Last Updated:** April 2, 2026
