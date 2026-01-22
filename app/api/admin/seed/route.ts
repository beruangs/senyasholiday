import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { User } from '@/models'
import bcrypt from 'bcryptjs'

// POST - Seed superadmin users from environment variables
// This endpoint can be called once to migrate existing admins to database
export async function POST(request: NextRequest) {
    try {
        await dbConnect()

        // Get admin credentials from environment
        const adminUsernames = process.env.ADMIN_USERNAMES?.split(',') || []
        const adminPasswords = process.env.ADMIN_PASSWORDS?.split(',') || []
        const adminNames = process.env.ADMIN_NAMES?.split(',') || []

        if (adminUsernames.length === 0) {
            return NextResponse.json({ error: 'No admin usernames found in environment' }, { status: 400 })
        }

        const results: any[] = []

        for (let i = 0; i < adminUsernames.length; i++) {
            const username = adminUsernames[i]?.trim().toLowerCase()
            const password = adminPasswords[i]?.trim()
            const name = adminNames[i]?.trim() || username

            if (!username || !password) {
                results.push({ username, status: 'skipped', reason: 'Missing username or password' })
                continue
            }

            // Check if user already exists
            const existingUser = await User.findOne({ username })

            if (existingUser) {
                // Update to superadmin if not already
                if (existingUser.role !== 'superadmin') {
                    existingUser.role = 'superadmin'
                    await existingUser.save()
                    results.push({ username, status: 'updated', message: 'Role updated to superadmin' })
                } else {
                    results.push({ username, status: 'exists', message: 'Already a superadmin' })
                }
            } else {
                // Create new superadmin user
                const hashedPassword = await bcrypt.hash(password, 12)
                await User.create({
                    username,
                    password: hashedPassword,
                    name,
                    role: 'superadmin',
                })
                results.push({ username, status: 'created', message: 'Superadmin created' })
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Seed completed',
            results,
        })
    } catch (error) {
        console.error('Seed error:', error)
        return NextResponse.json({ error: 'Failed to seed admins' }, { status: 500 })
    }
}

// GET - Check current superadmin status
export async function GET() {
    try {
        await dbConnect()

        const superadmins = await User.find({ role: 'superadmin' })
            .select('username name createdAt')
            .lean()

        const envUsernames = process.env.ADMIN_USERNAMES?.split(',').map(u => u.trim().toLowerCase()) || []

        return NextResponse.json({
            superadmins,
            envUsernames,
            needsSeed: envUsernames.some(u => !superadmins.find((s: any) => s.username === u)),
        })
    } catch (error) {
        console.error('Check error:', error)
        return NextResponse.json({ error: 'Failed to check status' }, { status: 500 })
    }
}
