-- 通知テーブルに role カラムを追加
-- 通知がどちらのロール向けかを識別するため
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS role TEXT DEFAULT NULL;
