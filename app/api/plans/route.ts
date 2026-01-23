import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { HolidayPlan, User } from '@/models'
import mongoose from 'mongoose'

// Helper to check if ID is a valid MongoDB ObjectId
const isValidObjectId = (id: string) => {
  return mongoose.Types.ObjectId.isValid(id) && !id.startsWith('env-')
}

// GET all plans for current user (owned, admin, or SEN plans for sen_user/superadmin)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    await dbConnect()

    // If logged in, get user's plans
    if (session?.user?.id) {
      const userId = session.user.id
      const userRole = (session.user as any)?.role || 'user'

      // Check if user is from environment variable (ID starts with 'env-')
      const isEnvAdmin = userId.startsWith('env-')

      let dbUserRole = userRole

      // If not env admin, try to get role from database
      if (!isEnvAdmin && isValidObjectId(userId)) {
        const user = await User.findById(userId)
        dbUserRole = user?.role || userRole
      }

      let query: any = {}

      if (dbUserRole === 'superadmin' || isEnvAdmin) {
        // Superadmin (including env admins) sees all plans
        query = {}
      } else if (dbUserRole === 'sen_user') {
        // SEN User sees: own plans, plans they're admin of, and SEN plans (no ownerId)
        query = {
          $or: [
            ...(isValidObjectId(userId) ? [{ ownerId: userId }, { adminIds: userId }] : []),
            { ownerId: { $exists: false } }, // Legacy SEN plans
            { ownerId: null }
          ]
        }
      } else {
        // Regular user sees only own plans and plans they're admin of
        if (isValidObjectId(userId)) {
          query = {
            $or: [
              { ownerId: userId },
              { adminIds: userId }
            ]
          }
        } else {
          // Invalid user ID, return empty
          return NextResponse.json([])
        }
      }

      const plans = await HolidayPlan.find(query)
        .populate('ownerId', 'username name')
        .populate('adminIds', 'username name')
        .sort({ createdAt: -1 })
        .lean() as any[]

      const plansWithInfo = plans.map(plan => {
        // Plan tanpa ownerId adalah plan SEN Yas Daddy (legacy)
        const isSenPlan = !plan.ownerId
        const isOwner = plan.ownerId?._id?.toString() === userId
        const isAdmin = plan.adminIds?.some((admin: any) => admin._id?.toString() === userId) || false
        const canEdit = isOwner || isAdmin || (isSenPlan && (dbUserRole === 'sen_user' || dbUserRole === 'superadmin' || isEnvAdmin))

        return {
          ...plan,
          _id: plan._id.toString(),
          hasPassword: !!plan.password,
          password: undefined,
          isOwner: isOwner || (isSenPlan && isEnvAdmin), // Env admins are treated as owners for SEN plans
          isAdmin,
          isSenPlan,
          canEdit,
        }
      })

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
    console.log('Create plan - Session:', JSON.stringify(session, null, 2))

    if (!session?.user?.id) {
      console.log('Create plan - No session or user ID')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const body = await req.json()
    console.log('Create plan - Request body:', JSON.stringify(body, null, 2))

    // For env admins, don't set ownerId (creates a SEN plan)
    const isEnvAdmin = session.user.id.startsWith('env-')
    console.log('Create plan - isEnvAdmin:', isEnvAdmin, 'userId:', session.user.id)

    const planData: any = {
      ...body,
      adminIds: [],
      createdBy: session.user.email, // Legacy
    }

    // Only set ownerId if user has valid MongoDB ObjectId
    if (!isEnvAdmin && isValidObjectId(session.user.id)) {
      planData.ownerId = session.user.id
    }

    console.log('Create plan - Plan data to save:', JSON.stringify(planData, null, 2))

    const plan = await HolidayPlan.create(planData)
    console.log('Create plan - Plan created:', plan._id)

    return NextResponse.json(plan, { status: 201 })
  } catch (error: any) {
    console.error('Error creating plan:', error)
    console.error('Error details:', error.message, error.stack)
    return NextResponse.json({
      error: 'Failed to create plan',
      details: error.message
    }, { status: 500 })
  }
}
