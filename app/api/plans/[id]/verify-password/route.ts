import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { HolidayPlan } from '@/models'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    const { password } = await req.json()
    
    const plan = await HolidayPlan.findById(params.id).select('password').lean() as any
    
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // If plan has no password, allow access
    if (!plan.password) {
      return NextResponse.json({ valid: true })
    }

    // Check if password matches
    const isValid = password === plan.password
    
    return NextResponse.json({ valid: isValid })
  } catch (error) {
    console.error('Error verifying password:', error)
    return NextResponse.json({ error: 'Failed to verify password' }, { status: 500 })
  }
}
