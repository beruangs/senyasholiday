import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { Notification, HolidayPlan, User } from '@/models'
import mongoose from 'mongoose'

const isValidObjectId = (id: string) => {
    return mongoose.Types.ObjectId.isValid(id) && !id.startsWith('env-')
}

// GET - Fetch all notifications for current user
export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id
        if (!isValidObjectId(userId)) {
            // Env admins don't have notifications yet
            return NextResponse.json([])
        }

        await dbConnect()

        const notifications = await Notification.find({
            userId,
            responded: false // Only show unresponded notifications
        })
            .populate('planId', 'title destination')
            .populate('fromUserId', 'username name')
            .sort({ createdAt: -1 })
            .lean()

        const formattedNotifications = notifications.map((n: any) => ({
            _id: n._id.toString(),
            type: n.type,
            title: n.title,
            message: n.message,
            read: n.read,
            responded: n.responded,
            plan: n.planId ? {
                _id: n.planId._id.toString(),
                title: n.planId.title,
                destination: n.planId.destination,
            } : null,
            fromUser: n.fromUserId ? {
                _id: n.fromUserId._id.toString(),
                username: n.fromUserId.username,
                name: n.fromUserId.name,
            } : null,
            createdAt: n.createdAt,
        }))

        return NextResponse.json(formattedNotifications)
    } catch (error) {
        console.error('Error fetching notifications:', error)
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }
}

// POST - Respond to admin invite notification
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id
        if (!isValidObjectId(userId)) {
            return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
        }

        await dbConnect()
        const { notificationId, action } = await req.json()

        if (!notificationId || !['accept', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
        }

        const notification = await Notification.findById(notificationId)
        if (!notification) {
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
        }

        // Verify this notification belongs to current user
        if (notification.userId.toString() !== userId) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
        }

        // Only process admin_invite type
        if (notification.type !== 'admin_invite') {
            return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
        }

        const plan = await HolidayPlan.findById(notification.planId)
        if (!plan) {
            // Plan was deleted, just mark notification as responded
            notification.responded = true
            await notification.save()
            return NextResponse.json({ message: 'Plan no longer exists' })
        }

        if (action === 'accept') {
            // Move from pendingAdminIds to adminIds
            await HolidayPlan.updateOne(
                { _id: plan._id },
                {
                    $pull: { pendingAdminIds: userId },
                    $addToSet: { adminIds: userId }
                }
            )

            // Mark notification as responded
            notification.responded = true
            await notification.save()

            // Notify the plan owner that invite was accepted
            if (plan.ownerId) {
                await Notification.create({
                    userId: plan.ownerId,
                    type: 'admin_invite_accepted',
                    planId: plan._id,
                    fromUserId: userId,
                    title: 'Undangan Editor Diterima',
                    message: `${session.user.name} telah menerima undangan untuk menjadi editor di "${plan.title}"`,
                })
            }

            return NextResponse.json({ message: 'Invitation accepted' })
        } else {
            // Reject: remove from pendingAdminIds
            await HolidayPlan.updateOne(
                { _id: plan._id },
                { $pull: { pendingAdminIds: userId } }
            )

            // Mark notification as responded
            notification.responded = true
            await notification.save()

            // Notify the plan owner that invite was rejected
            if (plan.ownerId) {
                await Notification.create({
                    userId: plan.ownerId,
                    type: 'admin_invite_rejected',
                    planId: plan._id,
                    fromUserId: userId,
                    title: 'Undangan Editor Ditolak',
                    message: `${session.user.name} menolak undangan untuk menjadi editor di "${plan.title}"`,
                })
            }

            return NextResponse.json({ message: 'Invitation rejected' })
        }
    } catch (error) {
        console.error('Error responding to notification:', error)
        return NextResponse.json({ error: 'Failed to respond' }, { status: 500 })
    }
}

// PUT - Mark notifications as read
export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id
        if (!isValidObjectId(userId)) {
            return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
        }

        await dbConnect()
        const { notificationIds } = await req.json()

        if (notificationIds && Array.isArray(notificationIds)) {
            // Mark specific notifications as read
            await Notification.updateMany(
                { _id: { $in: notificationIds }, userId },
                { $set: { read: true } }
            )
        } else {
            // Mark all as read
            await Notification.updateMany(
                { userId, read: false },
                { $set: { read: true } }
            )
        }

        return NextResponse.json({ message: 'Notifications marked as read' })
    } catch (error) {
        console.error('Error marking notifications as read:', error)
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }
}

// DELETE - Delete/dismiss a notification (for accepted/rejected response notifications)
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id
        if (!isValidObjectId(userId)) {
            return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
        }

        await dbConnect()
        const { searchParams } = new URL(req.url)
        const notificationId = searchParams.get('id')

        if (!notificationId) {
            return NextResponse.json({ error: 'Notification ID required' }, { status: 400 })
        }

        // Delete notification only if it belongs to current user
        await Notification.deleteOne({ _id: notificationId, userId })

        return NextResponse.json({ message: 'Notification deleted' })
    } catch (error) {
        console.error('Error deleting notification:', error)
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }
}
