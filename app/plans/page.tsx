'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, MapPin, Search, Plane, Loader2, Compass } from 'lucide-react'
import { format } from 'date-fns'
import { id, enUS } from 'date-fns/locale'
import { useLanguage } from '@/context/LanguageContext'

export default function PlansPage() {
  const { language, t } = useLanguage(); const [plans, setPlans] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [searchQuery, setSearchQuery] = useState('')
  const dateLocale = language === 'id' ? id : enUS

  useEffect(() => {
    fetch('/api/plans/public').then(res => res.json()).then(data => { setPlans(data); setLoading(false); }).catch(() => setLoading(false))
  }, [])

  const filtered = plans.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.destination.toLowerCase().includes(searchQuery.toLowerCase()))

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-bold"><Loader2 className="w-12 h-12 animate-spin text-primary-600" /></div>

  return (
    <div className="min-h-screen bg-white font-bold">
      <div className="bg-primary-600 px-6 py-24 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"><Plane className="w-[40rem] h-[40rem] absolute -top-20 -right-20" /></div>
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="flex justify-center mb-10"><Image src="/logo.png" alt="LOGO" width={80} height={80} className="rounded-2xl shadow-2xl" /></div>
          <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-6">{language === 'id' ? 'Database Rencana' : 'Plan Database'}</h1>
          <p className="text-primary-100 font-black uppercase text-[10px] tracking-[0.4em]">{language === 'id' ? 'TEMUKAN INSPIRASI PERJALANANMU' : 'FIND YOUR TRAVEL INSPIRATION'}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="relative mb-20 group max-w-2xl mx-auto">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-300 group-focus-within:text-primary-600 transition-all" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={language === 'id' ? 'CARI TRIP...' : 'SEARCH TRIPS...'} className="w-full pl-16 pr-8 py-6 bg-gray-50 border border-gray-100 rounded-[2rem] outline-none font-black text-xl text-gray-900 focus:bg-white focus:border-primary-500 transition-all shadow-sm" />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-40 border-2 border-dashed border-gray-100 rounded-[4rem] font-bold"><Compass className="w-20 h-20 text-gray-200 mx-auto mb-10" /><h3 className="text-2xl font-black uppercase tracking-tight text-gray-900 mb-4">{language === 'id' ? 'TIDAK DITEMUKAN' : 'NO RESULTS FOUND'}</h3><p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{language === 'id' ? 'COBA KATA KUNCI LAIN' : 'TRY ANOTHER KEYWORD'}</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filtered.map(p => (
              <Link key={p._id} href={`/plan/${p._id}`} className="group bg-white rounded-[3rem] border border-gray-100 p-8 hover:shadow-2xl hover:border-transparent transition-all duration-500 flex flex-col h-full relative overflow-hidden">
                <div className="flex-1 space-y-6">
                  <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 leading-tight group-hover:text-primary-600 transition-colors">{p.title}</h2>
                  <div className="space-y-4 uppercase text-[10px] font-black tracking-widest text-gray-400">
                    <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-primary-500" /> <span className="truncate">{p.destination}</span></div>
                    <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-primary-500" /> <span>{format(new Date(p.startDate), 'd MMM', { locale: dateLocale })} - {format(new Date(p.endDate), 'd MMM yyyy', { locale: dateLocale })}</span></div>
                  </div>
                  {p.description && <p className="text-[11px] font-bold text-gray-400 uppercase leading-relaxed line-clamp-3 opacity-60">{p.description}</p>}
                </div>
                <div className="mt-10 pt-8 border-t border-gray-50 flex justify-between items-center"><span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-600 group-hover:translate-x-2 transition-transform">VIEW DETAILS →</span><div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 group-hover:bg-primary-600 group-hover:text-white transition-all"><Plane className="w-4 h-4" /></div></div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <footer className="py-20 text-center border-t border-gray-100 mb-20"><Link href="/" className="px-12 py-5 bg-white border-2 border-gray-100 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[10px] text-gray-400 hover:text-gray-900 hover:border-gray-200 transition-all">← BACK TO HOME</Link></footer>
    </div>
  )
}
