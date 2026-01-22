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

        // Prevent deleting yourself (only for database users)
        const isEnvAdmin = session.user.id.startsWith('env-')
        if (!isEnvAdmin && params.id === session.user.id) {
            return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
        }

        const user = await User.findByIdAndDelete(params.id)

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting user:', error)
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }
}
