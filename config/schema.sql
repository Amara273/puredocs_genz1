-- ═══════════════════════════════════════════════════════
--  TeamDocs KH  ·  Schema v3
--  Run: mysql -u root -p < config/schema.sql
-- ═══════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS teamdocs_kh
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE teamdocs_kh;

-- ── USERS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id               VARCHAR(36)  NOT NULL PRIMARY KEY,
  name             VARCHAR(100) NOT NULL,
  email            VARCHAR(100) NOT NULL UNIQUE,
  password         VARCHAR(255) NOT NULL,
  role             ENUM('admin','editor','member') NOT NULL DEFAULT 'member',
  status           ENUM('pending','active','suspended') NOT NULL DEFAULT 'pending',
  avatar_color     VARCHAR(100) DEFAULT NULL,
  -- password reset
  reset_token      VARCHAR(128) DEFAULT NULL,
  reset_expires    DATETIME     DEFAULT NULL,
  -- email verification
  verify_token     VARCHAR(128) DEFAULT NULL,
  email_verified   TINYINT(1)   NOT NULL DEFAULT 0,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── TEAMS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id         VARCHAR(36)  NOT NULL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  code       VARCHAR(20)  NOT NULL UNIQUE,
  color      VARCHAR(100) DEFAULT NULL,
  created_by VARCHAR(36)  NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── TEAM MEMBERS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  team_id   VARCHAR(36) NOT NULL,
  user_id   VARCHAR(36) NOT NULL,
  role      ENUM('admin','editor','member') NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (team_id, user_id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── INVITATIONS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invitations (
  id         VARCHAR(36)  NOT NULL PRIMARY KEY,
  team_id    VARCHAR(36)  NOT NULL,
  email      VARCHAR(100) NOT NULL,
  role       ENUM('admin','editor','member') NOT NULL DEFAULT 'member',
  token      VARCHAR(128) NOT NULL UNIQUE,
  invited_by VARCHAR(36)  NOT NULL,
  used       TINYINT(1)   NOT NULL DEFAULT 0,
  expires_at DATETIME     NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id)    REFERENCES teams(id)  ON DELETE CASCADE,
  FOREIGN KEY (invited_by) REFERENCES users(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── FOLDERS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS folders (
  id         VARCHAR(36)  NOT NULL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  team_id    VARCHAR(36)  NOT NULL,
  parent_id  VARCHAR(36)  DEFAULT NULL,
  created_by VARCHAR(36)  NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id)    REFERENCES teams(id)   ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (parent_id)  REFERENCES folders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── FILES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS files (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  original_name VARCHAR(255) NOT NULL,
  stored_name   VARCHAR(255) NOT NULL,
  filepath      VARCHAR(500) NOT NULL,
  mimetype      VARCHAR(100) DEFAULT NULL,
  size          BIGINT       NOT NULL DEFAULT 0,
  team_id       VARCHAR(36)  NOT NULL,
  folder_id     VARCHAR(36)  DEFAULT NULL,
  uploader_id   VARCHAR(36)  NOT NULL,
  is_shared     TINYINT(1)   NOT NULL DEFAULT 0,
  share_token   VARCHAR(64)  DEFAULT NULL UNIQUE,
  upload_date   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id)     REFERENCES teams(id)   ON DELETE CASCADE,
  FOREIGN KEY (folder_id)   REFERENCES folders(id) ON DELETE SET NULL,
  FOREIGN KEY (uploader_id) REFERENCES users(id)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── ACTIVITY LOG ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_log (
  id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  team_id     VARCHAR(36)  NOT NULL,
  user_id     VARCHAR(36)  NOT NULL,
  action      VARCHAR(50)  NOT NULL,
  target_type ENUM('file','folder') NOT NULL,
  target_id   VARCHAR(36)  DEFAULT NULL,
  target_name VARCHAR(255) DEFAULT NULL,
  meta        JSON         DEFAULT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── SHARE LOGS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS share_logs (
  id        INT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
  file_id   VARCHAR(36) NOT NULL,
  shared_by VARCHAR(36) NOT NULL,
  platform  VARCHAR(50) DEFAULT NULL,
  shared_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (file_id)   REFERENCES files(id) ON DELETE CASCADE,
  FOREIGN KEY (shared_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── INDEXES ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_status    ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_email     ON users(email);
CREATE INDEX IF NOT EXISTS idx_invites_token   ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invites_email   ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_folders_team    ON folders(team_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent  ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_files_team      ON files(team_id);
CREATE INDEX IF NOT EXISTS idx_files_folder    ON files(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_uploader  ON files(uploader_id);
CREATE INDEX IF NOT EXISTS idx_activity_team   ON activity_log(team_id);