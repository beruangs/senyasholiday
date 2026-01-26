'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Lock, Calendar, MapPin, DollarSign, Users,
  CreditCard, FileText, Settings, CheckSquare,
  Receipt, StickyNote, ArrowLeft, ArrowRight, Check,
  Sparkles, Globe, Plane, LayoutDashboard,
  Wallet, TrendingUp, ChevronDown, Printer, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id, enUS } from 'date-fns/locale'
import { usePageTitle, pageTitle } from '@/lib/usePageTitle'
import SuggestionButton from '@/components/SuggestionButton'
import { useLanguage } from '@/context/LanguageContext'
import DigitalReceipt from '@/components/DigitalReceipt'

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
  const [activeTab, setActiveTab] = useState<'info' | 'rundown' | 'keuangan' | 'checklist' | 'splitbill' | 'note'>('info')
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null)
  const [selectedBill, setSelectedBill] = useState<any>(null)

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
        if (!data.hasPassword) {
          setIsAuthenticated(true)
          // No need to wait for useEffect, just fetch full data here
          const fullRes = await fetch(`/api/plans/${planId}/full`)
          if (fullRes.ok) {
            const fullData = await fullRes.json()
            setRundowns(fullData.rundowns)
            setExpenses(fullData.expenses)
            setParticipants(fullData.participants)
            setContributions(fullData.contributions)
            setSplitBills(fullData.splitBills)
            setChecklist(fullData.checklist)
            setNote(fullData.note)
          }
        }
      }
    } catch (error) { toast.error(t.dashboard.loading_data) } finally { setLoading(false) }
  }

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/plans/${planId}/full`)
      if (res.ok) {
        const data = await res.json()
        setPlan(data.plan) // Keep plan synced
        setRundowns(data.rundowns)
        setExpenses(data.expenses)
        setParticipants(data.participants)
        setContributions(data.contributions)
        setSplitBills(data.splitBills)
        setChecklist(data.checklist)
        setNote(data.note)
      }
    } catch (error) { console.error('Error fetching data:', error) } finally { setLoading(false) }
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
            <h1 className="text-xl font-black text-gray-900 mb-2 tracking-tight">{plan.title}</h1>
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
    <div className="min-h-screen bg-gray-50/50 font-bold px-4 print:px-0">
      {/* ==========================================
          HEADER & HERO (WEB-ONLY)
          ========================================== */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-10 py-4 sm:py-8 flex justify-between items-center pointer-events-none print:hidden">
        <div className="bg-white/80 backdrop-blur-md border border-gray-100 px-6 py-3 rounded-2xl shadow-sm flex items-center gap-4 pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <p className="text-xs font-black uppercase text-gray-400 tracking-widest">{plan.status === 'completed' ? 'Final Report' : 'Current Plan'}</p>
          </div>
        </div>
        <button onClick={() => window.print()} className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary-200 transition-all active:scale-95 pointer-events-auto flex items-center gap-2">
          <Printer className="w-4 h-4" /> Print
        </button>
      </nav>

      <div className="max-w-7xl mx-auto pt-24 sm:pt-32 px-4 print:hidden">
        <div className="mb-8 rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100 bg-white relative">
          <div className="relative h-40 sm:h-64">
            {plan.bannerImage ? <img src={plan.bannerImage} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-900" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute -bottom-8 sm:-bottom-10 left-1/2 -translate-x-1/2">
              <div className="w-20 h-20 sm:w-36 sm:h-36 rounded-[1.2rem] sm:rounded-[2.5rem] bg-white p-2 shadow-2xl overflow-hidden border-4 border-white">
                {plan.logoImage ? <img src={plan.logoImage} className="w-full h-full object-contain" /> : <div className="w-full h-full bg-primary-600 rounded-[0.8rem] sm:rounded-[1.8rem] flex items-center justify-center"><span className="text-white font-black text-xl sm:text-4xl">SYD</span></div>}
              </div>
            </div>
          </div>

          <div className="pt-14 sm:pt-16 px-4 sm:px-8 pb-6 sm:pb-8 text-center">
            <div className="flex flex-col items-center gap-6">
              <div className="flex-1 space-y-4 w-full">
                <h1 className="text-2xl sm:text-5xl font-black text-gray-900 tracking-tight leading-none break-words">{plan.title}</h1>
                <div className="flex flex-wrap justify-center items-center gap-3">
                  <span className="px-4 py-1.5 bg-primary-50 text-primary-600 rounded-full text-[9px] font-black tracking-widest flex items-center gap-2 shadow-sm"><MapPin className="w-3.5 h-3.5" /> {plan.destination}</span>
                  {plan.status === 'completed' && <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black tracking-widest flex items-center gap-2 shadow-sm uppercase"><CheckSquare className="w-3.5 h-3.5" /> {t.plan.trip_completed}</span>}
                  <span className="px-4 py-1.5 bg-gray-50 text-gray-400 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm"><Calendar className="w-3.5 h-3.5" /> {format(new Date(plan.startDate), 'dd MMM', { locale: dateLocale })} - {format(new Date(plan.endDate), 'dd MMM yyyy', { locale: dateLocale })}</span>
                </div>
              </div>
            </div>

            <div className="mt-10 overflow-x-auto no-scrollbar -mx-4 sm:mx-0 py-2">
              <nav className="flex items-center justify-start sm:justify-center gap-2 border-t border-gray-100 pt-6 pb-6 min-w-max px-4 sm:px-0">
                {[
                  { id: 'info', label: t.plan.about_trip || 'Info', icon: Globe },
                  { id: 'rundown', label: t.plan.rundown, icon: Calendar },
                  { id: 'keuangan', label: t.plan.finance, icon: Wallet },
                  { id: 'splitbill', label: t.plan.split_bill, icon: Receipt },
                  { id: 'checklist', label: t.plan.checklist, icon: CheckSquare },
                  { id: 'note', label: t.plan.notes, icon: StickyNote },
                ].map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-primary-600 text-white shadow-lg shadow-primary-100 scale-105' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}>
                    <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto pb-24 font-medium print:max-w-none print:pb-0">
        {/* ==========================================
            PRINT-ONLY PAGE 1: COVER (LAPORAN PROPOSAL)
            ========================================== */}
        <div className="hidden print:flex flex-col items-center justify-center min-h-[100vh] text-center p-20 break-inside-avoid break-after-page">
          <div className="mb-20">
            <div className="w-24 h-24 bg-primary-600 rounded-[2.5rem] flex items-center justify-center text-white mb-10 mx-auto shadow-2xl rotate-12">
              <Globe className="w-12 h-12" />
            </div>
            <h1 className="text-6xl font-black tracking-tighter mb-4 text-gray-900 leading-none">Proposal & Laporan<br />Rencana Liburan</h1>
            <div className="w-40 h-2 bg-primary-600 mx-auto my-10"></div>
            <h2 className="text-4xl font-black text-primary-600 mb-4">{plan.title}</h2>
            <p className="text-xl text-gray-400 font-black tracking-[0.4em]">{plan.destination}</p>
          </div>

          <div className="grid grid-cols-2 gap-20 w-full max-w-2xl border-t-4 border-gray-900 pt-20 mt-20">
            <div className="text-left space-y-4">
              <p className="text-[12px] font-black text-gray-400 uppercase tracking-widest">Disusun Oleh</p>
              <div className="space-y-1">
                <p className="font-black text-gray-900 text-xl uppercase">Sistem Senyas Holiday</p>
                <p className="text-sm text-gray-500 font-bold uppercase underline underline-offset-4 decoration-primary-300">Automated Planning System v2.0</p>
              </div>
            </div>
            <div className="text-right space-y-4">
              <p className="text-[12px] font-black text-gray-400 uppercase tracking-widest">Tanggal Dokumen</p>
              <div className="space-y-1">
                <p className="font-black text-gray-900 text-xl uppercase">{format(new Date(), 'dd MMMM yyyy', { locale: id })}</p>
                <p className="text-sm text-gray-500 font-bold uppercase">ID: SH-{plan._id?.toString().slice(-8).toUpperCase()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            DOCUMENTS CONTENT (PAGE 2+)
            ========================================== */}
        <div className="print:block">
          {/* Executive Summary (Only on Print) */}
          <div className="hidden print:block mb-24 break-before-page pt-20">
            <div className="flex items-center gap-6 mb-16">
              <span className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl">01</span>
              <div>
                <h3 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Ringkasan Eksekutif</h3>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Overview & Persiapan Awal</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12 mb-16">
              <div className="border-4 border-gray-100 p-10 rounded-[3rem]">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-6 tracking-widest border-b pb-4">A. Statistik Perjalanan</p>
                <div className="space-y-6">
                  <div className="flex justify-between items-end border-b-2 border-dashed border-gray-100 pb-2"><span className="text-sm font-bold text-gray-500">Total Peserta</span><span className="text-lg font-black">{participants.length} Orang</span></div>
                  <div className="flex justify-between items-end border-b-2 border-dashed border-gray-100 pb-2"><span className="text-sm font-bold text-gray-500">Item Persiapan</span><span className="text-lg font-black">{checklist.length} Item</span></div>
                  <div className="flex justify-between items-end border-b-2 border-dashed border-gray-100 pb-2"><span className="text-sm font-bold text-gray-500">Kesiapan Dokumen</span><span className="text-lg font-black">{checklist.length > 0 ? Math.round((checklist.filter((i: any) => i.isCompleted).length / checklist.length) * 100) : 0}%</span></div>
                </div>
              </div>
              <div className="bg-primary-50/20 border-4 border-primary-100 p-10 rounded-[3rem]">
                <p className="text-[10px] font-black text-primary-500 uppercase mb-6 tracking-widest border-b border-primary-100 pb-4">B. Financial Outlook</p>
                <div className="space-y-6">
                  <div className="flex justify-between items-end border-b-2 border-dashed border-primary-100 pb-2"><span className="text-sm font-bold text-primary-600">Total Pengeluaran</span><span className="text-xl font-black text-gray-900">{formatCurrency(grandTotal)}</span></div>
                  <div className="flex justify-between items-end border-b-2 border-dashed border-primary-100 pb-2"><span className="text-sm font-bold text-primary-600">Total Kas Masuk</span><span className="text-xl font-black text-gray-900">{formatCurrency(allContributionsPaid)}</span></div>
                  <div className="flex justify-between items-end border-b-2 border-dashed border-primary-100 pb-2"><span className="text-sm font-bold text-primary-600">Status Saldo</span><span className={`text-xl font-black ${allContributionsPaid >= grandTotal ? 'text-emerald-600' : 'text-rose-600'}`}>{allContributionsPaid >= grandTotal ? 'SURPLUS' : 'DEFISIT'}</span></div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">C. Deskripsi Latar Belakang</p>
              <div className="text-base leading-loose text-gray-700 font-bold bg-white border-l-8 border-gray-100 pl-10 py-6 italic">{plan.description || "Laporan ini berisi detail komprehensif mengenai rencana liburan, termasuk jadwal kegiatan dan rincian biaya yang telah disepakati bersama."}</div>
            </div>
          </div>

          <div className="bg-white rounded-[1.5rem] sm:rounded-[3rem] p-5 sm:p-12 shadow-xl border border-gray-100 min-h-[500px] transition-all mx-0 print:border-none print:shadow-none print:p-0">
            {/* II. PESERTA & DELEGASI */}
            <div className={`${activeTab === 'info' ? 'block' : 'hidden print:block'} space-y-8 print:break-before-page pt-2`}>
              <div className="hidden print:flex items-center gap-6 mb-16">
                <span className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl">02</span>
                <div>
                  <h3 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Daftar Peserta & Delegasi</h3>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Detail Personalia & Kontak</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-1 gap-12">
                <div className="hidden print:block">
                  <table className="w-full text-left uppercase text-[11px]">
                    <thead className="bg-gray-100 border-y-2 border-gray-900">
                      <tr>
                        <th className="px-8 py-5 font-black tracking-widest text-gray-900">No</th>
                        <th className="px-8 py-5 font-black tracking-widest text-gray-900">Nama Lengkap</th>
                        <th className="px-8 py-5 font-black tracking-widest text-gray-900">Nomor Telepon</th>
                        <th className="px-8 py-5 font-black tracking-widest text-gray-900">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {participants.map((p: any, idx: number) => (
                        <tr key={p._id}>
                          <td className="px-8 py-5 font-bold text-gray-400">{String(idx + 1).padStart(2, '0')}</td>
                          <td className="px-8 py-5 font-black text-gray-900 text-sm">{p.name}</td>
                          <td className="px-8 py-5 font-bold text-gray-600">{p.phoneNumber || 'N/A'}</td>
                          <td className="px-8 py-5"><span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded font-black uppercase text-[9px]">Confirmed</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Web view logic stays same but simplified mapping */}
                <div className="print:hidden">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-gray-900 font-bold">
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-6 flex items-center gap-3"><Globe className="w-6 h-6 text-primary-600" /> {t.plan.about_trip}</h3>
                        <div className="bg-gray-50/50 rounded-[2rem] p-8 border border-gray-100 leading-relaxed text-gray-600 font-bold whitespace-pre-wrap">{plan.description || (language === 'id' ? 'Tidak ada deskripsi untuk liburan ini.' : 'No description for this trip.')}</div>
                      </div>
                    </div>
                    <div className="space-y-8">
                      <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-6 flex items-center gap-3"><Users className="w-6 h-6 text-primary-600" /> {language === 'id' ? 'Daftar Peserta' : 'Participants List'}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {participants.map((p: any) => (
                          <div key={p._id} className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-black uppercase flex-shrink-0">{p.name[0]}</div>
                            <div className="min-w-0">
                              <p className="font-black text-gray-900 text-[11px] truncate">{p.name}</p>
                              <p className="text-[7px] font-bold text-gray-400 tracking-tight">{p.phoneNumber || (language === 'id' ? 'No Kontak' : 'No Contact')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* III. RUNDOWN */}
            <div className={`${activeTab === 'rundown' ? 'block' : 'hidden print:block'} space-y-8 print:break-before-page pt-2`}>
              <div className="hidden print:flex items-center gap-6 mb-16">
                <span className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl">03</span>
                <div>
                  <h3 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Agenda Perjalanan (Rundown)</h3>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Jadwal Harian & Lokasi Tujuan</p>
                </div>
              </div>

              {Object.keys(groupedRundowns).length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-100"><Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" /><p className="text-gray-400 font-black uppercase tracking-widest text-[9px]">{t.plan.no_rundown}</p></div>
              ) : (
                Object.keys(groupedRundowns).sort().map((date, idx) => (
                  <div key={date} className="relative print:break-inside-avoid print:mt-8">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg">0{idx + 1}</div>
                      <div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight mb-1">{t.demo.day} 0{idx + 1}</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{format(new Date(date), 'EEEE, dd MMMM yyyy', { locale: id })}</p>
                      </div>
                    </div>
                    <div className="space-y-4 ml-6 pl-10 border-l-4 border-gray-100">
                      {groupedRundowns[date].map((rundown: any) => (
                        <div key={rundown._id} className="bg-white p-6 rounded-[1.5rem] border border-gray-100 print:shadow-none print:bg-gray-50/30">
                          <div className="flex flex-col sm:flex-row gap-6">
                            <div className="text-[11px] font-black text-primary-600 bg-white border-2 border-primary-50 px-5 py-2 rounded-xl h-fit uppercase tracking-widest text-center min-w-[100px]">{rundown.time || 'WIB'}</div>
                            <div className="flex-1">
                              <h4 className="font-black text-gray-900 text-xl mb-3 leading-tight tracking-tight">{rundown.activity}</h4>
                              <div className="flex flex-wrap gap-6">
                                {rundown.location && <p className="text-[11px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-2"><MapPin className="w-4 h-4 text-primary-400" /> {rundown.location}</p>}
                                {rundown.notes && <p className="text-[11px] text-gray-400 font-bold bg-white px-3 py-1 rounded-lg border border-gray-100 italic">"{rundown.notes}"</p>}
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

            {/* IV. KEUANGAN & AUDIT */}
            <div className={`${activeTab === 'keuangan' ? 'block' : 'hidden print:block'} space-y-8 print:break-before-page pt-2`}>
              <div className="hidden print:flex items-center gap-6 mb-16">
                <span className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl">04</span>
                <div>
                  <h3 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Laporan Audit Keuangan</h3>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Transparansi Dana & Alokasi Biaya</p>
                </div>
              </div>

              <section className="space-y-6">
                <p className="text-[12px] font-black text-gray-400 uppercase tracking-[0.3em] border-l-8 border-primary-600 pl-6">A. Rincian Pengeluaran</p>
                <div className="overflow-x-auto rounded-[2rem] border-2 border-gray-900 shadow-sm bg-white no-scrollbar">
                  <table className="w-full text-left uppercase text-[10px] min-w-[500px] md:min-w-0">
                    <thead className="bg-gray-900 text-white">
                      <tr>
                        <th className="px-6 md:px-10 py-6 font-black tracking-widest">Deskripsi Item</th>
                        <th className="px-4 md:px-10 py-6 font-black tracking-widest">Kategori</th>
                        <th className="px-6 md:px-10 py-6 font-black tracking-widest text-right">Total Biaya</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-gray-100">
                      {expenses.map((expense: any) => (
                        <tr key={expense._id} className="print:break-inside-avoid">
                          <td className="px-6 md:px-10 py-6">
                            <p className="font-black text-gray-900 text-sm mb-1">{expense.itemName}</p>
                            <p className="text-[9px] text-gray-400 font-bold italic normal-case">{expense.detail || 'Tidak ada catatan tambahan'}</p>
                          </td>
                          <td className="px-4 md:px-10 py-6"><span className="px-3 py-1 bg-gray-100 text-gray-500 rounded font-black uppercase text-[8px]">{expense.categoryId?.name || 'UMUM'}</span></td>
                          <td className="px-6 md:px-10 py-6 text-right font-black text-gray-900 text-sm">{formatCurrency(expense.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-100 text-gray-900 font-black border-t-2 border-gray-900">
                      <tr>
                        <td colSpan={2} className="px-6 md:px-10 py-8 text-right tracking-[0.1em] md:tracking-[0.2em] font-black uppercase text-[10px] md:text-sm text-gray-400">Total Realisasi Anggaran</td>
                        <td className="px-6 md:px-10 py-8 text-right text-lg md:text-2xl border-l border-gray-200">{formatCurrency(grandTotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>

              <section className="print:break-before-page pt-20">
                <p className="text-[12px] font-black text-gray-400 uppercase tracking-[0.3em] border-l-8 border-primary-600 pl-6 mb-10">B. Rekapitulasi Iuran Peserta</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {participants.map((p: any) => {
                    const pContributions = contributions.filter((c: any) => (typeof c.participantId === 'object' ? c.participantId._id : c.participantId) === p._id)
                    const totalReq = pContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
                    const totalPaid = pContributions.reduce((sum, c) => sum + (c.paid || 0), 0)
                    const isLunas = totalPaid >= totalReq && totalReq > 0
                    return (
                      <div key={p._id} className={`bg-white border-2 rounded-[2rem] p-8 transition-all font-bold print:break-inside-avoid ${isLunas ? 'border-emerald-200 bg-emerald-50/10' : 'border-gray-200'}`}>
                        <div className="flex justify-between items-center mb-8 border-b pb-6">
                          <div>
                            <p className="font-black text-gray-900 text-lg mb-1">{p.name}</p>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{p.phoneNumber || 'KONTAK TIDAK TERSEDIA'}</p>
                          </div>
                          <div className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${isLunas ? 'bg-emerald-600 text-white' : 'bg-rose-100 text-rose-600'}`}>
                            {isLunas ? 'Lunas / Terverifikasi' : 'Belum Lunas'}
                          </div>
                        </div>
                        <div className="space-y-4 mb-8">
                          <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em]">Rincian Item:</p>
                          <div className="space-y-2">
                            {pContributions.map((c: any) => (
                              <div key={c._id} className="flex justify-between items-center text-[10px] bg-gray-50/50 px-4 py-2 rounded-lg border border-gray-100">
                                <span className="text-gray-500 truncate pr-4">{c.expenseItemId?.itemName || 'Item'}</span>
                                <span className="text-gray-900 font-black">{formatCurrency(c.amount)}</span>
                              </div>
                            ))}
                            {pContributions.length === 0 && <p className="text-[9px] text-gray-400 italic">Tidak ada tagihan iuran.</p>}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-10 text-[11px] font-black uppercase pt-6 border-t border-dashed border-gray-100">
                          <div className="space-y-2"><p className="text-gray-400 text-[10px]">Tagihan Wajib</p><p className="text-gray-900 text-lg">{formatCurrency(totalReq)}</p></div>
                          <div className="space-y-2 text-right"><p className="text-gray-400 text-[10px]">Bayar</p><p className="text-primary-600 text-lg">{formatCurrency(totalPaid)}</p></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>

            {/* IVb. SPLIT BILLS */}
            <div className={`${activeTab === 'splitbill' ? 'block' : 'hidden print:block'} space-y-8 print:break-before-page pt-2`}>
              <div className="hidden print:flex items-center gap-6 mb-16">
                <span className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl">04b</span>
                <div>
                  <h3 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Bagi Tagihan (Split Bill)</h3>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Detail Pembagian Biaya Per Item</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2">
                {splitBills.length === 0 ? (
                  <div className="col-span-full text-center py-20 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-100 italic font-black uppercase tracking-widest text-gray-400 text-[9px]">Belum ada catatan split bill.</div>
                ) : (
                  splitBills.map((bill: any) => (
                    <div key={bill._id} className="bg-white border-2 border-gray-900 rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col print:break-inside-avoid">
                      <div className="p-8 border-b-2 border-gray-900 bg-gray-50/50">
                        <div className="flex justify-between items-start gap-4 mb-4">
                          <div>
                            <h4 className="text-xl font-black text-gray-900 leading-tight mb-2">{bill.title}</h4>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payer: <span className="text-primary-600">{bill.payerId?.name || 'Unknown'}</span></p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-gray-900 leading-none mb-2">{formatCurrency(bill.totalAmount)}</p>
                            <button onClick={() => setSelectedBill(bill)} className="text-[7px] font-black uppercase text-primary-600 hover:underline tracking-widest leading-none">LIHAT STRUK</button>
                          </div>
                        </div>
                        <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{format(new Date(bill.date), 'dd MMMM yyyy', { locale: language === 'id' ? id : enUS })}</div>
                      </div>
                      <div className="p-8 space-y-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Peserta & Bagian:</p>
                        <div className="space-y-3">
                          {bill.participantPayments.map((p: any) => (
                            <div key={p.participantId?._id} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${p.isPaid ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-400'}`}>{p.isPaid ? '✓' : '✗'}</div>
                                <span className="text-[11px] font-black text-gray-900">{p.participantId?.name}</span>
                              </div>
                              <span className="text-[11px] font-black text-gray-700">{formatCurrency(p.shareAmount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* V. EVALUASI KESIAPAN */}
            <div className={`${activeTab === 'checklist' ? 'block' : 'hidden print:block'} space-y-8 print:break-before-page pt-2`}>
              <div className="hidden print:flex items-center gap-6 mb-16">
                <span className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl">05</span>
                <div>
                  <h3 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Evaluasi Kesiapan (Checklist)</h3>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Kesiapan Dokumen & Logistik</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2">
                {checklist.map((item: any) => (
                  <div key={item._id} className="flex items-center gap-6 p-8 rounded-[2rem] border-2 border-gray-100 bg-white print:break-inside-avoid">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-4 font-black text-lg ${item.isCompleted ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-100 text-gray-100'}`}>{item.isCompleted ? '✓' : ''}</div>
                    <div className="flex-1">
                      <p className={`font-black text-sm tracking-tight ${item.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{item.item}</p>
                      <span className="text-[9px] font-black text-primary-400 uppercase tracking-[0.3em] mt-1 block">{item.category || 'LOGISTIK UTAMA'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* VI. CATATAN TAMBAHAN */}
            <div className={`${activeTab === 'note' ? 'block' : 'hidden print:block'} space-y-8 print:break-before-page pt-2`}>
              <div className="hidden print:flex items-center gap-6 mb-16">
                <span className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl">06</span>
                <div>
                  <h3 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Catatan Tambahan</h3>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Informasi Penting & Instruksi Khusus</p>
                </div>
              </div>

              <div className="bg-white border-4 border-gray-100 rounded-[3rem] p-8 md:p-16 min-h-[400px] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5"><FileText className="w-40 h-40" /></div>
                {note ? (
                  <div className="prose prose-lg max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-headings:text-gray-900 prose-p:font-bold prose-p:text-gray-600 prose-li:font-bold prose-strong:text-primary-600" dangerouslySetInnerHTML={{ __html: note }} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-20">
                    <p className="text-gray-300 font-black uppercase tracking-widest">Tidak ada catatan tambahan yang dilampirkan dalam dokumen ini.</p>
                  </div>
                )}
              </div>
            </div>


          </div>
        </div>
      </main>

      <style jsx global>{`
        @media print { 
          body { background: white !important; } 
          .max-w-6xl { max-width: 100% !important; padding: 0 !important; margin: 0 !important; } 
          nav, button, footer, .suggestion-button-container, .fixed { display: none !important; } 
          .rounded-[4rem], .rounded-[3rem], .rounded-[2.5rem], .rounded-[2rem], .rounded-[1.5rem] { border-radius: 0.5rem !important; } 
          .shadow-xl, .shadow-2xl, .shadow-sm { box-shadow: none !important; border: 1px solid #eee !important; } 
          .bg-gray-50/50, .bg-gray-50, .bg-white { background: white !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          
          /* Fix table truncation */
          table { width: 100% !important; table-layout: auto !important; }
          th, td { padding-left: 1rem !important; padding-right: 1rem !important; }
          .px-10 { padding-left: 1rem !important; padding-right: 1rem !important; }
          .p-16 { padding: 2rem !important; }
          .p-8 { padding: 1rem !important; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; } 
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <SuggestionButton page={`Shared Link Content - ${plan.title}`} />
      {selectedBill && <DigitalReceipt bill={selectedBill} onClose={() => setSelectedBill(null)} language={language} participants={participants} />}
    </div>
  )
}
