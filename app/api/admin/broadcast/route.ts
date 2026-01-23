import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { User, Notification } from '@/models'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id

        await dbConnect()

        // Verify if user is superadmin
        // Environment admins have role 'superadmin' in session
        const userRole = (session.user as any)?.role
        if (userRole !== 'superadmin') {
            return NextResponse.json({ error: 'Superadmin access required' }, { status: 403 })
        }

        const body = await req.json()
        const { title, message, targetRoles } = body

        if (!title || !message || !targetRoles || !Array.isArray(targetRoles)) {
            return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
        }

        // Find users based on roles
        const users = await User.find({ role: { $in: targetRoles } }).select('_id')

        if (users.length === 0) {
            return NextResponse.json({ error: 'Tidak ada user dengan role terpilih' }, { status: 404 })
        }

        // Create notifications for all selected users
        const notifications = users.map(user => ({
            userId: user._id,
            type: 'general',
            fromUserId: userId.startsWith('env-') ? null : userId, // Env admins don't have a DB user ID
            title,
            message,
            read: false,
            responded: false,
        }))

        await Notification.insertMany(notifications)

        return NextResponse.json({
            success: true,
            message: `Berhasil mengirim broadcast ke ${users.length} user.`
        })
    } catch (error) {
        console.error('Error sending broadcast:', error)
        return NextResponse.json({ error: 'Gagal mengirim broadcast' }, { status: 500 })
    }
}
