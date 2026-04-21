-- ============================================================
-- 002: Dual-role architecture update
-- ============================================================

-- 1. users テーブル変更
ALTER TABLE users RENAME COLUMN type TO role;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_type_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'business'));
UPDATE users SET role = 'user' WHERE role = 'individual';
UPDATE users SET role = 'business' WHERE role = 'company';
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname TEXT;

-- 2. offers テーブル新規
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  area TEXT NOT NULL,
  trade TEXT NOT NULL,
  condition TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'reviewing', 'matched', 'closed')) DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_offers_from_user_id ON offers(from_user_id);
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_created_at ON offers(created_at DESC);

CREATE TRIGGER offers_updated_at BEFORE UPDATE ON offers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. business_profiles テーブル新規
CREATE TABLE business_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  area TEXT,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_business_profiles_user_id ON business_profiles(user_id);

CREATE TRIGGER business_profiles_updated_at BEFORE UPDATE ON business_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. notifications テーブル拡張
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('new_application', 'application_approved', 'application_rejected', 'new_request', 'new_offer', 'offer_response', 'match'));
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_id UUID;

-- 5. RLS for new tables
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "offers_select_all" ON offers FOR SELECT USING (true);
CREATE POLICY "offers_insert_own" ON offers FOR INSERT WITH CHECK (true);
CREATE POLICY "offers_update_own" ON offers FOR UPDATE USING (true);

CREATE POLICY "business_profiles_select_all" ON business_profiles FOR SELECT USING (true);
CREATE POLICY "business_profiles_insert_own" ON business_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "business_profiles_update_own" ON business_profiles FOR UPDATE USING (true);
