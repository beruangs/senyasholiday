'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Lock, Calendar, MapPin, DollarSign, Users,
  CreditCard, FileText, Settings, CheckSquare,
  Receipt, StickyNote, ArrowRight, Check,
  Sparkles, Globe, Plane, LayoutDashboard,
  Wallet, TrendingUp, ChevronDown, Printer, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id, enUS } from 'date-fns/locale'
import { usePageTitle, pageTitle } from '@/lib/usePageTitle'
import SuggestionButton from '@/components/SuggestionButton'
import { useLanguage } from '@/context/LanguageContext'

export default function PublicPlanPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const planId = params.id as string
  const { language, t } = useLanguage()

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [plan, setPlan] = useState<any>(null)
  const [rundowns, setRundowns] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [participants, setParticipants] = useState<any[]>([])
  const [contributions, setContributions] = useState<any[]>([])
  const [splitBills, setSplitBills] = useState<any[]>([])
  const [checklist, setChecklist] = useState<any[]>([])
  const [note, setNote] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'rundown' | 'keuangan' | 'checklist' | 'splitbill' | 'note'>('rundown')
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null)

  usePageTitle(plan ? pageTitle.publicPlan(plan.title) : 'Loading...')

  useEffect(() => {
    fetchPlan()
  }, [planId])

  useEffect(() => {
    if (isAuthenticated) fetchAllData()
  }, [isAuthenticated])

  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    if (paymentStatus === 'success') {
      toast.success(language === 'id' ? 'Pembayaran berhasil! 🎉' : 'Payment successful! 🎉')
      if (isAuthenticated) fetchAllData()
    } else if (paymentStatus === 'error') {
      toast.error(language === 'id' ? 'Pembayaran gagal.' : 'Payment failed.')
    } else if (paymentStatus === 'pending') {
      toast.info(language === 'id' ? 'Pembayaran pending.' : 'Payment pending.')
    }
    if (searchParams.get('print') === 'true' && isAuthenticated && !loading) {
      setTimeout(() => window.print(), 2000)
    }
  }, [searchParams, isAuthenticated, loading, language])

  const fetchPlan = async () => {
    try {
      const res = await fetch(`/api/plans/${planId}`)
      if (res.ok) {
        const data = await res.json(); setPlan(data);
        if (!data.hasPassword) setIsAuthenticated(true)
      }
    } catch (error) { toast.error(t.dashboard.loading_data) } finally { setLoading(false) }
  }

  const fetchAllData = async () => {
    try {
      const [rundownsRes, expensesRes, participantsRes, contributionsRes, notesRes, splitRes, checkRes] = await Promise.all([
        fetch(`/api/rundowns?planId=${planId}`), fetch(`/api/expenses?planId=${planId}`),
        fetch(`/api/participants?planId=${planId}`), fetch(`/api/contributions?planId=${planId}`),
        fetch(`/api/notes?planId=${planId}`), fetch(`/api/split-bills?planId=${planId}`),
        fetch(`/api/plans/${planId}/checklist`),
      ])
      if (rundownsRes.ok) setRundowns(await rundownsRes.json())
      if (expensesRes.ok) setExpenses(await expensesRes.json())
      if (participantsRes.ok) setParticipants(await participantsRes.json())
      if (contributionsRes.ok) setContributions(await contributionsRes.json())
      if (splitRes.ok) setSplitBills(await splitRes.json())
      if (checkRes.ok) setChecklist(await checkRes.json())
      if (notesRes.ok) { const data = await notesRes.json(); setNote(data.content || ''); }
    } catch (error) { console.error('Error fetching data:', error) }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/plans/${planId}/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (data.valid) { setIsAuthenticated(true); toast.success(t.plan.access_granted); }
      else { toast.error(t.plan.wrong_password); setPassword(''); }
    } catch (error) { toast.error(t.common.loading) }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }

  const handlePayment = async (participantId: string, participantName: string) => {
    setPaymentLoading(participantId)
    try {
      const participantContributions = contributions.filter((c: any) => {
        const cParticipantId = typeof c.participantId === 'object' ? c.participantId._id : c.participantId
        return cParticipantId === participantId && c.paid < c.amount
      })
      if (participantContributions.length === 0) { toast.error(language === 'id' ? 'Lunas!' : 'Paid!'); setPaymentLoading(null); return; }
      const res = await fetch('/api/payment/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contributionIds: participantContributions.map((c: any) => c._id), participantId, planId }), })
      if (!res.ok) throw new Error('Failed to create payment')
      const data = await res.json()
      if (data.redirectUrl) window.location.href = data.redirectUrl
      else toast.error('Failed to create payment link')
    } catch (error) { toast.error('Failed to create payment') } finally { setPaymentLoading(null) }
  }

  const dateLocale = language === 'id' ? id : enUS

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold"><Loader2 className="animate-spin h-8 w-8 text-primary-600" /></div>
  if (!plan) { notFound(); return null; }

  if (plan.hasPassword && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 font-bold">
        <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-10 border border-gray-100">
          <div className="flex justify-center mb-8"><Image src="/logo.png" alt="SEN YAS DADDY" width={80} height={80} className="rounded-[1.5rem] shadow-xl" /></div>
          <div className="text-center mb-8">
            <Lock className="w-10 h-10 text-primary-600 mx-auto mb-4" />
            <h1 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">{plan.title}</h1>
            <p className="text-gray-400 font-black uppercase tracking-widest text-[9px]">{t.plan.password_protected}</p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold" placeholder={t.plan.enter_password} />
            <button type="submit" className="w-full px-8 py-4 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary-100">{t.plan.access_plan}</button>
          </form>
        </div>
        <SuggestionButton page={`Shared Link - Auth - ${plan.title}`} />
      </div>
    )
  }

  const grandTotal = expenses.reduce((sum: number, exp: any) => sum + exp.total, 0)
  const groupedRundowns = rundowns.reduce((acc: any, rundown: any) => {
    const date = rundown.date.split('T')[0]; if (!acc[date]) acc[date] = []; acc[date].push(rundown); return acc
  }, {})

  const allContributionsPaid = contributions.reduce((sum: number, c: any) => sum + (c.paid || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50/50 font-bold px-4">
      <div className="relative mb-8 max-w-6xl mx-auto pt-8">
        <div className="relative h-48 sm:h-64 w-full overflow-hidden rounded-[2rem] sm:rounded-[3rem] shadow-xl">
          {plan.bannerImage ? <img src={plan.bannerImage} alt="Banner" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-900" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          {plan.status === 'completed' && <div className="absolute top-4 right-4 px-4 py-1.5 bg-emerald-600 text-white rounded-full font-black text-[9px] uppercase tracking-widest shadow-lg flex items-center gap-2"><CheckSquare className="w-3.5 h-3.5" /> {t.plan.trip_completed}</div>}
        </div>

        <div className="relative px-6 sm:px-12 -mt-16">
          <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl p-6 sm:p-10 border border-gray-100 relative overflow-hidden">
            <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-end">
              <div className="flex-shrink-0 relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl p-2 border-4 border-white flex items-center justify-center -mt-16 sm:-mt-24 relative z-10 font-black">
                  {plan.logoImage ? <img src={plan.logoImage} alt="Logo" className="w-full h-full object-contain" /> : <div className="w-full h-full bg-primary-600 rounded-[1rem] sm:rounded-[1.5rem] flex items-center justify-center font-black text-white text-3xl sm:text-4xl">SYD</div>}
                </div>
              </div>

              <div className="flex-1 text-center lg:text-left space-y-3">
                <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight uppercase">{plan.title}</h1>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                  <span className="px-4 py-1.5 bg-primary-50 text-primary-600 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm"><MapPin className="w-3.5 h-3.5" /> {plan.destination}</span>
                  <span className="px-4 py-1.5 bg-gray-50 text-gray-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-gray-100 flex items-center gap-2 shadow-sm"><Calendar className="w-3.5 h-3.5 text-primary-400" /> {format(new Date(plan.startDate), 'dd MMM', { locale: dateLocale })} - {format(new Date(plan.endDate), 'dd MMM yyyy', { locale: dateLocale })}</span>
                </div>
              </div>

              <div className="flex-shrink-0"><button onClick={() => window.print()} className="p-3 bg-gray-50 text-gray-400 hover:text-primary-600 rounded-xl transition-all shadow-sm"><Printer className="w-4 h-4" /></button></div>
            </div>

            <div className="mt-8 w-full overflow-x-auto no-scrollbar pt-6 border-t border-gray-50">
              <nav className="flex sm:justify-center gap-2 min-w-max pb-2">
                {[
                  { id: 'rundown', label: t.plan.rundown, icon: Calendar },
                  { id: 'keuangan', label: t.plan.finance, icon: Wallet },
                  { id: 'splitbill', label: t.plan.split_bill, icon: Receipt },
                  { id: 'checklist', label: t.plan.checklist, icon: CheckSquare },
                  { id: 'note', label: t.plan.notes, icon: StickyNote },
                ].map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-primary-600 text-white shadow-lg shadow-primary-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
                    <tab.icon className="w-4 h-4" /> {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto pb-24 font-bold">
        {plan.status === 'completed' && activeTab === 'keuangan' && (
          <div className="mb-8 bg-emerald-600 rounded-[2.5rem] p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden mx-4">
            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none transition-transform"><TrendingUp className="w-40 h-40" /></div>
            <div className="relative z-10">
              <h2 className="text-2xl font-black uppercase tracking-tight mb-8 font-bold">{t.plan.final_report}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div><p className="text-[9px] font-black text-emerald-100 uppercase tracking-widest mb-1 opacity-70">Total Realisasi</p><p className="text-3xl font-black">{formatCurrency(grandTotal)}</p></div>
                <div><p className="text-[9px] font-black text-emerald-100 uppercase tracking-widest mb-1 opacity-70">Total Iuran Masuk</p><p className="text-3xl font-black">{formatCurrency(allContributionsPaid)}</p></div>
                <div><p className="text-[9px] font-black text-emerald-100 uppercase tracking-widest mb-1 opacity-70">Status Keuangan</p><p className="text-3xl font-black uppercase">{allContributionsPaid >= grandTotal ? t.demo.surplus : t.demo.deficit}</p></div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-[3rem] p-6 sm:p-12 shadow-xl border border-gray-100 min-h-[500px] transition-all mx-4">
          {activeTab === 'rundown' && (
            <div className="space-y-12">
              {Object.keys(groupedRundowns).length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-100"><Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" /><p className="text-gray-400 font-black uppercase tracking-widest text-[9px]">{t.plan.no_rundown}</p></div>
              ) : (
                Object.keys(groupedRundowns).sort().map((date, idx) => (
                  <div key={date} className="relative">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary-50">0{idx + 1}</div>
                      <div><h3 className="text-xl font-black text-gray-900 tracking-tight uppercase mb-1">{t.demo.day} 0{idx + 1}</h3><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{format(new Date(date), 'EEEE, dd MMMM yyyy', { locale: dateLocale })}</p></div>
                    </div>
                    <div className="space-y-4 ml-6 pl-10 border-l-2 border-dashed border-gray-100">
                      {groupedRundowns[date].map((rundown: any) => (
                        <div key={rundown._id} className="group bg-gray-50/50 hover:bg-white hover:shadow-xl hover:border-primary-50 border border-transparent p-6 rounded-[2rem] transition-all duration-300">
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="text-[9px] font-black text-primary-600 bg-white border border-gray-100 px-3 py-1 rounded-lg shadow-sm h-fit uppercase tracking-widest">{rundown.time || '--:--'}</div>
                            <div className="flex-1">
                              <h4 className="font-black text-gray-900 text-lg mb-3 leading-tight uppercase tracking-tight">{rundown.activity}</h4>
                              <div className="flex flex-wrap gap-4 mt-2">
                                {rundown.location && <p className="text-[10px] text-gray-400 flex items-center gap-2 font-black uppercase tracking-widest"><MapPin className="w-3.5 h-3.5" /> {rundown.location}</p>}
                                {rundown.notes && <p className="text-[10px] text-gray-300 flex items-center gap-2 font-bold uppercase tracking-widest opacity-60"><StickyNote className="w-3.5 h-3.5" /> {rundown.notes}</p>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'keuangan' && (
            <div className="space-y-16 font-bold">
              <section>
                <div className="flex items-center justify-between mb-8"><h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{t.plan.expense_detail}</h3><div className="px-5 py-2 bg-gray-50 rounded-xl text-[9px] font-black uppercase text-gray-400 tracking-widest">Total: {formatCurrency(grandTotal)}</div></div>
                <div className="overflow-x-auto rounded-[2rem] border border-gray-100"><table className="w-full text-left uppercase text-[10px]"><thead><tr className="bg-gray-50 border-b border-gray-100"><th className="px-8 py-5 font-black tracking-widest text-gray-400 text-[9px]">Item</th><th className="px-8 py-5 font-black tracking-widest text-gray-400 text-right text-[9px]">Total</th><th className="px-8 py-5 font-black tracking-widest text-gray-400 text-right text-[9px]">Unit Cost</th></tr></thead><tbody className="divide-y divide-gray-50">{expenses.map((expense: any) => (
                  <tr key={expense._id} className="group hover:bg-primary-50/20 transition-all font-bold"><td className="px-8 py-6"><p className="font-black text-gray-900 text-sm mb-1">{expense.itemName}</p><p className="text-[8px] text-gray-300 font-bold">{expense.detail || '-'}</p></td><td className="px-8 py-6 text-right font-black text-gray-900 text-sm">{formatCurrency(expense.total)}</td><td className="px-8 py-6 text-right"><span className="inline-flex px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black">{formatCurrency(expense.total / (participants.length || 1))}</span></td></tr>
                ))}</tbody></table></div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-8"><h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{t.plan.contribution_status}</h3></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{participants.map((p: any) => {
                  const pContributions = contributions.filter((c: any) => (typeof c.participantId === 'object' ? c.participantId._id : c.participantId) === p._id)
                  const totalReq = pContributions.reduce((sum, c) => sum + (c.amount || 0), 0); const totalPaid = pContributions.reduce((sum, c) => sum + (c.paid || 0), 0)
                  const isLunas = totalPaid >= totalReq && totalReq > 0
                  return (
                    <div key={p._id} className="bg-white border-2 border-gray-50 rounded-[2.5rem] p-8 group hover:border-primary-100 hover:shadow-xl transition-all font-bold">
                      <div className="flex justify-between items-start mb-6"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center font-black text-primary-600 border border-gray-100 shadow-inner group-hover:bg-primary-600 group-hover:text-white transition-all text-lg uppercase">{p.name[0]}</div><div><p className="font-black text-gray-900 text-base uppercase mb-1">{p.name}</p><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{p.phoneNumber || 'PESERTA'}</p></div></div>{totalReq > 0 && <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${isLunas ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{isLunas ? t.plan.lunas : t.plan.not_lunas}</span>}</div>
                      <div className="space-y-4 pt-4 border-t border-gray-50"><div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400"><span>{t.plan.required}</span><span className="text-gray-900">{formatCurrency(totalReq)}</span></div><div className="flex justify-between text-sm font-black uppercase tracking-widest text-primary-600"><span>{t.plan.paid}</span><div className="flex items-center gap-3"><span>{formatCurrency(totalPaid)}</span>{totalPaid < totalReq && <button onClick={() => handlePayment(p._id, p.name)} disabled={paymentLoading === p._id} className="p-2.5 bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-100 active:scale-90 transition-all disabled:opacity-50"><CreditCard className="w-4 h-4" /></button>}</div></div></div>
                    </div>
                  )
                })}</div>
              </section>
            </div>
          )}

          {activeTab === 'splitbill' && (
            <div className="space-y-12">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-8">Split Bill Details</h3>
              {splitBills.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-100"><Receipt className="w-12 h-12 text-gray-200 mx-auto mb-4" /><p className="text-gray-400 font-black uppercase tracking-widest text-[9px]">{language === 'id' ? 'Belum ada split bill khusus' : 'No custom split bills'}</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-bold text-gray-900">{splitBills.map((bill: any) => (
                  <div key={bill._id} className="bg-white border-4 border-gray-50 rounded-[2.5rem] p-8 hover:border-primary-100 hover:shadow-2xl transition-all border-l-[10px] border-l-primary-600 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6"><div><h4 className="text-lg font-black uppercase leading-tight mb-2 tracking-tight">{bill.title}</h4><p className="text-[8px] font-black text-gray-400 tracking-widest uppercase">{language === 'id' ? 'DIBAYAR OLEH' : 'PAID BY'} {participants.find((p: any) => p._id === bill.payerId)?.name || 'UNKNOWN'}</p></div><div className="text-right"><p className="text-2xl font-black">{formatCurrency(bill.totalAmount)}</p><span className="text-[8px] font-black text-primary-300 uppercase tracking-widest">Total</span></div></div>
                    <div className="flex flex-wrap gap-2 pt-6 border-t-2 border-gray-50">{bill.participantPayments?.map((pay: any) => {
                      const p = participants.find((part: any) => part._id === pay.participantId); return (
                        <div key={pay.participantId} className="px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100 flex items-center gap-2"><div className="w-5 h-5 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-[8px] font-black text-primary-600 uppercase">{p?.name[0]}</div><span className="text-[8px] font-black text-gray-500 uppercase tracking-tight">{p?.name}: {formatCurrency(pay.shareAmount)}</span></div>
                      )
                    })}</div>
                  </div>
                ))}</div>
              )}
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="space-y-12">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-8">Preparation Checklist</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{checklist.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-100 font-bold"><CheckSquare className="w-12 h-12 text-gray-200 mx-auto mb-4" /><p className="text-gray-400 font-black uppercase tracking-widest text-[9px]">Empty List</p></div>
              ) : (checklist.map((item: any) => (
                <div key={item._id} className={`flex items-center gap-4 p-6 rounded-[2rem] border-2 transition-all font-bold ${item.isCompleted ? 'bg-primary-50/20 border-primary-50 opacity-60' : 'bg-white border-gray-100 shadow-sm hover:border-primary-100 hover:shadow-xl'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${item.isCompleted ? 'bg-primary-600 text-white shadow-lg' : 'bg-gray-50 text-gray-300'}`}>{item.isCompleted ? <Check className="w-5 h-5" /> : <div className="w-4 h-4 rounded-md bg-white border-2 border-gray-100" />}</div>
                  <div className="flex-1"><p className={`font-black text-sm uppercase tracking-tight ${item.isCompleted ? 'text-gray-300 line-through' : 'text-gray-900'}`}>{item.item}</p><span className={`text-[7px] font-black uppercase tracking-[0.2em] mt-1 block ${item.isCompleted ? 'text-primary-200' : 'text-primary-300'}`}>{item.category || 'PACKING'}</span></div>
                </div>
              )))}</div>
            </div>
          )}

          {activeTab === 'note' && (
            <div className="space-y-12">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-8">{t.plan.notes}</h3>
              <div className="relative group">
                <div className="absolute inset-0 bg-primary-50/30 rounded-[3rem] transform translate-x-3 translate-y-3 pointer-events-none" />
                <div className="relative bg-white border border-gray-100 rounded-[3rem] p-8 sm:p-14 min-h-[400px] shadow-sm overflow-hidden font-bold">
                  <StickyNote className="absolute top-10 right-10 w-16 h-16 text-primary-50" />
                  <div className="relative z-10">{note ? <div className="prose prose-lg max-w-none prose-p:font-bold prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter" dangerouslySetInnerHTML={{ __html: note }} /> : (
                    <div className="text-center py-20"><FileText className="w-16 h-16 text-gray-100 mx-auto mb-6" /><p className="text-gray-400 font-black uppercase text-[9px] tracking-widest">No extra notes</p></div>
                  )}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-1000 print:hidden w-full px-6 max-w-md">
        <Link href="/" className="group flex items-center justify-between gap-4 px-8 py-4 bg-gray-900 text-white rounded-full shadow-[0_20px_40px_-5px_rgba(0,0,0,0.4)] hover:scale-105 active:scale-95 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center ring-2 ring-gray-800"><Globe className="w-4 h-4 text-white" /></div>
            <span className="text-[9px] font-black uppercase tracking-widest truncate">Orchestrate with S.E.N</span>
          </div>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-all text-primary-500" />
        </Link>
      </div>

      <style jsx global>{`
        @media print { body { background: white !important; } .max-w-6xl { max-width: 100% !important; padding: 0 !important; } nav, button, footer, .suggestion-button-container, .fixed { display: none !important; } .rounded-[4rem], .rounded-[3rem], .rounded-[2.5rem] { border-radius: 1.5rem !important; } .shadow-xl, .shadow-2xl { box-shadow: none !important; border: 1px solid #eee !important; } .bg-gray-50/50, .bg-gray-50 { background: white !important; } }
        .no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
