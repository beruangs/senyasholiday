import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { HolidayPlan, ExpenseCategory, ExpenseItem, Participant, Contribution, SplitPayment, Rundown, Note, PaymentHistory } from '@/models'
import mongoose from 'mongoose'

// Helper to check if ID is a valid MongoDB ObjectId
const isValidObjectId = (id: string) => {
    return mongoose.Types.ObjectId.isValid(id) && !id.startsWith('env-')
}

// Trash retention period: 1 minute for testing (change to 3 days later)
const TRASH_RETENTION_MS = 1 * 60 * 1000 // 1 minute
// const TRASH_RETENTION_MS = 3 * 24 * 60 * 60 * 1000 // 3 days

// GET all trashed plans for current user
export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await dbConnect()

        const userId = session.user.id
        const userRole = (session.user as any)?.role || 'user'
        const isEnvAdmin = userId.startsWith('env-')

        // Auto-delete expired trash items first
        await HolidayPlan.deleteMany({
            deletedAt: { $ne: null },
            trashExpiresAt: { $lte: new Date() }
        })

        let query: any = { deletedAt: { $ne: null } }

        if (userRole === 'superadmin' || isEnvAdmin) {
            // Superadmin sees all trashed plans
        } else if (isValidObjectId(userId)) {
            // Regular users see only their own trashed plans
            query.$or = [
                { ownerId: userId },
                { adminIds: userId }
            ]
        } else {
            return NextResponse.json([])
        }

        const trashedPlans = await HolidayPlan.find(query)
            .populate('ownerId', 'username name')
            .sort({ deletedAt: -1 })
            .lean()

        // Add time remaining info
        const plansWithTimeRemaining = trashedPlans.map((plan: any) => {
            const now = new Date().getTime()
            const expiresAt = new Date(plan.trashExpiresAt).getTime()
            const remainingMs = Math.max(0, expiresAt - now)

            return {
                ...plan,
                _id: plan._id.toString(),
                remainingMs,
                remainingFormatted: formatTimeRemaining(remainingMs),
                hasPassword: !!plan.password,
                password: undefined,
            }
        })

        return NextResponse.json(plansWithTimeRemaining)
    } catch (error) {
        console.error('Error fetching trash:', error)
        return NextResponse.json({ error: 'Failed to fetch trash' }, { status: 500 })
    }
}

// POST - Move plan to trash (soft delete)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await dbConnect()
        const { planId } = await req.json()

        if (!planId || !isValidObjectId(planId)) {
            return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 })
        }

        const plan = await HolidayPlan.findById(planId)
        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
        }

        // Check permission
        const userId = session.user.id
        const userRole = (session.user as any)?.role || 'user'
        const isEnvAdmin = userId.startsWith('env-')
        const isOwner = plan.ownerId?.toString() === userId
        const isSenPlan = !plan.ownerId
        const canDelete = isOwner || (isSenPlan && (userRole === 'superadmin' || isEnvAdmin)) || userRole === 'superadmin' || isEnvAdmin

        if (!canDelete) {
            return NextResponse.json({ error: 'Not authorized to delete this plan' }, { status: 403 })
        }

        // Move to trash
        const now = new Date()
        plan.deletedAt = now
        plan.trashExpiresAt = new Date(now.getTime() + TRASH_RETENTION_MS)
        await plan.save()

        return NextResponse.json({
            message: 'Plan moved to trash',
            expiresAt: plan.trashExpiresAt
        })
    } catch (error) {
        console.error('Error moving to trash:', error)
        return NextResponse.json({ error: 'Failed to move to trash' }, { status: 500 })
    }
}

// PUT - Restore plan from trash
export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await dbConnect()
        const { planId } = await req.json()

        if (!planId || !isValidObjectId(planId)) {
            return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 })
        }

        const plan = await HolidayPlan.findById(planId)
        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
        }

        if (!plan.deletedAt) {
            return NextResponse.json({ error: 'Plan is not in trash' }, { status: 400 })
        }

        // Check permission
        const userId = session.user.id
        const userRole = (session.user as any)?.role || 'user'
        const isEnvAdmin = userId.startsWith('env-')
        const isOwner = plan.ownerId?.toString() === userId
        const canRestore = isOwner || userRole === 'superadmin' || isEnvAdmin

        if (!canRestore) {
            return NextResponse.json({ error: 'Not authorized to restore this plan' }, { status: 403 })
        }

        // Restore from trash
        plan.deletedAt = null
        plan.trashExpiresAt = null
        await plan.save()

        return NextResponse.json({ message: 'Plan restored successfully' })
    } catch (error) {
        console.error('Error restoring plan:', error)
        return NextResponse.json({ error: 'Failed to restore plan' }, { status: 500 })
    }
}

// DELETE - Permanently delete plan
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await dbConnect()
        const { searchParams } = new URL(req.url)
        const planId = searchParams.get('planId')

        if (!planId || !isValidObjectId(planId)) {
            return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 })
        }

        const plan = await HolidayPlan.findById(planId)
        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
        }

        // Check permission
        const userId = session.user.id
        const userRole = (session.user as any)?.role || 'user'
        const isEnvAdmin = userId.startsWith('env-')
        const isOwner = plan.ownerId?.toString() === userId
        const canDelete = isOwner || userRole === 'superadmin' || isEnvAdmin

        if (!canDelete) {
            return NextResponse.json({ error: 'Not authorized to delete this plan' }, { status: 403 })
        }

        // Permanently delete plan and all related data
        await Promise.all([
            ExpenseCategory.deleteMany({ holidayPlanId: planId }),
            ExpenseItem.deleteMany({ holidayPlanId: planId }),
            Participant.deleteMany({ holidayPlanId: planId }),
            Contribution.deleteMany({ holidayPlanId: planId }),
            SplitPayment.deleteMany({ holidayPlanId: planId }),
            Rundown.deleteMany({ holidayPlanId: planId }),
            Note.deleteMany({ holidayPlanId: planId }),
            PaymentHistory.deleteMany({ holidayPlanId: planId }),
            HolidayPlan.findByIdAndDelete(planId),
        ])

        return NextResponse.json({ message: 'Plan permanently deleted' })
    } catch (error) {
        console.error('Error permanently deleting plan:', error)
        return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 })
    }
}

// Helper function to format remaining time
function formatTimeRemaining(ms: number): string {
    if (ms <= 0) return 'Kedaluwarsa'

    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
        return `${days} hari ${hours % 24} jam lagi`
    } else if (hours > 0) {
        return `${hours} jam ${minutes % 60} menit lagi`
    } else if (minutes > 0) {
        return `${minutes} menit lagi`
    } else {
        return `${seconds} detik lagi`
    }
}
