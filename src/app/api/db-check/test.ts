import prisma from '../../../lib/prisma'

async function checkDates() {
    const cycles = await prisma.cropCycle.findMany()
    console.log("Cycles:")
    for (const c of cycles) {
        console.log(`Greenhouse: ${c.greenhouseId}, LightsOff: ${c.lightsOffDate?.toISOString()}`)
    }

    const schedules = await prisma.cropSchedule.findMany()
    console.log("\nSchedules:")
    for (const s of schedules) {
        console.log(`Stage: ${s.stage}, GH: ${s.greenhouseId}, Start: ${s.startDate.toISOString()}, End: ${s.endDate?.toISOString()}`)
    }
}

checkDates().catch(console.error)
