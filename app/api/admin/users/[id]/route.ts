import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { User } from '@/models'

// Helper to check superadmin access
async function checkSuperadminAccess(session: any): Promise<boolean> {
    if (!session?.user?.id) return false

    const userId = session.user.id
    const sessionRole = (session.user as any)?.role
    const isEnvAdmin = userId.startsWith('env-')

    if (isEnvAdmin) {
        return sessionRole === 'superadmin'
    }

    const user = await User.findById(userId)
    return user?.role === 'superadmin'
}

// PUT - Update user role (superadmin only)
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await dbConnect()

        // Check if user is superadmin
        const isSuperadmin = await checkSuperadminAccess(session)
        if (!isSuperadmin) {
            return NextResponse.json({ error: 'Superadmin access required' }, { status: 403 })
        }

        const body = await request.json()
        const { role } = body

        // Validate role
        if (!['user', 'sen_user', 'superadmin'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
        }

        // Prevent demoting yourself (only for database users)
        const isEnvAdmin = session.user.id.startsWith('env-')
        if (!isEnvAdmin && params.id === session.user.id && role !== 'superadmin') {
            return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })
        }

        const user = await User.findByIdAndUpdate(
            params.id,
            { role },
            { new: true }
        ).select('-password')

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json(user)
    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }
}

// DELETE - Delete user (superadmin only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await dbConnect()

        // Check if user is superadmin
        const isSuperadmin = await checkSuperadminAccess(session)
        if (!isSuperadmin) {
            return NextResponse.json({ error: 'Superadmin access required' }, { status: 403 })
        }

        console.log(`[Admin] Attempting to delete user ${params.id} by admin ${session.user.id}`)

        // Prevent deleting yourself
        if (params.id === session.user.id) {
            return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
        }

        const user = await User.findById(params.id)
        if (!user) {
            console.log(`[Admin] User ${params.id} not found in database`)
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // 1. Remove this user from all plans they are an owner of
        // (Optional: You might want to delete their plans or transfer them)
        // For now, we'll keep the plans but they'll have no owner
        // or you could delete them. Let's delete individual plans and set SEN plans owner to null.
        const { HolidayPlan } = await import('@/models')

        // Remove from admin committees
        await HolidayPlan.updateMany(
            { adminIds: params.id },
            { $pull: { adminIds: params.id } }
        )
        await HolidayPlan.updateMany(
            { pendingAdminIds: params.id },
            { $pull: { pendingAdminIds: params.id } }
        )

        // Actually delete the user
        await User.findByIdAndDelete(params.id)

        console.log(`[Admin] User ${params.id} (@${user.username}) successfully deleted`)
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting user:', error)
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }
}
