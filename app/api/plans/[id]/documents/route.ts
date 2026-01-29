import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { HolidayPlan, TravelDocument, User } from '@/models'
import mongoose from 'mongoose'

const isValidObjectId = (id: string) => {
    return mongoose.Types.ObjectId.isValid(id) && !id.startsWith('env-')
}

// GET - List all documents for a plan
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await dbConnect()
        const documents = await TravelDocument.find({ holidayPlanId: params.id })
            .sort({ createdAt: -1 })
            .lean()

        return NextResponse.json(documents)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }
}

// POST - Add a new document
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await dbConnect()
        const plan = await HolidayPlan.findById(params.id)
        if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

        // Check Premium status
        const isEnvAdmin = session.user.id.startsWith('env-')
        let isPremium = (session.user as any).isPremium || false
        if (!isPremium && !isEnvAdmin && isValidObjectId(session.user.id)) {
            const user = await User.findById(session.user.id)
            isPremium = user?.isPremium || false
        }

        const body = await req.json()

        // Restriction: Only Premium can have fileUrl (files)
        if (body.fileUrl && !isPremium && !isEnvAdmin) {
            return NextResponse.json({
                error: 'Fitur Premium',
                details: 'Simpan file dokumen (PDF/Gambar) hanya tersedia untuk pengguna Premium.'
            }, { status: 403 })
        }

        const doc = await TravelDocument.create({
            holidayPlanId: params.id,
            ...body
        })

        return NextResponse.json(doc, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
    }
}
