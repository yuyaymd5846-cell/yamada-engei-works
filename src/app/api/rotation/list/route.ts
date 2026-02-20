
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const rotations = await prisma.pesticideRotation.findMany({
            orderBy: {
                // Determine order by parsing the label number if possible, or just string sort
                // Since labels are ①, ②, etc., simple string sort works okay-ish but specialized sort is better.
                // For now, let's just fetch and let frontend sort or rely on creation order if seeded sequentially.
                // Standard string sort: "①" < "②" works.
                label: 'asc'
            }
        });

        // Parse JSON string back to object
        const formattedRotations = rotations.map(r => ({
            id: r.id,
            label: r.label,
            pesticides: JSON.parse(r.pesticides)
        }));

        // Custom sort for Circled Numbers 1-20
        const circledNumbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'];
        formattedRotations.sort((a, b) => {
            return circledNumbers.indexOf(a.label) - circledNumbers.indexOf(b.label);
        });

        return NextResponse.json(formattedRotations);
    } catch (error) {
        console.error('Failed to fetch rotations:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}
