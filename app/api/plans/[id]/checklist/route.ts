import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { HolidayPlan, Checklist } from '@/models'
import mongoose from 'mongoose'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect()
        const items = await Checklist.find({ holidayPlanId: params.id }).sort({ createdAt: 1 })
        return NextResponse.json(items)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await dbConnect()
        const planId = params.id

        // Final simplified auth
        const plan = await HolidayPlan.findById(planId)
        if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

        const body = await req.json()

        // Use direct model create to avoid validation issues with old schemas
        const newItem = await Checklist.create({
            holidayPlanId: new mongoose.Types.ObjectId(planId),
            item: body.item,
            category: body.category || 'packing',
            isCompleted: false
        })

        return NextResponse.json(newItem)
    } catch (error: any) {
        console.error('Checklist POST Error:', error)
        return NextResponse.json({
            error: 'Database Error',
            details: error.message
        }, { status: 500 })
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect()
        const { id: itemId, ...updates } = await req.json()
        const updatedItem = await Checklist.findByIdAndUpdate(itemId, updates, { new: true })
        return NextResponse.json(updatedItem)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect()
        const itemId = new URL(req.url).searchParams.get('id')
        await Checklist.findByIdAndDelete(itemId)
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
