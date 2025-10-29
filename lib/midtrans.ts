import midtransClient from 'midtrans-client'

// Initialize Snap API client
export const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
})

// Calculate service fee to be charged to customer
// Midtrans charges approximately 2% + Rp 2,000 for QRIS/VA
// We'll add this to the customer's total so merchant receives the exact amount
export const calculateServiceFee = (amount: number): number => {
  // Midtrans fee structure (approximate):
  // - 2% + Rp 2,000 for QRIS, Virtual Account
  // - Round up to nearest 100
  const feePercentage = 0.02 // 2%
  const fixedFee = 2000 // Rp 2,000
  
  const fee = Math.ceil((amount * feePercentage + fixedFee) / 100) * 100
  return fee
}

// Calculate gross amount (amount + service fee)
export const calculateGrossAmount = (netAmount: number): number => {
  const serviceFee = calculateServiceFee(netAmount)
  return netAmount + serviceFee
}

// Create payment transaction
interface CreateTransactionParams {
  orderId: string
  grossAmount: number
  netAmount: number
  serviceFee: number
  customerDetails: {
    first_name: string
    email?: string
    phone?: string
  }
  itemDetails: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>
}

export const createTransaction = async (params: CreateTransactionParams) => {
  const parameter = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.grossAmount,
    },
    customer_details: params.customerDetails,
    item_details: params.itemDetails,
    enabled_payments: [
      'credit_card',
      'bca_va',
      'bni_va',
      'bri_va',
      'permata_va',
      'other_va',
      'gopay',
      'shopeepay',
      'qris',
    ],
    callbacks: {
      finish: `${process.env.NEXT_PUBLIC_BASE_URL}/plan/${params.itemDetails[0]?.id?.split('-')[1] || ''}?payment=success`,
      error: `${process.env.NEXT_PUBLIC_BASE_URL}/plan/${params.itemDetails[0]?.id?.split('-')[1] || ''}?payment=error`,
      pending: `${process.env.NEXT_PUBLIC_BASE_URL}/plan/${params.itemDetails[0]?.id?.split('-')[1] || ''}?payment=pending`,
    },
  }

  try {
    const transaction = await snap.createTransaction(parameter)
    return transaction
  } catch (error) {
    console.error('Midtrans transaction error:', error)
    throw error
  }
}

// Verify notification signature from Midtrans
export const verifySignatureKey = (
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean => {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || ''
  const crypto = require('crypto')
  const hash = crypto
    .createHash('sha512')
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest('hex')
  
  return hash === signatureKey
}
