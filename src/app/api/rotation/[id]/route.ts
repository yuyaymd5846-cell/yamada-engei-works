
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const { pesticides } = await req.json();

        // Validate structure (basic check)
        if (!Array.isArray(pesticides)) {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        const updated = await prisma.pesticideRotation.update({
            where: { id: id },
            data: {
                pesticides: JSON.stringify(pesticides)
            }
        });

        return NextResponse.json({
            id: updated.id,
            label: updated.label,
            pesticides: JSON.parse(updated.pesticides)
        });
    } catch (error) {
        console.error('Failed to update rotation:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
