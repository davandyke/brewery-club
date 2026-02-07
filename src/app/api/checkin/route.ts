import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { breweryId } = await request.json()

    if (!breweryId) {
        return NextResponse.json({ error: 'Missing breweryId' }, { status: 400 })
    }

    // Get user ID from email since session.user.id might not be populated if he re-logs in
    // Actually we fixed the session callback, so session.user.id SHOULD be there.
    // But let's be safe and find by email if needed, or just trust the session.
    // We'll trust the session for now, but fallback to email lookup if needed.

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    })

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.isApproved) {
        return NextResponse.json({ error: 'Not approved' }, { status: 403 })
    }

    const existingCheckIn = await prisma.checkIn.findUnique({
        where: {
            userId_breweryId: {
                userId: user.id,
                breweryId: breweryId,
            },
        },
    })

    if (existingCheckIn) {
        // Toggle off -> Delete
        await prisma.checkIn.delete({
            where: {
                id: existingCheckIn.id,
            },
        })
        return NextResponse.json({ visited: false })
    } else {
        // Toggle on -> Create
        await prisma.checkIn.create({
            data: {
                userId: user.id,
                breweryId: breweryId,
            },
        })
        return NextResponse.json({ visited: true })
    }
}
