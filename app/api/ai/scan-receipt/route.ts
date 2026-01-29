import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { imageUrl, lang } = await req.json()
        if (!imageUrl) {
            return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
        }

        const apiKey = process.env.GROQ_API_KEY
        if (!apiKey) {
            return NextResponse.json({ error: 'Groq API Key not configured' }, { status: 500 })
        }

        // Fetch image and convert to base64
        const imageResponse = await fetch(imageUrl)
        const imageBuffer = await imageResponse.arrayBuffer()
        const base64Image = Buffer.from(imageBuffer).toString('base64')
        const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg'

        const prompt = `
            Analyze this receipt image and extract the following information into a JSON format:
            - itemName: (Merchant name or main item name)
            - totalAmount: (The final total amount shown on the receipt, as a number)
            - date: (Date of transaction in YYYY-MM-DD format, use current year if not specified)
            - detail: (A brief summary of what's on the receipt, e.g., "Dinner at Sushi Tei")
            - currency: (Currency code, default to IDR)

            Return ONLY the JSON object. Do not include markdown formatting or extra text.
        `

        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${mimeType};base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                temperature: 0.1,
                max_tokens: 1024,
                response_format: { type: "json_object" }
            })
        })

        if (!groqResponse.ok) {
            const errorData = await groqResponse.json()
            throw new Error(errorData.error?.message || 'Groq Vision API error')
        }

        const result = await groqResponse.json()
        const responseText = result.choices[0].message.content

        const receiptData = JSON.parse(responseText)

        return NextResponse.json({
            success: true,
            data: receiptData,
            originalImageUrl: imageUrl
        })

    } catch (error: any) {
        console.error('Groq Receipt Scan Error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to scan receipt' },
            { status: 500 }
        )
    }
}
