# 📅 Phase 1 Implementation Roadmap

**Timeline:** 2-3 weeks (Start: Apr 2 | End: Apr 23)
**Priority:** HIGH
**Status:** 🚫 TODO

---

## 🗂️ **Task Breakdown by Feature**

---

## 🎯 **Feature 1: Saksi Forensik Role (2-3 days)**

### Database Tasks (Day 1)
- [ ] Verify `users.role` includes `saksi_forensik`
- [ ] Verify deployment to production

### Backend Tasks (Day 1-2)
- [ ] Update User model (role enum validation)
- [ ] Update AuthController
  - Support 'saksi_forensik' role login
  - Return correct role in JWT token
- [ ] Create SaksiController
  - GET /api/members/voted-only (filtered query)
  - Only expose voted members + timestamp
- [ ] Update authorization middleware
  - `role:admin,panitia` → `role:admin,panitia,saksi_forensik`
- [ ] Update audit logging
  - Log "SAKSI_LOGIN" actions

### Frontend Tasks (Day 2)
- [ ] Create SaksiForensikLoginPage component
  - Reuse AdminLoginPage logic
  - Same form, same validation
- [ ] Update AdminLayout sidebar
  - Show conditional menu based on role
  - Saksi Forensik: Hide Users, Settings, Vouchers menu
  - Saksi Forensik: Show Dashboard, Candidates, Members (voted), Votes, Results
- [ ] Update MembersPage component
  - Add role check
  - If saksi_forensik: Hide "Add" button, show only voted members
  - If saksi_forensik: Hide edit/delete buttons
- [ ] Create API call for voted members only
  - Update Zustand store to handle role-based filtering

### Testing (Day 3)
- [ ] Unit tests: Saksi Forensik authorization middleware
- [ ] Integration tests: Saksi Forensik login flow
- [ ] E2E tests:
  - Login as saksi_forensik
  - Verify cannot see unvoted members
  - Verify cannot see edit forms
  - Verify can see results & audit logs

**Estimated Effort:** 2-3 days
**Team:** 1 Backend Dev (1.5 days) + 1 Frontend Dev (1 day)

---

## 🏆 **Feature 2: 50%+1 Voting Method (2-3 days)**

### Backend Tasks (Day 1-2)
- [ ] Analysis: Review current results calculation
- [ ] Update Results model/logic
  ```php
  // OLD: Just count votes per candidate
  // NEW: Calculate threshold, determine status (WINNER/TIE/NO_MAJORITY)
  ```
- [ ] Create migration: `update_results_for_qualified_majority`
  - Add `status` column (ENUM: WINNER, TIE, NO_MAJORITY)
  - Add `threshold` column (integer)
- [ ] Implement calculation method
  ```php
  public function calculateQualifiedMajority()
  {
    $totalVotes = $this->totalValidVotes();
    $threshold = ceil($totalVotes * 0.5) + 1;

    foreach ($candidates as $candidate) {
      $voteCount = $candidate->validVotes();
      $candidate->qualified = $voteCount >= $threshold;
      $candidate->status = $this->determineStatus($voteCount, $threshold);
    }
  }
  ```
- [ ] Update API endpoint: `GET /api/results`
  - Include `threshold` in response
  - Include `status` per candidate
  - Include `qualified` boolean
- [ ] Update election settings (if storing method)
  - Keep election settings aligned with current schema fields only
- [ ] Test calculation with edge cases
  - Exactly 50% (should NOT be winner)
  - 50%+1 exactly (should be winner)
  - Three candidates, no majority

### Frontend Tasks (Day 2)
- [ ] Update Results page display
  - Show threshold prominently: "Ambang batas: 51 dari 100 suara"
  - Show visual threshold line on chart
- [ ] Update Results table
  - Add `qualified` column (show ✅ or ❌)
  - Add `status` badge (WINNER/TIE/NO_MAJORITY)
  - Color code: Green (Winner), Orange (TIE), Red (NO_MAJORITY)
- [ ] Update Dashboard cards
  - Change "Partisipasi %" to "Threshold: X/Y votes"
  - Show progress to threshold
- [ ] Update InfoComponent/InfoSection
  - Show method explanation: "Pemenang = Suara terbanyak + Minimum 50%+1"

### Testing (Day 3)
- [ ] Unit tests: Threshold calculation
  ```
  totalVotes: 100 → threshold: 51 ✓
  totalVotes: 101 → threshold: 51 ✓
  totalVotes: 99 → threshold: 50 ✓
  ```
- [ ] Edge cases:
  - [ ] Tied votes (2 candidates)
  - [ ] Three candidates, no majority
  - [ ] Exactly 50% (not qualified)
  - [ ] Exactly 50%+1 (qualified)
- [ ] Integration tests: Results calculation accuracy
- [ ] Manual verification: Calculate 5 scenarios by hand, compare

**Estimated Effort:** 2-3 days
**Team:** 1 Backend Dev (1.5 days) + 1 Frontend Dev (1.5 days)

---

## 🎁 **Feature 3: Voucher System (4-5 days)**

### Database Tasks (Day 1)
- [ ] Create migration: `create_vouchers_table`
- [ ] Create migration: `create_voter_vouchers_table`
- [ ] Verify constraints & indexes
- [ ] Seed test data (10 vouchers)

### Backend Tasks (Day 2-3)
- [ ] Create Voucher model & migration
- [ ] Create VoterVoucher pivot model
- [ ] Create VoucherController
  - `POST /api/vouchers` - Create batch
  - `GET /api/vouchers` - List (with pagination & filters)
  - `POST /api/vouchers/{id}/grant` - Grant to voter (called after vote)
  - `POST /api/vouchers/redeem` - Redeem voucher
  - `POST /api/vouchers/validate` - Check validity
- [ ] Implement validation rules
  - One-time use check
  - Expiration date check
  - Ownership verification
- [ ] Implement audit logging
  - Log: VOUCHER_CREATED, VOUCHER_GRANTED, VOUCHER_REDEEMED
- [ ] Update Vote model
  - After successful vote, trigger grant-voucher
  - Add hook: `protected $dispatchesEvents = ['created' => VoteCreated::class]`
  - In VoteCreated event: Call `/vouchers/grant`

### Frontend Tasks (Day 3-4)
- [ ] Create VoucherManagement page (admin only)
  - Form: Quantity, Value, Expires At
  - Submit: Generate codes (API call)
  - Table: List all vouchers with status & filters
  - Actions: Export CSV, Delete (if not redeemed)
- [ ] Create VoucherModal (after voting success)
  - Show: Code, Value, Expiration, Instructions
  - Actions: Copy to clipboard, Download PDF
  - Auto-show after vote success (modal.open())
- [ ] Create VoucherRedemptionHistory page
  - Table: Voter, Voucher Code, Value, Redeemed Date, Merchant
  - Filters: Date range, status
  - Stats: Total redeemed, Count, Success rate
- [ ] Integrate into VoterPage
  - After successful voting → Show VoucherModal with code
  - Auto-copy on demand

### Testing (Day 4-5)
- [ ] Unit tests:
  - [ ] Expiration logic
  - [ ] One-time use validation
  - [ ] Ownership check
  - [ ] Code generation (uniqueness)
- [ ] Integration tests:
  - [ ] End-to-end voting → voucher grant → redemption flow
  - [ ] Prevent double-redeem
  - [ ] Prevent expired redemption
- [ ] Load testing:
  - [ ] 1000 vouchers generated
  - [ ] 100 concurrent redemptions
  - [ ] Response time < 500ms
- [ ] Security tests:
  - [ ] Attempt to redeem others' vouchers (should fail)
  - [ ] Attempt to redeem twice (should fail)
  - [ ] SQL injection on code (should be sanitized)

**Estimated Effort:** 4-5 days
**Team:** 1 Backend Dev (2 days) + 1 Frontend Dev (2 days) + QA (0.5 day)

---

## 📊 **Timeline Visualization**

```
Week 1 (Apr 2-9)
│
├─ [SAKSI FORENSIK ROLE]━━━━━━━ 2-3 days ✓
│  ├─ DB Migration (Day 1)
│  ├─ Backend Auth (Day 1-2)
│  └─ Frontend UI (Day 2)
│
├─ [50%+1 VOTING]━━━━━━━━━━━━━━ 2-3 days ✓
│  ├─ Backend Logic (Day 1-2)
│  ├─ Frontend Display (Day 2)
│  └─ Testing (Day 3)
│
Week 2 (Apr 9-16)
│
├─ [VOUCHER SYSTEM]━━━━━━━━━━━━ 4-5 days ✓
│  ├─ DB + Backend (Day 1-3)
│  ├─ Frontend UI (Day 3-4)
│  └─ Testing (Day 4-5)
│
Week 3 (Apr 16-23)
│
└─ QA, Bug Fixes, Final Testing ━ 1 week ✓
   ├─ System testing
   ├─ Security testing
   ├─ Load testing
   └─ Prepare for deployment
```

---

## 👥 **Team Assignment**

### Backend Developer (Primary)
- Saksi Forensik: Auth & Authorization (1.5 days)
- 50%+1: Calculation logic (1.5 days)
- Voucher: CRUD & Validation (2 days)
- **Total:** ~5 days

### Frontend Developer (Primary)
- Saksi Forensik: UI components & filters (1 day)
- 50%+1: Display logic & updates (1.5 days)
- Voucher: Pages & modals (2 days)
- **Total:** ~4.5 days

### QA/Tester
- Test plans (0.5 day)
- Execute tests (1 day)
- Bug reporting (ongoing)
- **Total:** ~1.5 days

**Note:** Roles can overlap. If only 1 dev, estimate doubled (10-11 days solo)

---

## 🎯 **Daily Standup Format**

```
Daily 10am standup

✅ What I completed yesterday
- Saksi Forensik role verification
- AuthController update

🚧 What I'm working on today
- SaksiForensikLoginPage component
- Test Saksi Forensik authorization

🚫 Blockers
- None

⏰ ETA for next task
- SaksiForensikLoginPage done by EOD
```

---

## ✅ **Completion Checklist**

### Phase 1 Completion
- [ ] All 3 features implemented
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] 95%+ code coverage
- [ ] 0 critical bugs
- [ ] Security review passed
- [ ] Performance tested (< 500ms API response)
- [ ] Documentation updated
- [ ] Code reviewed & merged to main
- [ ] Ready for production deployment

---

## 📞 **Escalation Path**

**If blocked:** Contact Tia Handayani
**If unsure:** Check [REQUIREMENTS.md](./REQUIREMENTS.md)
**If sick:** Update team, assign to backup dev
**If scope creep:** Escalate to Tia

---

## 🎓 **Knowledge Base**

- [Laravel Documentation](https://laravel.com/docs/11)
- [React Hooks Guide](https://react.dev)
- [JWT Auth](https://jwt.io)
- [MySQL Transactions](https://dev.mysql.com/doc/refman/8.0/en/commit.html)

---

**Timeline Status:** Ready to Start
**Difficulty:** Medium
**Risk Level:** Low
**Buffer:** 1 week (for delays/bugs)

---

Last Updated: April 5, 2026
