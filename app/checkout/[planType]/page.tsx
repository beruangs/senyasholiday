'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Crown, Zap, ShieldCheck, ArrowLeft, Loader2, Check } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { getRegionalPricing, formatPrice } from '@/lib/pricing'
import { toast } from 'sonner'

export default function CheckoutPage() {
    const params = useParams()
    const router = useRouter()
    const { language, t } = useLanguage()
    const { data: session } = useSession()

    const [loading, setLoading] = useState(false)
    const [country, setCountry] = useState('ID')
    const planType = params.planType as string

    if (!t.pricing) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>

    const pricing = getRegionalPricing(country)
    const netAmount = planType === 'premium_ai' ? pricing.premium_ai : pricing.premium
    const taxAmount = Math.round(netAmount * 0.11)
    const totalAmount = netAmount + taxAmount

    useEffect(() => {
        fetch('/api/geo')
            .then(res => res.json())
            .then(data => setCountry(data.country || 'ID'))
            .catch(() => setCountry('ID'))
    }, [])

    const handlePay = async () => {
        if (!session) return router.push('/login')
        setLoading(true)
        try {
            const res = await fetch('/api/premium/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planType })
            })
            const data = await res.json()
            if (data.success && data.redirectUrl) {
                window.location.href = data.redirectUrl
            } else {
                toast.error(data.error || 'Failed to initialize payment')
            }
        } catch {
            toast.error('Network error')
        } finally {
            setLoading(false)
        }
    }

    const planName = planType === 'premium_ai' ? t.pricing.premium_ai : t.pricing.premium
    const features = planType === 'premium_ai' ? t.pricing.features_premium_ai : t.pricing.features_premium

    return (
        <div className="min-h-screen bg-gray-50/50 font-bold py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <Link href="/pricing" className="inline-flex items-center text-gray-400 hover:text-gray-900 mb-8 transition-all group">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t.common.back}</span>
                </Link>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Left: Plan Info */}
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">{t.pricing.checkout.title}</h1>
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{planName} • MONTHLY ACCESS (30 DAYS)</p>
                        </div>

                        <div className="p-8 bg-white rounded-[2.5rem] border-2 border-primary-100 shadow-xl shadow-primary-50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5">
                                {planType === 'premium_ai' ? <Zap size={120} /> : <Crown size={120} />}
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-tight flex items-center gap-3">
                                {planType === 'premium_ai' ? <Zap className="text-indigo-600" /> : <Crown className="text-amber-500" />}
                                {planName}
                            </h3>
                            <div className="space-y-4">
                                {features.slice(0, 6).map((f: string, i: number) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                            <Check size={12} strokeWidth={4} />
                                        </div>
                                        <span className="text-gray-600 text-[11px] font-bold">{f}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-6 bg-slate-900 rounded-3xl text-white">
                            <ShieldCheck className="text-emerald-400 w-8 h-8" />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest">Secure Checkout</p>
                                <p className="text-gray-400 text-[9px] font-bold">Your payment information is encrypted and secure via Midtrans.</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Payment Details */}
                    <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-gray-200 border border-gray-100 flex flex-col">
                        <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-8 border-b border-gray-50 pb-4">{t.pricing.checkout.order_total}</h2>

                        <div className="flex-1 space-y-6">
                            <div className="flex justify-between items-center text-gray-500">
                                <span className="text-[10px] font-black uppercase tracking-widest">{planName}</span>
                                <span className="font-black">{formatPrice(netAmount, pricing.currency, language)}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-400">
                                <span className="text-[10px] font-black uppercase tracking-widest">{t.pricing.checkout.tax}</span>
                                <span className="font-bold">{formatPrice(taxAmount, pricing.currency, language)}</span>
                            </div>

                            <div className="pt-6 border-t border-dashed border-gray-100 flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total</p>
                                    <p className="text-3xl font-black text-primary-600 tracking-tighter">{formatPrice(totalAmount, pricing.currency, language)}</p>
                                </div>
                                <p className="text-[9px] font-black text-gray-300 uppercase">{pricing.currency}</p>
                            </div>
                        </div>

                        <button
                            onClick={handlePay}
                            disabled={loading}
                            className="w-full mt-12 py-6 bg-primary-600 text-white rounded-[1.8rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary-100 hover:bg-primary-700 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck size={18} /> {t.pricing.checkout.pay_securely}</>}
                        </button>

                        <p className="text-center mt-6 text-[8px] font-black text-gray-300 uppercase tracking-tighter">
                            By clicking Pay Now, you agree to our Terms of Service and Privacy Policy.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
