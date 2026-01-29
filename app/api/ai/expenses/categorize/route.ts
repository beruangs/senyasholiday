import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { HolidayPlan, ExpenseItem, ExpenseCategory } from '@/models'

export async function POST(req: NextRequest) {
    console.log('--- AI Expense Categorizer (Groq) Started ---')
    const apiKey = process.env.GROQ_API_KEY

    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { planId, lang } = await req.json()
        const targetLang = lang === 'id' ? 'Indonesian' : 'English'

        await dbConnect()
        const plan = await HolidayPlan.findById(planId)
        if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

        // Security & Premium Check
        const userId = (session.user as any).id
        const isOwner = plan.ownerId.toString() === userId
        const isAdmin = plan.admins?.some((admin: any) => admin.userId.toString() === userId)
        const isSuperadmin = (session.user as any).role === 'superadmin'
        const isPremium = (session.user as any).isPremium || isSuperadmin

        if (!isOwner && !isAdmin && !isSuperadmin) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        if (!isPremium) return NextResponse.json({ error: 'Premium required' }, { status: 403 })
        if (!apiKey) return NextResponse.json({ error: 'Configuration Error' }, { status: 500 })

        // Fetch current expenses and categories
        const [expenses, categories] = await Promise.all([
            ExpenseItem.find({ holidayPlanId: planId }),
            ExpenseCategory.find({ holidayPlanId: planId })
        ])

        if (expenses.length === 0) {
            return NextResponse.json({ message: 'No expenses to categorize' })
        }

        const expenseList = expenses.map(e => ({ id: e._id, name: e.itemName, detail: e.detail || '' }))
        const categoryList = categories.map(c => ({ id: c._id, name: c.name }))

        const prompt = `
      You are an expert accountant. Tidy up these travel expenses by assigning them to the correct category IDs.
      If a suitable category doesn't exist, suggest a name for a new category.
      
      Existing Categories:
      ${JSON.stringify(categoryList)}
      
      Expenses to Categorize:
      ${JSON.stringify(expenseList)}
      
      Rules:
      1. Return JSON ONLY.
      2. Format: { "updates": [{ "expenseId": "string", "categoryId": "string", "newCategoryName": "string|null" }] }
      3. "categoryId" should be an existing ID if possible. If not, set to null and provide "newCategoryName".
      4. Use ${targetLang} for "newCategoryName" if you create one.
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
                temperature: 0.1,
                response_format: { type: 'json_object' }
            })
        })

        if (!response.ok) throw new Error('Groq API error')

        const result = await response.json()
        const content = JSON.parse(result.choices[0].message.content)

        // Process updates
        for (const update of content.updates) {
            let catId = update.categoryId

            // If AI suggests a new category
            if (!catId && update.newCategoryName) {
                // Double check if it exists now (to avoid duplicates in processing loop)
                const existingCat = await ExpenseCategory.findOne({ holidayPlanId: planId, name: update.newCategoryName })
                if (existingCat) {
                    catId = existingCat._id
                } else {
                    const newCat = await ExpenseCategory.create({ holidayPlanId: planId, name: update.newCategoryName })
                    catId = newCat._id
                }
            }

            if (catId) {
                await ExpenseItem.findByIdAndUpdate(update.expenseId, { categoryId: catId })
            }
        }

        return NextResponse.json({ success: true, count: content.updates.length })

    } catch (error: any) {
        console.error('Groq Error:', error)
        return NextResponse.json({ error: error.message || 'AI Categorization failed' }, { status: 500 })
    }
}
