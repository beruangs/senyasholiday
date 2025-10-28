import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { Rundown } from '@/models'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const planId = searchParams.get('planId')

    await dbConnect()
    const rundowns = await Rundown.find({ holidayPlanId: planId })
      .sort({ date: 1, order: 1 })
      .lean()

    return NextResponse.json(rundowns)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch rundowns' }, { status: 500 })
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
    const rundown = await Rundown.create(body)

    return NextResponse.json(rundown, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create rundown' }, { status: 500 })
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

    const rundown = await Rundown.findByIdAndUpdate(_id, updateData, { new: true })
    return NextResponse.json(rundown)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update rundown' }, { status: 500 })
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
    await Rundown.findByIdAndDelete(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete rundown' }, { status: 500 })
  }
}
