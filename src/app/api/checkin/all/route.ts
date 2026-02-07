import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    })

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all breweries
    const breweries = await prisma.brewery.findMany({ select: { id: true } })

    // Create check-ins for all of them
    // We use createMany with skipDuplicates to be efficient
    await prisma.checkIn.createMany({
        data: breweries.map(b => ({
            userId: user.id,
            breweryId: b.id
        })),
        skipDuplicates: true
    })

    return NextResponse.json({ success: true, count: breweries.length })
}
