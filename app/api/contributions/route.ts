import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { Contribution } from '@/models'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const planId = searchParams.get('planId')

    await dbConnect()
    const contributions = await Contribution.find({ holidayPlanId: planId })
      .populate('participantId')
      .populate({
        path: 'expenseItemId',
        populate: {
          path: 'collectorId',
          model: 'Participant'
        }
      })
      .lean()

    return NextResponse.json(contributions)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch contributions' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const body = await req.json()
    
    // Validate required fields
    if (!body.holidayPlanId || !body.expenseItemId || !body.participantId) {
      return NextResponse.json(
        { error: 'Missing required fields: holidayPlanId, expenseItemId, participantId' },
        { status: 400 }
      )
    }

    const contribution = await Contribution.create(body)

    return NextResponse.json(contribution, { status: 201 })
  } catch (error) {
    console.error('Contribution POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create contribution', details: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const body = await req.json()
    const { _id, maxPay, ...updateData } = body

    // Jika maxPay dikirim, update juga field maxPay
    if (typeof maxPay !== 'undefined') {
      updateData.maxPay = maxPay
    }

    const contribution = await Contribution.findByIdAndUpdate(_id, updateData, { new: true })
    return NextResponse.json(contribution)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update contribution' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const expenseItemId = searchParams.get('expenseItemId')
    const participantId = searchParams.get('participantId')

    await dbConnect()

    if (expenseItemId && participantId) {
      // Delete by expenseItemId and participantId
      const result = await Contribution.deleteOne({
        expenseItemId,
        participantId,
      })

      if (result.deletedCount === 0) {
        return NextResponse.json({ error: 'Contribution not found' }, { status: 404 })
      }

      return NextResponse.json({ message: 'Contribution deleted' })
    } else {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete contribution' }, { status: 500 })
  }
}