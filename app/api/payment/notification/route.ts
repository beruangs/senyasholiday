import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { Contribution } from '@/models'
import { verifySignatureKey } from '@/lib/midtrans'

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const notification = await req.json()

    // Verify signature
    const isValid = verifySignatureKey(
      notification.order_id,
      notification.status_code,
      notification.gross_amount,
      notification.signature_key
    )

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    const {
      order_id,
      transaction_status,
      fraud_status,
      transaction_id,
      gross_amount,
    } = notification

    // Handle Premium Orders
    if (order_id.startsWith('PREM-')) {
      let paymentStatus = 'pending'
      if (transaction_status === 'capture' && fraud_status === 'accept') paymentStatus = 'success'
      else if (transaction_status === 'settlement') paymentStatus = 'success'
      else if (['cancel', 'deny', 'expire'].includes(transaction_status)) paymentStatus = 'failed'

      if (paymentStatus === 'success') {
        const userId = order_id.split('-')[1]
        const { User } = await import('@/models')
        const user = await User.findById(userId)
        if (user) {
          user.isPremium = true
          user.planType = user.pendingPlan || 'premium'
          user.premiumOrderId = order_id
          // Set/Extend Expiry
          const now = new Date()
          const currentExpiry = (user.premiumExpiresAt && user.premiumExpiresAt > now)
            ? new Date(user.premiumExpiresAt)
            : now

          user.premiumExpiresAt = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000)
          user.pendingPlan = null
          await user.save()
        }
      }
      return NextResponse.json({ success: true, status: paymentStatus })
    }

    // Get contributions with this order ID
    const contributions = await Contribution.find({ midtransOrderId: order_id })

    if (!contributions || contributions.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Handle different transaction statuses
    let paymentStatus = 'pending'

    if (transaction_status === 'capture') {
      if (fraud_status === 'accept') {
        paymentStatus = 'success'
      }
    } else if (transaction_status === 'settlement') {
      paymentStatus = 'success'
    } else if (
      transaction_status === 'cancel' ||
      transaction_status === 'deny' ||
      transaction_status === 'expire'
    ) {
      paymentStatus = 'failed'
    } else if (transaction_status === 'pending') {
      paymentStatus = 'pending'
    }

    // Update contributions if payment successful
    if (paymentStatus === 'success') {
      // Calculate net amount (gross - service fee)
      const serviceFee = contributions[0].midtransServiceFee || 0
      const netAmount = parseFloat(gross_amount) - serviceFee

      // Distribute payment to contributions
      let remainingAmount = netAmount

      for (const contrib of contributions) {
        const remaining = contrib.amount - contrib.paid
        const paymentForThis = Math.min(remaining, remainingAmount)

        if (paymentForThis > 0) {
          await Contribution.findByIdAndUpdate(contrib._id, {
            $inc: { paid: paymentForThis },
            $set: {
              midtransTransactionId: transaction_id,
              paymentMethod: 'midtrans',
              paidAt: new Date(),
              isPaid: (contrib.paid + paymentForThis) >= contrib.amount,
            },
          })

          remainingAmount -= paymentForThis
        }
      }
    }

    return NextResponse.json({ success: true, status: paymentStatus })
  } catch (error) {
    console.error('Payment notification error:', error)
    return NextResponse.json(
      { error: 'Failed to process notification', details: (error as Error).message },
      { status: 500 }
    )
  }
}
