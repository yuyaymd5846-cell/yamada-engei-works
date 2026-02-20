
import prisma from './prisma';

/**
 * Parses the "actionSteps" text of the Parent Stock Management manual
 * and updates the CropSchedule for B (greenhouse-b) and D (greenhouse-d) houses.
 */
export async function syncParentStockManualToSchedule(actionSteps: string) {
    console.log('Syncing Parent Stock dates...');

    const lines = actionSteps.split('\n');
    const newSchedules: { ghId: string, ghName: string, date: Date }[] = [];

    // Mapping of series to greenhouses based on user preferences
    const seriesMap: Record<string, { id: string, name: string }> = {
        '夏系①': { id: 'greenhouse-b', name: 'B' },
        '秋系①': { id: 'greenhouse-b', name: 'B' },
        '秋系③': { id: 'greenhouse-b', name: 'B' },
        '夏系②': { id: 'greenhouse-d', name: 'D' },
        '秋系②': { id: 'greenhouse-d', name: 'D' },
        '秋系④': { id: 'greenhouse-d', name: 'D' }
    };

    for (const line of lines) {
        // Look for lines that start with a series label, e.g., "- 夏系①: ..."
        const match = line.match(/^-\s*(夏系[①②]|秋系[①②③④])/);
        if (match) {
            const series = match[1];
            const targetHouse = seriesMap[series];
            if (!targetHouse) continue;

            // Extract all dates in M/D or M月D日 format
            const dateRegex = /(\d{1,2})[\/月](\d{1,2})[日]?/g;
            let dateMatch;
            while ((dateMatch = dateRegex.exec(line)) !== null) {
                const month = parseInt(dateMatch[1]);
                const day = parseInt(dateMatch[2]);

                // Determine year: If month is 9-12, assume it's "last year" or current year depending on context.
                // For simplicity as requested, we'll assume 2026 for now as used in seed.
                // Realistically would need more logic for year rollover.
                const year = 2026;
                const date = new Date(year, month - 1, day);

                if (!isNaN(date.getTime())) {
                    newSchedules.push({
                        ghId: targetHouse.id,
                        ghName: targetHouse.name,
                        date
                    });
                }
            }
        }
    }

    if (newSchedules.length > 0) {
        console.log(`Found ${newSchedules.length} dates to sync.`);

        await prisma.$transaction(async (tx) => {
            // 1. Delete existing Parent Stock schedules for these houses
            await tx.cropSchedule.deleteMany({
                where: {
                    stage: '親株管理',
                    greenhouseId: { in: ['greenhouse-b', 'greenhouse-d'] }
                }
            });

            // 2. Create new schedules
            for (const item of newSchedules) {
                await tx.cropSchedule.create({
                    data: {
                        greenhouseId: item.ghId,
                        greenhouseName: item.ghName,
                        stage: '親株管理',
                        startDate: item.date,
                        endDate: item.date, // Single day for these tasks
                        color: '#e67e22'
                    }
                });
            }
        });
        console.log('Sync complete.');
    } else {
        console.log('No dates found to sync.');
    }
}
