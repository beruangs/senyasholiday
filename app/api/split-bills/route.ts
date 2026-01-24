import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { SplitBill, HolidayPlan } from '@/models'
import mongoose from 'mongoose'

// GET all split bills for a plan
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const planId = searchParams.get('planId')

        if (!planId) {
            return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
        }

        await dbConnect()
        const session = await getServerSession(authOptions)

        const splitBills = await SplitBill.find({ holidayPlanId: planId })
            .populate('payerId', 'name')
            .populate('items.involvedParticipants', 'name')
            .populate('participantPayments.participantId', 'name')
            .sort({ date: -1 })
            .lean()

        return NextResponse.json(splitBills)
    } catch (error) {
        console.error('Error fetching split bills:', error)
        return NextResponse.json({ error: 'Failed to fetch split bills' }, { status: 500 })
    }
}

// POST create a new split bill
export async function POST(req: NextRequest) {
    try {
        await dbConnect()
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { holidayPlanId, title, payerId, date, totalAmount, items, participantPayments } = body

        // Basic validation
        if (!holidayPlanId || !title || !payerId || !totalAmount || !items || !participantPayments) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Check if plan exists and user has access
        const plan = await HolidayPlan.findById(holidayPlanId)
        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
        }

        // TODO: Add permission check if needed (e.g. only admins can add split bills)

        const newSplitBill = await SplitBill.create({
            holidayPlanId,
            title,
            payerId,
            date: date || new Date(),
            totalAmount,
            items,
            participantPayments
        })

        return NextResponse.json(newSplitBill)
    } catch (error) {
        console.error('Error creating split bill:', error)
        return NextResponse.json({ error: 'Failed to create split bill' }, { status: 500 })
    }
}
