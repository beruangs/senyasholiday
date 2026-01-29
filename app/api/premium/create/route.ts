import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { User } from '@/models'
import { createTransaction } from '@/lib/midtrans'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
    try {
        await dbConnect()
        const session = await getServerSession(authOptions)

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { planType } = await req.json()
        const country = req.headers.get('cf-ipcountry') || req.headers.get('x-vercel-ip-country') || 'ID'

        const userId = session.user.id
        const user = await User.findById(userId)

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Pricing definition (Before VAT)
        const pricingConfig: any = {
            ID: {
                premium: { name: 'Premium (30 Days)', price: 29000 },
                premium_ai: { name: 'Premium + AI (30 Days)', price: 59000 }
            },
            GLOBAL: {
                premium: { name: 'Premium (30 Days)', price: 47000 },
                premium_ai: { name: 'Premium + AI (30 Days)', price: 95000 }
            }
        }

        const region = country === 'ID' ? 'ID' : 'GLOBAL'
        const plan = pricingConfig[region][planType]

        if (!plan) {
            return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 })
        }

        const netAmount = plan.price
        const taxAmount = Math.round(netAmount * 0.11)
        const grossAmount = netAmount + taxAmount

        const orderId = `PREM-${userId}-${Date.now()}`

        const transaction = await createTransaction({
            orderId,
            grossAmount,
            netAmount,
            serviceFee: taxAmount, // Using serviceFee field for tax for now in the call, or just adjust gross
            customerDetails: {
                first_name: user.name,
                email: session.user.email || `${user.username}@senyasdaddy.app`,
            },
            itemDetails: [
                {
                    id: planType,
                    name: plan.name,
                    price: netAmount,
                    quantity: 1,
                },
                {
                    id: 'PPN',
                    name: 'PPN (11%)',
                    price: taxAmount,
                    quantity: 1
                }
            ],
            customCallbackUrls: {
                finish: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?premium=success`,
                error: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing?premium=error`,
                pending: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?premium=pending`,
            }
        })

        // Store order details in user
        user.premiumOrderId = orderId
        user.pendingPlan = planType
        await user.save()

        return NextResponse.json({
            success: true,
            token: transaction.token,
            redirectUrl: transaction.redirect_url,
            orderId,
            netAmount,
            taxAmount,
            grossAmount
        })
    } catch (error: any) {
        console.error('Create premium payment error:', error)
        return NextResponse.json(
            { error: 'Failed to create premium payment', details: error.message },
            { status: 500 }
        )
    }
}
