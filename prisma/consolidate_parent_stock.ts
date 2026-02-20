
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('Consolidating Parent Stock Management data...')

    // 1. Clean up old granular manuals
    const oldManualNames = [
        '親株：準備・土壌消毒',
        '親株：定植',
        '親株：摘芯',
        '親株：採穂'
    ]
    for (const name of oldManualNames) {
        await prisma.workManual.deleteMany({
            where: { workName: name }
        })
    }
    console.log('Old granular manuals removed.')

    // 2. Create the unified WorkManual
    const unifiedManual = {
        workName: '親株管理',
        stage: '親株管理',
        purpose: '定植用の健全な穂木を安定生産し、病害虫・ウイルス等のリスクを排除する。秀率の源流工程。',
        timingStandard: '作型スケジュールに基づく（夏系・秋系）',
        inputParameters: JSON.stringify([
            { name: '作業種別', type: 'text', defaultValue: '消毒/定植/摘芯/採穂' },
            { name: '備考', type: 'text', defaultValue: '' }
        ]),
        actionSteps: `
### 【概要】
- 対象：Bハウス(150坪)／Dハウス(120坪) 合計270坪(約8.9a)
- 年間目標時間：465時間

### 【定植方法】
- 目安棒を使用し、奥行方向に植え付け。
- 片側6～7本植え（12～14本/列）。
- 1列あたり3,000～3,500本、8列分（合計2.4万～2.8万本）。

### 【主要工程】
1. **土壌消毒**: ソイリーンまたはテロンを使用。
2. **定植**: 指定日に実施。
3. **摘芯**: 定植10日～2週間後に頂部を摘み取る。
4. **採穂**: 発生した穂木を順次採取する。

### 【シリーズ別目安】
- 夏系①: 2/19消毒、2/27定植、3/13摘芯、その後採穂
- 夏系②: 3/20消毒、3/27定植、4/6頃摘芯、その後採穂
- 秋系①: 6/19消毒、6/25定植、7/5摘芯
- 秋系②: 7/20消毒、7/27定植、8/6摘芯
- 秋系③: 10/17消毒、10/25定植、11/5摘芯
- 秋系④: 12/10消毒、12/16定植、12/29摘芯
        `.trim(),
        riskIfNotDone: '健全な穂木が得られず、本圃での病害蔓延や欠株が発生する。',
        impactOnQuality: '苗の揃いと健全性に直結（秀率の低下）',
        impactOnYield: '本圃での定植密度低下による収量減',
        impactOnProfit: '苗代コスト増および全体の売上減少',
        requiredTime10a: 52.2, // 465h / 8.9a = approx 52.2h per 10a
        difficultyLevel: 3
    }

    await prisma.workManual.upsert({
        where: { id: 'manual-parent-stock-unified' },
        update: unifiedManual,
        create: { id: 'manual-parent-stock-unified', ...unifiedManual }
    })
    console.log('Unified WorkManual "親株管理" ready.')

    // 3. Update CropSchedules
    // Delete old granular schedules and recreate them with simplified label
    await prisma.cropSchedule.deleteMany({
        where: { stage: { startsWith: '親株：' } }
    })

    const createSchedule = async (ghId: string, ghName: string, start: string, end?: string) => {
        await prisma.cropSchedule.create({
            data: {
                greenhouseId: ghId,
                greenhouseName: ghName,
                stage: '親株管理',
                startDate: new Date(start),
                endDate: end ? new Date(end) : new Date(start),
                color: '#e67e22'
            }
        })
    }

    // Reuse the dates from the user request
    // --- 夏系① (B) ---
    await createSchedule('greenhouse-b', 'B', '2026-02-19')
    await createSchedule('greenhouse-b', 'B', '2026-02-27')
    await createSchedule('greenhouse-b', 'B', '2026-03-13')
    await createSchedule('greenhouse-b', 'B', '2026-03-14', '2026-05-31')

    // --- 夏系② (D) ---
    await createSchedule('greenhouse-d', 'D', '2026-03-13')
    await createSchedule('greenhouse-d', 'D', '2026-03-20')
    await createSchedule('greenhouse-d', 'D', '2026-03-27')
    await createSchedule('greenhouse-d', 'D', '2026-04-06')
    await createSchedule('greenhouse-d', 'D', '2026-04-15', '2026-06-30')

    // --- 秋系① (B) ---
    await createSchedule('greenhouse-b', 'B', '2026-06-19')
    await createSchedule('greenhouse-b', 'B', '2026-06-25')
    await createSchedule('greenhouse-b', 'B', '2026-07-05')
    await createSchedule('greenhouse-b', 'B', '2026-07-10', '2026-09-30')

    // --- 秋系② (D) ---
    await createSchedule('greenhouse-d', 'D', '2026-07-20')
    await createSchedule('greenhouse-d', 'D', '2026-07-27')
    await createSchedule('greenhouse-d', 'D', '2026-08-06')
    await createSchedule('greenhouse-d', 'D', '2026-08-15', '2026-10-31')

    // --- 秋系③ (B) ---
    await createSchedule('greenhouse-b', 'B', '2026-10-17')
    await createSchedule('greenhouse-b', 'B', '2026-10-25')
    await createSchedule('greenhouse-b', 'B', '2026-11-05')

    // --- 秋系④ (D) ---
    await createSchedule('greenhouse-d', 'D', '2026-12-10')
    await createSchedule('greenhouse-d', 'D', '2026-12-16')
    await createSchedule('greenhouse-d', 'D', '2026-12-29')

    console.log('Schedules updated.')
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
