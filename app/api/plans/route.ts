import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { HolidayPlan, User } from '@/models'

// GET all plans for current user (owned or admin)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    await dbConnect()

    // If logged in, get user's plans
    if (session?.user?.id) {
      const plans = await HolidayPlan.find({
        $or: [
          { ownerId: session.user.id },
          { adminIds: session.user.id }
        ]
      })
        .populate('ownerId', 'username name')
        .populate('adminIds', 'username name')
        .sort({ createdAt: -1 })
        .lean() as any[]

      const plansWithInfo = plans.map(plan => ({
        ...plan,
        _id: plan._id.toString(),
        hasPassword: !!plan.password,
        password: undefined,
        isOwner: plan.ownerId?._id?.toString() === session.user.id,
        isAdmin: plan.adminIds?.some((admin: any) => admin._id?.toString() === session.user.id) || false,
      }))

      return NextResponse.json(plansWithInfo)
    }

    // Not logged in - return empty
    return NextResponse.json([])
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }
}

// POST create new plan
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const body = await req.json()

    const plan = await HolidayPlan.create({
      ...body,
      ownerId: session.user.id,
      adminIds: [],
      createdBy: session.user.email, // Legacy
    })

    return NextResponse.json(plan, { status: 201 })
  } catch (error) {
    console.error('Error creating plan:', error)
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
  }
}
