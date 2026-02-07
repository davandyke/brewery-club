import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const APPROVAL_CODE = 'BREWSADER'

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await request.json()

    if (code?.toUpperCase() !== APPROVAL_CODE) {
        return NextResponse.json({ error: 'Invalid code' }, { status: 403 })
    }

    await prisma.user.update({
        where: { id: session.user.id },
        data: { isApproved: true },
    })

    return NextResponse.json({ success: true })
}
