import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { User } from '@/models'

// GET - Get all users (superadmin only)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id
        const sessionRole = (session.user as any)?.role
        const isEnvAdmin = userId.startsWith('env-')

        await dbConnect()

        // Check if user is superadmin
        // For env-admin users, check session role
        if (isEnvAdmin) {
            if (sessionRole !== 'superadmin') {
                return NextResponse.json({ error: 'Superadmin access required' }, { status: 403 })
            }
        } else {
            // For database users, check role from database
            const adminUser = await User.findById(userId)
            if (adminUser?.role !== 'superadmin') {
                return NextResponse.json({ error: 'Superadmin access required' }, { status: 403 })
            }
        }

        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .lean()

        return NextResponse.json(users)
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
}
