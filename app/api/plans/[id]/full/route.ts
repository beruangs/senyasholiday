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
import mongoose from 'mongoose'

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params
        await dbConnect()

        // Get basic plan info first
        let plan;
        if (mongoose.Types.ObjectId.isValid(id)) {
            plan = await HolidayPlan.findById(id)
                .populate('ownerId', 'username name')
                .populate('adminIds', 'username name')
                .lean() as any
        }

        if (!plan) {
            plan = await HolidayPlan.findOne({ slug: id })
                .populate('ownerId', 'username name')
                .populate('adminIds', 'username name')
                .lean() as any
        }

        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
        }

        // Gather all data in parallel using the actual plan ID
        const finalId = plan._id
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
            Rundown.find({ holidayPlanId: finalId }).sort({ order: 1, date: 1 }).lean(),
            Participant.find({ holidayPlanId: finalId }).sort({ order: 1 }).lean(),
            ExpenseCategory.find({ holidayPlanId: finalId }).sort({ order: 1 }).lean(),
            ExpenseItem.find({ holidayPlanId: finalId }).populate('categoryId').sort({ createdAt: 1 }).lean(),
            Contribution.find({ holidayPlanId: finalId }).populate('participantId').populate('expenseItemId').lean(),
            SplitBill.find({ holidayPlanId: finalId })
                .populate('payerId', 'name')
                .populate('participantPayments.participantId', 'name')
                .populate('items.involvedParticipants', 'name')
                .lean(),
            Note.findOne({ holidayPlanId: finalId }).lean(),
            Checklist.find({ holidayPlanId: finalId }).sort({ updatedAt: -1 }).lean()
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
