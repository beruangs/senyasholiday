import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { HolidayPlan } from '@/models'

export async function POST(req: NextRequest) {
    console.log('--- AI Consultant (Groq) Started ---')
    const apiKey = process.env.GROQ_API_KEY

    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { planId, budget, action, lang } = await req.json()
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

        let prompt = ''
        if (action === 'budget') {
            prompt = `
        As a travel finance expert, analyze this budget for a trip to ${plan.destination}:
        Trip Title: ${plan.title}
        Duration: ${plan.startDate} to ${plan.endDate}
        User Budget: IDR ${budget}
        Accommodation: ${plan.accommodationType || 'N/A'} ${plan.accommodationName ? `@ ${plan.accommodationName}` : ''}
        
        Please provide:
        1. Feasibility analysis (Is this enough?).
        2. Daily spending limit (Makan, Transport, HTM).
        3. Tips on how to save money in this specific destination.
        
        Language: ${targetLang}.
        Format: Markdown.
      `
        } else {
            prompt = `
        As a travel guide, provide travel advice and cultural tips for ${plan.destination}:
        Trip Title: ${plan.title}
        Description: ${plan.description || ''}
        Dates: ${plan.startDate} to ${plan.endDate}
        
        Include:
        1. Cultural Do's and Don'ts.
        2. Local transportation tips.
        3. Current weather/seasonal expectations.
        4. Tipping culture and common phrases.
        
        Language: ${targetLang}.
        Format: Markdown.
      `
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 2048
            })
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error?.message || 'Groq API error')
        }

        const result = await response.json()
        const advice = result.choices[0].message.content

        return NextResponse.json({ advice })

    } catch (error: any) {
        console.error('Groq Error:', error)
        return NextResponse.json({ error: error.message || 'AI Consultation failed' }, { status: 500 })
    }
}
