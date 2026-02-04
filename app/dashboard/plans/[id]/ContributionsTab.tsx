'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Check, X, DollarSign, ChevronDown, Users, AlertTriangle, History, Clock, ArrowUpRight, ArrowDownRight, Settings, CreditCard, ChevronUp, Wallet, CheckCircle, Loader2, MessageCircle, Share2, Download } from 'lucide-react'
import { toast } from 'sonner'
import { toBlob } from 'html-to-image'
import { useLanguage } from '@/context/LanguageContext'

interface PaymentHistoryItem { _id: string; contributionId: string; participantId: { _id: string; name: string } | string; expenseItemId?: { _id: string; itemName: string } | string; action: string; previousAmount: number; newAmount: number; changeAmount: number; paymentMethod: string; note?: string; createdAt: string; }
interface Participant { _id: string; name: string; }
interface ExpenseItem { _id: string; itemName: string; collectorId?: Participant | string; }
interface Contribution { _id?: string; participantId: string; expenseItemId?: ExpenseItem | string; amount: number; isPaid: boolean; paid?: number; maxPay?: number; paymentMethod?: string; paidAt?: string | Date; }

export default function ContributionsTab({ planId, readOnly }: { planId: string; readOnly?: boolean }) {
  const { language, t } = useLanguage()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)
  const [openAccordion, setOpenAccordion] = useState<string | null>(null)
  const [showMaxPayModal, setShowMaxPayModal] = useState<string | null>(null)
  const [editMaxPayValue, setEditMaxPayValue] = useState<number | null>(null)
  const [editMaxPayName, setEditMaxPayName] = useState<string>('')
  const [editPaymentValue, setEditPaymentValue] = useState<number>(0)
  const [editPaymentMethod, setEditPaymentMethod] = useState<string>('manual')
  const [showPaymentForm, setShowPaymentForm] = useState<string | null>(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchData() }, [planId])

  const fetchData = async () => {
    try {
      const [participantsRes, contributionsRes] = await Promise.all([fetch(`/api/participants?planId=${planId}`), fetch(`/api/contributions?planId=${planId}`)])
      if (participantsRes.ok) setParticipants(await participantsRes.json())
      if (contributionsRes.ok) setContributions(await contributionsRes.json())
    } catch { toast.error(t.dashboard.loading_data) } finally { setLoading(false) }
  }

  const updateMaxPay = async () => {
    if (!showMaxPayModal) return
    try {
      const res = await fetch('/api/contributions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _id: showMaxPayModal, maxPay: editMaxPayValue }) })
      if (res.ok) { toast.success(t.common.success); setShowMaxPayModal(null); setEditMaxPayValue(null); fetchData(); }
    } catch { toast.error(t.common.failed) }
  }

  const updatePayment = async (contributionId: string, paidAmount: number) => {
    try {
      const res = await fetch('/api/contributions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _id: contributionId, paid: paidAmount, isPaid: paidAmount > 0, paymentMethod: editPaymentMethod, paidAt: paidAmount > 0 ? new Date() : null }) })
      if (res.ok) { toast.success(t.common.success); setShowPaymentForm(null); setEditPaymentValue(0); setEditPaymentMethod('manual'); fetchData(); }
    } catch { toast.error(t.common.failed) }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }

  const fetchPaymentHistory = async () => {
    setLoadingHistory(true)
    try {
      const res = await fetch(`/api/payment-history?planId=${planId}&limit=100`)
      if (res.ok) setPaymentHistory(await res.json())
    } catch { toast.error(t.common.failed) } finally { setLoadingHistory(false) }
  }

  const groupByCollector = (contribs: Contribution[]) => {
    const collectorMap = new Map<string, { collectorId: string; collectorName: string; itemNames: string[]; contributions: Contribution[]; }>()
    contribs.forEach(c => {
      let collectorId = 'no-collector'; let collectorName = language === 'id' ? 'TANPA PENGUMPUL' : 'NO COLLECTOR'; let itemName = 'Unknown'
      if (c.expenseItemId && typeof c.expenseItemId === 'object') {
        const exp = c.expenseItemId as ExpenseItem; itemName = exp.itemName || 'Unknown'
        if (exp.collectorId && typeof exp.collectorId === 'object') { const col = exp.collectorId as Participant; collectorId = col._id; collectorName = col.name; }
        else if (exp.collectorId) collectorId = exp.collectorId as string
      }
      if (!collectorMap.has(collectorId)) collectorMap.set(collectorId, { collectorId, collectorName, itemNames: [], contributions: [] })
      const group = collectorMap.get(collectorId)!; group.contributions.push(c); if (!group.itemNames.includes(itemName)) group.itemNames.push(itemName)
    })
    const result: any[] = []
    collectorMap.forEach((group) => {
      const participantMap = new Map<string, { participantId: string; participantName: string; contributions: Contribution[]; totalIuran: number; totalPaid: number; }>()
      group.contributions.forEach(c => {
        let pId = ''; let pName = 'Unknown'
        if (typeof c.participantId === 'object' && c.participantId !== null) { pId = (c.participantId as any)._id; pName = (c.participantId as any).name; }
        else { pId = c.participantId; pName = participants.find(p => p._id === pId)?.name || 'Unknown'; }
        if (!participantMap.has(pId)) participantMap.set(pId, { participantId: pId, participantName: pName, contributions: [], totalIuran: 0, totalPaid: 0 })
        const pData = participantMap.get(pId)!; pData.contributions.push(c); pData.totalIuran += c.amount; pData.totalPaid += c.paid || 0
      })
      const totalAmount = group.contributions.reduce((sum, c) => sum + c.amount, 0); let cappedAmount = 0; let uncappedParticipants: string[] = []
      participantMap.forEach((pData, pId) => {
        const hasMax = pData.contributions.some(c => typeof c.maxPay === 'number' && c.maxPay < c.amount)
        if (hasMax) cappedAmount += pData.contributions.reduce((sum, c) => sum + (typeof c.maxPay === 'number' && c.maxPay < c.amount ? c.maxPay : c.amount), 0)
        else uncappedParticipants.push(pId)
      })
      const remainingAmount = totalAmount - cappedAmount; const perUncapped = uncappedParticipants.length > 0 ? remainingAmount / uncappedParticipants.length : 0
      const summaries: any[] = []; let gShare = 0; let gPaid = 0; let gKurang = 0
      participantMap.forEach((pData) => {
        const hasMax = pData.contributions.some(c => typeof c.maxPay === 'number' && c.maxPay < c.amount)
        let harus = pData.totalIuran; if (hasMax) harus = pData.contributions.reduce((sum, c) => sum + (typeof c.maxPay === 'number' && c.maxPay < c.amount ? c.maxPay : c.amount), 0); else if (uncappedParticipants.includes(pData.participantId) && cappedAmount > 0) harus = perUncapped
        const kurang = Math.max(0, harus - pData.totalPaid)
        summaries.push({ participantId: pData.participantId, participantName: pData.participantName, totalIuran: pData.totalIuran, totalHarusBayar: harus, totalTerbayar: pData.totalPaid, totalKurang: kurang, contributions: pData.contributions })
        gShare += harus; gPaid += pData.totalPaid; gKurang += kurang
      })
      summaries.sort((a, b) => a.participantName.localeCompare(b.participantName))
      result.push({ collectorId: group.collectorId, collectorName: group.collectorName, itemNames: group.itemNames, participantSummaries: summaries, totalShare: gShare, totalPaid: gPaid, totalKurang: gKurang })
    })
    return result
  }

  const collections = useMemo(() => groupByCollector(contributions), [contributions, participants, language])
  const totalStats = useMemo(() => {
    let s = 0; let p = 0; let k = 0; collections.forEach(g => { s += g.totalShare; p += g.totalPaid; k += g.totalKurang; }); return { s, p, k }
  }, [collections])

  const handleDownloadImage = async (specificRef?: React.RefObject<HTMLDivElement>, fileName?: string) => {
    const target = specificRef?.current || containerRef.current
    if (!target) return
    setIsCapturing(true)
    const toastId = toast.loading(language === 'id' ? 'Menyiapkan gambar...' : 'Preparing images...')

    if (!specificRef) {
      await new Promise(r => setTimeout(r, 100))
    }

    try {
      const blob = await toBlob(target, {
        backgroundColor: '#ffffff',
        style: {
          padding: '20px',
          borderRadius: '20px',
          height: 'auto',
          overflow: 'visible'
        },
        filter: (node) => {
          const exclusionClasses = ['share-exclude', 'lucide-history', 'lucide-chevron-down', 'lucide-settings', 'lucide-plus', 'lucide-x', 'lucide-message-circle', 'lucide-image']
          const className = (node as HTMLElement).className || ''
          const nodeName = (node as HTMLElement).tagName || ''
          if (nodeName === 'BUTTON' && className.includes('share-exclude')) return false
          return !exclusionClasses.some(cls => typeof className === 'string' && className.includes(cls))
        }
      })

      if (!blob) throw new Error('Failed to generate image')

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${fileName || `senyas-holiday-iuran-${planId}`}.png`
      a.click()
      URL.revokeObjectURL(url)

      toast.success(language === 'id' ? 'Gambar PNG berhasil diunduh!' : 'PNG image downloaded successfully!', { id: toastId })
    } catch (error) {
      console.error('Download error:', error)
      toast.error(t.common.failed, { id: toastId })
    } finally {
      setIsCapturing(false)
    }
  }

  const handleSendWhatsAppText = (group?: any) => {
    let text = `*SEN Yas Holiday - ${language === 'id' ? 'RINCIAN IURAN' : 'CONTRIBUTION DETAILS'}*\n\n`

    if (group) {
      text += `*${language === 'id' ? 'PENGUMPUL' : 'COLLECTOR'}: ${group.collectorName.toUpperCase()}*\n`
      text += `_Items: ${group.itemNames.join(' · ')}_\n\n`
      group.participantSummaries.forEach((s: any) => {
        text += `• *${s.participantName}*\n`
        text += `  Iuran: ${formatCurrency(s.totalHarusBayar)}\n`
        text += `  Bayar: ${formatCurrency(s.totalTerbayar)}\n`
        text += `  ${s.totalKurang > 0 ? `*Sisa: ${formatCurrency(s.totalKurang)}*` : `✅ *${language === 'id' ? 'LUNAS' : 'SETTLED'}*`}\n\n`
      })
      text += `*TOTAL SISA: ${formatCurrency(group.totalKurang)}*`
    } else {
      collections.forEach(g => {
        text += `*Kolektor: ${g.collectorName}*\n`
        g.participantSummaries.forEach((s: any) => {
          text += `- ${s.participantName}: ${s.totalKurang > 0 ? `Kurang ${formatCurrency(s.totalKurang)}` : 'LUNAS'}\n`
        })
        text += `Total Sisa: ${formatCurrency(g.totalKurang)}\n\n`
      })
      text += `*GRAND TOTAL SISA: ${formatCurrency(totalStats.k)}*`
    }

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  if (loading) return null

  return (
    <div className="space-y-8 pt-12 border-t border-gray-100 font-bold">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary-50"><CreditCard className="w-5 h-5" /></div>
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{language === 'id' ? 'Status Iuran' : 'Contribution Status'}</h2>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{language === 'id' ? 'PEMBAYARAN & LIMIT' : 'PAYMENTS & LIMITS'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 share-exclude">
          <button
            onClick={() => handleDownloadImage()}
            disabled={isCapturing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white hover:bg-black rounded-xl transition-all font-black text-[9px] uppercase tracking-widest shadow-sm disabled:opacity-50"
          >
            {isCapturing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {language === 'id' ? 'Download PNG' : 'Download PNG'}
          </button>
          <button
            onClick={() => handleSendWhatsAppText()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all font-black text-[9px] uppercase tracking-widest shadow-sm"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {language === 'id' ? 'Kirim Teks WA' : 'Send WA Text'}
          </button>
          <button onClick={() => { setShowHistoryModal(true); fetchPaymentHistory(); }} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 text-gray-400 hover:text-primary-600 rounded-xl transition-all font-black text-[9px] uppercase tracking-widest shadow-sm"><History className="w-3.5 h-3.5" /> {language === 'id' ? 'Riwayat' : 'History'}</button>
        </div>
      </div>

      <div className="space-y-4" ref={containerRef}>
        {collections.map((group) => (
          <div key={group.collectorId} className={`group bg-white border border-gray-100 rounded-[1.5rem] overflow-hidden transition-all duration-500 ${openAccordion === group.collectorId ? 'shadow-xl border-primary-100' : 'hover:shadow-lg'}`}>
            <button onClick={() => setOpenAccordion(openAccordion === group.collectorId ? null : group.collectorId)} className={`w-full px-6 py-4 flex items-center justify-between transition-all ${openAccordion === group.collectorId ? 'bg-primary-50/30' : 'bg-white'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${openAccordion === group.collectorId ? 'bg-primary-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}><Users className="w-5 h-5" /></div>
                <div className="text-left"><h3 className="text-base font-black text-gray-900 uppercase tracking-tight leading-none">{group.collectorName}</h3><p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mt-1">{group.participantSummaries.length} GUESTS · {group.itemNames.length} ITEMS</p></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-0.5">REMAINING</span>
                  <span className={`text-[11px] font-black ${group.totalKurang > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{group.totalKurang > 0 ? formatCurrency(group.totalKurang) : 'LUNAS'}</span>
                </div>
                <div className="flex items-center gap-2 share-exclude">
                  <button
                    title="Download Image"
                    onClick={(e) => {
                      e.stopPropagation();
                      const target = e.currentTarget.closest('.group');
                      if (target) {
                        setOpenAccordion(group.collectorId);
                        setTimeout(() => {
                          handleDownloadImage({ current: target as HTMLDivElement }, `iuran-${group.collectorName.toLowerCase().replace(/\s+/g, '-')}`);
                        }, 100);
                      }
                    }}
                    className="p-2 bg-slate-900 text-white hover:bg-black rounded-lg transition-all"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    title="Send WhatsApp Text"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendWhatsAppText(group);
                    }}
                    className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${openAccordion === group.collectorId ? 'rotate-180 bg-primary-100 text-primary-600' : 'bg-gray-50 text-gray-300'}`}><ChevronDown className="w-4 h-4" /></div>
                </div>
              </div>
            </button>

            {(openAccordion === group.collectorId || isCapturing) && (
              <div className="px-6 pb-6 pt-3 space-y-6 animate-in slide-in-from-top-2 duration-300">
                <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-100 flex items-center gap-2 overflow-hidden"><span className="text-[8px] font-black text-gray-300 uppercase tracking-widest shrink-0">Items:</span><p className="text-[8px] font-black text-gray-400 uppercase tracking-tight truncate">{group.itemNames.join(' · ')}</p></div>
                <div className="overflow-x-auto rounded-[1.2rem] border border-gray-100"><table className="w-full text-left uppercase text-[9px]">
                  <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="px-5 py-3 font-black tracking-widest text-gray-400">Nama</th><th className="px-5 py-3 font-black tracking-widest text-gray-400 text-right">Iuran</th><th className="px-5 py-3 font-black tracking-widest text-gray-400 text-right">Limit</th><th className="px-5 py-3 font-black tracking-widest text-gray-400 text-right">Harus</th><th className="px-5 py-3 font-black tracking-widest text-gray-400 text-right">Bayar</th><th className="px-5 py-3 font-black tracking-widest text-gray-400 text-right">Status</th>{!readOnly && <th className="px-5 py-3 font-black tracking-widest text-gray-400 text-center share-exclude">Aksi</th>}</tr></thead>
                  <tbody className="divide-y divide-gray-50">{group.participantSummaries.map((s: any) => {
                    const hasMax = s.contributions.some((c: any) => typeof c.maxPay === 'number' && c.maxPay < c.amount); const curLimit = hasMax ? s.contributions.reduce((sum: any, c: any) => sum + (c.maxPay ?? c.amount), 0) : null
                    return (<tr key={s.participantId} className="hover:bg-primary-50/10 transition-all"><td className="px-5 py-4 font-black text-gray-900">{s.participantName}</td><td className="px-5 py-4 text-right font-black text-gray-300">{formatCurrency(s.totalIuran)}</td>
                      <td className="px-5 py-4 text-right">
                        {!readOnly ? (
                          <button
                            onClick={() => { setShowMaxPayModal(s.contributions[0]._id); setEditMaxPayValue(curLimit); setEditMaxPayName(s.participantName); }}
                            className={`px-2.5 py-1 rounded-full font-black uppercase tracking-widest text-[8px] ${hasMax ? 'bg-amber-100 text-amber-700' : 'bg-gray-50 text-gray-300'} ${!hasMax && isCapturing ? 'opacity-0' : ''} ${!hasMax ? 'share-exclude' : ''}`}
                          >
                            {hasMax ? formatCurrency(curLimit) : 'SET LIMIT'}
                          </button>
                        ) : (
                          <span className="text-gray-200">{hasMax ? formatCurrency(curLimit) : '-'}</span>
                        )}
                      </td>
                      <td className={`px-5 py-4 text-right font-black ${hasMax ? 'text-amber-600' : 'text-gray-900'}`}>{formatCurrency(s.totalHarusBayar)}</td>
                      <td className="px-5 py-4 text-right font-black text-emerald-600">{formatCurrency(s.totalTerbayar)}</td>
                      <td className="px-5 py-4 text-right font-black">{s.totalKurang > 0 ? <span className="text-rose-600">{formatCurrency(s.totalKurang)}</span> : <span className="text-emerald-600">LUNAS</span>}</td>
                      {!readOnly && <td className="px-5 py-4 text-center share-exclude"><button onClick={() => { setEditPaymentValue(s.totalTerbayar); setShowPaymentForm(s.contributions[0]._id); }} className="px-4 py-1.5 bg-primary-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest shadow-md">INPUT</button></td>}
                    </tr>)
                  })}</tbody>
                </table></div>
                <div className="p-4 sm:p-6 bg-primary-600 rounded-[1.2rem] sm:rounded-[1.5rem] text-white shadow-lg shadow-primary-50 relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-10"><Wallet className="w-24 sm:w-32 h-24 sm:h-32" /></div>
                  <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <div>
                      <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest opacity-60 mb-2">Total Project Fund</p>
                      <div className="flex gap-6 sm:gap-8">
                        <div><span className="text-[7px] font-black uppercase tracking-widest opacity-60 block mb-0.5">Paid</span><p className="text-lg sm:text-xl font-black">{formatCurrency(group.totalPaid)}</p></div>
                        <div className="w-px h-8 bg-white/20" />
                        <div><span className="text-[7px] font-black uppercase tracking-widest opacity-60 block mb-0.5">Due</span><p className="text-lg sm:text-xl font-black">{formatCurrency(group.totalKurang)}</p></div>
                      </div>
                    </div>
                    {group.totalKurang === 0 && <div className="px-3 py-1.5 bg-white/20 rounded-xl flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-300" /><span className="text-[8px] font-black uppercase tracking-widest">SETTLED</span></div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-10 border border-primary-50 shadow-xl shadow-primary-50 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 sm:gap-8">
        <div className="flex items-center justify-between sm:justify-start gap-8 w-full lg:w-auto">
          <div><span className="text-[8px] font-black uppercase text-gray-300 tracking-widest mb-1 block">Grand Total</span><span className="text-lg sm:text-2xl font-black text-gray-900 leading-none">{formatCurrency(totalStats.s)}</span></div>
          <div className="w-px h-10 bg-gray-100 hidden sm:block" />
          <div><span className="text-[8px] font-black uppercase text-gray-300 tracking-widest mb-1 block">Collected</span><span className="text-lg sm:text-2xl font-black text-emerald-600 leading-none">{formatCurrency(totalStats.p)}</span></div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 w-full lg:w-auto border-t sm:border-t-0 pt-6 sm:pt-0">
          <div className="text-left sm:text-right flex-1"><span className="text-[8px] font-black uppercase text-rose-300 tracking-widest mb-1 block">Remaining Balance</span><span className="text-2xl sm:text-4xl font-black text-rose-600 tracking-tight leading-none">{formatCurrency(totalStats.k)}</span></div>
          <div className="px-5 py-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center gap-3"><AlertTriangle className="w-4 h-4 text-rose-600" /><span className="text-[9px] font-black text-rose-700 uppercase tracking-widest leading-none">{collections.length} COLLECTORS</span></div>
        </div>
      </div>

      {showPaymentForm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md font-bold animate-in fade-in transition-all">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-8 text-primary-600"><DollarSign className="w-10 h-10" /><div><h3 className="text-lg font-black uppercase tracking-tight">Input Payment</h3><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate">{participants.find(p => p._id === (typeof (contributions.find(c => c._id === showPaymentForm)?.participantId) === 'object' ? (contributions.find(c => c._id === showPaymentForm)?.participantId as any)?._id : contributions.find(c => c._id === showPaymentForm)?.participantId))?.name}</p></div></div>
            <div className="space-y-4">
              <div className="space-y-1.5"><label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Amount Paid</label><input type="number" value={editPaymentValue} onChange={(e) => setEditPaymentValue(Number(e.target.value))} className="w-full px-6 py-3.5 bg-gray-50 border border-gray-100 rounded-xl outline-none font-black text-xl text-gray-900" /></div>
              <div className="space-y-1.5"><label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Method</label><select value={editPaymentMethod} onChange={(e) => setEditPaymentMethod(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-sm appearance-none cursor-pointer"><option value="manual">Transfer</option><option value="cash">Cash</option></select></div>
            </div>
            <div className="flex gap-3 mt-8"><button onClick={() => setShowPaymentForm(null)} className="flex-1 py-3 text-[9px] font-black uppercase text-gray-400 hover:text-gray-900 transition-all">Cancel</button><button onClick={() => updatePayment(showPaymentForm!, editPaymentValue)} className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary-50">Save Entry</button></div>
          </div>
        </div>
      )}

      {showMaxPayModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md font-bold animate-in fade-in transition-all">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-8 text-amber-500"><Settings className="w-10 h-10" /><div><h3 className="text-lg font-black uppercase tracking-tight">Set Payment Limit</h3><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{editMaxPayName}</p></div></div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Max Payable</label>
              <input type="number" value={editMaxPayValue || ''} onChange={(e) => setEditMaxPayValue(e.target.value ? Number(e.target.value) : null)} placeholder="No Limit" className="w-full px-6 py-3.5 bg-gray-50 border border-gray-100 rounded-xl outline-none font-black text-xl text-gray-900" />
            </div>
            <p className="text-[8px] font-bold text-gray-400 leading-relaxed mt-4 uppercase">Limits prevent participants from paying over a set amount. Excess is redistributed to uncapped members.</p>
            <div className="flex gap-3 mt-8"><button onClick={() => setShowMaxPayModal(null)} className="flex-1 py-3 text-[9px] font-black uppercase text-gray-400 hover:text-gray-900 transition-all">Cancel</button><button onClick={updateMaxPay} className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-black uppercase text-[10px] shadow-lg shadow-amber-50">Set Limit</button></div>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md font-bold animate-in fade-in transition-all">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-3xl shadow-2xl animate-in zoom-in-95 h-[75vh] flex flex-col">
            <div className="flex items-center justify-between mb-8"><div className="flex items-center gap-3 text-primary-600"><History className="w-10 h-10" /><h3 className="text-xl font-black uppercase tracking-tight">Payment Logs</h3></div><button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all"><X className="w-5 h-5" /></button></div>
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">{loadingHistory ? <div className="text-center py-20 animate-pulse text-gray-200"><Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto" /></div> : paymentHistory.length === 0 ? <p className="text-center py-20 text-gray-300 font-black uppercase text-[10px] tracking-widest">No activity yet</p> : paymentHistory.map((h: any) => (
              <div key={h._id} className="p-5 bg-gray-50/50 border border-gray-100 rounded-2xl flex items-center justify-between gap-4"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-lg flex items-center justify-center ${h.action === 'payment' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{h.action === 'payment' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}</div><div><p className="text-[11px] font-black text-gray-900 uppercase leading-none mb-1">{typeof h.participantId === 'object' ? h.participantId.name : 'User'}</p><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{new Date(h.createdAt).toLocaleDateString()} · {h.action}</p></div></div><div className="text-right"><p className={`text-sm font-black ${h.changeAmount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{h.changeAmount > 0 ? '+' : ''}{formatCurrency(h.changeAmount)}</p><p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">{h.paymentMethod}</p></div></div>
            ))}</div>
          </div>
        </div>
      )}
    </div>
  )
}
