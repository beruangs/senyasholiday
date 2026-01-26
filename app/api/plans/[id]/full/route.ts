import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import {
    HolidayPlan,
    Rundown,
    ExpenseCategory,
    ExpenseItem,
    Participant,
    Contribution,
    SplitBill,
    Note,
    Checklist
} from '@/models'

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params
        await dbConnect()

        // Get basic plan info first to check if public
        const plan = await HolidayPlan.findById(id)
            .populate('ownerId', 'username name')
            .populate('adminIds', 'username name')
            .lean() as any

        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
        }

        // Gather all data in parallel
        const [
            rundowns,
            participants,
            categories,
            expenses,
            contributions,
            splitBills,
            notes,
            checklists
        ] = await Promise.all([
            Rundown.find({ holidayPlanId: id }).sort({ order: 1, date: 1 }).lean(),
            Participant.find({ holidayPlanId: id }).sort({ order: 1 }).lean(),
            ExpenseCategory.find({ holidayPlanId: id }).sort({ order: 1 }).lean(),
            ExpenseItem.find({ holidayPlanId: id }).populate('categoryId').sort({ createdAt: 1 }).lean(),
            Contribution.find({ holidayPlanId: id }).populate('participantId').lean(),
            SplitBill.find({ holidayPlanId: id })
                .populate('payerId', 'name')
                .populate('participantPayments.participantId', 'name')
                .populate('items.involvedParticipants', 'name')
                .lean(),
            Note.findOne({ holidayPlanId: id }).lean(),
            Checklist.find({ holidayPlanId: id }).sort({ updatedAt: -1 }).lean()
        ])

        return NextResponse.json({
            plan: {
                ...plan,
                hasPassword: !!plan.password,
                // Do not send password here unless authenticated
            },
            rundowns,
            participants,
            categories,
            expenses,
            contributions,
            splitBills,
            note: notes ? (notes as any).content : '',
            checklist: checklists
        })
    } catch (error) {
        console.error('Full plan fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch plan data' }, { status: 500 })
    }
}
