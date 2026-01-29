import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { HolidayPlan, TravelDocument, User } from '@/models'
import mongoose from 'mongoose'

const isValidObjectId = (id: string) => {
    return mongoose.Types.ObjectId.isValid(id) && !id.startsWith('env-')
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string, docId: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await dbConnect()

        // Authorization check (can user manage the plan?)
        const plan = await HolidayPlan.findById(params.id)
        if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

        const userId = session.user.id
        const isOwner = plan.ownerId?.toString() === userId
        const isAdmin = plan.adminIds?.some((id: any) => id.toString() === userId)
        const isSuperadmin = (session.user as any).role === 'superadmin' || userId.startsWith('env-')

        if (!isOwner && !isAdmin && !isSuperadmin) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
        }

        await TravelDocument.findByIdAndDelete(params.docId)
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string, docId: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await dbConnect()
        const body = await req.json()

        const updated = await TravelDocument.findByIdAndUpdate(
            params.docId,
            { ...body, updatedAt: new Date() },
            { new: true }
        )

        return NextResponse.json(updated)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
    }
}
