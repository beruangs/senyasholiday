import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { User } from '@/models'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id
        const isEnvAdmin = userId.startsWith('env-')

        if (isEnvAdmin) {
            // For env admins, return session data as they aren't in database
            return NextResponse.json({
                id: session.user.id,
                name: session.user.name,
                username: (session.user as any).username,
                role: (session.user as any).role,
                isEnvAdmin: true
            })
        }

        await dbConnect()
        const user = await User.findById(userId).select('-password').lean() as any

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json({
            ...user,
            _id: user._id.toString(),
            isEnvAdmin: false
        })
    } catch (error) {
        console.error('Error fetching user profile:', error)
        return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }
}
