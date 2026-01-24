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
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = params
        await dbConnect()

        // Verify access
        const plan = await HolidayPlan.findById(id)
        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
        }

        // Gather all data
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
            Rundown.find({ holidayPlanId: id }).lean(),
            Participant.find({ holidayPlanId: id }).lean(),
            ExpenseCategory.find({ holidayPlanId: id }).lean(),
            ExpenseItem.find({ holidayPlanId: id }).lean(),
            Contribution.find({ holidayPlanId: id }).lean(),
            SplitBill.find({ holidayPlanId: id }).lean(),
            Note.find({ holidayPlanId: id }).lean(),
            Checklist.find({ holidayPlanId: id }).lean()
        ])

        const exportData = {
            version: '1.0',
            planMeta: {
                title: plan.title,
                destination: plan.destination,
                description: plan.description,
                planCategory: plan.planCategory
            },
            rundowns,
            participants,
            categories,
            expenses,
            contributions,
            splitBills,
            notes,
            checklists
        }

        return NextResponse.json(exportData)
    } catch (error) {
        console.error('Export error:', error)
        return NextResponse.json({ error: 'Failed to export plan' }, { status: 500 })
    }
}
