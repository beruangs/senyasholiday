import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { HolidayPlan, Rundown, ExpenseCategory, ExpenseItem, Participant, Contribution, SplitPayment, SplitBill, PaymentHistory, User } from '@/models'
import mongoose from 'mongoose'

// Helper to check if ID is a valid MongoDB ObjectId
const isValidObjectId = (id: string) => {
  return mongoose.Types.ObjectId.isValid(id) && !id.startsWith('env-')
}

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
    const userRole = (session?.user as any)?.role || 'user'
    const isEnvAdmin = userId?.startsWith('env-')

    let dbUserRole = userRole

    // Get role from database if valid ObjectId
    if (userId && !isEnvAdmin && isValidObjectId(userId)) {
      const user = await User.findById(userId)
      dbUserRole = user?.role || userRole
    }

    // Plan tanpa ownerId adalah plan SEN Yas Daddy (legacy)
    const isSenPlan = !plan.ownerId
    const isOwner = plan.ownerId?._id?.toString() === userId
    const isAdmin = plan.adminIds?.some((admin: any) => admin._id?.toString() === userId) || false
    const isSuperadmin = dbUserRole === 'superadmin' || isEnvAdmin
    const isSenUser = dbUserRole === 'sen_user'

    // Can edit if: owner, admin, superadmin/env-admin, or sen_user for SEN plans
    const canEdit = isOwner || isAdmin || isSuperadmin || (isSenPlan && isSenUser)
    const hasAccess = canEdit || session !== null // Logged in users can view

    return NextResponse.json({
      ...plan,
      _id: plan._id.toString(),
      hasPassword: !!plan.password,
      password: session ? plan.password : undefined,
      isOwner: isOwner || (isSenPlan && isEnvAdmin),
      isAdmin,
      isSenPlan,
      isSuperadmin,
      isSenUser,
      canEdit,
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

    const userId = session.user.id
    const userRole = (session.user as any)?.role || 'user'
    const isEnvAdmin = userId.startsWith('env-')

    let dbUserRole = userRole
    if (!isEnvAdmin && isValidObjectId(userId)) {
      const user = await User.findById(userId)
      dbUserRole = user?.role || userRole
    }

    const isSenPlan = !existingPlan.ownerId
    const isOwner = existingPlan.ownerId?.toString() === userId
    const isAdmin = existingPlan.adminIds?.some((id: any) => id.toString() === userId)
    const isSuperadmin = dbUserRole === 'superadmin' || isEnvAdmin
    const isSenUser = dbUserRole === 'sen_user'

    const canEdit = isOwner || isAdmin || isSuperadmin || (isSenPlan && isSenUser)

    if (!canEdit) {
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

    const plan = await HolidayPlan.findById(params.id)
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const userId = session.user.id
    const userRole = (session.user as any)?.role || 'user'
    const isEnvAdmin = userId.startsWith('env-')

    let dbUserRole = userRole
    if (!isEnvAdmin && isValidObjectId(userId)) {
      const user = await User.findById(userId)
      dbUserRole = user?.role || userRole
    }

    // Only owner, superadmin, or env-admin can delete
    const isOwner = plan.ownerId?.toString() === userId
    const isSuperadmin = dbUserRole === 'superadmin' || isEnvAdmin
    const isSenPlan = !plan.ownerId

    if (!isOwner && !isSuperadmin) {
      return NextResponse.json({ error: 'Only owner or superadmin can delete this plan' }, { status: 403 })
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
      SplitBill.deleteMany({ holidayPlanId: params.id }),
      PaymentHistory.deleteMany({ holidayPlanId: params.id }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting plan:', error)
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 })
  }
}
