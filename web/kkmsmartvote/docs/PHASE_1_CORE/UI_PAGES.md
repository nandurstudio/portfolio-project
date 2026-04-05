# 🎨 UI/UX Documentation: All Pages

**Total Pages:** 10 (Admin/Voter interface)
**Last Updated:** April 5, 2026

---

## 📑 **Page Navigation Map**

```
Public (No Login)
├─ 🗳️ VoterPage (index) - Voting interface
└─ 🔐 AdminLoginPage - Admin/Panitia login

Protected (Admin/Panitia/Saksi)
├─ 📊 AdminDashboard - Results overview
├─ 👤 CandidatesPage - Candidate management
├─ 👥 MembersPage - Member management
├─ 🗳️ VotesPage - Vote details
├─ 🏆 ResultsPage - Election results
├─ 📋 AuditPage - Activity logs
├─ 🔑 UsersPage (admin) - Admin management
└─ ⚙️ SettingsPage (admin) - Configuration

NEW Phase 1
├─ 🎁 VoucherManagement (admin) - Create/redeem vouchers
└─ 📢 NotificationsPage (phase 2) - Notification center
```

---

## 🗳️ **1. VOTER PAGE (Public)**

**URL:** `/` or `/voter`
**Access:** Public (no auth required)
**Purpose:** Voting interface for members

### Layout
```
┌─────────────────────────────────────────────┐
│ Header: Election Info, Countdown Timer      │
├─────────────────────────────────────────────┤
│ Step 1: Verify Member                       │
│ ├─ Input: NIK, Name, Site                   │
│ └─ Button: Continue                         │
├─────────────────────────────────────────────┤
│ Step 2: Select Candidate (if verified)      │
│ ├─ Candidate 1 Card (avatar, name, bio)    │
│ ├─ Candidate 2 Card (avatar, name, bio)    │
│ └─ Button: Choose                           │
├─────────────────────────────────────────────┤
│ Step 3: Confirm & Success (if chosen)       │
│ ├─ Modal: "Confirm vote for X?"             │
│ └─ Button: Confirm / Cancel                 │
├─────────────────────────────────────────────┤
│ Success Alert (if voted)                    │
│ ├─ Message: "Terima kasih!"                 │
│ ├─ 🎁 VoucherModal: Display voucher code    │
│ └─ Button: Copy / Download / Done           │
├─────────────────────────────────────────────┤
│ Stats Section (always visible)              │
│ ├─ Total Members: 500                       │
│ ├─ Voted: 250 (50%)                         │
│ ├─ Threshold: 51/100 (new)                  │
│ └─ Time Remaining: 2 hrs                    │
└─────────────────────────────────────────────┘
```

### Components
- **VerifyForm** - Input member data
- **CandidateCard** - Show candidate (avatar, name, bio)
- **ConfirmModal** - Confirm before voting
- **VoucherModal** (NEW) - Show granted voucher after voting
- **StatsBar** - Real-time election info

### State Flow
```
Start → Verify Member → Select Candidate → Confirm → Vote Recorded → Show Voucher → Done
   ↓ (error)           ↓ (refusal)       ↓ (error)
  Error               Back to Start
```

### Info Displayed
- 📅 Election name, period, dates
- ⏰ Start/end times, countdown
- 👥 Total members, voted count, percentage
- 🎯 Threshold: "51 dari 100" (50%+1)
- 📍 Site/location (if multi-site)

---

## 🔐 **2. ADMIN LOGIN PAGE**

**URL:** `/admin` or `/admin/login`
**Access:** Public
**Purpose:** Authenticate admin/panitia/saksi (NEW)

### Layout
```
┌──────────────────────────┐
│ Logo / Title             │
├──────────────────────────┤
│ Login Form:              │
│ ├─ Username input        │
│ ├─ Password input        │
│ └─ Button: Login         │
├──────────────────────────┤
│ Demo Accounts (info box) │
│ ├─ admin / password      │
│ ├─ panitia1 / password   │
│ └─ saksi_observer / pwd  │
├──────────────────────────┤
│ Error Message (if fail)  │
│ └─ "Invalid credentials" │
└──────────────────────────┘
```

### Features
- Form validation (client + server)
- Loading state on button
- Error display on fail
- Demo account info visible
- Link back to voter page
- (Saksi role can login same way - NEW)

### POST Request
```json
POST /api/auth/login
{
  "username": "admin",
  "password": "password"
}

Response:
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "role": "admin"  // or "panitia" or "saksi" (NEW)
}
```

---

## 📊 **3. ADMIN DASHBOARD**

**URL:** `/admin` or `/admin/dashboard`
**Access:** Protected (admin/panitia/saksi)
**Purpose:** Overview of election results & statistics

### Layout
```
┌──────────────────────┬──────────────────────┐
│ Stat Card: Suara Sah │ Stat Card: Total     │
│ 250 votes            │ 500 members          │
├──────────────────────┼──────────────────────┤
│ Stat Card: Partisipasi  │  Stat Card: Tidak Sah │
│ 50%                     │ 0 votes               │
├─────────────────────────────────────────────┤
│ Results Chart (Real-time votes)             │
│ ├─ Candidate A: 55 votes (55%) ████████    │
│ └─ Candidate B: 45 votes (45%) ██████      │
├─────────────────────────────────────────────┤
│ Threshold Info (NEW):                       │
│ "Ambang batas: 51 dari 100" (50%+1)        │
├─────────────────────────────────────────────┤
│ Status Badge (NEW):                         │
│ "🏆 PEMENANG: Candidate A" (if qualified)  │
│ or "⚠️ TIE" or "⚠️ NO_MAJORITY"             │
├─────────────────────────────────────────────┤
│ Admin Action:                               │
│ └─ Button: "Finalisasi Hasil" (admin only)  │
└─────────────────────────────────────────────┘
```

### Components
- **StatCard** - Vote counts, percentages
- **VotesChart** - Bar chart of candidate votes
- **ThresholdInfo** (NEW) - Show 50%+1 calculation
- **StatusBadge** (NEW) - WINNER/TIE/NO_MAJORITY
- **ActionButton** - Finalize results (admin only)

### Real-time Updates
- Auto-update every 10 seconds (or WebSocket later)
- No page refresh needed
- Smooth transitions

---

## 👤 **4. CANDIDATES PAGE**

**URL:** `/admin/candidates`
**Access:** Protected (view: all, edit: admin/panitia only)
**Purpose:** Manage candidates & view vote counts

### Layout
```
┌──────────────────────────────┐
│ Title: Candidates            │
├──────────────────────────────┤
│ Button: "+ Tambah Kandidat"  │
├──────────────────────────────┤
│ Card View:                   │
│ ┌────────────────────────┐   │
│ │ Avatar (initial name)  │   │
│ ├────────────────────────┤   │
│ │ Name: John Doe         │   │
│ │ Position: Ketua        │   │
│ │ Bio: Experienced...    │   │
│ │ Votes: 55 (live)       │   │
│ │ Status: Active ✓       │   │
│ ├────────────────────────┤   │
│ │ Buttons:               │   │
│ │ ├─ [Edit] (auth only)  │   │
│ │ └─ [Delete] (auth only)│   │
│ └────────────────────────┘   │
└──────────────────────────────┘
```

### Features
- View all candidates
- (Admin/Panitia) Add new candidate
- (Admin/Panitia) Edit candidate details
- (Admin/Panitia) Delete candidate
- (Saksi) View only, no edit buttons (NEW)
- Real-time vote count

### Modal (Add/Edit)
```
Form: Add/Edit Candidate
├─ Name (text, required)
├─ Position (dropdown)
├─ Bio (textarea)
├─ Photo URL (text, optional)
└─ Buttons: Save / Cancel
```

---

## 👥 **5. MEMBERS PAGE**

**URL:** `/admin/members`
**Access:** Protected (admin/panitia see all, saksi see voted only - NEW)
**Purpose:** Manage member registration & voting status

### Layout (Admin/Panitia)
```
┌──────────────────────────────────────────┐
│ Title: Members                           │
├──────────────────────────────────────────┤
│ Button: "+ Tambah Anggota" (admin only)  │
├──────────────────────────────────────────┤
│ Search Box: "Cari NIK atau nama..."       │
├──────────────────────────────────────────┤
│ Table:                                   │
│ ┌──────┬─────┬──────┬──────────┬──────┐ │
│ │ NIK  │Name │Site  │Status    │Action│ │
│ ├──────┼─────┼──────┼──────────┼──────┤ │
│ │123456│John │Site A│✅ Voted  │Edit  │ │
│ │654321│Jane │Site B│❌ Not    │Edit  │ │
│ └──────┴─────┴──────┴──────────┴──────┘ │
└──────────────────────────────────────────┘
```

### Layout (Saksi - NEW)
```
┌──────────────────────────────────────────┐
│ Title: Members (Voted Only)              │
├──────────────────────────────────────────┤
│ Filter: "Tampilkan hanya yang memilih"   │
├──────────────────────────────────────────┤
│ Table (Voted Members Only + Timestamp):  │
│ ┌──────┬─────┬──────┬──────────────┐   │
│ │ NIK  │Name │Site  │Voted At      │   │
│ ├──────┼─────┼──────┼──────────────┤   │
│ │123456│John │Site A│04/04 10:30   │   │
│ │654321│Jane │Site B│04/04 11:15   │   │
│ └──────┴─────┴──────┴──────────────┘   │
│ (No edit buttons for Saksi!)            │
└──────────────────────────────────────────┘
```

### Features
- List members with status
- Search by NIK or name
- Add member (admin only)
- Edit member (admin/panitia, hidden for saksi - NEW)
- Status badges: ✅ Voted / ❌ Not Voted
- Per-site breakdown (optional)

### Modal (Add/Edit)
```
Form: Add/Edit Member
├─ NIK (text, required, unique)
├─ Name (text, required)
├─ Site (dropdown)
└─ Buttons: Save / Cancel
```

---

## 🗳️ **6. VOTES PAGE (Recap)**

**URL:** `/admin/votes`
**Access:** Protected (admin/panitia/saksi)
**Purpose:** View all recorded votes with validation status

### Layout
```
┌──────────────────────────────────────────────────┐
│ Title: Rekap Suara (Vote Summary)                │
├──────────────────────────────────────────────────┤
│ Stats: Total 250, Valid 250, Invalid 0           │
├──────────────────────────────────────────────────┤
│ Table:                                           │
│ ┌──────┬──────┬──────┬────────┬──────┬────────┐ │
│ │NIK   │Name  │Site  │Kandida │Time  │Status  │ │
│ │      │      │      │t       │      │        │ │
│ ├──────┼──────┼──────┼────────┼──────┼────────┤ │
│ │12345 │John  │Site A│(Hidden)│10:30 │✅ Sah  │ │
│ │65432 │Jane  │Site B│(Hidden)│11:15 │✅ Sah  │ │
│ │11122 │Bob   │Site A│(Hidden)│12:00 │❌ TdkSh│ │
│ └──────┴──────┴──────┴────────┴──────┴────────┘ │
│ (Action: Invalidate button for valid votes)     │
└──────────────────────────────────────────────────┘
```

### Features
- List all votes with details
- Vote choice shown as "(Hidden)" - privacy protection
- Status: ✅ Valid / ❌ Invalid
- (Admin/Panitia) Can invalidate vote
- Invalidation reason prompt
- Real-time count updates

### Important
- **Vote choice is ALWAYS hidden** (privacy!)
- Can see voter identity (transparency for admins)
- Can see timestamp (audit trail)
- Cannot show who voted for whom

---

## 🏆 **7. RESULTS PAGE**

**URL:** `/admin/results`
**Access:** Protected (admin/panitia/saksi)
**Purpose:** Final election results & declaration

### Layout
```
┌──────────────────────────────────────────────┐
│ Title: Hasil Pemilihan                        │
├──────────────────────────────────────────────┤
│ Voting Method Explanation (NEW):             │
│ "Pemenang = Suara terbanyak + Min. 50%+1"   │
├──────────────────────────────────────────────┤
│ Threshold Info (NEW):                        │
│ ┌──────────────────────────────────────────┐ │
│ │ Ambang Batas (Threshold): 51 dari 100    │ │
│ │ Total Suara Sah: 100                     │ │
│ └──────────────────────────────────────────┘ │
├──────────────────────────────────────────────┤
│ Result Status Banner (NEW):                  │
│ ┌──────────────────────────────────────────┐ │
│ │ 🏆 PEMENANG: Candidate A - 55 (55%)       │ │
│ │ ✅ Mencapai ambang batas 50%+1            │ │
│ └──────────────────────────────────────────┘ │
│ OR                                           │
│ ┌──────────────────────────────────────────┐ │
│ │ ⚠️ TERJADI SERI (TIE)                     │ │
│ │ 2 kandidat sama: 50 suara                │ │
│ │ Diperlukan putaran kedua                 │ │
│ └──────────────────────────────────────────┘ │
│ OR                                           │
│ ┌──────────────────────────────────────────┐ │
│ │ ⚠️ BELUM ADA PEMENANG (NO_MAJORITY)       │ │
│ │ Tertinggi: 40 suara (40%) < 50%+1        │ │
│ │ Diperlukan runoff/revote                 │ │
│ └──────────────────────────────────────────┘ │
├──────────────────────────────────────────────┤
│ Results Table:                               │
│ ┌──┬─────────┬──────┬────────┬────────────┐ │
│ │#│Kandidat │Suara │Persentase│Status     │ │
│ ├──┼─────────┼──────┼────────┼────────────┤ │
│ │1│John Doe │55    │55%     │✅ WINNER   │ │
│ │2│Jane Smith│45   │45%     │❌ Not Qual.│ │
│ └──┴─────────┴──────┴────────┴────────────┘ │
│ (Status badges: Green=WINNER, Orange=TIE,   │
│  Red=NO_MAJORITY)                            │
├──────────────────────────────────────────────┤
│ Admin Action:                                │
│ └─ Button: "Finalisasi Hasil" (admin only)   │
│    └─ Confirmation modal before locking      │
└──────────────────────────────────────────────┘
```

### Components (NEW)
- **ThresholdDisplay** - Show "51 dari 100"
- **MethodExplanation** - "Pemenang = ..."
- **ResultStatus** (NEW) - WINNER/TIE/NO_MAJORITY badge
- **QualificationMarker** (NEW) - ✅/❌ for each candidate
- **ResultsChart** - Visual representation
- **FinalizeButton** (admin) - Lock results

### Features
- Display winner clearly
- Show why each candidate qualified or not
- Explain voting method
- (Admin only) Can finalize results
- After finalization: Results locked, cannot change
- Cannot invalidate votes after finalization

---

## 📋 **8. AUDIT LOGS PAGE**

**URL:** `/admin/audit`
**Access:** Protected (admin/panitia, and Saksi - NEW)
**Purpose:** Track all system activities

### Layout
```
┌────────────────────────────────────────────┐
│ Title: Audit Trail / Riwayat Aktivitas     │
├────────────────────────────────────────────┤
│ Filters:                                   │
│ ├─ Date Range                              │
│ ├─ Action (dropdown: all, login, create...) │
│ └─ Actor (dropdown: all users)              │
├────────────────────────────────────────────┤
│ Table:                                     │
│ ┌───────┬────────┬──────┬────────┬────────┐│
│ │Time   │Actor   │Action│Detail  │IP      ││
│ ├───────┼────────┼──────┼────────┼────────┤│
│ │10:30  │admin   │LOGIN │"admin" │192.x.x││
│ │10:45  │SYSTEM  │VOTE_ │{"voter"│192.x.x││
│ │       │        │RECORD│"123"}  │        ││
│ │12:00  │admin   │VOTE_ │{"vote_ │192.x.x││
│ │       │        │INVALID│id":3}  │        ││
│ └───────┴────────┴──────┴────────┴────────┘│
│ (Detail expandable, shows JSON)             │
└────────────────────────────────────────────┘
```

### Features
- List all auditable actions
- Timestamp, actor, action, detail, IP
- Detail JSON expandable
- Filter by date range, action type, actor
- Immutable (cannot delete/edit)
- Saksi can see audit logs (transparency - NEW)

### Logged Actions
- LOGIN / LOGOUT
- ADD / EDIT / DELETE Candidate
- ADD / EDIT / DELETE Member
- VOTE_RECORDED
- VOTE_INVALIDATED
- FINALIZE_RESULTS
- VOUCHER_CREATED (NEW)
- VOUCHER_GRANTED (NEW)
- VOUCHER_REDEEMED (NEW)
- UPDATE SETTINGS

---

## 🔑 **9. USERS PAGE (Admin Only)**

**URL:** `/admin/users`
**Access:** Protected (admin only)
**Purpose:** Manage admin/panitia/saksi accounts (NEW role)

### Layout
```
┌──────────────────────────────────────┐
│ Title: Pengguna Sistem               │
├──────────────────────────────────────┤
│ Button: "+ Tambah Pengguna"          │
├──────────────────────────────────────┤
│ Table:                               │
│ ┌──────────┬──────────┬────────────┐ │
│ │Nama      │Username  │Role        │ │
│ │          │          │(NEW)       │ │
│ ├──────────┼──────────┼────────────┤ │
│ │Admin     │admin     │🔴 Admin    │ │
│ │Panitia 1 │panitia1  │🔵 Panitia  │ │
│ │Saksi     │saksi_obs │🟢 Saksi    │ │
│ │          │          │   (NEW)    │ │
│ ├──────────┴──────────┴────────────┴──
│ │ Delete button (except current user)│
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

### Features
- List all admin accounts
- Role badges: Admin (red), Panitia (blue), Saksi (green - NEW)
- Add new user (admin only)
- Delete user (admin only, not self)
- Password reset (optional)

### Modal (Add)
```
Form: Add User
├─ Nama Lengkap (text, required)
├─ Username (text, required, unique)
├─ Password (text, required)
├─ Role (dropdown: admin, panitia, saksi)  ← NEW
└─ Buttons: Create / Cancel
```

---

## ⚙️ **10. SETTINGS PAGE (Admin Only)**

**URL:** `/admin/settings`
**Access:** Protected (admin only)
**Purpose:** Configure election parameters

### Layout
```
┌──────────────────────────────────────┐
│ Title: Pengaturan Pemilihan           │
├──────────────────────────────────────┤
│ Form:                                │
│ ├─ Nama Pemilihan (text)             │
│ ├─ Periode (text: "2026-2029")        │
│ ├─ Tanggal Mulai (date picker)        │
│ ├─ Tanggal Selesai (date picker)      │
│ ├─ Jam Selesai (time picker)          │
│ ├─ Status (toggle: Aktif/Tidak Aktif)│
│ └─ Button: Simpan Pengaturan          │
├──────────────────────────────────────┤
│ Current Settings (read-only):         │
│ ├─ Pemilihan aktif: ✅ Ya             │
│ ├─ Finalisasi: ❌ Tidak               │
│ └─ Sisa waktu: 2 jam 30 menit         │
└──────────────────────────────────────┘
```

### Features
- Edit election name, dates, times
- Toggle election active/inactive
- Validation: end date > start date
- Save success message
- Read-only display of current status

---

## 🎁 **NEW: VOUCHER MANAGEMENT (Admin)**

**URL:** `/admin/vouchers`
**Access:** Protected (admin/panitia)
**Purpose:** Create & manage voucher rewards (Phase 1 NEW)

### Layout
```
┌────────────────────────────────────┐
│ Title: Manajemen Voucher (NEW)      │
├────────────────────────────────────┤
│ Button: "+ Generate Batch"          │
├────────────────────────────────────┤
│ Create Form (Collapsed):            │
│ ├─ Quantity (number)                │
│ ├─ Value (Rp amount)                │
│ ├─ Expires At (date)                │
│ └─ Button: Generate                 │
├────────────────────────────────────┤
│ Vouchers Table:                     │
│ ┌──────┬────────┬──────┬──────────┐ │
│ │Code  │Value   │Status │Redeemed │ │
│ │      │        │       │At       │ │
│ ├──────┼────────┼──────┼──────────┤ │
│ │REC001│50,000  │Active│-         │ │
│ │REC002│50,000  │Reedm.│04/04 2pm │ │
│ └──────┴────────┴──────┴──────────┘ │
│ (Filters: Status, Date range)       │
├────────────────────────────────────┤
│ Stats:                              │
│ ├─ Generated: 500                   │
│ ├─ Redeemed: 250 (50%)              │
│ └─ Total Value: Rp 25,000,000       │
└────────────────────────────────────┘
```

### Features
- Generate batch of vouchers
- View code, value, status, redeemed date
- Filter by status, date range
- Export codes (optional)
- Statistics dashboard

---

## 🔐 **Permission Matrix (Updated with Saksi Role)**

| Feature | Admin | Panitia | Saksi (NEW) | Voter |
|---------|-------|---------|-------------|-------|
| Voting | ✅ | ✅ | ❌ | ✅ |
| Login (Admin) | ✅ | ✅ | ✅ (NEW) | - |
| Dashboard | ✅ | ✅ | ✅ (NEW) | - |
| Candidates (View) | ✅ | ✅ | ✅ | - |
| Candidates (Edit) | ✅ | ❌ | ❌ | - |
| Members (All) | ✅ | ✅ | ❌ | - |
| Members (Voted Only) | ✅ | ✅ | ✅ (NEW) | - |
| Members (Add) | ✅ | ❌ | ❌ | - |
| Votes (View) | ✅ | ✅ | ✅ (NEW) | - |
| Votes (Invalidate) | ✅ | ❌ | ❌ | - |
| Results | ✅ | ✅ | ✅ (NEW) | - |
| Results (Finalize) | ✅ | ❌ | ❌ | - |
| Audit Logs | ✅ | ✅ | ✅ (NEW) | - |
| Users | ✅ | ❌ | ❌ | - |
| Settings | ✅ | ❌ | ❌ | - |
| Vouchers (Mgmt) | ✅ (NEW) | ✅ (NEW) | ❌ | - |
| Vouchers (View After Vote) | ✅ | ✅ | - | ✅ |

---

## 🎨 **Responsive Design**

All pages responsive for:
- 📱 Mobile (< 768px)
- 💻 Tablet (768px - 1024px)
- 🖥️ Desktop (> 1024px)

Key breakpoints:
- **Mobile:** Stack layout, full-width inputs
- **Tablet:** 2-column layout, larger tap targets
- **Desktop:** Multi-column, full-featured layout

---

## ✨ **UI Components Used**

- **Card** - Display info sections
- **Modal** - Confirmations, forms
- **Table** - List data with sorting/filtering
- **Badge** - Status indicators (✅/❌)
- **Progress Bar** - Vote counts, thresholds
- **Chart** - Results visualization
- **Form Inputs** - Text, dropdown, date, time
- **Button** - Actions (Save, Delete, etc)
- **Alert** - Messages (success, error, warning)

---

## 🎨 **Color Scheme**

- **Green (#4CAF50)** - Success, Valid, Winner, Saksi role
- **Red (#F44336)** - Error, Invalid, Danger
- **Blue (#2196F3)** - Info, Panitia role, Primary actions
- **Orange (#FF9800)** - Warning, TIE, Pending
- **Gray (#757575)** - Disabled, Inactive
- **Dark (#212121)** - Text, Primary
- **Light (#FAFAFA)** - Backgrounds

---

## 🔄 **Real-time Updates**

Pages that auto-update:
- **Dashboard** - Votes every 10 sec (or WebSocket later)
- **Candidates** - Vote counts every 10 sec
- **Results** - Calculations every 10 sec
- **Stats** - Percentages every time data changes

---

**Last Updated:** April 5, 2026
**Next Update:** During Phase 1 development
