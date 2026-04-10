-- KKM Smart Vote - Normalization V1 (idempotent)
-- Safe additive migration for local DB: koperasi_vote

-- 1) Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    site_id BIGINT UNSIGNED NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_departments_code (code),
    UNIQUE KEY uq_departments_name (name),
    KEY idx_departments_site_id (site_id),
    KEY idx_departments_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add FK departments.site_id -> sites.id if missing
SET @has_fk_dept_site := (
    SELECT COUNT(*)
    FROM information_schema.REFERENTIAL_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'departments'
      AND CONSTRAINT_NAME = 'fk_departments_site_id'
);
SET @sql_fk_dept_site := IF(
    @has_fk_dept_site = 0,
    'ALTER TABLE departments ADD CONSTRAINT fk_departments_site_id FOREIGN KEY (site_id) REFERENCES sites(id) ON UPDATE CASCADE ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE stmt_fk_dept_site FROM @sql_fk_dept_site;
EXECUTE stmt_fk_dept_site;
DEALLOCATE PREPARE stmt_fk_dept_site;

-- 2) Seed departments from members.department distinct values
INSERT INTO departments (code, name, site_id, is_active, created_at, updated_at)
SELECT
    CONCAT('DEPT_', LPAD(ROW_NUMBER() OVER (ORDER BY d.department_name), 4, '0')) AS code,
    d.department_name,
    NULL,
    1,
    NOW(),
    NOW()
FROM (
    SELECT DISTINCT TRIM(department) AS department_name
    FROM members
    WHERE department IS NOT NULL AND TRIM(department) <> ''
) d
LEFT JOIN departments dep ON dep.name = d.department_name
WHERE dep.id IS NULL;

-- 3) Add members.department_id
SET @has_col_members_department_id := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'members'
      AND COLUMN_NAME = 'department_id'
);
SET @sql_col_members_department_id := IF(
    @has_col_members_department_id = 0,
    'ALTER TABLE members ADD COLUMN department_id BIGINT UNSIGNED NULL AFTER department',
    'SELECT 1'
);
PREPARE stmt_col_members_department_id FROM @sql_col_members_department_id;
EXECUTE stmt_col_members_department_id;
DEALLOCATE PREPARE stmt_col_members_department_id;

SET @has_idx_members_dept_id := (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'members'
      AND INDEX_NAME = 'idx_members_department_id'
);
SET @sql_idx_members_dept_id := IF(
    @has_idx_members_dept_id = 0,
    'CREATE INDEX idx_members_department_id ON members (department_id)',
    'SELECT 1'
);
PREPARE stmt_idx_members_dept_id FROM @sql_idx_members_dept_id;
EXECUTE stmt_idx_members_dept_id;
DEALLOCATE PREPARE stmt_idx_members_dept_id;

-- backfill members.department_id from members.department text
UPDATE members m
JOIN departments d ON d.name = m.department
SET m.department_id = d.id
WHERE m.department_id IS NULL
  AND m.department IS NOT NULL
  AND TRIM(m.department) <> '';

-- FK members.department_id -> departments.id
SET @has_fk_members_dept := (
    SELECT COUNT(*)
    FROM information_schema.REFERENTIAL_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'members'
      AND CONSTRAINT_NAME = 'fk_members_department_id'
);
SET @sql_fk_members_dept := IF(
    @has_fk_members_dept = 0,
    'ALTER TABLE members ADD CONSTRAINT fk_members_department_id FOREIGN KEY (department_id) REFERENCES departments(id) ON UPDATE CASCADE ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE stmt_fk_members_dept FROM @sql_fk_members_dept;
EXECUTE stmt_fk_members_dept;
DEALLOCATE PREPARE stmt_fk_members_dept;

-- 4) Add candidates.department_id
SET @has_col_candidates_department_id := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'candidates'
      AND COLUMN_NAME = 'department_id'
);
SET @sql_col_candidates_department_id := IF(
    @has_col_candidates_department_id = 0,
    'ALTER TABLE candidates ADD COLUMN department_id BIGINT UNSIGNED NULL AFTER position',
    'SELECT 1'
);
PREPARE stmt_col_candidates_department_id FROM @sql_col_candidates_department_id;
EXECUTE stmt_col_candidates_department_id;
DEALLOCATE PREPARE stmt_col_candidates_department_id;

SET @has_idx_candidates_dept_id := (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'candidates'
      AND INDEX_NAME = 'idx_candidates_department_id'
);
SET @sql_idx_candidates_dept_id := IF(
    @has_idx_candidates_dept_id = 0,
    'CREATE INDEX idx_candidates_department_id ON candidates (department_id)',
    'SELECT 1'
);
PREPARE stmt_idx_candidates_dept_id FROM @sql_idx_candidates_dept_id;
EXECUTE stmt_idx_candidates_dept_id;
DEALLOCATE PREPARE stmt_idx_candidates_dept_id;

SET @has_fk_candidates_dept := (
    SELECT COUNT(*)
    FROM information_schema.REFERENTIAL_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'candidates'
      AND CONSTRAINT_NAME = 'fk_candidates_department_id'
);
SET @sql_fk_candidates_dept := IF(
    @has_fk_candidates_dept = 0,
    'ALTER TABLE candidates ADD CONSTRAINT fk_candidates_department_id FOREIGN KEY (department_id) REFERENCES departments(id) ON UPDATE CASCADE ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE stmt_fk_candidates_dept FROM @sql_fk_candidates_dept;
EXECUTE stmt_fk_candidates_dept;
DEALLOCATE PREPARE stmt_fk_candidates_dept;

-- Backfill candidates.department_id from members by exact candidate name match
UPDATE candidates c
JOIN members m ON UPPER(TRIM(m.name)) = UPPER(TRIM(c.name))
SET c.department_id = m.department_id
WHERE c.department_id IS NULL
    AND m.department_id IS NOT NULL;

-- 5) Add votes.site_id and backfill
SET @has_col_votes_site_id := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'votes'
      AND COLUMN_NAME = 'site_id'
);
SET @sql_col_votes_site_id := IF(
    @has_col_votes_site_id = 0,
    'ALTER TABLE votes ADD COLUMN site_id BIGINT UNSIGNED NULL AFTER site',
    'SELECT 1'
);
PREPARE stmt_col_votes_site_id FROM @sql_col_votes_site_id;
EXECUTE stmt_col_votes_site_id;
DEALLOCATE PREPARE stmt_col_votes_site_id;

SET @has_idx_votes_site_id := (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'votes'
      AND INDEX_NAME = 'idx_votes_site_id'
);
SET @sql_idx_votes_site_id := IF(
    @has_idx_votes_site_id = 0,
    'CREATE INDEX idx_votes_site_id ON votes (site_id)',
    'SELECT 1'
);
PREPARE stmt_idx_votes_site_id FROM @sql_idx_votes_site_id;
EXECUTE stmt_idx_votes_site_id;
DEALLOCATE PREPARE stmt_idx_votes_site_id;

UPDATE votes v
LEFT JOIN sites s_name ON LOWER(TRIM(v.site)) = LOWER(TRIM(s_name.name))
LEFT JOIN sites s_code ON UPPER(TRIM(v.site)) = UPPER(TRIM(s_code.code))
SET v.site_id = COALESCE(s_name.id, s_code.id)
WHERE v.site_id IS NULL
  AND v.site IS NOT NULL
  AND TRIM(v.site) <> '';

SET @has_fk_votes_site := (
    SELECT COUNT(*)
    FROM information_schema.REFERENTIAL_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'votes'
      AND CONSTRAINT_NAME = 'fk_votes_site_id'
);
SET @sql_fk_votes_site := IF(
    @has_fk_votes_site = 0,
    'ALTER TABLE votes ADD CONSTRAINT fk_votes_site_id FOREIGN KEY (site_id) REFERENCES sites(id) ON UPDATE CASCADE ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE stmt_fk_votes_site FROM @sql_fk_votes_site;
EXECUTE stmt_fk_votes_site;
DEALLOCATE PREPARE stmt_fk_votes_site;

-- 6) FK votes.member_nik -> members.nik
SET @has_idx_votes_member_nik := (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'votes'
      AND INDEX_NAME = 'idx_votes_member_nik'
);
SET @sql_idx_votes_member_nik := IF(
    @has_idx_votes_member_nik = 0,
    'CREATE INDEX idx_votes_member_nik ON votes (member_nik)',
    'SELECT 1'
);
PREPARE stmt_idx_votes_member_nik FROM @sql_idx_votes_member_nik;
EXECUTE stmt_idx_votes_member_nik;
DEALLOCATE PREPARE stmt_idx_votes_member_nik;

SET @has_fk_votes_member := (
    SELECT COUNT(*)
    FROM information_schema.REFERENTIAL_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'votes'
      AND CONSTRAINT_NAME = 'fk_votes_member_nik'
);
SET @sql_fk_votes_member := IF(
    @has_fk_votes_member = 0,
    'ALTER TABLE votes ADD CONSTRAINT fk_votes_member_nik FOREIGN KEY (member_nik) REFERENCES members(nik) ON UPDATE CASCADE ON DELETE RESTRICT',
    'SELECT 1'
);
PREPARE stmt_fk_votes_member FROM @sql_fk_votes_member;
EXECUTE stmt_fk_votes_member;
DEALLOCATE PREPARE stmt_fk_votes_member;

-- 7) FK email_otps.member_nik -> members.nik
SET @has_idx_otps_member_nik := (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'email_otps'
      AND INDEX_NAME = 'idx_email_otps_member_nik_fk'
);
SET @sql_idx_otps_member_nik := IF(
    @has_idx_otps_member_nik = 0,
    'CREATE INDEX idx_email_otps_member_nik_fk ON email_otps (member_nik)',
    'SELECT 1'
);
PREPARE stmt_idx_otps_member_nik FROM @sql_idx_otps_member_nik;
EXECUTE stmt_idx_otps_member_nik;
DEALLOCATE PREPARE stmt_idx_otps_member_nik;

SET @has_fk_otps_member := (
    SELECT COUNT(*)
    FROM information_schema.REFERENTIAL_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'email_otps'
      AND CONSTRAINT_NAME = 'fk_email_otps_member_nik'
);
SET @sql_fk_otps_member := IF(
    @has_fk_otps_member = 0,
    'ALTER TABLE email_otps ADD CONSTRAINT fk_email_otps_member_nik FOREIGN KEY (member_nik) REFERENCES members(nik) ON UPDATE CASCADE ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE stmt_fk_otps_member FROM @sql_fk_otps_member;
EXECUTE stmt_fk_otps_member;
DEALLOCATE PREPARE stmt_fk_otps_member;

-- Optional backfill: email_otps.member_nik from unique members.email
UPDATE email_otps o
JOIN (
    SELECT LOWER(TRIM(email)) AS email_key, MIN(nik) AS nik, COUNT(*) AS cnt
    FROM members
    WHERE email IS NOT NULL AND TRIM(email) <> ''
    GROUP BY LOWER(TRIM(email))
    HAVING cnt = 1
) m ON LOWER(TRIM(o.email)) = m.email_key
SET o.member_nik = m.nik
WHERE o.member_nik IS NULL;

-- 8) Report
SELECT
    (SELECT COUNT(*) FROM departments) AS departments_total,
    (SELECT COUNT(*) FROM members WHERE department_id IS NOT NULL) AS members_mapped_department_id,
    (SELECT COUNT(*) FROM votes WHERE site_id IS NOT NULL) AS votes_mapped_site_id;
