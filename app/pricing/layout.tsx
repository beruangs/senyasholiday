import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Pricing & Plans',
    description: 'Choose the best plan for your holiday. From free basic features to AI-powered itineraries and receipt scanning.',
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
