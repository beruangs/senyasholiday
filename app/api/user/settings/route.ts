import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { User } from '@/models'

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Env admins cannot change settings
        if (session.user.id.startsWith('env-')) {
            return NextResponse.json({ error: 'Environment admins cannot change settings' }, { status: 400 })
        }

        await dbConnect()
        const body = await req.json()
        const { name, currentPassword, newPassword, theme } = body

        const user = await User.findById(session.user.id)
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Update theme if provided
        if (theme && ['light', 'ash', 'dark'].includes(theme)) {
            user.theme = theme
        }

        // Update name if provided
        if (name && name.trim()) {
            user.name = name.trim()
        }

        // Update password if provided
        if (newPassword) {
            user.password = newPassword
        }

        user.updatedAt = new Date()
        await user.save()

        return NextResponse.json({
            message: 'Settings updated successfully',
            user: {
                name: user.name,
                username: user.username,
                role: user.role,
            }
        })
    } catch (error) {
        console.error('Error updating settings:', error)
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }
}
