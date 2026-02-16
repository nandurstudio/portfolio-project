CREATE DATABASE IF NOT EXISTS db_undangan_rat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'kkmrat_user'@'%' IDENTIFIED BY 'kkmrat_pass';
GRANT ALL PRIVILEGES ON db_undangan_rat.* TO 'kkmrat_user'@'%';
FLUSH PRIVILEGES;
