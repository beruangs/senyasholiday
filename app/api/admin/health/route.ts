import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import mongoose from 'mongoose'
import { User } from '@/models'

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await dbConnect()

        // Check if user is superadmin
        const user = await User.findById(session.user.id)
        if (user?.role !== 'superadmin' && !session.user.id.startsWith('env-')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const startTime = Date.now()

        // Database check
        const dbStatus = mongoose.connection.readyState
        // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
        const dbStatusMap = {
            0: 'Disconnected',
            1: 'Healthy',
            2: 'Connecting',
            3: 'Disconnecting'
        }

        // Latency check (time to ping DB)
        let latency = 0
        if (mongoose.connection.db) {
            await mongoose.connection.db.admin().ping()
            latency = Date.now() - startTime
        }

        // System info
        const systemInfo = {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            platform: process.platform,
            nodeVersion: process.version,
        }

        return NextResponse.json({
            status: 'operational',
            database: {
                status: dbStatusMap[dbStatus as keyof typeof dbStatusMap] || 'Unknown',
                latency: `${latency}ms`,
                readyState: dbStatus
            },
            system: {
                uptime: `${Math.floor(systemInfo.uptime / 3600)}h ${Math.floor((systemInfo.uptime % 3600) / 60)}m`,
                memoryUsage: `${Math.round(systemInfo.memory.rss / 1024 / 1024)}MB`,
                platform: systemInfo.platform,
                nodeVersion: systemInfo.nodeVersion
            },
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('Health check failed:', error)
        return NextResponse.json({
            status: 'degraded',
            error: 'Database connection unstable'
        }, { status: 500 })
    }
}
