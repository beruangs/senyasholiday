import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { HolidayPlan, User, Notification } from '@/models'
import mongoose from 'mongoose'

const isValidObjectId = (id: string) => {
    return mongoose.Types.ObjectId.isValid(id) && !id.startsWith('env-')
}

// GET - Check if username exists
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await dbConnect()
        const { searchParams } = new URL(req.url)
        const username = searchParams.get('username')?.trim().toLowerCase()

        if (!username) {
            return NextResponse.json({ error: 'Username required' }, { status: 400 })
        }

        const user = await User.findOne({ username }).select('_id username name')

        if (!user) {
            return NextResponse.json({ exists: false })
        }

        // Don't allow inviting yourself
        if (user._id.toString() === session.user.id) {
            return NextResponse.json({
                exists: true,
                error: 'Tidak bisa mengundang diri sendiri'
            })
        }

        return NextResponse.json({
            exists: true,
            user: {
                _id: user._id.toString(),
                username: user.username,
                name: user.name,
            }
        })
    } catch (error) {
        console.error('Error checking username:', error)
        return NextResponse.json({ error: 'Failed to check username' }, { status: 500 })
    }
}

// POST - Send admin invitation
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await dbConnect()
        const { planId, username } = await req.json()

        if (!planId || !username) {
            return NextResponse.json({ error: 'Plan ID and username required' }, { status: 400 })
        }

        // Find the plan
        const plan = await HolidayPlan.findById(planId)
        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
        }

        // Check if current user is the owner or superadmin
        const userId = session.user.id
        const userRole = (session.user as any)?.role || 'user'
        const isEnvAdmin = userId.startsWith('env-')
        const isOwner = plan.ownerId?.toString() === userId
        const isSenPlan = !plan.ownerId

        const canInvite = isOwner || (isSenPlan && (userRole === 'superadmin' || isEnvAdmin)) || userRole === 'superadmin' || isEnvAdmin

        if (!canInvite) {
            return NextResponse.json({ error: 'Not authorized to invite admins' }, { status: 403 })
        }

        // Find the user to invite
        const targetUser = await User.findOne({ username: username.trim().toLowerCase() })
        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const targetUserId = targetUser._id.toString()

        // Check if already an admin
        if (plan.adminIds?.some((id: any) => id.toString() === targetUserId)) {
            return NextResponse.json({ error: 'User sudah menjadi editor' }, { status: 400 })
        }

        // Check if already pending
        if (plan.pendingAdminIds?.some((id: any) => id.toString() === targetUserId)) {
            return NextResponse.json({ error: 'Undangan sudah dikirim, menunggu konfirmasi' }, { status: 400 })
        }

        // Add to pendingAdminIds
        await HolidayPlan.updateOne(
            { _id: planId },
            { $addToSet: { pendingAdminIds: targetUserId } }
        )

        // Create notification for the invited user
        const fromUserId = isValidObjectId(userId) ? userId : null

        await Notification.create({
            userId: targetUserId,
            type: 'admin_invite',
            planId: plan._id,
            fromUserId: fromUserId,
            title: 'Undangan Editor Plan',
            message: `${session.user.name || 'Seseorang'} mengundang kamu untuk menjadi editor di plan "${plan.title}"`,
        })

        return NextResponse.json({
            message: 'Undangan berhasil dikirim',
            pendingUser: {
                _id: targetUserId,
                username: targetUser.username,
                name: targetUser.name,
                status: 'pending'
            }
        })
    } catch (error) {
        console.error('Error sending invitation:', error)
        return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 })
    }
}

// DELETE - Cancel pending invitation or remove admin
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await dbConnect()
        const { searchParams } = new URL(req.url)
        const planId = searchParams.get('planId')
        const targetUserId = searchParams.get('userId')
        const type = searchParams.get('type') // 'pending' or 'admin'

        if (!planId || !targetUserId) {
            return NextResponse.json({ error: 'Plan ID and user ID required' }, { status: 400 })
        }

        // Find the plan
        const plan = await HolidayPlan.findById(planId)
        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
        }

        // Check if current user is the owner or superadmin
        const userId = session.user.id
        const userRole = (session.user as any)?.role || 'user'
        const isEnvAdmin = userId.startsWith('env-')
        const isOwner = plan.ownerId?.toString() === userId
        const isSenPlan = !plan.ownerId

        const canManage = isOwner || (isSenPlan && (userRole === 'superadmin' || isEnvAdmin)) || userRole === 'superadmin' || isEnvAdmin

        if (!canManage) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
        }

        if (type === 'pending') {
            // Cancel pending invitation
            await HolidayPlan.updateOne(
                { _id: planId },
                { $pull: { pendingAdminIds: targetUserId } }
            )

            // Delete the notification
            await Notification.deleteMany({
                userId: targetUserId,
                planId: planId,
                type: 'admin_invite',
                responded: false
            })

            return NextResponse.json({ message: 'Invitation cancelled' })
        } else {
            // Remove admin
            await HolidayPlan.updateOne(
                { _id: planId },
                { $pull: { adminIds: targetUserId } }
            )

            return NextResponse.json({ message: 'Admin removed' })
        }
    } catch (error) {
        console.error('Error managing admin:', error)
        return NextResponse.json({ error: 'Failed to manage admin' }, { status: 500 })
    }
}
