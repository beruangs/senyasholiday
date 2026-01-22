import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { HolidayPlan, User } from '@/models'

// GET - Get plan admins
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await dbConnect()

        const plan = await HolidayPlan.findById(params.id)
            .populate('ownerId', 'username name')
            .populate('adminIds', 'username name')

        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
        }

        // Check if user is owner or admin
        const isOwner = plan.ownerId?._id?.toString() === session.user.id
        const isAdmin = plan.adminIds?.some((admin: any) => admin._id?.toString() === session.user.id)

        if (!isOwner && !isAdmin) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
        }

        return NextResponse.json({
            owner: plan.ownerId,
            admins: plan.adminIds || [],
            isOwner,
        })
    } catch (error) {
        console.error('Error fetching admins:', error)
        return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 })
    }
}

// POST - Add admin to plan
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await dbConnect()

        const plan = await HolidayPlan.findById(params.id)

        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
        }

        // Only owner can add admins
        if (plan.ownerId?.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Only owner can add admins' }, { status: 403 })
        }

        const body = await request.json()
        const { username } = body

        if (!username) {
            return NextResponse.json({ error: 'Username required' }, { status: 400 })
        }

        // Clean username
        const cleanUsername = username.trim().toLowerCase().replace(/^@/, '')

        // Find user by username
        const userToAdd = await User.findOne({ username: cleanUsername })

        if (!userToAdd) {
            return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
        }

        // Can't add owner as admin
        if (userToAdd._id.toString() === plan.ownerId?.toString()) {
            return NextResponse.json({ error: 'Owner sudah memiliki akses penuh' }, { status: 400 })
        }

        // Check if already admin
        if (plan.adminIds?.includes(userToAdd._id)) {
            return NextResponse.json({ error: 'User sudah menjadi admin' }, { status: 400 })
        }

        // Add to adminIds
        plan.adminIds = plan.adminIds || []
        plan.adminIds.push(userToAdd._id)
        await plan.save()

        return NextResponse.json({
            success: true,
            admin: {
                _id: userToAdd._id,
                username: userToAdd.username,
                name: userToAdd.name,
            }
        })
    } catch (error) {
        console.error('Error adding admin:', error)
        return NextResponse.json({ error: 'Failed to add admin' }, { status: 500 })
    }
}

// DELETE - Remove admin from plan
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

        const plan = await HolidayPlan.findById(params.id)

        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
        }

        // Only owner can remove admins
        if (plan.ownerId?.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Only owner can remove admins' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const adminId = searchParams.get('adminId')

        if (!adminId) {
            return NextResponse.json({ error: 'Admin ID required' }, { status: 400 })
        }

        // Remove from adminIds
        plan.adminIds = (plan.adminIds || []).filter(
            (id: any) => id.toString() !== adminId
        )
        await plan.save()

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error removing admin:', error)
        return NextResponse.json({ error: 'Failed to remove admin' }, { status: 500 })
    }
}
