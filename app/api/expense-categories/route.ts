import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { ExpenseCategory } from '@/models'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const planId = searchParams.get('planId')

        await dbConnect()
        const categories = await ExpenseCategory.find({ holidayPlanId: planId })
            .sort({ order: 1 })
            .lean()

        return NextResponse.json(categories)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
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
        const category = await ExpenseCategory.create(body)

        return NextResponse.json(category, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await dbConnect()
        const { _id, name } = await req.json()

        const category = await ExpenseCategory.findByIdAndUpdate(_id, { name }, { new: true })
        return NextResponse.json(category)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
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
        await ExpenseCategory.findByIdAndDelete(id)

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
    }
}
