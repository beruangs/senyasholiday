'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, MapPin, ArrowRight, Plus, Loader2, DollarSign, Users, LayoutDashboard, Sparkles, Globe, Play } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

export default function UserHomePage({ session }: { session: any }) {
    const { language, t } = useLanguage(); const [data, setData] = useState<any>(null); const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/user/home-data').then(res => res.json()).then(json => { setData(json); setLoading(false); }).catch(() => setLoading(false))
    }, [])

    if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-bold"><Loader2 className="w-10 h-10 animate-spin text-primary-600" /></div>

    const firstName = session?.user?.name?.split(' ')[0] || 'User'

    return (
        <div className="min-h-screen bg-white font-bold">
            <section className="py-12 md:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
                    <div className="flex justify-center mb-8"><Image src="/logo.png" alt="LOGO" width={80} height={80} className="rounded-[1.5rem] sm:rounded-[2rem] shadow-xl p-1 bg-white border border-gray-100 transition-all hover:scale-105" /></div>
                    <h1 className="text-3xl md:text-7xl font-black text-gray-900 mb-4 tracking-tighter leading-none uppercase">{t.home.hero_title}, <br className="sm:hidden" /><span className="text-primary-600">{firstName}</span>!</h1>
                    <p className="text-xs md:text-lg text-gray-400 mb-10 uppercase tracking-widest leading-none">{t.home.hero_subtitle}</p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <Link href="/dashboard/plans/create" className="px-8 py-4 bg-primary-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary-50 hover:bg-primary-700 transition-all flex items-center gap-2"><Plus className="w-4 h-4" /> {t.home.create_plan}</Link>
                        <Link href="/dashboard" className="px-8 py-4 bg-gray-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-lg shadow-gray-200 hover:bg-black transition-all flex items-center gap-2"><LayoutDashboard className="w-4 h-4" /> {t.home.to_dashboard}</Link>
                        <Link href="/demo" className="px-8 py-4 bg-gray-50 text-gray-500 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-all flex items-center gap-2"><Play className="w-4 h-4" /> {t.home.view_demo}</Link>
                    </div>
                </div>
            </section>

            <section className="py-16 md:py-20 bg-gray-50/50 rounded-[2rem] sm:rounded-[3.5rem] mx-2 sm:mx-6 mb-16 border border-gray-100">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-xl md:text-2xl font-black text-center text-gray-300 mb-16 uppercase tracking-[0.4em]">{t.home.summary_title}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <SummaryCard icon={<Calendar className="w-6 h-6 text-primary-600" />} title={t.home.upcoming_trip} val={data?.stats?.upcomingPlansCount || 0} sub={t.home.plans_active} />
                        <SummaryCard icon={<DollarSign className="w-6 h-6 text-emerald-600" />} title={t.home.budget} val={`Rp ${(data?.stats?.totalBudget || 0).toLocaleString(language === 'id' ? 'id-ID' : 'en-US')}`} sub={t.home.total_managed} />
                        <SummaryCard icon={<MapPin className="w-6 h-6 text-amber-600" />} title={t.home.destinations} val={data?.stats?.totalPlans || 0} sub={t.home.places_visited} />
                        <SummaryCard icon={<Users className="w-6 h-6 text-indigo-600" />} title={t.home.partner} val="ACTIVE" sub={t.home.connected} />
                    </div>
                </div>
            </section>

            <section className="py-16 md:py-24 bg-gray-900 mx-2 sm:mx-6 rounded-[2rem] sm:rounded-[4rem] relative overflow-hidden text-center text-white mb-20 shadow-2xl">
                <div className="absolute inset-0 opacity-[0.05]"><Globe className="w-[40rem] h-[40rem] -bottom-30 -right-30 absolute" /></div>
                <div className="relative z-10 max-w-4xl mx-auto px-6">
                    <h2 className="text-3xl md:text-6xl font-black uppercase tracking-tight mb-6 leading-none">{t.home.ready_hero} <br /><span className="text-primary-500">{t.home.holiday_dream}</span></h2>
                    <p className="text-base md:text-lg text-gray-400 font-bold uppercase tracking-widest mb-12 max-w-xl mx-auto leading-relaxed">{t.home.hero_desc}</p>
                    <Link href="/dashboard/plans/create" className="px-12 py-5 bg-primary-600 text-white rounded-full font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary-500/10 hover:bg-primary-700 transition-all flex items-center gap-3 mx-auto w-fit">START NOW <ArrowRight className="w-5 h-5" /></Link>
                </div>
            </section>

            <footer className="py-16 text-center border-t border-gray-50 opacity-40"><p className="text-gray-900 font-black uppercase tracking-[0.3em] text-[9px] mb-1.5 leading-none">SEN YAS DADDY &copy; {new Date().getFullYear()}</p><p className="text-gray-300 font-black uppercase tracking-[0.4em] text-[7px]">The All-in-One Holiday Orchestrator</p></footer>
        </div>
    )
}

function SummaryCard({ icon, title, val, sub }: any) {
    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-inner">{icon}</div>
            <h3 className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1.5">{title}</h3>
            <p className="text-xl font-black text-gray-900 mb-0.5 uppercase tracking-tight">{val}</p>
            <p className="text-[8px] font-black text-primary-400 uppercase tracking-widest leading-none opacity-60">{sub}</p>
        </div>
    )
}
