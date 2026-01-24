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

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await dbConnect()

        const { id: planId } = params
        const body = await req.json()
        const {
            rundowns = [],
            participants = [],
            categories = [],
            expenses = [],
            contributions = [],
            splitBills = [],
            notes = [],
            checklists = []
        } = body

        // Verify access
        const plan = await HolidayPlan.findById(planId)
        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
        }

        // --- 0. Always Clear Existing Data Before Import ---
        await Promise.all([
            Rundown.deleteMany({ holidayPlanId: planId }),
            Participant.deleteMany({ holidayPlanId: planId }),
            ExpenseCategory.deleteMany({ holidayPlanId: planId }),
            ExpenseItem.deleteMany({ holidayPlanId: planId }),
            Contribution.deleteMany({ holidayPlanId: planId }),
            SplitBill.deleteMany({ holidayPlanId: planId }),
            Note.deleteMany({ holidayPlanId: planId }),
            Checklist.deleteMany({ holidayPlanId: planId })
        ])

        // --- 1. Map Participants ---
        const participantMap: Record<string, string> = {}
        for (const p of participants) {
            const { _id, ...pData } = p
            const newP = await Participant.create({
                ...pData,
                holidayPlanId: planId,
                userId: undefined // Don't link to old user accounts
            })
            participantMap[_id] = newP._id.toString()
        }

        // --- 2. Map Categories ---
        const categoryMap: Record<string, string> = {}
        for (const c of categories) {
            const { _id, ...cData } = c
            const newC = await ExpenseCategory.create({
                ...cData,
                holidayPlanId: planId
            })
            categoryMap[_id] = newC._id.toString()
        }

        // --- 3. Create Rundowns ---
        for (const r of rundowns) {
            const { _id, ...rData } = r
            await Rundown.create({
                ...rData,
                holidayPlanId: planId
            })
        }

        // --- 4. Create Expenses & Map them ---
        const expenseMap: Record<string, string> = {}
        for (const e of expenses) {
            const { _id, categoryId, collectorId, ...eData } = e
            const newE = await ExpenseItem.create({
                ...eData,
                holidayPlanId: planId,
                categoryId: categoryId ? categoryMap[categoryId] : undefined,
                collectorId: collectorId ? participantMap[collectorId] : undefined
            })
            expenseMap[_id] = newE._id.toString()
        }

        // --- 5. Create Contributions ---
        for (const c of contributions) {
            const { _id, expenseItemId, participantId, ...cData } = c
            await Contribution.create({
                ...cData,
                holidayPlanId: planId,
                expenseItemId: expenseItemId?._id ? expenseMap[expenseItemId._id] : expenseMap[expenseItemId],
                participantId: participantId?._id ? participantMap[participantId._id] : participantMap[participantId]
            })
        }

        // --- 6. Create Split Bills ---
        for (const sb of splitBills) {
            const { _id, payerId, items, participantPayments, ...sbData } = sb

            const newItems = items.map((item: any) => ({
                ...item,
                involvedParticipants: item.involvedParticipants?.map((pid: string) => participantMap[pid])
            }))

            const newParticipantPayments = participantPayments.map((pp: any) => ({
                ...pp,
                participantId: participantMap[pp.participantId]
            }))

            await SplitBill.create({
                ...sbData,
                holidayPlanId: planId,
                payerId: participantMap[payerId],
                items: newItems,
                participantPayments: newParticipantPayments
            })
        }

        // --- 7. Create Notes ---
        for (const n of notes) {
            const { _id, ...nData } = n
            await Note.create({
                ...nData,
                holidayPlanId: planId
            })
        }

        // --- 8. Create Checklists ---
        for (const ch of checklists) {
            const { _id, assignedTo, ...chData } = ch
            await Checklist.create({
                ...chData,
                holidayPlanId: planId,
                assignedTo: assignedTo ? participantMap[assignedTo] : undefined
            })
        }

        return NextResponse.json({ success: true, message: 'Plan data imported successfully' })
    } catch (error) {
        console.error('Import error:', error)
        return NextResponse.json({ error: 'Failed to import plan' }, { status: 500 })
    }
}
