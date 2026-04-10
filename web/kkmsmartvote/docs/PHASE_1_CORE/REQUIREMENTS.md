# 🔴 Phase 1: Core Features Requirements

**Priority:** HIGH | **Timeline:** 2-3 weeks | **Status:** 🚫 TODO

---

## 📋 **Overview**

Phase 1 implements 3 core features to improve voting system:
1. **Saksi Role** - Observer access with view-only rights
2. **50%+1 Voting Method** - Consensus-based winner determination
3. **Voucher System** - Reward management for participants

---

## 📱 **Non-Functional Requirement: Multi-Device Support (Global, Mandatory)**

Semua UI pada sistem ini wajib responsive dan usable di berbagai perangkat, mencakup halaman public maupun admin.

### Scope
- Public pages (landing, OTP, member lookup, vote, vote success).
- Admin pages (dashboard, candidates, members, votes, results, audit, users, settings, voucher).

### Minimum Device Coverage
- Mobile kecil: `<= 480px`
- Mobile besar / tablet portrait: `481-768px`
- Tablet landscape / laptop kecil: `769-1024px`
- Desktop: `> 1024px`

### Acceptance Criteria (Wajib Lulus)
1. Tidak ada horizontal overflow pada konten utama.
2. Navigasi, CTA, dan form tetap dapat dioperasikan pada touch device.
3. Modal/dialog aman untuk layar kecil (scroll internal + close action jelas).
4. Halaman data-heavy admin (table/list) punya fallback mobile:
    - responsive table dengan wrapper scroll yang aman, atau
    - card/list mode khusus mobile.
5. Font, spacing, dan kontras tetap terbaca nyaman di semua breakpoint target.
6. Fitur dinyatakan selesai hanya jika lulus uji manual lintas breakpoint.

---

## 🎯 **Feature 1: Saksi (Witness) Role**

### Purpose
Enable election observers to monitor voting process transparently while protecting voter privacy.

### Requirement

#### Database
- Add `role = 'saksi'` to users table
- Migration: Add enum constraint (admin, panitia, saksi)

#### Backend Authentication
```
POST /api/auth/login
{
  "username": "saksi_observer",
  "password": "password"
}
Response: { "token": "jwt...", "role": "saksi", ... }
```

#### Authorization (What Saksi Can Access)

| Resource | View | Create | Edit | Delete |
|----------|------|--------|------|--------|
| Dashboard | ✅ | ✗ | ✗ | ✗ |
| Candidates | ✅ | ✗ | ✗ | ✗ |
| Members (Voted Only) | ✅ | ✗ | ✗ | ✗ |
| Members (Not Voted) | ✗ | ✗ | ✗ | ✗ |
| Votes/Results | ✅ | ✗ | ✗ | ✗ |
| Audit Logs | ✅ | ✗ | ✗ | ✗ |
| Settings | ✗ | ✗ | ✗ | ✗ |
| Users Management | ✗ | ✗ | ✗ | ✗ |
| Vouchers | ✗ | ✗ | ✗ | ✗ |

#### API Endpoints

```php
// Controller authorization
if ($user->role === 'saksi') {
    // Only access these routes
    - GET /api/candidates
    - GET /api/members/voted-only ← NEW
    - GET /api/votes
    - GET /api/results
    - GET /api/audit-logs
}

// Members endpoint with role-based filtering
GET /api/members/voted-only
Response: [
    { "nik": "123", "name": "John", "site": "A", "voted_at": "2026-04-05 10:30" },
    { "nik": "456", "name": "Jane", "site": "B", "voted_at": "2026-04-05 11:15" }
]
// NOT including members with has_voted = false
```

#### Frontend Components
- **SaksiLoginPage** - Same as AdminLoginPage
- **SaksiDashboard** - Limited view (no Edit buttons)
- **SaksiMembersPage** - Show only voted members
  - Filter: "Tampilkan hanya anggota yang sudah memilih"
  - Columns: NIK, Nama, Site, Waktu Voting
- **SaksiSidebar** - Reduced menu (no Settings, Users, Vouchers)

#### Testing Checklist
- [ ] Login as saksi account
- [ ] Verify can see voted members
- [ ] Verify cannot see unvoted members
- [ ] Verify cannot see edit/delete buttons
- [ ] Verify correct results visible
- [ ] Verify audit logs visible
- [ ] Verify no access to settings/users

---

## 🏆 **Feature 2: Voting Method 50%+1**

### Purpose
Ensure fair winner determination through majority consensus, not simple plurality.

### Requirement

#### Calculation Logic
```
Total votes = COUNT(votes WHERE is_valid = true)
Threshold = CEIL(total_votes * 0.5) + 1

For each candidate:
  vote_count = candidate.valid_votes()

  if vote_count >= threshold:
    status = 'WINNER'
  else if vote_count == max_in_tie:
    status = 'TIE'
  else:
    status = 'NO_MAJORITY'
```

#### Example Scenarios

**Scenario 1: Clear Winner**
```
Total: 100 votes
Threshold: 51 votes

Candidate A: 55 votes → WINNER ✅
Candidate B: 45 votes → Not Qualified
```

**Scenario 2: No Majority**
```
Total: 100 votes (3 candidates)
Threshold: 51 votes

Candidate A: 40 votes
Candidate B: 35 votes
Candidate C: 25 votes
→ Status: NO_MAJORITY ⚠️ (highest is only 40, need runoff)
```

**Scenario 3: Tie**
```
Total: 100 votes
Threshold: 51 votes

Candidate A: 50 votes
Candidate B: 50 votes
→ Status: TIE ⚠️ (need tiebreaker)
```

#### Database
- Add `status` field to results table (WINNER | TIE | NO_MAJORITY)
- Add `threshold` field to track the 50%+1 calculation

#### Backend API Update

```php
GET /api/results
Response: {
    "election_id": 1,
    "total_valid_votes": 100,
    "threshold": 51,  // 50%+1
    "results": [
        {
            "candidate_id": 1,
            "name": "John",
            "votes": 55,
            "percentage": 55.0,
            "qualified": true,  // >= threshold
            "status": "WINNER"   // or TIE, NO_MAJORITY
        },
        {
            "candidate_id": 2,
            "name": "Jane",
            "votes": 45,
            "percentage": 45.0,
            "qualified": false,  // < threshold
            "status": null
        }
    ],
    "is_finalized": false
}
```

#### Frontend Display

**Dashboard Cards:**
- "Threshold: 51/100 suara"
- Progress bar filled to threshold line
- Visual indicator: Green if some candidate qualified, Red if not

**Results Page:**
```
Threshold Pemilihan: 51 suara dari 100 total
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏆 PEMENANG
├─ John Doe: 55 suara (55%) ✅ QUALIFIED
│
⚠️ TIDAK QUALIFIED
├─ Jane Smith: 45 suara (45%) ✗ Not enough votes
```

**Status Badges:**
- **WINNER** - Badge hijau dengan ✅
- **TIE** - Badge orange dengan ⚠️
- **NO_MAJORITY** - Badge merah dengan warning message

#### Testing Checklist
- [ ] Calculate with 2 candidates (one winner)
- [ ] Calculate with 3 candidates (no majority)
- [ ] Calculate with tie scenario
- [ ] Verify threshold displayed correctly on dashboard
- [ ] Verify qualification shown on results page
- [ ] Verify manual calculation matches system
- [ ] Test edge case: exactly 50% (should NOT be winner)
- [ ] Test edge case: 50%+1 exactly (should be winner)

---

## 🎁 **Feature 3: Voucher System**

### Purpose
Reward voters for participating, increasing participation rates.

### Requirement

#### Database Schema

**vouchers table**
```sql
CREATE TABLE vouchers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,  -- Encrypted code
    value DECIMAL(10,2) NOT NULL,       -- Voucher amount
    status ENUM('active','redeemed','expired','canceled') DEFAULT 'active',
    expires_at TIMESTAMP,
    created_by INT NOT NULL,            -- Admin who created
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE voter_vouchers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    voter_nik VARCHAR(20) NOT NULL,
    voucher_id INT NOT NULL,
    granted_at TIMESTAMP,               -- When voter received voucher
    redeemed_at TIMESTAMP,              -- When voucher was used
    redeemed_by VARCHAR(255),           -- Merchant name
    redemption_code VARCHAR(100),       -- Transaction reference
    created_at TIMESTAMP,
    UNIQUE KEY (voter_nik, voucher_id), -- One voucher per voter
    FOREIGN KEY (voter_nik) REFERENCES members(nik),
    FOREIGN KEY (voucher_id) REFERENCES vouchers(id)
);
```

#### Backend APIs

**Create Voucher (Admin Only)**
```php
POST /api/vouchers
{
    "quantity": 100,
    "value": 50000,
    "expires_at": "2026-05-31"
}
Response: {
    "success": true,
    "created": 100,
    "codes": ["VOUCHER001", "VOUCHER002", ...]
}
```

**List Vouchers (Admin/Panitia)**
```php
GET /api/vouchers?status=active&page=1
Response: [
    {
        "id": 1,
        "code": "VOUCHER001",
        "value": 50000,
        "status": "active",
        "expires_at": "2026-05-31",
        "redeemed": false,
        "created_at": "2026-04-05"
    }
]
```

**Grant Voucher to Voter (After Successful Vote)**
```php
POST /api/votes/{vote_id}/grant-voucher
Response: {
    "success": true,
    "voucher_code": "VOUCHER001",
    "value": 50000,
    "expires_at": "2026-05-31"
}
// Called after successful vote
```

**Redeem Voucher (Voter)**
```php
POST /api/vouchers/redeem
{
    "code": "VOUCHER001"
}
Response: {
    "success": true,
    "message": "Voucher berhasil diredeem",
    "value": 50000
}
```

**Validate Voucher Code**
```php
POST /api/vouchers/validate
{
    "code": "VOUCHER001"
}
Response: {
    "valid": true,
    "value": 50000,
    "type": "GRANTED_FROM_VOTING",
    "expires_at": "2026-05-31",
    "already_redeemed": false
}
```

#### Frontend Components

**VoucherManagement Page (Admin)**
- Create new batches of vouchers
  - Input: Quantity, Value, Expiration date
  - Generate: Auto-generate unique codes
  - Export: Download PDF with codes
- View vouchers
  - Table: Code, Value, Status, Expiration, Redeemed date
  - Filter: Status (Active/Redeemed/Expired)
  - Search: Code or date range
- Statistics
  - Total generated, Active, Redeemed, Expired
  - Total value distributed
  - Redemption rate (%)

**Voucher Modal (After Voting Success)**
- Show immediately after successful vote
- Display:
  - "Congratulations! Anda mendapat voucher:"
  - Voucher code (large, bold)
  - Value (Rp 50.000)
  - Expiration date
  - "Sebenarnya kode ini bisa diredeem di merchant pilihan"
  - Buttons: "Copy Code" | "Download" | "Close"
- Copy to clipboard functionality
- Download as PDF/Image

**Voucher Redemption History (Admin)**
- Table showing all redemptions:
  - Voter name, NIK, Voucher code, Value, Redeemed date, Merchant
  - Filter: Date range, merchant, status
  - Total: Money redeemed, Number of vouchers

#### Validation Rules

**One-Time Use:**
```php
// Check before redemption
if (VoterVoucher::where('voucher_id', $voucherId)
                  ->where('redeemed_at', '!=', null)
                  ->exists()) {
    throw new VoucherAlreadyRedeemedException();
}
```

**Expiration Check:**
```php
if (Carbon::now() > $voucher->expires_at) {
    throw new VoucherExpiredException();
}
```

**Ownership Check:**
```php
// Voucher must be granted to this voter
$granted = VoterVoucher::where('voter_nik', $voter->nik)
                        ->where('voucher_id', $voucherId)
                        ->exists();
if (!$granted) {
    throw new VoucherNotGrantedException();
}
```

#### Audit Logging

Log all voucher activity:
```php
// When voucher created
AuditLog::create([
    'action' => 'VOUCHER_CREATED',
    'actor' => $admin->name,
    'detail' => json_encode(['quantity' => 100, 'value' => 50000]),
    'ip_address' => request()->ip()
]);

// When voted and voucher granted
AuditLog::create([
    'action' => 'VOUCHER_GRANTED',
    'actor' => 'SYSTEM',
    'detail' => json_encode(['voter_nik' => $voter->nik, 'voucher_id' => $voucher->id]),
    'ip_address' => $voter->ip_address
]);

// When redeemed
AuditLog::create([
    'action' => 'VOUCHER_REDEEMED',
    'actor' => $voter->name,
    'detail' => json_encode(['voucher_code' => $code, 'value' => $value]),
    'ip_address' => request()->ip()
]);
```

#### Testing Checklist
- [ ] Generate voucher batch
- [ ] Verify unique codes generated
- [ ] Verify expiration date enforced
- [ ] Test redemption (success case)
- [ ] Test duplicate redemption (should fail)
- [ ] Test expired voucher (should fail)
- [ ] Test invalid code (should fail)
- [ ] Verify audit trail recorded
- [ ] Test copy-to-clipboard
- [ ] Test PDF download
- [ ] Load test (1000 simultaneously redeeming)

---

## 📊 **Implementation Priority**

### Week 1
1. **Saksi Role** - Database + Auth + Authorization (HIGH)
2. **50%+1 Voting** - Calculation + Display (HIGH)

### Week 2
3. **Voucher System** - Database + APIs + UI (HIGH)

### Week 3
4. Testing & QA
5. Bug fixes
6. Prepare Phase 2

---

## ✅ **Success Criteria**

- [ ] All 3 features fully implemented
- [ ] All unit tests passing (95%+ coverage)
- [ ] API response times < 500ms
- [ ] Zero security vulnerabilities
- [ ] Saksi role properly restricts access
- [ ] 50%+1 calculation verified manually
- [ ] Voucher prevents double-redeem
- [ ] Audit logs complete & accurate

---

## 🔗 **Related Documents**

- [PHASE_1_CORE/ROADMAP.md](./ROADMAP.md) - Tasks & timeline
- [PHASE_1_CORE/UI_PAGES.md](./UI_PAGES.md) - UI/UX details
- [PHASE_1_CORE/STATUS.md](./STATUS.md) - Progress tracking
- [DATABASE_API/SCHEMA.md](../DATABASE_API/SCHEMA.md) - Schema details

---

**Status:** Ready for implementation
**Difficulty:** Medium (CRUD + Authorization + Calculation)
