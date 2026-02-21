
import prisma from '@/lib/prisma'
import { Prisma, WorkRecord } from '@prisma/client'
import { NextResponse } from 'next/server'

// Keywords map to determine schedule updates
const TRIGGER_KEYWORDS = {
    START: ['定植', '株間', '鉢上げ'], // Starts a new crop cycle
    PHASE_CHANGE: ['消灯', '電照'],      // Changes phase (e.g. Veg -> Flower)
    HARVEST_START: ['収穫開始'],         // Start harvesting
    END: ['収穫終了', '撤去', '片付け']   // Ends the cycle
}

async function updateSchedule(record: any) {
    const { greenhouseName, workName, date, batchNumber } = record

    // 1. Find greenhouse ID (Normalized lookup)
    const allGH = await prisma.greenhouse.findMany()
    const greenhouse = allGH.find(g =>
        g.name === greenhouseName || normalizeGH(g.name) === normalizeGH(greenhouseName)
    )

    // If unknown greenhouse, maybe create a placeholder ID or skip? 
    // For now, let's assume we can't link if not found, but we can store ID as optional in schedule if we want, 
    // but schema says ID required. Let's use a dummy or try to create if missing?
    // Better: use the Name as key if ID missing, but schema relies on ID. 
    // Let's skip if no greenhouse found to avoid errors.
    if (!greenhouse) return

    const recordDate = new Date(date)

    // Helper: Find open schedule for this greenhouse
    const findOpenSchedule = async () =>
        prisma.cropSchedule.findFirst({
            where: {
                greenhouseId: greenhouse.id,
                endDate: null
            },
            orderBy: { startDate: 'desc' }
        })

    // Logic Tree
    if (TRIGGER_KEYWORDS.START.some(k => workName.includes(k))) {
        // CLOSE any existing open schedule first
        const openSched = await findOpenSchedule()
        if (openSched) {
            await prisma.cropSchedule.update({
                where: { id: openSched.id },
                data: { endDate: recordDate }
            })
        }

        // CREATE NEW '定植〜消灯' (Vegative Phase)
        await prisma.cropSchedule.create({
            data: {
                greenhouseId: greenhouse.id,
                greenhouseName: greenhouse.name,
                stage: '定植〜消灯',
                startDate: recordDate,
                color: '#4caf50', // Green
                batchNumber: batchNumber
            }
        })
    }
    else if (TRIGGER_KEYWORDS.PHASE_CHANGE.some(k => workName.includes(k))) {
        // UPDATE current to END, Start NEW '消灯〜収穫' (Reproductive Phase)
        const openSched = await findOpenSchedule()
        if (openSched) {
            await prisma.cropSchedule.update({
                where: { id: openSched.id },
                data: { endDate: recordDate }
            })

            await prisma.cropSchedule.create({
                data: {
                    greenhouseId: greenhouse.id,
                    greenhouseName: greenhouse.name,
                    stage: '消灯〜収穫',
                    startDate: recordDate,
                    color: '#2196f3', // Blue
                    batchNumber: openSched.batchNumber // Inherit batch
                }
            })
        }
    }
    else if (TRIGGER_KEYWORDS.END.some(k => workName.includes(k))) {
        // CLOSE current content
        const openSched = await findOpenSchedule()
        if (openSched) {
            await prisma.cropSchedule.update({
                where: { id: openSched.id },
                data: { endDate: recordDate }
            })
        }
    }
}

export async function GET() {
    try {
        const records = await prisma.workRecord.findMany({
            orderBy: { date: 'desc' }
        })
        return NextResponse.json(records)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 })
    }
}



// Robust normalization to match "1-s" with "①-S"
function normalizeGH(name: string) {
    if (!name) return ""
    let n = name.toUpperCase().trim()
    // Map numbers to circled numbers
    const circled = ["⓪", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"]
    n = n.replace(/[0-9]+/g, (match) => {
        const num = parseInt(match)
        return num <= 10 ? circled[num] : match
    })
    // Remove common separators to make matching flexible (e.g. 1-s vs 1s)
    return n.replace(/[-\s]/g, "")
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const recordsRaw = Array.isArray(body) ? body : [body]

        // Fetch all greenhouses once to lookup areas
        const allGreenhouses = await prisma.greenhouse.findMany()

        // Create lookup maps
        const ghByCanonical = new Map(allGreenhouses.map(g => [g.name, g]))
        const ghByNormalized = new Map(allGreenhouses.map(g => [normalizeGH(g.name), g]))

        const results = []

        for (const data of recordsRaw) {
            const { workName, greenhouseName, batchNumber, areaAcre, spentTime, note, date } = data

            if (!workName || !greenhouseName || spentTime === undefined) {
                if (recordsRaw.length === 1) {
                    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
                }
                continue
            }

            // Lookup area & Canonical name using normalized matching
            const ghMaster = ghByCanonical.get(greenhouseName) || ghByNormalized.get(normalizeGH(greenhouseName))

            let finalArea = areaAcre ? Number(areaAcre) : 0
            let finalGHName = greenhouseName

            if (ghMaster) {
                finalArea = ghMaster.areaAcre
                finalGHName = ghMaster.name // Use the master's name (e.g. "①-S" instead of "1-s")
            }

            const record = await prisma.workRecord.create({
                data: {
                    workName,
                    greenhouseName: finalGHName,
                    batchNumber: batchNumber ? Number(batchNumber) : null,
                    areaAcre: finalArea,
                    spentTime: Number(spentTime),
                    note: note ? String(note) : "",
                    photoUrl: data.photoUrl || null,
                    date: date ? new Date(date) : new Date()
                }
            })

            // TRIGGER AUTO-UPDATE for Gantt chart
            await updateSchedule(record).catch(err => console.error("Schedule update failed:", err))

            results.push(record)
        }

        return NextResponse.json(results.length === 1 && !Array.isArray(body) ? results[0] : results)
    } catch (error) {
        console.error('Record creation error:', error)
        return NextResponse.json({ error: 'Failed to save record' }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json()
        const { id, date, batchNumber, areaAcre, spentTime, note } = body

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 })
        }

        const updated = await prisma.workRecord.update({
            where: { id },
            data: {
                date: date ? new Date(date) : undefined,
                batchNumber: batchNumber !== undefined ? Number(batchNumber) : undefined,
                areaAcre: areaAcre !== undefined ? Number(areaAcre) : undefined,
                spentTime: spentTime !== undefined ? Number(spentTime) : undefined,
                note: note !== undefined ? note : undefined,
                photoUrl: body.photoUrl !== undefined ? body.photoUrl : undefined,
            }
        })

        // Note: We are NOT re-triggering schedule updates on PATCH for simplicity in this version,
        // as it requires complex logic to check if dates shifted phases. 
        // Can be added if user requests "Fixing record should fix schedule".

        return NextResponse.json(updated)
    } catch (error) {
        console.error('Record update error:', error)
        return NextResponse.json({ error: 'Failed to update record' }, { status: 500 })
    }
}
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const all = searchParams.get('all')

        if (all === 'true') {
            await prisma.workRecord.deleteMany({})
            return NextResponse.json({ message: 'All records deleted' })
        }

        if (id) {
            await prisma.workRecord.delete({
                where: { id }
            })
            return NextResponse.json({ message: 'Record deleted' })
        }

        return NextResponse.json({ error: 'ID or all=true is required' }, { status: 400 })
    } catch (error) {
        console.error('Record deletion error:', error)
        return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 })
    }
}
