'use client'

import Link from 'next/link'
import { Compass, Home, Search, AlertTriangle, Globe } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

export default function NotFound() {
    const { language } = useLanguage()
    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6 overflow-hidden relative font-bold">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"><Globe className="w-[100rem] h-[100rem] absolute -bottom-40 -right-40" /></div>

            <div className="max-w-2xl w-full text-center space-y-16 animate-in fade-in duration-1000 relative z-10">
                <div className="relative inline-block scale-125 md:scale-150">
                    <div className="text-[120px] font-black text-gray-50 leading-none select-none tracking-tighter">404</div>
                    <div className="absolute inset-0 flex items-center justify-center"><div className="w-16 h-16 bg-white rounded-2xl shadow-2xl flex items-center justify-center text-primary-600 border border-gray-100 animate-bounce"><Compass className="w-8 h-8" /></div></div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-center gap-3 text-amber-500"><AlertTriangle className="w-6 h-6" /><span className="text-[10px] font-black uppercase tracking-[0.4em]">{language === 'id' ? 'Ops! Tersesat?' : 'Lost in destination?'}</span></div>
                    <h1 className="text-4xl md:text-6xl font-black text-gray-900 uppercase tracking-tighter leading-none">{language === 'id' ? 'Halaman Tidak Ada' : 'Page Not Found'}</h1>
                    <p className="text-xs md:text-sm text-gray-400 font-bold max-w-sm mx-auto uppercase leading-loose tracking-widest">{language === 'id' ? 'Sepertinya koordinat yang kamu tuju salah atau destinasi ini sudah dihapus dari peta.' : 'Target coordinates are invalid or this destination has been removed from the map.'}</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/dashboard" className="px-10 py-5 bg-primary-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary-200 hover:bg-primary-700 transition-all flex items-center gap-3"><Home className="w-4 h-4" /> {language === 'id' ? 'KE DASHBOARD' : 'DASHBOARD'}</Link>
                    <Link href="/plans" className="px-10 py-5 bg-gray-50 text-gray-400 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-gray-100 transition-all flex items-center gap-3"><Search className="w-4 h-4" /> {language === 'id' ? 'CARI RENCANA' : 'SEARCH PLANS'}</Link>
                </div>

                <p className="text-[10px] font-black text-gray-200 uppercase tracking-[0.5em] pt-20">SEN YAS DADDY • EXPLORER EDITION</p>
            </div>
        </div>
    )
}
