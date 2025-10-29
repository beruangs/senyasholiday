import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { Contribution, Participant, ExpenseItem, HolidayPlan } from '@/models'
import { createTransaction, calculateGrossAmount, calculateServiceFee } from '@/lib/midtrans'

export async function POST(req: NextRequest) {
  try {
    await dbConnect()
    
    const { contributionIds, participantId, planId } = await req.json()

    if (!contributionIds || !Array.isArray(contributionIds) || contributionIds.length === 0) {
      return NextResponse.json({ error: 'Contribution IDs required' }, { status: 400 })
    }

    // Get contributions with populated data
    const contributions = await Contribution.find({
      _id: { $in: contributionIds },
      participantId,
    })
      .populate('expenseItemId')
      .populate('participantId')
      .lean()

    if (!contributions || contributions.length === 0) {
      return NextResponse.json({ error: 'Contributions not found' }, { status: 404 })
    }

    // Calculate total remaining amount
    let totalRemaining = 0
    const itemDetails: Array<{ id: string; name: string; price: number; quantity: number }> = []

    contributions.forEach((contrib: any) => {
      const remaining = contrib.amount - contrib.paid
      if (remaining > 0) {
        totalRemaining += remaining
        itemDetails.push({
          id: `${contrib._id}`,
          name: contrib.expenseItemId?.itemName || 'Iuran',
          price: remaining,
          quantity: 1,
        })
      }
    })

    if (totalRemaining === 0) {
      return NextResponse.json({ error: 'No remaining payment' }, { status: 400 })
    }

    // Calculate service fee
    const serviceFee = calculateServiceFee(totalRemaining)
    const grossAmount = calculateGrossAmount(totalRemaining)

    // Add service fee as separate item
    itemDetails.push({
      id: 'service-fee',
      name: 'Biaya Layanan Payment Gateway',
      price: serviceFee,
      quantity: 1,
    })

    // Get participant details
    const participant = contributions[0].participantId as any
    const participantName = participant?.name || 'Peserta'

    // Generate unique order ID
    const orderId = `ORDER-${planId}-${participantId}-${Date.now()}`

    // Create Midtrans transaction
    const transaction = await createTransaction({
      orderId,
      grossAmount,
      netAmount: totalRemaining,
      serviceFee,
      customerDetails: {
        first_name: participantName,
        email: '', // Optional
        phone: '', // Optional
      },
      itemDetails,
    })

    // Store order ID in contributions for tracking
    await Contribution.updateMany(
      { _id: { $in: contributionIds } },
      {
        $set: {
          midtransOrderId: orderId,
          midtransServiceFee: serviceFee,
        },
      }
    )

    return NextResponse.json({
      success: true,
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
      orderId,
      grossAmount,
      netAmount: totalRemaining,
      serviceFee,
    })
  } catch (error) {
    console.error('Create payment error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment', details: (error as Error).message },
      { status: 500 }
    )
  }
}
