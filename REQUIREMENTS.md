# 匿名キャリアブック沖縄 — 要件書

## コンセプト
沖縄の建設業界特化の人材・協力会社マッチングサービス。
LINEベースでシンプルに「応援（職人募集）」「下請け（協力会社募集）」をマッチング。

## 技術構成
- Next.js (App Router)
- Supabase (DB, Auth, Realtime)
- LIFF SDK (LINEログイン・LINE内ブラウザ)
- Vercel (デプロイ)
- TypeScript

## 4/28ゴール
Webで公開できる状態（MVP）。バックエンドはSupabaseに接続済み。

## 機能一覧

### 認証
- LINEログイン（LIFF SDK）
- ゲスト閲覧可（投稿・応募はログイン必要）

### 応援リクエスト（職人・人手募集）
- 職種・エリア・期間・日当・募集人数を設定して投稿
- 急募タグ
- メッセージ付き応募 → 依頼主が承認/却下

### 下請けリクエスト（協力会社募集）
- 工事内容・エリア・期間を設定して投稿
- メッセージ付き応募 → 依頼主が承認/却下

### フィルター
- 沖縄全24市町村エリアフィルター（横スクロール）
- 全16職種フィルター

### マイページ
- 匿名プロフィール（個人/会社切替）
- 得意職種・活動エリア設定
- 自分の投稿一覧
- 応募履歴（申請中/承認済/却下）

### 通知
- 新着応募通知
- 応募承認通知
- 未読バッジ

### エリア
那覇市・浦添市・沖縄市・うるま市・名護市 等 全24市町村

### 職種
鳶工、型枠工、鉄筋工、大工、左官、塗装工、防水工、電気工事、配管工事、設備工事、内装工事、解体工事、土木作業、クレーン、重機オペ、その他

## DB設計（案）
- users (id, line_id, display_name, type: individual/company, skills[], areas[], created_at)
- requests (id, user_id, type: support/subcontract, title, description, area, trade, period_start, period_end, daily_rate, headcount, is_urgent, status, created_at)
- applications (id, request_id, applicant_id, message, status: pending/approved/rejected, created_at)
- notifications (id, user_id, type, message, is_read, created_at)
