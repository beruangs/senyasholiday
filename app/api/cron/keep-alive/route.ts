import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization')

    // Safety: Check for a secret key to prevent random people from hitting this endpoint
    // You can set this in your .env as CRON_SECRET
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        console.log('Cron Job: Starting keep-alive ping...')

        // 1. Keep MongoDB Warm
        await dbConnect()
        // Simple ping to MongoDB
        const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Reconnecting'

        // 2. Keep Supabase Warm (If you use it)
        // If you eventually use Supabase, you can add a fetch here:
        // await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
        //   headers: { apikey: process.env.SUPABASE_ANON_KEY }
        // })

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            databases: {
                mongodb: dbStatus,
                supabase: 'Ready to add'
            },
            message: 'Keep-alive successful'
        })
    } catch (error: any) {
        console.error('Cron Job Error:', error)
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
