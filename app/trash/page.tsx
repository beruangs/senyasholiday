'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trash2, RotateCcw, AlertTriangle, Clock, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import ConfirmModal from '@/components/ConfirmModal'
import { useLanguage } from '@/context/LanguageContext'

interface TrashedPlan { _id: string; title: string; destination: string; startDate: string; endDate: string; deletedAt: string; trashExpiresAt: string; remainingMs: number; remainingFormatted: string; ownerId?: { username: string; name: string } }

export default function TrashPage() {
    const { language, t } = useLanguage()
    const { status } = useSession(); const router = useRouter()
    const [trashedPlans, setTrashedPlans] = useState<TrashedPlan[]>([]); const [loading, setLoading] = useState(true); const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [confirmState, setConfirmState] = useState<{ type: 'restore' | 'delete' | null; planId: string; planTitle: string }>({ type: null, planId: '', planTitle: '' })

    useEffect(() => { if (status === 'unauthenticated') router.push('/login'); else if (status === 'authenticated') fetchTrash(); }, [status])

    useEffect(() => {
        const interval = setInterval(() => {
            setTrashedPlans(prev => prev.map(p => {
                const rem = Math.max(0, new Date(p.trashExpiresAt).getTime() - Date.now()); const s = Math.floor(rem / 1000); const m = Math.floor(s / 60); const h = Math.floor(m / 60); const d = Math.floor(h / 24)
                let f = ''; if (d > 0) f = `${d} ${language === 'id' ? 'hari lagi' : 'days left'}`; else if (h > 0) f = `${h} ${language === 'id' ? 'jam lagi' : 'hours left'}`; else if (m > 0) f = `${m} ${language === 'id' ? 'menit lagi' : 'mins left'}`; else f = `${s} ${language === 'id' ? 'detik lagi' : 'secs left'}`
                return { ...p, remainingMs: rem, remainingFormatted: f }
            }))
        }, 1000); return () => clearInterval(interval)
    }, [language])

    const fetchTrash = async () => { try { const res = await fetch('/api/trash'); if (res.ok) setTrashedPlans(await res.json()); } catch { toast.error(t.dashboard.loading_data) } finally { setLoading(false) } }

    const handleConfirm = async () => {
        const { type, planId, planTitle } = confirmState; setActionLoading(planId)
        try {
            const res = await fetch(type === 'restore' ? '/api/trash' : `/api/trash?planId=${planId}`, { method: type === 'restore' ? 'PUT' : 'DELETE', headers: { 'Content-Type': 'application/json' }, body: type === 'restore' ? JSON.stringify({ planId }) : undefined })
            if (res.ok) { toast.success(type === 'restore' ? t.common.success : t.plan.delete_success); fetchTrash(); setConfirmState({ type: null, planId: '', planTitle: '' }); }
        } catch { toast.error(t.common.failed) } finally { setActionLoading(null) }
    }

    if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-bold font-black"><Loader2 className="w-10 h-10 animate-spin text-primary-600" /></div>

    return (
        <div className="min-h-screen bg-white font-bold">
            <ConfirmModal isOpen={confirmState.type !== null} onClose={() => setConfirmState({ type: null, planId: '', planTitle: '' })} onConfirm={handleConfirm} title={confirmState.type === 'restore' ? 'RESTORE PLAN?' : 'DELETE PERMANENTLY?'} message={confirmState.type === 'restore' ? `"${confirmState.planTitle}" will return to dashboard.` : `"${confirmState.planTitle}" will be GONE FOREVER.`} confirmText={confirmState.type === 'restore' ? 'RESTORE' : 'DELETE FOREVER'} cancelText={t.common.cancel} variant={confirmState.type === 'restore' ? 'info' : 'danger'} loading={actionLoading === confirmState.planId} />

            <div className="max-w-4xl mx-auto px-6 py-12">
                <Link href="/dashboard" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-10 font-black uppercase text-[10px] tracking-widest group transition-all"><ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> {t.common.back}</Link>

                <div className="flex items-center gap-5 mb-12">
                    <div className="w-14 h-14 bg-rose-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-rose-100"><Trash2 className="w-7 h-7" /></div>
                    <div><h1 className="text-4xl font-black uppercase tracking-tight">{language === 'id' ? 'Tong Sampah' : 'Bin'}</h1><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{language === 'id' ? 'TEMPAT RENCANA YANG DIHAPUS' : 'WASTE BASKET'}</p></div>
                </div>

                {trashedPlans.length === 0 ? (
                    <div className="bg-gray-50 rounded-[4rem] p-24 text-center border border-gray-100 font-bold"><Trash2 className="w-16 h-16 text-gray-200 mx-auto mb-6" /><h3 className="text-xl font-black uppercase tracking-tight text-gray-900 mb-2">{language === 'id' ? 'TRASH KOSONG' : 'BIN IS EMPTY'}</h3><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{language === 'id' ? 'TIDAK ADA RENCANA DI SINI' : 'NOTHING TO SEE HERE'}</p></div>
                ) : (
                    <div className="space-y-6">
                        {trashedPlans.map(plan => (
                            <div key={plan._id} className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col sm:flex-row items-center justify-between gap-8">
                                <div className="flex-1"><h3 className="text-xl font-black uppercase tracking-tight text-gray-900 mb-2">{plan.title}</h3><p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">{plan.destination}</p><div className="flex items-center gap-4"><div className="px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2"><Clock className="w-4 h-4" /> {plan.remainingFormatted}</div><span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{language === 'id' ? 'Dihapus pada' : 'Deleted at'} {new Date(plan.deletedAt).toLocaleDateString()}</span></div></div>
                                <div className="flex items-center gap-3"><button onClick={() => setConfirmState({ type: 'restore', planId: plan._id, planTitle: plan.title })} className="px-8 py-4 bg-primary-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary-100 hover:bg-primary-700 transition-all flex items-center gap-3"><RotateCcw className="w-5 h-5" /> RESTORE</button><button onClick={() => setConfirmState({ type: 'delete', planId: plan._id, planTitle: plan.title })} className="p-4 bg-gray-50 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 className="w-5 h-5" /></button></div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-12 p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100 flex items-start gap-5"><AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" /><div className="space-y-2"><p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">{language === 'id' ? 'PENTING' : 'IMPORTANT'}</p><p className="text-[11px] font-bold text-amber-900/60 uppercase leading-relaxed">{language === 'id' ? 'DATA DI SINI AKAN DIHAPUS PERMANEN SECARA OTOMATIS JIKA WAKTUNYA HABIS.' : 'DATA HERE WILL BE PERMANENTLY DELETED AUTOMATICALLY ONCE THE TIMER RUNS OUT.'}</p></div></div>
            </div>
        </div>
    )
}
