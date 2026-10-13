-- PostgreSQL schema. Applied by `npm run db:init` (safe to run again).

CREATE TABLE IF NOT EXISTS colleges (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  trust_name  VARCHAR(200),
  affiliation VARCHAR(200),
  address     VARCHAR(300),
  logo_url    TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tc_records (
  id               SERIAL PRIMARY KEY,
  tc_number        VARCHAR(50) UNIQUE NOT NULL,
  id_number        VARCHAR(50),
  student_name     VARCHAR(200) NOT NULL,
  father_name      VARCHAR(200),
  mother_name      VARCHAR(200),
  guardian_name    VARCHAR(200),
  parent_name      VARCHAR(200),
  gender           VARCHAR(20),
  nationality      VARCHAR(100),
  religion         VARCHAR(100),
  community        VARCHAR(100),
  caste            VARCHAR(100),
  dob              DATE,
  dob_words        VARCHAR(200),
  admission_date   DATE,
  study_period     VARCHAR(100),
  leaving_date     DATE,
  class_at_leaving VARCHAR(100),
  medium           VARCHAR(100),
  umis_number      VARCHAR(50),
  promotion_status VARCHAR(100),
  application_date DATE,
  reason           TEXT,
  conduct          VARCHAR(100),
  college_id       INTEGER REFERENCES colleges(id),
  download_count   INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMP DEFAULT NOW()
);

-- One row per re-download of a TC (the first download is not logged)
CREATE TABLE IF NOT EXISTS tc_download_logs (
  id             SERIAL PRIMARY KEY,
  tc_id          INTEGER NOT NULL REFERENCES tc_records(id) ON DELETE CASCADE,
  download_count INTEGER NOT NULL,
  reason         TEXT,
  downloaded_at  TIMESTAMP DEFAULT NOW()
);

-- People who can sign in. Passwords are stored only as a bcrypt hash.
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Usernames are unique ignoring case ("Admin" and "admin" are the same login)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users (LOWER(username));

-- Dropdown options master table
CREATE TABLE IF NOT EXISTS dropdown_options (
  id         SERIAL PRIMARY KEY,
  category   VARCHAR(50) NOT NULL,
  value      VARCHAR(200) NOT NULL,
  parent     VARCHAR(200),
  sort_order INTEGER NOT NULL DEFAULT 999,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(category, value, parent)
);

CREATE INDEX IF NOT EXISTS idx_dropdown_category ON dropdown_options(category);
CREATE INDEX IF NOT EXISTS idx_dropdown_parent   ON dropdown_options(parent);
