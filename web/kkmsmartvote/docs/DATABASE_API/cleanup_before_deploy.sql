-- ============================================================================
-- DATABASE CLEANUP SCRIPT - Production Deployment (April 16, 2026)
-- ============================================================================
-- Purpose: Clear sensitive/test data before production deployment to VPS
-- Database: PostgreSQL 16
-- Note: Run this BEFORE uploading database to production server
--
-- Tables to truncate & reset ID:
--   1. voter_vouchers (depends on vouchers, clear first)
--   2. vouchers
--   3. votes
--   4. email_otps
--   5. audit_logs
-- ============================================================================

-- Start transaction (can rollback if needed)
BEGIN;

-- Step 1: Clear voter_vouchers (has FK to vouchers)
TRUNCATE TABLE voter_vouchers RESTART IDENTITY CASCADE;
COMMIT;
BEGIN;

-- Step 2: Clear vouchers (main table)
TRUNCATE TABLE vouchers RESTART IDENTITY CASCADE;
COMMIT;
BEGIN;

-- Step 3: Clear votes (voting data)
TRUNCATE TABLE votes RESTART IDENTITY CASCADE;
COMMIT;
BEGIN;

-- Step 4: Clear email_otps (OTP verification data)
TRUNCATE TABLE email_otps RESTART IDENTITY CASCADE;
COMMIT;
BEGIN;

-- Step 5: Clear audit_logs (activity logs)
TRUNCATE TABLE audit_logs RESTART IDENTITY CASCADE;
COMMIT;

-- ============================================================================
-- Verification queries (run after cleanup)
-- ============================================================================
-- SELECT 'voter_vouchers' as table_name, COUNT(*) as row_count FROM voter_vouchers
-- UNION ALL
-- SELECT 'vouchers', COUNT(*) FROM vouchers
-- UNION ALL
-- SELECT 'votes', COUNT(*) FROM votes
-- UNION ALL
-- SELECT 'email_otps', COUNT(*) FROM email_otps
-- UNION ALL
-- SELECT 'audit_logs', COUNT(*) FROM audit_logs;
-- ============================================================================
