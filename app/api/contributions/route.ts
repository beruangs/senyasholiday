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
    const contribution = await Contribution.create(body)

    return NextResponse.json(contribution, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create contribution' }, { status: 500 })
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
    const { _id, ...updateData } = body

    const contribution = await Contribution.findByIdAndUpdate(_id, updateData, { new: true })
    return NextResponse.json(contribution)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update contribution' }, { status: 500 })
  }
}
