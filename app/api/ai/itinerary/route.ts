import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { HolidayPlan } from '@/models'

export async function POST(req: NextRequest) {
    console.log('--- AI Itinerary (Groq) Started ---')
    const apiKey = process.env.GROQ_API_KEY
    console.log('Groq API Key exists:', !!apiKey)

    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { planId, preferences, lang } = await req.json()
        const targetLang = lang === 'id' ? 'Indonesian' : lang === 'en' ? 'English' : (req.headers.get('accept-language')?.includes('id') ? 'Indonesian' : 'English')

        await dbConnect()
        const plan = await HolidayPlan.findById(planId)
        if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

        // Security & Premium Check
        const userId = (session.user as any)?.id
        const isOwner = plan.ownerId?.toString() === userId
        const isAdmin = (plan as any).adminIds?.some((id: any) => id.toString() === userId)
        const isSuperadmin = (session.user as any)?.role === 'superadmin'
        const isPremium = (session.user as any).isPremium || isSuperadmin

        if (!isOwner && !isAdmin && !isSuperadmin) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        if (!isPremium) return NextResponse.json({ error: 'Premium required' }, { status: 403 })
        if (!apiKey) return NextResponse.json({ error: 'Configuration Error' }, { status: 500 })

        const prompt = `
      You are a professional travel planner. Create a detailed daily itinerary for this trip:
      Destination: ${plan.destination}
      Title: ${plan.title}
      Description: ${plan.description || ''}
      Dates: ${plan.startDate} to ${plan.endDate}
      Accommodation: ${plan.accommodationType || 'Any'} ${plan.accommodationName ? `at ${plan.accommodationName}` : ''}
      Check-in: ${plan.checkInTime || 'No specific time'}
      Check-out: ${plan.checkOutTime || 'No specific time'}
      Travel Style/Preferences: ${preferences}

      Rules:
      1. Return JSON ONLY. NO OTHER TEXT.
      2. Format MUST be an array of objects:
         [{ "date": "YYYY-MM-DD", "time": "HH:MM", "activity": "string", "location": "string", "notes": "string" }]
      3. Use appropriate times (breakfast, sightseeing, lunch, rest, dinner).
      4. Activities must be within the trip range [${plan.startDate} to ${plan.endDate}].
      5. Optimization: If accommodation is provided, try to suggest activities that are reasonably reachable from that location.
      6. Output language: ${targetLang}.

      Respond ONLY with the raw JSON array.
    `

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.5,
                max_tokens: 4096,
                response_format: { type: 'json_object' }
            })
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error?.message || 'Groq API error')
        }

        const result = await response.json()
        const content = result.choices[0].message.content

        // Groq response format for json_object can sometimes wrap in a root key
        let itinerary = JSON.parse(content)
        if (itinerary.itinerary) itinerary = itinerary.itinerary
        if (itinerary.days) itinerary = itinerary.days

        // Double check it's an array
        const finalItinerary = Array.isArray(itinerary) ? itinerary : Object.values(itinerary)[0]

        return NextResponse.json(Array.isArray(finalItinerary) ? finalItinerary : [itinerary])

    } catch (error: any) {
        console.error('Groq Error:', error)
        return NextResponse.json({ error: error.message || 'AI Generation failed' }, { status: 500 })
    }
}
