# 🎯 KKM Smart Vote - START HERE

**Live URL:** https://kkmsmartvote.web.id
**Status:** MVP Stabilization Complete | Landing Page Phase Started
**Last Updated:** April 8, 2026

---

## 📌 **Quick Navigation**

### 🔥 **If You're NEW to the Project**
1. Read: [INDEX.md](./INDEX.md) - (5 min overview)
2. Read: [MEETINGS.md](./MEETINGS.md) - What was decided
3. Read: [PHASE_1_CORE/REQUIREMENTS.md](./PHASE_1_CORE/REQUIREMENTS.md) - What to build

### 🛠️ **If You're DEVELOPING**
1. Check: [PHASE_1_CORE/ROADMAP.md](./PHASE_1_CORE/ROADMAP.md) - Task breakdown
2. Check: [PHASE_1_CORE/UI_PAGES.md](./PHASE_1_CORE/UI_PAGES.md) - UI/UX reference
3. Check: [DATABASE_API/SCHEMA.md](./DATABASE_API/SCHEMA.md) - Data structure
4. Check: [PHASE_2_NEXT/LANDING_PAGE_ROADMAP_V2.md](./PHASE_2_NEXT/LANDING_PAGE_ROADMAP_V2.md) - Landing page execution plan

### 📊 **If You're MANAGING**
1. Read: [PHASE_1_CORE/STATUS.md](./PHASE_1_CORE/STATUS.md) - Current status
2. Check: [PHASE_1_CORE/ROADMAP.md](./PHASE_1_CORE/ROADMAP.md) - Timeline
3. Read: [NEXT_STEPS.md](./NEXT_STEPS.md) - What's next

---

## 🎨 **Current Architecture (MVP)**

```
Frontend (Vite + React)          Backend (Laravel 11)
├── VoterPage                    ├── /api/auth (JWT)
├── AdminLogin                   ├── /api/candidates
├── AdminDashboard               ├── /api/members
├── CandidatesPage              ├── /api/votes
├── MembersPage                 ├── /api/results
├── VotesPage                   └── /api/audit
├── ResultsPage
├── AuditPage
├── UsersPage (admin)
└── SettingsPage (admin)
                    MySQL Database (koperasi_vote)
                    ├── Users, Members, Candidates
                    ├── Votes, ElectionSettings, AuditLogs
                    └── Indexes, Foreign Keys
```

---

## 📋 **What's Done (MVP Phase 0)**

✅ User authentication (Admin/Panitia/Voter)
✅ Voter registration & verification
✅ Candidate management
✅ Vote casting & recording
✅ Results dashboard
✅ Audit logging
✅ Role-based access control

---

## 📍 **Current Progress Snapshot (April 8, 2026)**

### Completed
- OTP 2-layer flow stabilized (request OTP -> verify OTP -> member lookup).
- Route cleanup done (legacy/duplicate page imports removed).
- Unauthorized access guard for `/vote` improved (clear message + auto-redirect).
- Core docs updated and centralized in `docs/`.
- Landing page public route active on `/` with dedicated OTP entry on `/otp`.
- Landing UI status badge + hero candidate dummy + single-link footer implemented.
- Landing reward notice implemented with prepared setting model (`reward_enabled`, `reward_text`) and dummy fallback.
- Landing page roadmap v2 finalized, including:
    - state flow (`coming_soon`, `open`, `closed`),
    - mini activity log public,
    - SEO metadata + OG image strategy,
    - footer watermark branding.

### In Progress
- Landing page implementation as first execution priority.
- Admin-driven event settings contract finalization.

### Next Priority (Execution Order)
1. Landing page state-driven UI (public first).
2. Admin settings for event state/timeline/content/SEO.
3. Activity log public module (top 10 + collapsible + pagination).
4. Server-side vote gate hardening per state & time window.

---

## 🚀 **What's Next (Execution Focus)**

### Phase A: Landing Page First
- Build state-based public landing (`coming_soon`, `open`, `closed`).
- Integrate dynamic countdown logic from admin settings.
- Add candidate cards + agenda block + watermark footer.
- Add SEO meta, Open Graph, Twitter card, and event-driven og:image.

### Phase B: Admin Controls for Landing
- Election settings (status, start, duration, end, announcement).
- Landing content settings (hero text, countdown toggle, activity log toggle).
- SEO settings (title, description, og title/description/image, canonical).
- Invitation settings (offline/online/hybrid + invited users).

### Phase C: Public Activity + Post-Vote Event
- Mini activity log (top 10, collapsible, simple pagination).
- Closed state turnout percentage and countdown to announcement event.
- Invitation highlight: offline invited users vs online invited users.

---

## 📂 **Documentation Structure**

```
docs/
├── 00_START_HERE.md              ← You are here
├── INDEX.md                       ← Full documentation index
├── MEETINGS.md                    ← Meeting decisions & notes
├── NEXT_STEPS.md                  ← Implementation suggestions
│
├── PHASE_1_CORE/
│   ├── REQUIREMENTS.md            ← Detailed feature specs
│   ├── ROADMAP.md                 ← Tasks & timeline
│   ├── STATUS.md                  ← Progress tracking
│   └── UI_PAGES.md                ← UI/UX documentation
│
├── PHASE_2_NEXT/
│   ├── LANDING_PAGE_ROADMAP_V2.md ← Landing page execution blueprint
│   └── FEATURES.md                ← Notifications & Real-time
│
└── DATABASE_API/
    ├── SCHEMA.md                  ← Database design
    └── ENDPOINTS.md               ← API specifications (TBD)
```

---

## 🎯 **Key Decisions Made**

1. ✅ **Voting Method:** Qualified Majority (50%+1) - More fair
2. ✅ **Execution Priority:** Landing page first before next feature batch
3. ✅ **State Model:** `coming_soon` -> `open` -> `closed` controlled by admin
4. ✅ **Open State:** Voting countdown duration default 2 days from settings
5. ✅ **Closed State:** Turnout progress + countdown to announcement event
6. ✅ **Public Transparency:** Mini activity log (top 10, collapsible, pagination)
7. ✅ **SEO Requirement:** Dynamic event metadata + Open Graph image + canonical
8. ✅ **UI Requirement (Global):** Semua UI wajib full support multiple device (mobile/tablet/desktop)

---

## 📱 **Global UI Rule: Multi-Device Support (Mandatory)**

Semua halaman UI (public + admin) wajib lolos standar responsive berikut:

1. Mobile-first layout, tidak ada horizontal scroll di viewport utama.
2. Breakpoint minimum yang diuji: `<= 480`, `481-768`, `769-1024`, `>1024`.
3. Komponen inti tetap usable di touch device:
    - tombol/aksi punya area klik memadai,
    - form input tidak terpotong,
    - modal bisa di-scroll dengan aman.
4. Tabel data admin wajib punya fallback mobile:
    - stacked cards, atau
    - horizontal scroll terkontrol dengan sticky header minimum.
5. Semua CTA penting tetap terlihat tanpa overlap pada layar kecil.
6. Testing wajib lintas device sebelum status task dinyatakan done.

---

## 🔗 **Important Links**

- **Live Site:** https://kkmsmartvote.web.id
- **Local Dev:** http://koperasi-vote.local (Laragon)
- **Database:** koperasi_vote (MySQL)
- **GitHub Repo:** web/kkmsmartvote/
- **Backup:** `.backups/koperasi-vote-sensitive-*`

---

## 👥 **Team**

| Role | Name |
|------|------|
| Product Lead | Tia Handayani |
| Stakeholder | Rudy, Gunawan |
| Developer | You! |

---

## 🚀 **Next Action**

**Recommended immediate path (all roles):**

1. Read [PHASE_2_NEXT/LANDING_PAGE_ROADMAP_V2.md](./PHASE_2_NEXT/LANDING_PAGE_ROADMAP_V2.md)
2. Execute Landing Page First plan (Phase A)
3. Continue to Phase B (Admin Controls) and Phase C (Activity + Announcement)

**Choose your role:**

👨‍💼 **Manager?**
→ Read [MEETINGS.md](./MEETINGS.md) + [PHASE_1_CORE/ROADMAP.md](./PHASE_1_CORE/ROADMAP.md)

👨‍💻 **Backend Dev?**
→ Read [PHASE_1_CORE/REQUIREMENTS.md](./PHASE_1_CORE/REQUIREMENTS.md) + [DATABASE_API/SCHEMA.md](./DATABASE_API/SCHEMA.md)

👨‍🎨 **Frontend Dev?**
→ Read [PHASE_1_CORE/UI_PAGES.md](./PHASE_1_CORE/UI_PAGES.md) + [PHASE_1_CORE/REQUIREMENTS.md](./PHASE_1_CORE/REQUIREMENTS.md)

🧪 **QA/Tester?**
→ Read [PHASE_1_CORE/REQUIREMENTS.md](./PHASE_1_CORE/REQUIREMENTS.md) (testing checklist)

---

**Status:** Landing page-first execution is active
**Current Focus:** Public landing + admin-driven state/SEO settings
**Difficulty:** Medium-high (state orchestration + SEO + server-side gate)
