import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
    console.log('--- AI Receipt Scanner (Groq Vision) Started ---')
    const apiKey = process.env.GROQ_API_KEY

    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { image, lang } = await req.json()
        if (!image) return NextResponse.json({ error: 'Image is required' }, { status: 400 })
        if (!apiKey) return NextResponse.json({ error: 'Configuration Error' }, { status: 500 })

        const prompt = `
      You are an expert receipt scanner. Analyze this receipt image and extract the following:
      1. Overall Title (e.g., "Dinner at Ichiran").
      2. Date (YYYY-MM-DD, if found).
      3. Individual items (List of { name, price, quantity }).
      4. Tax and Service percentages (if found separately).
      5. Currency (3-letter code, e.g., JPY, IDR, USD).

      Rules:
      1. Return JSON ONLY.
      2. Format: { "title": "string", "date": "string|null", "items": [{ "name": "string", "price": number, "quantity": number }], "taxPercent": number, "servicePercent": number, "currency": "string" }
      3. Language: ${lang === 'id' ? 'Indonesian' : 'English'}.
    `

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.2-11b-vision-preview',
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            { type: 'image_url', image_url: { url: image } }
                        ]
                    }
                ],
                temperature: 0.1,
                response_format: { type: 'json_object' }
            })
        })

        if (!response.ok) {
            const err = await response.json()
            throw new Error(err.error?.message || 'Groq Vision Error')
        }

        const result = await response.json()
        const content = JSON.parse(result.choices[0].message.content)

        return NextResponse.json(content)

    } catch (error: any) {
        console.error('Vision Error:', error)
        return NextResponse.json({ error: error.message || 'AI Scanning failed' }, { status: 500 })
    }
}
