-- ============================================================
-- RLS (Row Level Security) 有効化スクリプト
-- Supabase SQL Editor で実行してください
-- https://supabase.com/dashboard/project/ckcfabinoxgvcqzoevge/sql/new
-- ============================================================
-- 【目的】
--   このアプリはすべての DB アクセスが Next.js の API Route (Prisma) 経由です。
--   Prisma は DATABASE_URL（service_role 相当）で接続するため RLS をバイパスします。
--   RLS を有効にして anon キーによる直接アクセスをブロックします。
-- ============================================================

-- 1. 全テーブルの RLS を有効化
ALTER TABLE work_manual          ENABLE ROW LEVEL SECURITY;
ALTER TABLE greenhouses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_records         ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_cycles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_schedules       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pesticide_rotations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE budding_diagnoses    ENABLE ROW LEVEL SECURITY;

-- 2. anon / authenticated ロールからの直接アクセスを完全ブロック
--    (ポリシーなし = すべて拒否。Prisma/service_role は RLS をバイパスするため影響なし)
--    既存のポリシーがあれば念のため削除してから適用

DO $$
DECLARE
    tbl TEXT;
    tbl_list TEXT[] := ARRAY[
        'work_manual', 'greenhouses', 'work_records',
        'crop_cycles', 'crop_schedules', 'pesticide_rotations', 'budding_diagnoses'
    ];
BEGIN
    FOREACH tbl IN ARRAY tbl_list LOOP
        -- 既存ポリシーをすべて削除（冪等実行のため）
        EXECUTE format('
            DO $inner$
            DECLARE pol TEXT;
            BEGIN
                FOR pol IN
                    SELECT policyname FROM pg_policies
                    WHERE tablename = %L AND schemaname = ''public''
                LOOP
                    EXECUTE format(''DROP POLICY IF EXISTS %%I ON %I'', pol, %L);
                END LOOP;
            END $inner$;
        ', tbl, tbl, tbl);
    END LOOP;
END $$;

-- 3. Storage バケット「work-photos」のポリシー設定
--    - ログイン済みユーザーのみアップロード可（このアプリは Supabase Auth で保護済み）
--    - 画像URLは公開（写真表示に必要）

-- 既存ポリシーを削除
DROP POLICY IF EXISTS "allow_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "allow_public_read"           ON storage.objects;

-- アップロード: ログイン済みユーザーのみ
CREATE POLICY "allow_authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'work-photos');

-- 読み取り: 全員可（画像URLを貼った場合に表示できるように）
CREATE POLICY "allow_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'work-photos');

-- ============================================================
-- 確認クエリ（実行後に RLS が有効か確認）
-- ============================================================
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
      'work_manual', 'greenhouses', 'work_records',
      'crop_cycles', 'crop_schedules', 'pesticide_rotations', 'budding_diagnoses'
  )
ORDER BY tablename;
