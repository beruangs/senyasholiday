'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Save, Loader2, Sparkles, MapPin, Calendar, Lock, FileText } from 'lucide-react'
import { usePageTitle, pageTitle } from '@/lib/usePageTitle'
import { useLanguage } from '@/context/LanguageContext'

export default function CreatePlanPage() {
  const { language, t } = useLanguage()
  usePageTitle(pageTitle.dashboard())
  const router = useRouter(); const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ title: '', destination: '', startDate: '', endDate: '', description: '', password: '', planCategory: 'individual' as 'individual' | 'sen_yas_daddy', })
  const userRole = (session?.user as any)?.role || 'user'; const canSelectCategory = userRole === 'sen_user' || userRole === 'superadmin'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      const res = await fetch('/api/plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      const data = await res.json()
      if (res.ok) { toast.success(t.common.success); router.push(`/dashboard/plans/${data._id}`); } else { toast.error(data.details || data.error || t.common.failed) }
    } catch { toast.error(t.common.failed) } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 font-bold">
      <div className="max-w-3xl mx-auto px-6">
        <Link href="/dashboard" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-8 font-black uppercase text-[9px] tracking-widest group transition-all"><ArrowLeft className="w-3.5 h-3.5 mr-2 group-hover:-translate-x-1 transition-transform" /> {t.common.back}</Link>

        <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-primary-600 p-10 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10"><Sparkles className="w-48 h-48" /></div>
            <div className="relative z-10"><h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight leading-none mb-2">{language === 'id' ? 'Buat Rencana Baru' : 'Create New Plan'}</h1><p className="text-primary-100 font-black uppercase text-[9px] tracking-widest opacity-60">{language === 'id' ? 'MULAI PETUALANGANMU DI SINI' : 'START YOUR ADVENTURE HERE'}</p></div>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2 space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t.common.title} <span className="text-rose-500">*</span></label><input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black text-gray-900 focus:bg-white focus:border-primary-500 transition-all text-lg" placeholder="E.g. SUMMER TRIP TO BALI" /></div>
              <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t.common.destination} <span className="text-rose-500">*</span></label><div className="relative"><MapPin className="absolute left-5 h-4 w-4 text-gray-300 top-1/2 -translate-y-1/2" /><input type="text" required value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })} className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black text-gray-900" placeholder="E.g. Tokyo" /></div></div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
                  <span>{t.plan.share_link_password}</span>
                  {!(session?.user as any).isPremium && (
                    <Link href="/pricing" className="text-amber-600 flex items-center gap-1 hover:underline">
                      <Lock size={10} />
                      PREMIUM
                    </Link>
                  )}
                </label>
                <div className="relative">
                  <Lock className="absolute left-5 h-4 w-4 text-gray-300 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black text-gray-900 ${!(session?.user as any).isPremium ? 'opacity-50 cursor-not-allowed' : ''}`}
                    placeholder={!(session?.user as any).isPremium ? 'Upgrade to use Password' : 'Optional'}
                    disabled={!(session?.user as any).isPremium}
                  />
                </div>
              </div>
              <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t.common.start_date} <span className="text-rose-500">*</span></label><div className="relative"><Calendar className="absolute left-5 h-4 w-4 text-gray-300 top-1/2 -translate-y-1/2" /><input type="date" required value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black" /></div></div>
              <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t.common.end_date} <span className="text-rose-500">*</span></label><div className="relative"><Calendar className="absolute left-5 h-4 w-4 text-gray-300 top-1/2 -translate-y-1/2" /><input type="date" required value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black" /></div></div>
              {canSelectCategory && (<div className="md:col-span-2 space-y-2 p-6 bg-primary-50/50 rounded-[1.5rem] border border-primary-100"><label className="text-[9px] font-black text-primary-600 uppercase tracking-widest">DATABASE CATEGORY</label><select value={formData.planCategory} onChange={e => setFormData({ ...formData, planCategory: e.target.value as any })} className="w-full px-6 py-3 bg-white border border-primary-100 rounded-xl outline-none font-black appearance-none cursor-pointer"><option value="individual">{language === 'id' ? 'INDIVIDU' : 'INDIVIDUAL'}</option><option value="sen_yas_daddy">{language === 'id' ? 'SEN YAS HOLIDAY' : 'SEN YAS HOLIDAY'}</option></select><p className="text-[8px] font-black text-primary-400 uppercase tracking-widest mt-2">{formData.planCategory === 'individual' ? 'PRIVATE · ONLY YOU CAN SEE' : 'ORG · TEAM CAN SEE'}</p></div>)}
              <div className="md:col-span-2 space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t.common.description}</label><div className="relative"><FileText className="absolute left-5 top-5 h-4 w-4 text-gray-300" /><textarea rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black text-gray-900 resize-none" placeholder="..." /></div></div>
            </div>

            <div className="flex gap-3 pt-8 border-t border-gray-100"><button type="submit" disabled={loading} className="flex-[2] py-4 bg-primary-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary-50 hover:bg-primary-700 transition-all flex items-center justify-center gap-3">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {language === 'id' ? 'SIMPAN RENCANA' : 'SAVE PLAN'}</button><Link href="/dashboard" className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest text-center hover:bg-gray-100 transition-all flex items-center justify-center">{t.common.cancel}</Link></div>
          </form>
        </div>
      </div>
    </div>
  )
}
