import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { HolidayPlan, User } from '@/models'

// GET - Fetch admins and pending admins for a plan
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await dbConnect()
        const planId = params.id

        const plan = await HolidayPlan.findById(planId)
            .populate('ownerId', '_id username name')
            .populate('adminIds', '_id username name')
            .populate('pendingAdminIds', '_id username name')
            .lean()

        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
        }

        const owner = plan.ownerId ? {
            _id: (plan.ownerId as any)._id.toString(),
            username: (plan.ownerId as any).username,
            name: (plan.ownerId as any).name,
        } : null

        const admins = ((plan.adminIds as any[]) || []).map((admin: any) => ({
            _id: admin._id.toString(),
            username: admin.username,
            name: admin.name,
        }))

        const pendingAdmins = ((plan.pendingAdminIds as any[]) || []).map((admin: any) => ({
            _id: admin._id.toString(),
            username: admin.username,
            name: admin.name,
        }))

        return NextResponse.json({
            owner,
            admins,
            pendingAdmins,
        })
    } catch (error) {
        console.error('Error fetching admins:', error)
        return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 })
    }
}
