
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.isApproved) {
        return NextResponse.json({ error: 'Not approved' }, { status: 403 })
    }

    try {
        const { breweryIds } = await req.json()

        if (!Array.isArray(breweryIds)) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
        }

        // Transaction:
        // 1. Delete all existing check-ins for user
        // 2. Create new check-ins for the provided IDs

        await prisma.$transaction([
            prisma.checkIn.deleteMany({
                where: { userId: session.user.id }
            }),
            prisma.checkIn.createMany({
                data: breweryIds.map((id: string) => ({
                    userId: session.user.id,
                    breweryId: id // ID is CUID string
                })),
                skipDuplicates: true
            })
        ])

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Batch Check-in Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
