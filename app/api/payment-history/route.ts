import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { PaymentHistory, Participant, ExpenseItem, Contribution } from '@/models'

// GET - Fetch payment history
export async function GET(request: NextRequest) {
    try {
        await connectDB()

        const { searchParams } = new URL(request.url)
        const planId = searchParams.get('planId')
        const contributionId = searchParams.get('contributionId')
        const participantId = searchParams.get('participantId')
        const limit = parseInt(searchParams.get('limit') || '50')

        if (!planId) {
            return NextResponse.json(
                { error: 'planId is required' },
                { status: 400 }
            )
        }

        const query: any = { holidayPlanId: planId }

        if (contributionId) {
            query.contributionId = contributionId
        }

        if (participantId) {
            query.participantId = participantId
        }

        const history = await PaymentHistory
            .find(query)
            .populate('participantId', 'name')
            .populate('expenseItemId', 'itemName')
            .populate('contributionId')
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean()

        return NextResponse.json(history)
    } catch (error) {
        console.error('Error fetching payment history:', error)
        return NextResponse.json(
            { error: 'Failed to fetch payment history' },
            { status: 500 }
        )
    }
}

// POST - Create payment history entry (usually called when updating payment)
export async function POST(request: NextRequest) {
    try {
        await connectDB()

        const body = await request.json()
        const {
            holidayPlanId,
            contributionId,
            participantId,
            expenseItemId,
            action,
            previousAmount,
            newAmount,
            paymentMethod,
            note
        } = body

        if (!holidayPlanId || !contributionId || !participantId || !action) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const changeAmount = newAmount - previousAmount

        const history = await PaymentHistory.create({
            holidayPlanId,
            contributionId,
            participantId,
            expenseItemId,
            action,
            previousAmount,
            newAmount,
            changeAmount,
            paymentMethod: paymentMethod || 'manual',
            note: note || null,
        })

        return NextResponse.json(history, { status: 201 })
    } catch (error) {
        console.error('Error creating payment history:', error)
        return NextResponse.json(
            { error: 'Failed to create payment history' },
            { status: 500 }
        )
    }
}
