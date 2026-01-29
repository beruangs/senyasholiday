export const PRICING_CONFIG = {
    ID: {
        currency: 'IDR',
        symbol: 'Rp',
        premium: 29000,
        premium_ai: 59000
    },
    GLOBAL: {
        currency: 'USD',
        symbol: '$',
        premium: 2.99,
        premium_ai: 5.99
    }
}

export function getRegionalPricing(countryCode: string | null) {
    if (countryCode === 'ID') return PRICING_CONFIG.ID
    return PRICING_CONFIG.GLOBAL
}

export function formatPrice(amount: number, currency: string, language: string = 'id') {
    return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: currency === 'IDR' ? 0 : 2
    }).format(amount)
}
