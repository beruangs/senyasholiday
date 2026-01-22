import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { HolidayPlan, Rundown, ExpenseCategory, ExpenseItem, Participant, Contribution, SplitPayment, PaymentHistory } from '@/models'

// GET single plan
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    const session = await getServerSession(authOptions)
    const plan = await HolidayPlan.findById(params.id)
      .populate('ownerId', 'username name')
      .populate('adminIds', 'username name')
      .lean() as any

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Determine user's access level
    const userId = session?.user?.id
    const isOwner = plan.ownerId?._id?.toString() === userId
    const isAdmin = plan.adminIds?.some((admin: any) => admin._id?.toString() === userId) || false
    const hasAccess = isOwner || isAdmin

    // If logged in user, return with access info
    return NextResponse.json({
      ...plan,
      _id: plan._id.toString(),
      hasPassword: !!plan.password,
      password: session ? plan.password : undefined,
      isOwner,
      isAdmin,
      hasAccess,
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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    // Check if user has access
    const existingPlan = await HolidayPlan.findById(params.id)
    if (!existingPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const isOwner = existingPlan.ownerId?.toString() === session.user.id
    const isAdmin = existingPlan.adminIds?.some((id: any) => id.toString() === session.user.id)

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized to edit this plan' }, { status: 403 })
    }

    const body = await req.json()

    const plan = await HolidayPlan.findByIdAndUpdate(
      params.id,
      { ...body, updatedAt: new Date() },
      { new: true }
    )

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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    // Only owner can delete
    const plan = await HolidayPlan.findById(params.id)
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    if (plan.ownerId?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Only owner can delete this plan' }, { status: 403 })
    }

    // Delete all related data
    await Promise.all([
      HolidayPlan.findByIdAndDelete(params.id),
      Rundown.deleteMany({ holidayPlanId: params.id }),
      ExpenseCategory.deleteMany({ holidayPlanId: params.id }),
      ExpenseItem.deleteMany({ holidayPlanId: params.id }),
      Participant.deleteMany({ holidayPlanId: params.id }),
      Contribution.deleteMany({ holidayPlanId: params.id }),
      SplitPayment.deleteMany({ holidayPlanId: params.id }),
      PaymentHistory.deleteMany({ holidayPlanId: params.id }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting plan:', error)
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 })
  }
}
