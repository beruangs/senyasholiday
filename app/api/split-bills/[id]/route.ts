import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { SplitBill } from '@/models'
import mongoose from 'mongoose'

// PUT update a split bill or update payment status
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect()
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()

        // Check if it's a payment update or a full bill update
        const isPaymentUpdate = body.type === 'payment_update'

        if (isPaymentUpdate) {
            const { participantId, paidAmount, isPaid } = body

            const splitBill = await SplitBill.findById(params.id)
            if (!splitBill) {
                return NextResponse.json({ error: 'Split bill not found' }, { status: 404 })
            }

            // Update the specific participant's payment in the array
            const participantIndex = splitBill.participantPayments.findIndex(
                (p: any) => p.participantId.toString() === participantId
            )

            if (participantIndex !== -1) {
                splitBill.participantPayments[participantIndex].paidAmount = paidAmount
                splitBill.participantPayments[participantIndex].isPaid = isPaid
                splitBill.participantPayments[participantIndex].paidAt = isPaid ? new Date() : splitBill.participantPayments[participantIndex].paidAt

                await splitBill.save()
                return NextResponse.json(splitBill)
            } else {
                return NextResponse.json({ error: 'Participant not found in this bill' }, { status: 404 })
            }
        } else {
            // Full bill update
            const updatedSplitBill = await SplitBill.findByIdAndUpdate(
                params.id,
                { ...body, updatedAt: new Date() },
                { new: true }
            ).populate('payerId', 'name')
                .populate('items.involvedParticipants', 'name')
                .populate('participantPayments.participantId', 'name')

            if (!updatedSplitBill) {
                return NextResponse.json({ error: 'Split bill not found' }, { status: 404 })
            }

            return NextResponse.json(updatedSplitBill)
        }
    } catch (error) {
        console.error('Error updating split bill:', error)
        return NextResponse.json({ error: 'Failed to update split bill' }, { status: 500 })
    }
}

// DELETE a split bill
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect()
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const splitBill = await SplitBill.findByIdAndDelete(params.id)
        if (!splitBill) {
            return NextResponse.json({ error: 'Split bill not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting split bill:', error)
        return NextResponse.json({ error: 'Failed to delete split bill' }, { status: 500 })
    }
}
