import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { User, ImpersonationToken } from '@/models'
import crypto from 'crypto'

// POST - Create impersonation token
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
        if (isEnvAdmin) {
            if (sessionRole !== 'superadmin') {
                return NextResponse.json({ error: 'Superadmin access required' }, { status: 403 })
            }
        } else {
            const adminUser = await User.findById(userId)
            if (adminUser?.role !== 'superadmin') {
                return NextResponse.json({ error: 'Superadmin access required' }, { status: 403 })
            }
        }

        const body = await request.json()
        const { targetUserId } = body

        if (!targetUserId) {
            return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 })
        }

        // Verify target user exists
        const targetUser = await User.findById(targetUserId)
        if (!targetUser) {
            return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
        }

        // Generate token
        const token = crypto.randomBytes(32).toString('hex')

        // Save token (using real admin ID even if env-admin, but if env-admin we need a fallback or create a reference)
        // Since we can't save env-admin in DB ref for ImpersonationToken if it doesn't exist, 
        // let's ensure we only allow impersonation if the admin is in the database or handle it.
        // Actually, if it's env-admin, we don't have an ObjectId.

        // Let's find or create a system user for env-admin in db if needed, or just use a fixed ID.
        // Better: ensure the admin has a DB entry.

        let dbAdminId = isEnvAdmin ? null : userId

        if (isEnvAdmin) {
            // Find a superadmin in db or use the first one as proxy
            const anyAdmin = await User.findOne({ role: 'superadmin' })
            if (anyAdmin) dbAdminId = anyAdmin._id
            else {
                // If no admin in DB, create a temporary one or fail
                // For simplicity, let's assume there's at least one superadmin or create a shadow one
                return NextResponse.json({ error: 'Database admin required for impersonation' }, { status: 400 })
            }
        }

        await ImpersonationToken.create({
            token,
            targetUserId: targetUser._id,
            adminId: dbAdminId
        })

        return NextResponse.json({ token })
    } catch (error) {
        console.error('Impersonation error:', error)
        return NextResponse.json({ error: 'Failed to create impersonation session' }, { status: 500 })
    }
}
