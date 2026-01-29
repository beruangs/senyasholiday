'use client'

import React, { useState, useEffect } from 'react'
import { Check, Zap, Crown, Shield, Star, Rocket, Mail, Sparkles } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import Navbar from '@/components/Navbar'
import { getRegionalPricing, formatPrice } from '@/lib/pricing'
import { useLanguage } from '@/context/LanguageContext'

export default function PricingPage() {
    const { data: session, update } = useSession()
    const { language, t } = useLanguage()
    const router = useRouter()
    const searchParams = useSearchParams()
    const isNewUser = searchParams.get('new_user') === 'true'
    const [loading, setLoading] = useState(false)
    const isPremium = (session?.user as any)?.isPremium

    const [country, setCountry] = useState('ID')
    const pricing = getRegionalPricing(country)

    useEffect(() => {
        fetch('/api/geo')
            .then(res => res.json())
            .then(data => setCountry(data.country || 'ID'))
            .catch(() => setCountry('ID'))
    }, [])

    const handleUpgrade = (planType: string) => {
        if (!session) {
            router.push(`/login?callbackUrl=/pricing`)
            return
        }
        router.push(`/checkout/${planType}`)
    }

    if (!t.pricing) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>

    const plans = [
        {
            id: 'free',
            name: t.pricing.free,
            price: formatPrice(0, pricing.currency, language),
            description: t.pricing.subtitle,
            features: t.pricing.features_free,
            cta: t.pricing.current_plan,
            premium: false,
            color: 'slate'
        },
        {
            id: 'premium',
            name: t.pricing.premium,
            price: formatPrice(pricing.premium, pricing.currency, language),
            description: language === 'id' ? 'Fitur lengkap untuk traveler sejati' : 'Complete features for real travelers',
            features: t.pricing.features_premium,
            cta: t.pricing.upgrade_now,
            premium: true,
            popular: country === 'ID',
            color: 'red'
        },
        {
            id: 'premium_ai',
            name: t.pricing.premium_ai,
            price: formatPrice(pricing.premium_ai, pricing.currency, language),
            description: language === 'id' ? 'Kekuatan AI untuk liburan tanpa pusing' : 'AI power for hassle-free vacay',
            features: t.pricing.features_premium_ai,
            cta: t.pricing.upgrade_now,
            premium: true,
            popular: country !== 'ID',
            color: 'indigo'
        }
    ]

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 pt-24 pb-16">
                {isNewUser && (
                    <div className="mb-12 p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 animate-in slide-in-from-top-10 duration-700 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <Crown size={150} />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="text-center md:text-left">
                                <h2 className="text-3xl font-black uppercase tracking-tight mb-2">
                                    {language === 'id' ? 'Selamat Datang di SEN YAS DADDY! 🎉' : 'Welcome to SEN YAS DADDY! 🎉'}
                                </h2>
                                <p className="text-indigo-100 font-bold uppercase tracking-widest text-[10px]">
                                    {language === 'id'
                                        ? 'Akun kamu berhasil dibuat. Mulai petualanganmu dengan paket Premium untuk fitur tanpa batas.'
                                        : 'Your account is ready. Start your adventure with a Premium plan for unlimited features.'}
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className="px-8 py-4 bg-white/10 hover:bg-white/20 border-2 border-white/20 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
                                >
                                    {language === 'id' ? 'Lanjutkan dengan Gratis' : 'Continue with Free'}
                                </button>
                                <button
                                    onClick={() => {
                                        const el = document.getElementById('pricing-grid');
                                        el?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-indigo-50 transition-all"
                                >
                                    {language === 'id' ? 'Lihat Paket Premium' : 'See Premium Plans'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-indigo-600">
                        {t.pricing.title}
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        {t.pricing.subtitle}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-100 shadow-sm">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{country === 'ID' ? '🇮🇩 Lokasi: Indonesia' : `🌍 Location: ${country}`}</span>
                    </div>
                </div>

                <div id="pricing-grid" className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, idx) => (
                        <div
                            key={idx}
                            className={`relative bg-white rounded-[2.5rem] shadow-xl p-8 border-2 transition-all duration-300 hover:scale-[1.02] ${plan.popular ? 'border-primary-600 ring-8 ring-primary-50' : 'border-transparent'
                                } ${plan.id === 'premium_ai' ? 'bg-gradient-to-br from-white to-indigo-50/30' : ''}`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-1.5 rounded-full text-[10px] font-black shadow-lg flex items-center gap-2 uppercase tracking-widest">
                                    <Star size={12} fill="white" />
                                    {language === 'id' ? 'Paling Populer' : 'Most Popular'}
                                </div>
                            )}

                            <div className="mb-8">
                                <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center ${plan.id === 'free' ? 'bg-slate-100 text-slate-600' : plan.id === 'premium' ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                    {plan.id === 'free' ? <Rocket size={24} /> : plan.id === 'premium' ? <Crown size={24} /> : <Zap size={24} />}
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                                    {plan.name}
                                </h3>
                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t.pricing.per_month}</span>
                                </div>
                                {country === 'ID' && plan.premium && (
                                    <div className="mb-4 inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                        <Sparkles size={10} />
                                        <span>{t.pricing.saved_badge} {plan.id === 'premium' ? 'Rp 18.000' : 'Rp 36.000'}</span>
                                    </div>
                                )}
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{t.pricing.ppn_note}</p>
                                <p className="text-slate-600 text-sm leading-relaxed">{plan.description}</p>
                            </div>

                            <div className="space-y-4 mb-10">
                                {plan.features.map((feature: string, fIdx: number) => (
                                    <div key={fIdx} className="flex items-start gap-3">
                                        <div className={`mt-1 p-0.5 rounded-full ${plan.premium ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                                            <Check size={12} strokeWidth={3} />
                                        </div>
                                        <span className="text-slate-700 text-xs font-bold leading-tight">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => plan.premium && handleUpgrade(plan.id)}
                                disabled={loading || (plan.premium && isPremium)}
                                className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl ${plan.premium
                                    ? isPremium
                                        ? 'bg-emerald-100 text-emerald-700 cursor-default shadow-none'
                                        : plan.id === 'premium'
                                            ? 'bg-primary-600 text-white shadow-primary-100 hover:bg-primary-700 hover:scale-[1.05]'
                                            : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.05]'
                                    : 'bg-slate-100 text-slate-400 cursor-default shadow-none'
                                    }`}
                            >
                                {loading ? t.pricing.checkout.processing : plan.cta}
                                {plan.premium && !isPremium && <Zap size={16} fill="currentColor" />}
                                {plan.premium && isPremium && <Check size={16} />}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-20 text-center">
                    <div className="inline-flex items-center gap-2 bg-slate-100 px-6 py-3 rounded-2xl text-slate-600 text-sm md:text-base">
                        <Shield size={20} className="text-indigo-600" />
                        <span>Keamanan data terjaga & Pembayaran Aman via Midtrans</span>
                    </div>
                </div>

                <section className="mt-32 max-w-4xl mx-auto space-y-12">
                    <h2 className="text-3xl font-bold text-center text-slate-900">Mengapa Harus Premium?</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center p-6 bg-white rounded-2xl shadow-sm">
                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Zap />
                            </div>
                            <h4 className="font-bold mb-2">Tanpa Batas</h4>
                            <p className="text-sm text-slate-500 text-balance">Buat rencana liburan sebanyak yang kamu mau tanpa khawatir kuota.</p>
                        </div>
                        <div className="text-center p-6 bg-white rounded-2xl shadow-sm">
                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Shield />
                            </div>
                            <h4 className="font-bold mb-2">Keamanan Privasi</h4>
                            <p className="text-sm text-slate-500 text-balance">Lindungi itinerary liburanmu dengan password untuk setiap plan.</p>
                        </div>
                        <div className="text-center p-6 bg-white rounded-2xl shadow-sm">
                            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Shield />
                            </div>
                            <h4 className="font-bold mb-2">{language === 'id' ? 'Akses Offline' : 'Offline Access'}</h4>
                            <p className="text-sm text-slate-500 text-balance">{language === 'id' ? 'Tetap bisa akses rencana liburan meskipun tanpa sinyal internet.' : 'Access your plans even without internet connection.'}</p>
                        </div>
                    </div>
                </section>

                <section className="mt-40 bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-10">
                        <Crown size={180} />
                    </div>
                    <div className="relative z-10 max-w-2xl">
                        <h2 className="text-3xl md:text-4xl font-black mb-6">Punya Pertanyaan?</h2>
                        <p className="text-slate-400 text-lg mb-8">
                            Hubungi tim kami jika kamu butuh bantuan terkait paket premium atau fitur aplikasi.
                        </p>
                        <a
                            href="mailto:senyasholiday@outlook.com"
                            className="inline-flex items-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-2xl font-bold hover:bg-red-50 transition-colors"
                        >
                            <Mail />
                            senyasholiday@outlook.com
                        </a>
                    </div>
                </section>
            </main>

            <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-slate-200 text-slate-500 text-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-red-600 rounded"></div>
                    <span className="font-bold text-slate-900">SEN YAS DADDY</span>
                </div>
                <div className="flex gap-8">
                    <a href="/terms" className="hover:text-red-600 transition-colors">Terms of Service</a>
                    <a href="/privacy" className="hover:text-red-600 transition-colors">Privacy Policy</a>
                </div>
                <div>
                    © 2026 Sen Yas Holiday. All rights reserved.
                </div>
            </footer>
        </div>
    )
}
