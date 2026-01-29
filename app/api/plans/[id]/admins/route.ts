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
            .lean() as any

        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
        }

        const userId = session.user.id
        const userRole = (session?.user as any)?.role || 'user'
        const isEnvAdmin = userId?.startsWith('env-')
        const isSuperadmin = userRole === 'superadmin' || isEnvAdmin
        const isOwner = plan.ownerId?._id?.toString() === userId
        const isAdmin = plan.adminIds?.some((admin: any) => admin._id?.toString() === userId) || false

        if (!isOwner && !isAdmin && !isSuperadmin) {
            return NextResponse.json({ error: 'Not authorized to view admin list' }, { status: 403 })
        }

        const owner = plan.ownerId ? {
            _id: plan.ownerId._id.toString(),
            username: plan.ownerId.username,
            name: plan.ownerId.name,
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
