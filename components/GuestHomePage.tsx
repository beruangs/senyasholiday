'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Users, DollarSign, Lock, Sparkles, ArrowRight, UserPlus } from 'lucide-react'
import Navbar from '@/components/Navbar'
import SuggestionButton from '@/components/SuggestionButton'
import { useLanguage } from '@/context/LanguageContext'

export default function GuestHomePage() {
    const { t } = useLanguage()

    return (
        <div className="min-h-screen bg-white font-bold">
            <Navbar />
            <SuggestionButton page="Homepage" />

            <section className="py-12 md:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
                    <div className="flex justify-center mb-8"><Image src="/logo.png" alt="LOGO" width={80} height={80} className="rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl p-1 bg-white border border-gray-100 transition-all hover:scale-105" /></div>
                    <h1 className="text-3xl md:text-7xl font-black text-gray-900 mb-4 tracking-tighter leading-none uppercase">SEN YAS DADDY</h1>
                    <p className="text-sm md:text-xl text-primary-600 mb-6 font-black uppercase tracking-[0.3em] font-bold">{t.guest.hero_subtitle}</p>
                    <p className="text-xs md:text-lg text-gray-400 max-w-xl mx-auto mb-10 uppercase leading-relaxed tracking-widest">{t.guest.hero_desc}</p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <Link href="/signup" className="px-10 py-5 bg-primary-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary-50 hover:bg-primary-700 transition-all flex items-center gap-3"><UserPlus className="w-5 h-5" /> {t.common.signup}</Link>
                        <Link href="/demo" className="px-10 py-5 bg-gray-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-lg shadow-gray-200 hover:bg-black transition-all flex items-center gap-3"><Sparkles className="w-5 h-5" /> {t.guest.view_demo}</Link>
                    </div>
                </div>
            </section>

            <section className="py-16 md:py-24 bg-gray-50 rounded-[2rem] sm:rounded-[4rem] mx-2 sm:mx-6 mb-16 border border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h2 className="text-2xl md:text-4xl font-black text-gray-900 mb-20 uppercase tracking-tighter">{t.guest.features_title}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <FeatureCard icon={<Calendar className="w-8 h-8 text-primary-600" />} title={t.guest.feature_rundown_title} desc={t.guest.feature_rundown_desc} />
                        <FeatureCard icon={<DollarSign className="w-8 h-8 text-emerald-600" />} title={t.guest.feature_finance_title} desc={t.guest.feature_finance_desc} />
                        <FeatureCard icon={<Users className="w-8 h-8 text-amber-600" />} title={t.guest.feature_split_title} desc={t.guest.feature_split_desc} />
                        <FeatureCard icon={<Lock className="w-8 h-8 text-indigo-600" />} title={t.guest.feature_admin_title} desc={t.guest.feature_admin_desc} />
                    </div>
                </div>
            </section>

            <section className="py-16 md:py-24 bg-gray-900 mx-2 sm:mx-6 rounded-[2rem] sm:rounded-[3.5rem] relative overflow-hidden text-center text-white mb-20 shadow-2xl">
                <div className="absolute inset-0 opacity-[0.05]"><Sparkles className="w-[40rem] h-[40rem] -bottom-20 -right-20 absolute" /></div>
                <div className="relative z-10 max-w-4xl mx-auto px-6">
                    <h2 className="text-3xl md:text-6xl font-black uppercase tracking-tight mb-6 leading-none">{t.guest.cta_title}</h2>
                    <p className="text-base md:text-lg text-gray-400 font-bold uppercase tracking-widest mb-12 max-w-xl mx-auto leading-relaxed">{t.guest.cta_desc}</p>
                    <Link href="/signup" className="px-14 py-5 bg-primary-600 text-white rounded-full font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary-500/20 hover:bg-primary-700 transition-all flex items-center gap-3 mx-auto w-fit">SIGN UP NOW <ArrowRight className="w-5 h-5" /></Link>
                </div>
            </section>

            <footer className="py-16 text-center border-t border-gray-50 opacity-40"><p className="text-gray-900 font-black uppercase tracking-[0.3em] text-[9px] mb-1.5 font-bold">SEN YAS DADDY &copy; {new Date().getFullYear()}</p><p className="text-gray-300 font-black uppercase tracking-[0.4em] text-[7px] font-bold">The All-in-One Holiday Orchestrator</p></footer>
        </div>
    )
}

function FeatureCard({ icon, title, desc }: any) {
    return (
        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-700 group flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-inner">{icon}</div>
            <h3 className="text-lg font-black text-gray-900 mb-4 uppercase tracking-tight leading-tight">{title}</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">{desc}</p>
        </div>
    )
}
