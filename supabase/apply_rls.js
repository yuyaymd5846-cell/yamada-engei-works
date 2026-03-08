const { Client } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const DIRECT_URL = process.env.DIRECT_URL

if (!DIRECT_URL) {
    console.error('DIRECT_URL が .env に見つかりません')
    process.exit(1)
}

const client = new Client({
    connectionString: DIRECT_URL,
    ssl: { rejectUnauthorized: false }
})

async function run() {
    await client.connect()
    console.log('Supabase に接続しました')

    const tables = [
        'work_manual', 'greenhouses', 'work_records',
        'crop_cycles', 'crop_schedules', 'pesticide_rotations', 'budding_diagnoses'
    ]

    // 1. 全テーブルの RLS を有効化
    console.log('\n--- RLS を有効化中 ---')
    for (const table of tables) {
        try {
            await client.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`)
            console.log(`  ✅ ${table}`)
        } catch (e) {
            console.error(`  ❌ ${table}: ${e.message}`)
        }
    }

    // 2. Storage ポリシー設定
    console.log('\n--- Storage ポリシーを設定中 ---')
    try {
        await client.query(`DROP POLICY IF EXISTS "allow_authenticated_upload" ON storage.objects`)
        await client.query(`DROP POLICY IF EXISTS "allow_public_read" ON storage.objects`)

        await client.query(`
            CREATE POLICY "allow_authenticated_upload"
            ON storage.objects FOR INSERT
            TO authenticated
            WITH CHECK (bucket_id = 'work-photos')
        `)
        console.log('  ✅ アップロードポリシー（authenticated のみ）')

        await client.query(`
            CREATE POLICY "allow_public_read"
            ON storage.objects FOR SELECT
            TO public
            USING (bucket_id = 'work-photos')
        `)
        console.log('  ✅ 読み取りポリシー（public）')
    } catch (e) {
        console.error('  Storage ポリシーエラー:', e.message)
    }

    // 3. 結果確認
    console.log('\n=== 最終確認 ===')
    const res = await client.query(`
        SELECT tablename, rowsecurity
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename = ANY($1)
        ORDER BY tablename
    `, [tables])

    res.rows.forEach(r => {
        const icon = r.rowsecurity ? '✅' : '❌'
        const status = r.rowsecurity ? 'RLS有効（安全）' : 'RLS無効（要対処）'
        console.log(`  ${icon} ${r.tablename.padEnd(25)} ${status}`)
    })

    await client.end()
    console.log('\n完了しました')
}

run().catch(e => {
    console.error('エラー:', e.message)
    client.end()
    process.exit(1)
})
