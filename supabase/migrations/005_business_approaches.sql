-- 企業間アプローチテーブル
CREATE TABLE IF NOT EXISTS business_approaches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_business_id UUID NOT NULL REFERENCES users(id),
  to_business_id UUID NOT NULL REFERENCES users(id),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_business_approaches_from ON business_approaches(from_business_id);
CREATE INDEX IF NOT EXISTS idx_business_approaches_to ON business_approaches(to_business_id);
CREATE INDEX IF NOT EXISTS idx_business_approaches_status ON business_approaches(status);

-- RLS
ALTER TABLE business_approaches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read business_approaches" ON business_approaches FOR SELECT USING (true);
CREATE POLICY "Anyone can insert business_approaches" ON business_approaches FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update business_approaches" ON business_approaches FOR UPDATE USING (true);
