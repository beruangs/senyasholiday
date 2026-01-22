import { NextRequest, NextResponse } from 'next/server'

// Debug endpoint to check environment variables (production safe - no sensitive data exposed)
export async function GET(request: NextRequest) {
    // Only allow in development or with secret header
    const isDev = process.env.NODE_ENV === 'development'
    const authHeader = request.headers.get('x-debug-key')
    const debugKey = process.env.DEBUG_KEY || 'sen-debug-2024'

    if (!isDev && authHeader !== debugKey) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check which env vars are set (not showing values for security)
    const envCheck = {
        // Database
        MONGODB_URI: !!process.env.MONGODB_URI,
        MONGODB_URI_LENGTH: process.env.MONGODB_URI?.length || 0,

        // NextAuth
        NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',

        // Admin credentials
        ADMIN_USERNAMES: !!process.env.ADMIN_USERNAMES,
        ADMIN_USERNAMES_COUNT: process.env.ADMIN_USERNAMES?.split(',').length || 0,
        ADMIN_PASSWORDS: !!process.env.ADMIN_PASSWORDS,
        ADMIN_PASSWORDS_COUNT: process.env.ADMIN_PASSWORDS?.split(',').length || 0,
        ADMIN_NAMES: !!process.env.ADMIN_NAMES,
        ADMIN_NAMES_COUNT: process.env.ADMIN_NAMES?.split(',').length || 0,

        // Show admin usernames (these are NOT sensitive - just usernames)
        ADMIN_USERNAMES_LIST: process.env.ADMIN_USERNAMES?.split(',').map(u => u.trim()) || [],

        // Environment
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV || 'not set',
    }

    return NextResponse.json({
        message: 'Environment variables check',
        timestamp: new Date().toISOString(),
        config: envCheck,
        recommendations: getRecommendations(envCheck),
    })
}

function getRecommendations(envCheck: any): string[] {
    const recommendations: string[] = []

    if (!envCheck.MONGODB_URI) {
        recommendations.push('❌ MONGODB_URI is not set - database connection will fail')
    }

    if (!envCheck.NEXTAUTH_SECRET) {
        recommendations.push('❌ NEXTAUTH_SECRET is not set - authentication will fail')
    }

    if (!envCheck.ADMIN_USERNAMES) {
        recommendations.push('⚠️ ADMIN_USERNAMES is not set - env admin fallback will not work')
    }

    if (!envCheck.ADMIN_PASSWORDS) {
        recommendations.push('⚠️ ADMIN_PASSWORDS is not set - env admin fallback will not work')
    }

    if (envCheck.ADMIN_USERNAMES_COUNT !== envCheck.ADMIN_PASSWORDS_COUNT) {
        recommendations.push('❌ ADMIN_USERNAMES and ADMIN_PASSWORDS count mismatch!')
    }

    if (envCheck.NEXTAUTH_URL === 'not set' && envCheck.VERCEL_ENV !== 'not set') {
        recommendations.push('⚠️ NEXTAUTH_URL should be set for Vercel deployment')
    }

    if (recommendations.length === 0) {
        recommendations.push('✅ All critical environment variables are set')
    }

    return recommendations
}
