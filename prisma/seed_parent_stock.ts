
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('Seeding Parent Stock Management data...')

    // 1. Create Greenhouses B & D if they don't exist
    const houseB = await prisma.greenhouse.upsert({
        where: { id: 'greenhouse-b' },
        update: { name: 'B', areaAcre: 4.96 },
        create: { id: 'greenhouse-b', name: 'B', areaAcre: 4.96 }
    })
    const houseD = await prisma.greenhouse.upsert({
        where: { id: 'greenhouse-d' },
        update: { name: 'D', areaAcre: 3.97 },
        create: { id: 'greenhouse-d', name: 'D', areaAcre: 3.97 }
    })
    console.log('Greenhouses B and D ready.')

    // 2. Create WorkManuals
    // We'll use specific stages to match the schedules
    const manuals = [
        {
            workName: '親株：準備・土壌消毒',
            stage: '親株：準備',
            purpose: '病害虫・ウイルスを持ち込まないための事前準備',
            timingStandard: '定植の1～2週間前',
            inputParameters: JSON.stringify([{ name: '消毒薬剤', type: 'text', defaultValue: 'ソイリーンまたはテロン' }]),
            actionSteps: '片付けを行い、指定の薬剤で土壌消毒を実施する。',
            riskIfNotDone: '病害虫が新株に伝染する',
            impactOnQuality: '健全な穂木が得られない',
            impactOnYield: '穂木本数の減少',
            impactOnProfit: '苗代コストの増大',
            requiredTime10a: 20, // estimated
            difficultyLevel: 3
        },
        {
            workName: '親株：定植',
            stage: '親株：定植',
            purpose: '健全で揃った穂木を安定生産する基礎作り',
            timingStandard: '指定日',
            inputParameters: JSON.stringify([
                { name: '定植本数', type: 'number', defaultValue: 3000 },
                { name: '植え方', type: 'text', defaultValue: '片側6～7本植え' }
            ]),
            actionSteps: '目安棒を使用。片側6～7本植え。6本×2列=12本または7本×2列=14本。奥行方向に植え付け。',
            riskIfNotDone: '生育の不揃い',
            impactOnQuality: '穂木のサイズがバラつく',
            impactOnYield: '定植密度の低下による収量減',
            impactOnProfit: '生産効率の低下',
            requiredTime10a: 40,
            difficultyLevel: 2
        },
        {
            workName: '親株：摘芯',
            stage: '親株：摘芯',
            purpose: '側芽の発生を促し、穂木本数を確保する',
            timingStandard: '定植後10日～2週間',
            inputParameters: JSON.stringify([{ name: '摘芯位置', type: 'text', defaultValue: '頂部' }]),
            actionSteps: '定植から約10日～2週間後に頂部を摘み取る。',
            riskIfNotDone: '穂木の発生が遅れる',
            impactOnQuality: '側芽の勢いが弱くなる',
            impactOnYield: '採穂本数の減少',
            impactOnProfit: '苗供給の遅延',
            requiredTime10a: 15,
            difficultyLevel: 1
        },
        {
            workName: '親株：採穂',
            stage: '親株：採穂',
            purpose: '本圃用の穂木を採取する',
            timingStandard: '摘芯後、順次',
            inputParameters: JSON.stringify([{ name: '採穂本数', type: 'number', defaultValue: 0 }]),
            actionSteps: '発生した穂木を順次採取する。',
            riskIfNotDone: '穂木が老化する',
            impactOnQuality: '活着率の低下',
            impactOnYield: '本圃の欠株発生',
            impactOnProfit: '全体の収益性低下',
            requiredTime10a: 50,
            difficultyLevel: 2
        }
    ]

    for (const m of manuals) {
        await prisma.workManual.upsert({
            where: { id: `manual-${m.workName}` },
            update: m,
            create: { id: `manual-${m.workName}`, ...m }
        })
    }
    console.log('Work Manuals ready.')

    // 3. Create CropSchedules
    // Helper to fixed dates in 2026 (assuming current year or upcoming)
    const createSchedule = async (ghId: string, ghName: string, stage: string, start: string, end?: string) => {
        await prisma.cropSchedule.create({
            data: {
                greenhouseId: ghId,
                greenhouseName: ghName,
                stage,
                startDate: new Date(start),
                endDate: end ? new Date(end) : new Date(start),
                color: '#e67e22' // Distinct color for Parent Management
            }
        })
    }

    // --- 夏系① (Bハウス) ---
    await createSchedule('greenhouse-b', 'B', '親株：準備', '2026-02-19')
    await createSchedule('greenhouse-b', 'B', '親株：定植', '2026-02-27')
    await createSchedule('greenhouse-b', 'B', '親株：摘芯', '2026-03-13')
    await createSchedule('greenhouse-b', 'B', '親株：採穂', '2026-03-14', '2026-05-31')

    // --- 夏系② (Dハウス) ---
    // 親株到着 (Mar 13) - we can call it prep or just a note. Let's use Prep.
    await createSchedule('greenhouse-d', 'D', '親株：準備', '2026-03-13')
    await createSchedule('greenhouse-d', 'D', '親株：準備', '2026-03-20') // Soil disinfection
    await createSchedule('greenhouse-d', 'D', '親株：定植', '2026-03-27')
    await createSchedule('greenhouse-d', 'D', '親株：摘芯', '2026-04-06')
    await createSchedule('greenhouse-d', 'D', '親株：採穂', '2026-04-15', '2026-06-30')

    // --- 秋系① (Assigned to B for example) ---
    await createSchedule('greenhouse-b', 'B', '親株：準備', '2026-06-19')
    await createSchedule('greenhouse-b', 'B', '親株：定植', '2026-06-25')
    await createSchedule('greenhouse-b', 'B', '親株：摘芯', '2026-07-05')
    await createSchedule('greenhouse-b', 'B', '親株：採穂', '2026-07-10', '2026-09-30')

    // --- 秋系② (Assigned to D) ---
    await createSchedule('greenhouse-d', 'D', '親株：準備', '2026-07-20')
    await createSchedule('greenhouse-d', 'D', '親株：定植', '2026-07-27')
    await createSchedule('greenhouse-d', 'D', '親株：摘芯', '2026-08-06')
    await createSchedule('greenhouse-d', 'D', '親株：採穂', '2026-08-15', '2026-10-31')

    // --- 秋系③ (B) ---
    await createSchedule('greenhouse-b', 'B', '親株：準備', '2026-10-17')
    await createSchedule('greenhouse-b', 'B', '親株 : 定植', '2026-10-25') // User had slightly different label? No, just 定植
    await createSchedule('greenhouse-b', 'B', '親株：定植', '2026-10-25')
    await createSchedule('greenhouse-b', 'B', '親株：摘芯', '2026-11-05')

    // --- 秋系④ (D) ---
    await createSchedule('greenhouse-d', 'D', '親株：準備', '2026-12-10')
    await createSchedule('greenhouse-d', 'D', '親株：定植', '2026-12-16')
    await createSchedule('greenhouse-d', 'D', '親株：摘芯', '2026-12-29')

    console.log('Schedules created.')
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
