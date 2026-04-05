# 🗄️ Database Schema (Current MVP + Phase 1 Changes)

**Total Tables:** 6 (MVP) + 2 (Phase 1) = 8 tables
**Last Updated:** April 5, 2026

---

## 📊 **Database Overview**

### MVP Tables (Phase 0) ✅
1. **users** - Admin/Panitia accounts
2. **members** - Voter registration
3. **candidates** - Election candidates
4. **votes** - Recorded votes
5. **election_settings** - Election configuration
6. **audit_logs** - System activity tracking

### Phase 1 New Tables 🔴
7. **vouchers** - Voucher codes & management
8. **voter_vouchers** - Voucher allocation to voters

---

## 📝 **Table: users**

**Purpose:** Admin/Panitia authentication & authorization

**Columns:**

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | INT | PK, AI | Admin ID |
| name | VARCHAR(255) | NOT NULL | Full name |
| username | VARCHAR(100) | UNIQUE, NOT NULL | Login username |
| password | VARCHAR(255) | NOT NULL | Hashed (bcrypt) |
| **role** | ENUM | NEW, NOT NULL | 'admin', 'panitia', 'saksi' |
| remember_token | VARCHAR(100) | NULLABLE | Session token |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes:**
```sql
UNIQUE KEY (username)
INDEX (role)
```

**Sample Data:**
```
1, "Admin User", "admin", "\$2y\$10\$...", "admin", NULL, 2026-04-02, 2026-04-02
2, "Panitia 1", "panitia1", "\$2y\$10\$...", "panitia", NULL, 2026-04-02, 2026-04-02
3, "Saksi Observer", "saksi_observer", "\$2y\$10\$...", "saksi", NULL, 2026-04-05, 2026-04-05
```

---

## 👥 **Table: members**

**Purpose:** Voter registration & eligibility tracking

**Columns:**

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | INT | PK, AI | Member ID (auto) |
| nik | VARCHAR(20) | UNIQUE, NOT NULL | National ID (voter identifier) |
| name | VARCHAR(255) | NOT NULL | Full name |
| site | VARCHAR(100) | NOT NULL | Location/site code |
| is_eligible | BOOLEAN | DEFAULT true | Can vote? |
| **has_voted** | BOOLEAN | DEFAULT false | Already voted? |
| created_at | TIMESTAMP | DEFAULT NOW() | Registration time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes:**
```sql
UNIQUE KEY (nik)
INDEX (site)
INDEX (has_voted)
```

**Sample Data:**
```
1, "123456789", "John Doe", "Site A", true, false, 2026-04-02, 2026-04-02
2, "987654321", "Jane Smith", "Site B", true, false, 2026-04-02, 2026-04-02
3, "111222333", "Bob Wilson", "Site A", true, true, 2026-04-02, 2026-04-04 (voted)
```

---

## 🏃 **Table: candidates**

**Purpose:** Election candidates & their details

**Columns:**

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | INT | PK, AI | Candidate ID |
| name | VARCHAR(255) | NOT NULL | Full name |
| position | VARCHAR(100) | NOT NULL | Role (Ketua, Wakil, etc) |
| bio | TEXT | NULLABLE | Biography/description |
| photo_url | VARCHAR(255) | NULLABLE | Avatar URL |
| is_active | BOOLEAN | DEFAULT true | Eligible to run? |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes:**
```sql
INDEX (is_active)
```

**Sample Data:**
```
1, "Candidate A", "Ketua", "Experienced...", "/images/cand_a.jpg", true, 2026-04-02, 2026-04-02
2, "Candidate B", "Ketua", "Passionate...", "/images/cand_b.jpg", true, 2026-04-02, 2026-04-02
```

---

## 🗳️ **Table: votes**

**Purpose:** Record individual votes (with anonymity for choice)

**Columns:**

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | INT | PK, AI | Vote ID |
| member_nik | VARCHAR(20) | FK (members.nik) | Who voted (voter identity) |
| member_name | VARCHAR(255) | NOT NULL | Voter name (for audit) |
| site | VARCHAR(100) | NOT NULL | Voting location |
| candidate_id | INT | FK (candidates.id) | Who they voted for (PRIVATE) |
| is_valid | BOOLEAN | DEFAULT true | Valid vote? |
| ip_address | VARCHAR(45) | NOT NULL | Voting IP |
| invalidated_at | TIMESTAMP | NULLABLE | When invalidated (if any) |
| invalidation_reason | TEXT | NULLABLE | Why invalidated |
| created_at | TIMESTAMP | DEFAULT NOW() | Vote timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes:**
```sql
UNIQUE KEY (member_nik, candidate_id)  ← Prevent duplicate voting
FK (member_nik) → members(nik)
FK (candidate_id) → candidates(id)
INDEX (is_valid)
INDEX (created_at)
```

**Sample Data:**
```
1, "123456789", "John Doe", "Site A", 1, true, "192.168.1.1", NULL, NULL, 2026-04-04 10:30, 2026-04-04
2, "987654321", "Jane Smith", "Site B", 2, true, "192.168.1.2", NULL, NULL, 2026-04-04 11:15, 2026-04-04
3, "111222333", "Bob Wilson", "Site A", 1, false, "192.168.1.3", 2026-04-04 12:00, "Duplicate voting", 2026-04-04, 2026-04-04
```

---

## ⚙️ **Table: election_settings**

**Purpose:** Election configuration & scheduling

**Columns:**

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | INT | PK (usually 1) | Config ID |
| election_name | VARCHAR(255) | NOT NULL | Event title |
| period | VARCHAR(100) | NOT NULL | Year range (2026-2029) |
| start_date | DATE | NOT NULL | Election start date |
| end_date | DATE | NOT NULL | Election end date |
| end_time | TIME | NOT NULL | Voting deadline time |
| is_active | BOOLEAN | DEFAULT true | Election ongoing? |
| is_finalized | BOOLEAN | DEFAULT false | Results locked? |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Sample Data:**
```
1, "Pemilihan Ketua Koperasi 2026", "2024-2027", "2026-04-04", "2026-04-05", "17:00:00", true, false, 2026-04-02, 2026-04-02
```

---

## 📋 **Table: audit_logs**

**Purpose:** Track all system activities for compliance & debugging

**Columns:**

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | INT | PK, AI | Log ID |
| actor | VARCHAR(255) | NOT NULL | Who did it (username or SYSTEM) |
| action | VARCHAR(100) | NOT NULL | What (LOGIN, CREATE, DELETE, etc) |
| detail | JSON | NOT NULL | Details (what changed) |
| ip_address | VARCHAR(45) | NOT NULL | Request IP |
| logged_at | TIMESTAMP | DEFAULT NOW() | Timestamp |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation |

**Indexes:**
```sql
INDEX (actor)
INDEX (action)
INDEX (logged_at)
```

**Sample Data:**
```
1, "admin", "LOGIN", {"username": "admin"}, "192.168.1.1", 2026-04-02 08:00:00, 2026-04-02
2, "admin", "VOTE_INVALIDATED", {"vote_id": 3, "reason": "Duplicate"}, "192.168.1.1", 2026-04-04 12:01:00, 2026-04-04
3, "SYSTEM", "VOUCHER_GRANTED", {"voter_nik": "123456789", "voucher_id": 1}, "192.168.1.100", 2026-04-04 10:31:00, 2026-04-04
```

---

## 🎁 **Table: vouchers** (Phase 1 NEW)

**Purpose:** Manage reward vouchers for voters

**Columns:**

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | INT | PK, AI | Voucher ID |
| code | VARCHAR(100) | UNIQUE, NOT NULL | Encrypted voucher code |
| value | DECIMAL(10,2) | NOT NULL | Amount (Rp) |
| status | ENUM | DEFAULT 'active' | 'active', 'redeemed', 'expired', 'canceled' |
| expires_at | TIMESTAMP | NULLABLE | Expiration date |
| created_by | INT | FK (users.id) | Admin who created |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes:**
```sql
UNIQUE KEY (code)
FK (created_by) → users(id)
INDEX (status)
INDEX (expires_at)
```

**Sample Data:**
```
1, "VOUCHER001", "50000.00", "active", "2026-05-31", 1, 2026-04-02, 2026-04-02
2, "VOUCHER002", "50000.00", "redeemed", "2026-05-31", 1, 2026-04-02, 2026-04-04
3, "VOUCHER003", "50000.00", "active", "2026-05-31", 1, 2026-04-02, 2026-04-02
```

---

## 🎯 **Table: voter_vouchers** (Phase 1 NEW)

**Purpose:** Track which voter received/redeemed which voucher

**Columns:**

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | INT | PK, AI | Record ID |
| voter_nik | VARCHAR(20) | FK (members.nik) | Voter NIK |
| voucher_id | INT | FK (vouchers.id) | Voucher ID |
| granted_at | TIMESTAMP | NOT NULL | When voter got voucher |
| redeemed_at | TIMESTAMP | NULLABLE | When redeemed (NULL if not yet) |
| redeemed_by | VARCHAR(255) | NULLABLE | Merchant name |
| redemption_code | VARCHAR(100) | NULLABLE | Transaction reference |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation |

**Indexes:**
```sql
UNIQUE KEY (voter_nik, voucher_id)  ← One voucher per voter
FK (voter_nik) → members(nik)
FK (voucher_id) → vouchers(id)
INDEX (redeemed_at)
```

**Sample Data:**
```
1, "123456789", 1, "2026-04-04 10:31:00", NULL, NULL, NULL, 2026-04-04 10:31:00
2, "987654321", 2, "2026-04-04 11:16:00", "2026-04-04 14:30:00", "Merchant A", "TRX123", 2026-04-04 11:16:00
3, "111222333", 3, "2026-04-04 12:01:00", NULL, NULL, NULL, 2026-04-04 12:01:00
```

---

## 🔗 **Relationships (Entity Relationship Diagram)**

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ id (PK)         │
│ username (UQ)   │  ◄──┐
│ role (NEW)      │     │
└─────────────────┘     │
        │               │
        │ created_by    │ (1:N)
        │               │
        ▼               │
┌──────────────────┐    │
│    vouchers      │    │
├──────────────────┤    │
│ id (PK)          │    │
│ code (UQ, NEW)   │    │
│ status (NEW)     │    │
└──────────────────┘    │
        │               │
        │ (1:N)         │
        │               │
        ▼               │
┌─────────────────────┐ │
│  voter_vouchers     │ │
├─────────────────────┤ │
│ id (PK)             │ │
│ voter_nik (FK, UQ)  │ │
│ voucher_id (FK, UQ) │ │
│ granted_at (NEW)    │ │
│ redeemed_at (NEW)   │ │
└─────────────────────┘ │
        │               │ (foreign key to users.id)
        │               │
        │ (donor:members.nik)
        │               │
        ▼               └───────────► (assignment)
┌─────────────────┐
│    members      │
├─────────────────┤
│ id (PK)         │
│ nik (UQ)        │
│ has_voted       │
└─────────────────┘
        │
        │ (voter in vote)
        │
        ▼
┌─────────────────┐
│     votes       │
├─────────────────┤
│ id (PK)         │
│ member_nik (FK) │
│ candidate_id(FK)│
│ is_valid        │
└─────────────────┘
        │
        │
        ▼
┌──────────────────┐
│   candidates     │
├──────────────────┤
│ id (PK)          │
│ name             │
│ is_active        │
└──────────────────┘


┌───────────────────────┐
│ election_settings     │
├───────────────────────┤
│ id (usually 1)        │
│ election_name         │
│ is_active             │
│ is_finalized          │
└───────────────────────┘


┌─────────────────┐
│  audit_logs     │
├─────────────────┤
│ id (PK)         │
│ actor           │
│ action          │
│ detail (JSON)   │
│ logged_at       │
└─────────────────┘
```

---

## 🔑 **Foreign Key Constraints**

```sql
ALTER TABLE vouchers
  ADD CONSTRAINT fk_vouchers_created_by
  FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE voter_vouchers
  ADD CONSTRAINT fk_voter_vouchers_voter
  FOREIGN KEY (voter_nik) REFERENCES members(nik),
  ADD CONSTRAINT fk_voter_vouchers_voucher
  FOREIGN KEY (voucher_id) REFERENCES vouchers(id);

ALTER TABLE votes
  ADD CONSTRAINT fk_votes_member
  FOREIGN KEY (member_nik) REFERENCES members(nik),
  ADD CONSTRAINT fk_votes_candidate
  FOREIGN KEY (candidate_id) REFERENCES candidates(id);
```

---

## 📊 **Pivot/Junction Tables**

```
voter_vouchers
├─ Single responsibility: track voucher allocation
├─ Unique constraint: (voter_nik, voucher_id)
├─ Can add timestamps: granted_at, redeemed_at
└─ Can add metadata: redemption_code, redeemed_by
```

---

## 🔍 **Query Examples**

### Count Total Votes
```sql
SELECT COUNT(*) as total_votes
FROM votes
WHERE is_valid = true;
```

### Calculate Results (50%+1)
```sql
SELECT
  c.id,
  c.name,
  COUNT(v.id) as vote_count,
  ROUND(100.0 * COUNT(v.id) / (SELECT COUNT(*) FROM votes WHERE is_valid = true), 2) as percentage
FROM candidates c
LEFT JOIN votes v ON c.id = v.candidate_id AND v.is_valid = true
GROUP BY c.id
ORDER BY vote_count DESC;
```

### Get Voted Members (For Saksi)
```sql
SELECT DISTINCT m.id, m.nik, m.name, m.site, v.created_at as voted_at
FROM members m
INNER JOIN votes v ON m.nik = v.member_nik AND v.is_valid = true
ORDER BY v.created_at DESC;
```

### Check Voucher Status
```sql
SELECT
  v.code,
  v.value,
  COALESCE(vv.redeemed_at, 'Not Redeemed') as status,
  CASE
    WHEN vv.redeemed_at IS NOT NULL THEN 'Redeemed'
    WHEN NOW() > v.expires_at THEN 'Expired'
    ELSE 'Active'
  END as current_status
FROM vouchers v
LEFT JOIN voter_vouchers vv ON v.id = vv.voucher_id;
```

### Audit Trail
```sql
SELECT * FROM audit_logs
WHERE actor = 'admin' OR action = 'VOUCHER_REDEEMED'
ORDER BY logged_at DESC
LIMIT 100;
```

---

## 🔐 **Data Privacy Notes**

| Data | Private? | Who Can See | Notes |
|------|----------|-----------|-------|
| Vote Choice | ✅ YES | Admin only | Member's nik + candidate_id = hidden |
| Member List | ⚠️ PARTIAL | Admin/Panitia | Saksi sees only voted members |
| Audit Logs | ✅ YES | Admin only | Who did what when |
| Voucher Codes | ✅ YES | Encrypted | Store encrypted in DB |
| IP Addresses | ✅ YES | Admin only | For security audit trail |

---

## 📈 **Performance Considerations**

**Indexes for common queries:**
```sql
-- Voting results calculation
INDEX votes (is_valid, candidate_id)
INDEX members (has_voted, site)

-- Saksi member view
INDEX members (has_voted)
INDEX votes (member_nik, is_valid)

-- Voucher redemption
INDEX voter_vouchers (voter_nik, voucher_id)
INDEX vouchers (status, expires_at)

-- Audit logs
INDEX audit_logs (logged_at, action)
INDEX audit_logs (actor)
```

---

## 🚀 **Migration Order (Phase 1)**

```
1. Add role='saksi' to users.role ENUM
2. Create vouchers table
3. Create voter_vouchers table
4. Add status & threshold columns to results (logic)
5. Run locally first, then on staging, then production
```

---

## ✅ **Validation Rules**

```
users.role: IN ('admin', 'panitia', 'saksi')
members.nik: NOT NULL, UNIQUE, LENGTH(20)
members.site: NOT NULL, VARCHAR(100)
candidates.name: NOT NULL, UNIQUE
vouchers.code: NOT NULL, UNIQUE, LENGTH(100)
vouchers.value: DECIMAL(10,2), >= 0
vouchers.expires_at: Can be NULL (never expires) or DATE > TODAY
votes.is_valid: BOOLEAN, cannot change after invalidated_at is set
```

---

## 📝 **Capacity Planning**

**Estimated size for 500 voters:**
```
members:          500 rows * 0.5 KB = 250 KB
candidates:       2 rows * 0.2 KB = 0.4 KB
votes:            400 rows * 0.8 KB = 320 KB
vouchers:         500 rows * 0.4 KB = 200 KB
voter_vouchers:   500 rows * 0.3 KB = 150 KB
audit_logs:       5000 rows * 0.3 KB = 1.5 MB
users:            3 rows * 0.3 KB = 0.9 KB
───────────────────────────────────────────
Total:            ~2.5 MB (easily fits in MySQL)
```

**Growth trajectory:**
- 1000 voters → 5 MB
- 5000 voters → 25 MB
- 10,000 voters → 50 MB (still comfortable)

No optimization needed unless > 100,000 voters

---

**Last Updated:** April 5, 2026
**Next Review:** After Phase 1 completion
