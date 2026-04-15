-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  line_id TEXT UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  type TEXT NOT NULL CHECK (type IN ('individual', 'company')) DEFAULT 'individual',
  company_name TEXT,
  skills TEXT[] DEFAULT '{}',
  areas TEXT[] DEFAULT '{}',
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- REQUESTS
-- ============================================================
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('support', 'subcontract')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  area TEXT NOT NULL,
  trade TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  daily_rate INTEGER,
  headcount INTEGER,
  is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL CHECK (status IN ('open', 'closed')) DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- APPLICATIONS
-- ============================================================
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(request_id, applicant_id)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_application', 'application_approved', 'application_rejected', 'new_request')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_requests_user_id ON requests(user_id);
CREATE INDEX idx_requests_type ON requests(type);
CREATE INDEX idx_requests_area ON requests(area);
CREATE INDEX idx_requests_trade ON requests(trade);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_created_at ON requests(created_at DESC);
CREATE INDEX idx_applications_request_id ON applications(request_id);
CREATE INDEX idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER requests_updated_at BEFORE UPDATE ON requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users: 全員読み取り可 / 自分だけ更新可
CREATE POLICY "users_select_all" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (auth.uid()::text = id::text);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Requests: 全員読み取り可 / 自分だけ作成・更新可
CREATE POLICY "requests_select_all" ON requests FOR SELECT USING (true);
CREATE POLICY "requests_insert_own" ON requests FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "requests_update_own" ON requests FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Applications: 関係者のみ読み取り可
CREATE POLICY "applications_select_own" ON applications FOR SELECT
  USING (
    auth.uid()::text = applicant_id::text
    OR auth.uid()::text IN (SELECT user_id::text FROM requests WHERE id = request_id)
  );
CREATE POLICY "applications_insert_own" ON applications FOR INSERT
  WITH CHECK (auth.uid()::text = applicant_id::text);
CREATE POLICY "applications_update_owner" ON applications FOR UPDATE
  USING (
    auth.uid()::text IN (SELECT user_id::text FROM requests WHERE id = request_id)
  );

-- Notifications: 自分のだけ
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (auth.uid()::text = user_id::text);
