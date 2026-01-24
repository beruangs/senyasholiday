'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { FileText, DollarSign, Users, CheckCircle, XCircle, Printer, Receipt, Upload, Loader2, X, ClipboardCheck, TrendingUp, Wallet } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

interface RincianTabProps {
  planId: string
  isCompleted?: boolean
}

export default function RincianTab({ planId, isCompleted }: RincianTabProps) {
  const { language, t } = useLanguage()
  const [expenses, setExpenses] = useState<any[]>([])
  const [contributions, setContributions] = useState<any[]>([])
  const [participants, setParticipants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showPrintView, setShowPrintView] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importText, setImportText] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => { fetchData() }, [planId])

  const fetchData = async () => {
    try {
      const [expensesRes, contributionsRes, participantsRes, billsRes] = await Promise.all([
        fetch(`/api/expenses?planId=${planId}`), fetch(`/api/contributions?planId=${planId}`),
        fetch(`/api/participants?planId=${planId}`), fetch(`/api/split-bills?planId=${planId}`)
      ])
      if (expensesRes.ok && contributionsRes.ok && participantsRes.ok && billsRes.ok) {
        setExpenses(await expensesRes.json())
        setContributions(await contributionsRes.json())
        setParticipants(await participantsRes.json())
      }
    } catch (error) { toast.error(t.dashboard.loading_data) } finally { setLoading(false) }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }

  const handlePrint = () => { setShowPrintView(true); setTimeout(() => window.print(), 500); }
  const handleImport = async () => {
    if (!importText.trim()) return
    setIsImporting(true)
    try {
      const jsonStr = atob(importText.trim()); const data = JSON.parse(jsonStr)
      const res = await fetch(`/api/plans/${planId}/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (res.ok) { toast.success(t.plan.import_success); window.location.reload(); }
    } catch (error) { toast.error(t.plan.invalid_format) } finally { setIsImporting(false) }
  }

  if (loading) return <div className="flex justify-center items-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.total, 0)
  const totalCollected = contributions.reduce((sum, c) => sum + c.paid, 0)
  const totalRemaining = totalExpenses - totalCollected

  const participantSummary = participants.map(p => {
    const pContribs = contributions.filter(c => (c.participantId?._id || c.participantId) === p._id)
    const totalAmount = pContribs.reduce((sum, c) => sum + c.amount, 0)
    const totalPaid = pContribs.reduce((sum, c) => sum + c.paid, 0)
    return { participant: p, totalAmount, totalPaid, remaining: totalAmount - totalPaid, status: totalPaid >= totalAmount ? 'lunas' : totalPaid > 0 ? 'sebagian' : 'belum' }
  }).sort((a, b) => a.participant.name.localeCompare(b.participant.name))

  return (
    <div className="space-y-8 font-bold">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary-50">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight leading-tight">{language === 'id' ? 'Rincian Acara' : 'Event Report'}</h2>
            <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest leading-none mt-0.5">{language === 'id' ? 'LAPORAN AKHIR' : 'FINAL REPORT'}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {!isCompleted && <button onClick={() => setShowImportModal(true)} className="px-5 py-2.5 bg-primary-50 text-primary-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-primary-100 transition-all font-bold"><Upload className="w-4 h-4" /> {t.plan.import}</button>}
          <button onClick={handlePrint} className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-primary-50 hover:bg-primary-700 transition-all font-bold"><Printer className="w-4 h-4" /> {language === 'id' ? 'CETAK' : 'PRINT'}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
        <div className="bg-white border border-gray-100 rounded-[1.5rem] p-6 shadow-sm hover:shadow-lg transition-all relative overflow-hidden group">
          <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:scale-110 transition-transform"><TrendingUp className="w-24 h-24 text-primary-600" /></div>
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-3">{language === 'id' ? 'TOTAL PENGELUARAN' : 'TOTAL EXPENSES'}</p>
          <h4 className="text-xl font-black text-gray-900 leading-none">{formatCurrency(totalExpenses)}</h4>
        </div>
        <div className="bg-white border border-gray-100 rounded-[1.5rem] p-6 shadow-sm hover:shadow-lg transition-all relative overflow-hidden group">
          <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:scale-110 transition-transform"><CheckCircle className="w-24 h-24 text-emerald-600" /></div>
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-3">{language === 'id' ? 'IURAN TERKUMPUL' : 'TOTAL COLLECTED'}</p>
          <h4 className="text-xl font-black text-emerald-600 leading-none">{formatCurrency(totalCollected)} <span className="text-[10px] opacity-60">({Math.round((totalCollected / (totalExpenses || 1)) * 100)}%)</span></h4>
        </div>
        <div className="bg-white border border-gray-100 rounded-[1.5rem] p-6 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
          <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:scale-110 transition-transform"><XCircle className="w-24 h-24 text-rose-600" /></div>
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-3">{language === 'id' ? 'SISA TAGIHAN' : 'BALANCE REMAINING'}</p>
          <h4 className="text-xl font-black text-rose-600 leading-none">{formatCurrency(totalRemaining)}</h4>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden font-bold">
        <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-3"><Users className="w-4 h-4 text-primary-600" /><h3 className="text-base font-black text-gray-900 uppercase tracking-tight">{language === 'id' ? 'REKAP PER PESERTA' : 'RECAP PER GUEST'}</h3></div>
        <div className="overflow-x-auto"><table className="w-full text-left uppercase text-[9px]"><thead><tr className="border-b border-gray-100 bg-white"><th className="px-6 py-4 font-black tracking-widest text-gray-400">Peserta</th><th className="px-6 py-4 font-black tracking-widest text-gray-400 text-right">Iuran</th><th className="px-6 py-4 font-black tracking-widest text-gray-400 text-right">Bayar</th><th className="px-6 py-4 font-black tracking-widest text-gray-400 text-right">Sisa</th><th className="px-6 py-4 font-black tracking-widest text-gray-400 text-center">Status</th></tr></thead><tbody className="divide-y divide-gray-50">{participantSummary.map((item) => (
          <tr key={item.participant._id} className="hover:bg-primary-50/10 transition-colors">
            <td className="px-6 py-4 font-black text-gray-900">{item.participant.name}</td>
            <td className="px-6 py-4 text-right font-black text-gray-400">{formatCurrency(item.totalAmount)}</td>
            <td className="px-6 py-4 text-right font-black text-emerald-600">{formatCurrency(item.totalPaid)}</td>
            <td className="px-6 py-4 text-right font-black text-rose-600">{formatCurrency(item.remaining)}</td>
            <td className="px-6 py-4 text-center"><span className={`px-3 py-1 rounded-full font-black text-[7px] tracking-widest ${item.status === 'lunas' ? 'bg-emerald-100 text-emerald-700' : item.status === 'sebagian' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>{item.status.toUpperCase()}</span></td>
          </tr>
        ))}</tbody></table></div>
      </div>

      {showImportModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md font-bold animate-in fade-in transition-all">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl p-8 font-bold animate-in zoom-in-95">
            <h3 className="text-xl font-black text-gray-900 mb-1.5 uppercase tracking-tight">{t.plan.import}</h3>
            <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-6 leading-relaxed">{t.plan.import_desc}</p>
            <textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={8} className="w-full p-5 bg-gray-50 border border-gray-100 rounded-xl outline-none font-mono text-[8px] break-all leading-loose mb-6 focus:bg-white" placeholder="PASTE DATA HERE..." />
            <div className="flex gap-3">
              <button onClick={handleImport} disabled={isImporting} className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary-50">{isImporting ? '...' : 'RUN IMPORT'}</button>
              <button onClick={() => setShowImportModal(false)} className="flex-1 py-3 bg-gray-50 text-gray-400 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all">CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
