import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    const country = req.headers.get('cf-ipcountry') || req.headers.get('x-vercel-ip-country') || 'ID'
    return NextResponse.json({ country })
}
