import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { Participant, Contribution, ExpenseItem } from '@/models'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const planId = searchParams.get('planId')

    await dbConnect()
    const participants = await Participant.find({ holidayPlanId: planId })
      .sort({ order: 1 })
      .lean()

    return NextResponse.json(participants)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const { holidayPlanId, name, phoneNumber, order } = await req.json()
    const participant = await Participant.create({ holidayPlanId, name, phoneNumber, order })

    return NextResponse.json(participant, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create participant' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const participantId = searchParams.get('id')

    if (!participantId) {
      return NextResponse.json({ error: 'Participant ID is required' }, { status: 400 })
    }

    await dbConnect()

    // Get the participant to find the planId
    const participant = await Participant.findById(participantId)
    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    const planId = participant.holidayPlanId

    // Find all contributions for this participant
    const contributionsToDelete = await Contribution.find({
      participantId: participantId,
      holidayPlanId: planId
    })

    // Group contributions by expense item to recalculate
    const expenseMap = new Map<string, typeof contributionsToDelete>()
    for (const contribution of contributionsToDelete) {
      const expenseId = contribution.expenseItemId.toString()
      if (!expenseMap.has(expenseId)) {
        expenseMap.set(expenseId, [])
      }
      expenseMap.get(expenseId)!.push(contribution)
    }

    // Delete all contributions for this participant
    await Contribution.deleteMany({ participantId: participantId })

    // Recalculate iuran for each expense
    for (const [expenseId, deletedContributions] of expenseMap) {
      const remainingContributions = await Contribution.find({
        expenseItemId: expenseId,
        holidayPlanId: planId
      })

      // If there are remaining contributors, recalculate their amounts
      if (remainingContributions.length > 0) {
        const expense = await ExpenseItem.findById(expenseId)
        if (expense) {
          const rawNewAmount = expense.total / remainingContributions.length
          const newAmount = Math.round(rawNewAmount / 100) * 100

          // Update all remaining contributions for this expense
          await Contribution.updateMany(
            { expenseItemId: expenseId, holidayPlanId: planId },
            { amount: newAmount }
          )
        }
      }
    }

    // Delete the participant
    await Participant.findByIdAndDelete(participantId)

    return NextResponse.json({
      success: true,
      message: `Peserta berhasil dihapus. Iuran peserta lain telah disesuaikan otomatis.`
    })
  } catch (error) {
    console.error('Error deleting participant:', error)
    return NextResponse.json({ error: 'Failed to delete participant' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const { id, name, phoneNumber } = await req.json()

    if (!id || !name) {
      return NextResponse.json({ error: 'ID and name are required' }, { status: 400 })
    }

    const updatedParticipant = await Participant.findByIdAndUpdate(
      id,
      { name, phoneNumber },
      { new: true }
    )

    if (!updatedParticipant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    return NextResponse.json(updatedParticipant)
  } catch (error) {
    console.error('Error updating participant:', error)
    return NextResponse.json({ error: 'Failed to update participant' }, { status: 500 })
  }
}
