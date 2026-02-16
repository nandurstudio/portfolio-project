CREATE DATABASE IF NOT EXISTS db_undangan_rat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- NOTE: do NOT commit real passwords into SQL files. Use `scripts/create-undangan-db.sh` or set `KKMRAT_DB_PASS` in your local `.env`.
CREATE USER IF NOT EXISTS 'kkmrat_user'@'%' IDENTIFIED BY '<KKMRAT_DB_PASS_PLACEHOLDER>';
GRANT ALL PRIVILEGES ON db_undangan_rat.* TO 'kkmrat_user'@'%';
FLUSH PRIVILEGES;
