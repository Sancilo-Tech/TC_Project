-- Run in Supabase SQL Editor

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
  tc_number        VARCHAR(20) UNIQUE NOT NULL,
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
  created_at       TIMESTAMP DEFAULT NOW()
);

-- User profiles table (extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  username   TEXT NOT NULL DEFAULT '',
  role       TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- If upgrading existing table, run:
-- ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS username TEXT NOT NULL DEFAULT '';

-- TC records migration (if upgrading):
-- ALTER TABLE tc_records ADD COLUMN IF NOT EXISTS father_name VARCHAR(200);
-- ALTER TABLE tc_records ADD COLUMN IF NOT EXISTS mother_name VARCHAR(200);
-- ALTER TABLE tc_records ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(200);
-- ALTER TABLE tc_records ALTER COLUMN gender TYPE VARCHAR(20);
-- ALTER TABLE tc_records ADD COLUMN IF NOT EXISTS download_count INTEGER NOT NULL DEFAULT 0;
-- ALTER TABLE tc_records ADD COLUMN IF NOT EXISTS umis_number VARCHAR(50);

-- New table for re-download logs:
-- CREATE TABLE IF NOT EXISTS tc_download_logs (
--   id             SERIAL PRIMARY KEY,
--   tc_id          INTEGER NOT NULL REFERENCES tc_records(id) ON DELETE CASCADE,
--   download_count INTEGER NOT NULL,
--   reason         TEXT,
--   downloaded_at  TIMESTAMP DEFAULT NOW()
-- );
-- ALTER TABLE tc_download_logs ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "auth_tc_download_logs" ON tc_download_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

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


ALTER TABLE colleges         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tc_records       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE dropdown_options ENABLE ROW LEVEL SECURITY;

-- Colleges & TC: accessible to authenticated users only
CREATE POLICY "auth_colleges"   ON colleges         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_tc_records" ON tc_records       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_dropdowns"  ON dropdown_options FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- user_profiles: users can read their own; admins can read/write all
CREATE POLICY "read_own_profile" ON user_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "admin_all_profiles" ON user_profiles
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Function to auto-create profile on signup (called by trigger)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- SEED: Create the first admin user
-- Run this AFTER creating the user via Supabase Auth dashboard
-- or use the app's first-run admin creation below.
-- ============================================================
-- INSERT INTO user_profiles (id, email, role)
-- VALUES ('<auth-user-uuid>', 'admin@yourdomain.com', 'admin');
