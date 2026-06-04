-- Migration: add claim fields to vouchers table (local use)
ALTER TABLE vouchers
  ADD COLUMN claim_token VARCHAR(64) NULL AFTER code,
  ADD COLUMN claim_url TEXT NULL AFTER claim_token,
  ADD COLUMN claim_visits INT NOT NULL DEFAULT 0 AFTER claim_url,
  ADD COLUMN claim_expires_at DATETIME NULL AFTER expires_at;
