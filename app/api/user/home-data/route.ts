import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { HolidayPlan, User, ExpenseItem, Notification } from '@/models'
import mongoose from 'mongoose'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id
        const isEnvAdmin = userId.startsWith('env-')

        await dbConnect()

        // 1. Get Plans (Owned or Admin)
        const notDeletedCondition = { $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] }
        let planQuery: any = { ...notDeletedCondition }

        if (!isEnvAdmin && mongoose.Types.ObjectId.isValid(userId)) {
            const user = await User.findById(userId)
            const role = user?.role || 'user'

            if (role !== 'superadmin') {
                planQuery.$or = [
                    { ownerId: userId },
                    { adminIds: userId }
                ]
            }
        }

        const plans = await HolidayPlan.find(planQuery)
            .sort({ startDate: 1 })
            .lean() as any[]

        // Filter upcoming plans and nearest one
        const now = new Date()
        const upcomingPlans = plans.filter(p => new Date(p.startDate) >= now)
        const nearestPlan = upcomingPlans.length > 0 ? upcomingPlans[0] : null

        // 2. Financial Summary - Total budget from all user's plans
        const planIds = plans.map(p => p._id)
        const expenseItems = await ExpenseItem.find({ holidayPlanId: { $in: planIds } }).select('total')
        const totalBudget = expenseItems.reduce((sum, item) => sum + (item.total || 0), 0)

        // 3. Recent Notifications
        let recentNotifs = []
        if (!isEnvAdmin && mongoose.Types.ObjectId.isValid(userId)) {
            recentNotifs = await Notification.find({ userId })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('fromUserId', 'name')
                .lean()
        }

        return NextResponse.json({
            user: {
                name: session.user.name,
                role: (session.user as any)?.role || 'user'
            },
            stats: {
                totalPlans: plans.length,
                upcomingPlansCount: upcomingPlans.length,
                totalBudget
            },
            nearestPlan: nearestPlan ? {
                _id: nearestPlan._id.toString(),
                title: nearestPlan.title,
                destination: nearestPlan.destination,
                startDate: nearestPlan.startDate,
                endDate: nearestPlan.endDate
            } : null,
            upcomingPlans: upcomingPlans.slice(0, 3).map(p => ({
                _id: p._id.toString(),
                title: p.title,
                destination: p.destination,
                startDate: p.startDate,
                endDate: p.endDate
            })),
            recentNotifs: recentNotifs.map((n: any) => ({
                _id: n._id.toString(),
                title: n.title,
                message: n.message,
                createdAt: n.createdAt,
                type: n.type,
                fromUser: n.fromUserId?.name
            }))
        })
    } catch (error) {
        console.error('Error fetching home data:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
