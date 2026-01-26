import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import {
    HolidayPlan,
    Rundown,
    Participant,
    ExpenseItem,
    Contribution,
    SplitBill,
    Note,
    Checklist,
    User
} from '@/models'

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const userId = session.user.id
        const sessionRole = (session.user as any)?.role
        const isEnvAdmin = userId.startsWith('env-')

        await dbConnect()

        // Superadmin check
        let isAdmin = false
        if (isEnvAdmin) {
            isAdmin = sessionRole === 'superadmin'
        } else {
            const adminUser = await User.findById(userId)
            isAdmin = adminUser?.role === 'superadmin'
        }
        if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        // 1. Skeleton Plans (Created > 7 days ago, 0 rundown, 0 participants)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const allPlans = await HolidayPlan.find({
            createdAt: { $lt: sevenDaysAgo },
            deletedAt: null
        }).lean()

        const skeletonPlans = []
        for (const plan of allPlans) {
            const [rundownCount, participantCount] = await Promise.all([
                Rundown.countDocuments({ holidayPlanId: plan._id }),
                Participant.countDocuments({ holidayPlanId: plan._id })
            ])

            if (rundownCount === 0 && participantCount === 0) {
                skeletonPlans.push(plan)
            }
        }

        // 2. Trash Cleanup (Deleted > 30 days ago)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const trashPlansCount = await HolidayPlan.countDocuments({
            deletedAt: { $ne: null, $lt: thirtyDaysAgo }
        })

        return NextResponse.json({
            skeletonPlans: {
                count: skeletonPlans.length,
                description: 'Plans created > 7 days ago with no items/participants'
            },
            trashPlans: {
                count: trashPlansCount,
                description: 'Items in trash for more than 30 days'
            }
        })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch prune stats' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const userId = session.user.id
        const sessionRole = (session.user as any)?.role
        const isEnvAdmin = userId.startsWith('env-')

        await dbConnect()

        // Superadmin check
        let isAdmin = false
        if (isEnvAdmin) {
            isAdmin = sessionRole === 'superadmin'
        } else {
            const adminUser = await User.findById(userId)
            isAdmin = adminUser?.role === 'superadmin'
        }
        if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const body = await req.json()
        const { type } = body

        let deletedCount = 0

        if (type === 'skeleton') {
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

            const allPlans = await HolidayPlan.find({
                createdAt: { $lt: sevenDaysAgo },
                deletedAt: null
            })

            for (const plan of allPlans) {
                const [rundownCount, participantCount] = await Promise.all([
                    Rundown.countDocuments({ holidayPlanId: plan._id }),
                    Participant.countDocuments({ holidayPlanId: plan._id })
                ])

                if (rundownCount === 0 && participantCount === 0) {
                    await deleteFullPlan(plan._id)
                    deletedCount++
                }
            }
        } else if (type === 'trash') {
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
            const plansToDelete = await HolidayPlan.find({
                deletedAt: { $ne: null, $lt: thirtyDaysAgo }
            })

            for (const plan of plansToDelete) {
                await deleteFullPlan(plan._id)
                deletedCount++
            }
        }

        return NextResponse.json({ success: true, deletedCount })
    } catch (error) {
        console.error('Prune error:', error)
        return NextResponse.json({ error: 'Failed to execute pruning' }, { status: 500 })
    }
}

async function deleteFullPlan(id: any) {
    await Promise.all([
        HolidayPlan.findByIdAndDelete(id),
        Rundown.deleteMany({ holidayPlanId: id }),
        Participant.deleteMany({ holidayPlanId: id }),
        ExpenseItem.deleteMany({ holidayPlanId: id }),
        Contribution.deleteMany({ holidayPlanId: id }),
        SplitBill.deleteMany({ holidayPlanId: id }),
        Note.deleteMany({ holidayPlanId: id }),
        Checklist.deleteMany({ holidayPlanId: id })
    ])
}
