import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { User } from '@/models'

// POST - Register new user
export async function POST(request: NextRequest) {
    try {
        await dbConnect()

        const body = await request.json()
        const { username, password, name } = body

        // Validate required fields
        if (!username || !password || !name) {
            return NextResponse.json(
                { error: 'Username, password, dan nama wajib diisi' },
                { status: 400 }
            )
        }

        // Clean and validate username
        const cleanUsername = username.trim().toLowerCase().replace(/^@/, '')

        if (cleanUsername.length < 3) {
            return NextResponse.json(
                { error: 'Username minimal 3 karakter' },
                { status: 400 }
            )
        }

        if (cleanUsername.length > 20) {
            return NextResponse.json(
                { error: 'Username maksimal 20 karakter' },
                { status: 400 }
            )
        }

        if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
            return NextResponse.json(
                { error: 'Username hanya boleh huruf kecil, angka, dan underscore' },
                { status: 400 }
            )
        }

        // Validate password
        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password minimal 6 karakter' },
                { status: 400 }
            )
        }

        // Check if username already exists
        const existingUser = await User.findOne({ username: cleanUsername })
        if (existingUser) {
            return NextResponse.json(
                { error: 'Username sudah digunakan' },
                { status: 409 }
            )
        }

        // Create user
        const user = await User.create({
            username: cleanUsername,
            password,
            name: name.trim(),
            role: 'user',
        })

        return NextResponse.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
            }
        }, { status: 201 })

    } catch (error) {
        console.error('Signup error:', error)
        return NextResponse.json(
            { error: 'Gagal mendaftar. Coba lagi.' },
            { status: 500 }
        )
    }
}
