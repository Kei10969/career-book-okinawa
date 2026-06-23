-- 通知テーブルに profile_link カラムを追加
-- 通知から相手のプロフィールページに直接遷移するためのリンク
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS profile_link TEXT DEFAULT NULL;
