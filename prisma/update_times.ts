
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const workTimes = [
    { name: '土壌消毒', time: 2 },
    { name: '採穂', time: 75 },
    { name: '挿芽', time: 46 },
    { name: '施肥', time: 3 },
    { name: '圃場準備', time: 8 },
    { name: '定植', time: 46 },
    { name: '杭打ち', time: 4 },
    { name: 'ヤゴかき', time: 25 },
    { name: '収穫', time: 85 },
    { name: '出荷調整', time: 178 },
    { name: '出荷', time: 26 },
    { name: '片付け', time: 6 },
    { name: '薬剤散布', time: 10 },
    { name: '栽培管理', time: 30 },
]

async function main() {
    console.log('Updating work times...')
    for (const item of workTimes) {
        const work = await prisma.workManual.findFirst({
            where: {
                OR: [
                    { workName: item.name },
                    { workName: item.name.replace('挿芽', '挿し芽') }
                ]
            }
        })

        if (work) {
            await prisma.workManual.update({
                where: { id: work.id },
                data: { requiredTime10a: item.time }
            })
            console.log(`Updated: ${work.workName} -> ${item.time} hr/10a`)
        } else {
            console.log(`Not found: ${item.name}`)
        }
    }
    console.log('Batch update finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
