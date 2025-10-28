import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { HolidayPlan } from '@/models'

// GET all plans
export async function GET() {
  try {
    await dbConnect()
    const plans = await HolidayPlan.find().sort({ createdAt: -1 }).lean() as any[]
    
    const plansWithPassword = plans.map(plan => ({
      ...plan,
      _id: plan._id.toString(),
      hasPassword: !!plan.password,
      password: undefined, // Don't send password to client
    }))

    return NextResponse.json(plansWithPassword)
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }
}

// POST create new plan
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const body = await req.json()
    
    const plan = await HolidayPlan.create({
      ...body,
      createdBy: session.user.email,
    })

    return NextResponse.json(plan, { status: 201 })
  } catch (error) {
    console.error('Error creating plan:', error)
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
  }
}
