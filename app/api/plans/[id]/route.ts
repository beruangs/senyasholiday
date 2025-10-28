import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { HolidayPlan, Rundown, ExpenseCategory, ExpenseItem, Participant, Contribution, SplitPayment } from '@/models'

// GET single plan
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    const plan = await HolidayPlan.findById(params.id).lean() as any
    
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...plan,
      _id: plan._id.toString(),
      hasPassword: !!plan.password,
      password: undefined,
    })
  } catch (error) {
    console.error('Error fetching plan:', error)
    return NextResponse.json({ error: 'Failed to fetch plan' }, { status: 500 })
  }
}

// PUT update plan
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const body = await req.json()
    
    const plan = await HolidayPlan.findByIdAndUpdate(
      params.id,
      { ...body, updatedAt: new Date() },
      { new: true }
    )

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    return NextResponse.json(plan)
  } catch (error) {
    console.error('Error updating plan:', error)
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
  }
}

// DELETE plan and all related data
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    
    // Delete all related data
    await Promise.all([
      HolidayPlan.findByIdAndDelete(params.id),
      Rundown.deleteMany({ holidayPlanId: params.id }),
      ExpenseCategory.deleteMany({ holidayPlanId: params.id }),
      ExpenseItem.deleteMany({ holidayPlanId: params.id }),
      Participant.deleteMany({ holidayPlanId: params.id }),
      Contribution.deleteMany({ holidayPlanId: params.id }),
      SplitPayment.deleteMany({ holidayPlanId: params.id }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting plan:', error)
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 })
  }
}
