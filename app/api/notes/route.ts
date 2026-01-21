import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { Note } from '@/models'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const planId = searchParams.get('planId')

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    await dbConnect()
    const note = await Note.findOne({ holidayPlanId: planId })

    if (!note) {
      return NextResponse.json({ content: '' })
    }

    return NextResponse.json(note)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch note' }, { status: 500 })
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
    const { planId, content } = body

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    // Find and update, or create if not exists
    const note = await Note.findOneAndUpdate(
      { holidayPlanId: planId },
      {
        content,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    )

    return NextResponse.json(note)
  } catch (error) {
    console.error('Note POST error:', error)
    return NextResponse.json(
      { error: 'Failed to save note', details: (error as Error).message },
      { status: 500 }
    )
  }
}
