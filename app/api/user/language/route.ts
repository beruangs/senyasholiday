import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { User } from '@/models'

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { language } = await req.json()
        if (!['id', 'en'].includes(language)) {
            return NextResponse.json({ error: 'Invalid language' }, { status: 400 })
        }

        await dbConnect()
        await User.findByIdAndUpdate(session.user.id, { language })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
