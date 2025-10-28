import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { Participant } from '@/models'

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
    const body = await req.json()
    const participant = await Participant.create(body)

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
    const id = searchParams.get('id')

    await dbConnect()
    await Participant.findByIdAndDelete(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete participant' }, { status: 500 })
  }
}
