import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { User, SystemSetting } from '@/models'

// GET - Get system settings
export async function GET(request: NextRequest) {
    try {
        await dbConnect()
        const settings = await SystemSetting.find()
        return NextResponse.json(settings)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }
}

// POST - Update or create setting (Superadmin only)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id
        const sessionRole = (session.user as any)?.role
        const isEnvAdmin = userId.startsWith('env-')

        await dbConnect()

        // Check if requester is superadmin
        let isAdmin = false
        if (isEnvAdmin) {
            isAdmin = sessionRole === 'superadmin'
        } else {
            const adminUser = await User.findById(userId)
            isAdmin = adminUser?.role === 'superadmin'
        }

        if (!isAdmin) {
            return NextResponse.json({ error: 'Superadmin access required' }, { status: 403 })
        }

        const body = await request.json()
        const { key, value, description } = body

        if (!key) {
            return NextResponse.json({ error: 'Key is required' }, { status: 400 })
        }

        const setting = await SystemSetting.findOneAndUpdate(
            { key },
            {
                value,
                description,
                updatedBy: isEnvAdmin ? null : userId,
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        )

        return NextResponse.json(setting)
    } catch (error) {
        console.error('Settings error:', error)
        return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 })
    }
}
