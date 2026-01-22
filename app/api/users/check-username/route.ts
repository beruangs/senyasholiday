import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { User } from '@/models'

// GET - Check if username exists (for realtime verification)
export async function GET(request: NextRequest) {
    try {
        await dbConnect()

        const { searchParams } = new URL(request.url)
        const username = searchParams.get('username')

        if (!username) {
            return NextResponse.json(
                { error: 'Username diperlukan' },
                { status: 400 }
            )
        }

        // Clean username
        const cleanUsername = username.trim().toLowerCase().replace(/^@/, '')

        if (cleanUsername.length < 3) {
            return NextResponse.json({
                available: false,
                exists: false,
                error: 'Username minimal 3 karakter'
            })
        }

        // Check if username exists
        const existingUser = await User.findOne({ username: cleanUsername }).select('username name')

        if (existingUser) {
            return NextResponse.json({
                available: false,
                exists: true,
                user: {
                    username: existingUser.username,
                    name: existingUser.name,
                }
            })
        }

        return NextResponse.json({
            available: true,
            exists: false,
        })

    } catch (error) {
        console.error('Check username error:', error)
        return NextResponse.json(
            { error: 'Gagal memeriksa username' },
            { status: 500 }
        )
    }
}
