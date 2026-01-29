import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')

    if (!q) return NextResponse.json({ error: 'Query required' }, { status: 400 })

    try {
        // 1. Geocoding
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`, {
            headers: { 'User-Agent': 'SenyasHolidayApp/1.0' }
        })
        const geoData = await geoRes.json()

        if (!geoData || geoData.length === 0) {
            return NextResponse.json({ error: 'Location not found' }, { status: 404 })
        }

        const { lat, lon, display_name } = geoData[0]

        // 2. Weather
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`)
        const weatherData = await weatherRes.json()

        return NextResponse.json({
            location: display_name,
            daily: weatherData.daily
        })

    } catch (error) {
        console.error('Weather Fetch Error:', error)
        return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 })
    }
}
