'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Users, Check, Save, Receipt, User, Calendar, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/context/LanguageContext'

interface SplitBillModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    planId: string
    participants: any[]
    editData?: any
    t: any
    language: string
}

interface SplitItem {
    name: string
    price: number
    quantity: number
    involvedParticipants: string[]
}

export default function SplitBillModal({ isOpen, onClose, onSuccess, planId, participants, editData, t, language }: SplitBillModalProps) {
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState('')
    const [payerId, setPayerId] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [items, setItems] = useState<SplitItem[]>([{ name: '', price: 0, quantity: 1, involvedParticipants: participants.map(p => p._id) }])
    const [taxPercent, setTaxPercent] = useState(0)
    const [servicePercent, setServicePercent] = useState(0)
    const [roundingIncrement, setRoundingIncrement] = useState(100)

    useEffect(() => {
        if (editData) {
            setTitle(editData.title); setPayerId(editData.payerId?._id || editData.payerId); setDate(new Date(editData.date).toISOString().split('T')[0]);
            setItems(editData.items.map((item: any) => ({ ...item, involvedParticipants: item.involvedParticipants.map((p: any) => p._id || p) })));
            setTaxPercent(editData.taxPercent || 0); setServicePercent(editData.servicePercent || 0); setRoundingIncrement(editData.roundingIncrement || 100);
        } else if (participants.length > 0) { setItems(items.map(i => ({ ...i, involvedParticipants: participants.map(p => p._id) }))) }
    }, [editData, participants])

    const calculateTotals = () => {
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        const tax = (subtotal * taxPercent) / 100; const service = (subtotal * servicePercent) / 100
        const rawTotal = subtotal + tax + service
        const roundedTotal = Math.ceil(rawTotal / roundingIncrement) * roundingIncrement
        return { subtotal, tax, service, rawTotal, roundedTotal, roundingDiff: roundedTotal - rawTotal }
    }

    const handleSubmit = async () => {
        if (!title.trim() || !payerId || items.some(i => !i.name.trim() || i.price <= 0 || i.involvedParticipants.length === 0)) {
            toast.error(language === 'id' ? 'Lengkapi semua data' : 'Complete all data'); return;
        }
        setLoading(true)
        const { subtotal, roundedTotal } = calculateTotals()
        const participantSubtotalShares: Record<string, number> = {}
        participants.forEach(p => participantSubtotalShares[p._id] = 0)
        items.forEach(item => { const sharePerPerson = (item.price * item.quantity) / item.involvedParticipants.length; item.involvedParticipants.forEach(pId => participantSubtotalShares[pId] += sharePerPerson) })
        const multiplier = subtotal > 0 ? roundedTotal / subtotal : 1
        const participantPayments = Object.keys(participantSubtotalShares).map(pId => ({
            participantId: pId, shareAmount: participantSubtotalShares[pId] * multiplier,
            paidAmount: pId === payerId ? (participantSubtotalShares[pId] * multiplier) : (editData?.participantPayments?.find((pp: any) => (pp.participantId?._id || pp.participantId) === pId)?.paidAmount || 0),
            isPaid: pId === payerId ? true : (editData?.participantPayments?.find((pp: any) => (pp.participantId?._id || pp.participantId) === pId)?.isPaid || false)
        }))
        try {
            const res = await fetch(editData ? `/api/split-bills/${editData._id}` : '/api/split-bills', { method: editData ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ holidayPlanId: planId, title, payerId, date, totalAmount: roundedTotal, taxPercent, servicePercent, roundingIncrement, items, participantPayments }) })
            if (res.ok) { toast.success(t.common.success); onSuccess(); }
        } catch { toast.error(t.common.failed) } finally { setLoading(false) }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300 font-bold">
            <div className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-200"><Receipt className="w-6 h-6" /></div>
                        <div><h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{editData ? t.plan.edit_split_bill : t.plan.add_split_bill}</h2><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{language === 'id' ? 'Bagi Tagihan Itemized' : 'Itemized Bill Split'}</p></div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-red-500"><X className="w-6 h-6" /></button>
                </div>

                <div className="flex-1 overflow-y-auto px-10 py-10 space-y-10 no-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.plan.bill_title}</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold focus:bg-white transition-all" placeholder="Jimbaran Dinner" /></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.plan.payer}</label><select value={payerId} onChange={(e) => setPayerId(e.target.value)} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold cursor-pointer appearance-none">{participants.map(p => <option key={p._id} value={p._id}>{p.name.toUpperCase()}</option>)}</select></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.plan.date}</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" /></div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4">{language === 'id' ? 'DAFTAR PESANAN' : 'ORDER LIST'}</h3>
                        {items.map((item, idx) => (
                            <div key={idx} className="p-8 bg-white border-2 border-gray-50 rounded-[2.5rem] shadow-sm hover:border-primary-100 transition-all space-y-6 relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-2 h-full bg-primary-600 opacity-20 group-hover:opacity-100 transition-opacity" />
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="md:col-span-2 space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase">{language === 'id' ? 'Nama Item' : 'Item Name'}</label><input type="text" value={item.name} onChange={(e) => { const n = [...items]; n[idx].name = e.target.value; setItems(n); }} className="w-full px-6 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-sm" /></div>
                                    <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase">{language === 'id' ? 'Harga' : 'Price'}</label><input type="number" value={item.price} onChange={(e) => { const n = [...items]; n[idx].price = Number(e.target.value); setItems(n); }} className="w-full px-6 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-sm" /></div>
                                    <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase">Qty</label><div className="flex items-center gap-3"><input type="number" value={item.quantity} onChange={(e) => { const n = [...items]; n[idx].quantity = Number(e.target.value); setItems(n); }} className="w-full px-6 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-sm" /><button onClick={() => setItems(items.filter((_, i) => i !== idx))} disabled={items.length === 1} className="p-3 text-gray-300 hover:text-rose-500 transition-all"><Trash2 className="w-5 h-5" /></button></div></div>
                                </div>
                                <div className="space-y-4 pt-4 border-t border-gray-50">
                                    <div className="flex justify-between items-center"><label className="text-[9px] font-black text-gray-400 uppercase">{language === 'id' ? 'SIAPA YANG MEMESAN?' : 'WHO ORDERED THIS?'} ({item.involvedParticipants.length})</label><button onClick={() => { const n = [...items]; n[idx].involvedParticipants = n[idx].involvedParticipants.length === participants.length ? [] : participants.map(p => p._id); setItems(n); }} className="text-[7px] font-black uppercase text-primary-600 tracking-widest">{item.involvedParticipants.length === participants.length ? 'DESELECT ALL' : 'SELECT ALL'}</button></div>
                                    <div className="flex flex-wrap gap-2">{participants.map(p => { const isSelected = item.involvedParticipants.includes(p._id); return <button key={p._id} onClick={() => { const n = [...items]; n[idx].involvedParticipants = isSelected ? n[idx].involvedParticipants.filter(id => id !== p._id) : [...n[idx].involvedParticipants, p._id]; setItems(n); }} className={`px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${isSelected ? 'bg-primary-600 text-white shadow-lg shadow-primary-100' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>{isSelected && '✓ '} {p.name}</button> })}</div>
                                </div>
                            </div>
                        ))}
                        <button onClick={() => setItems([...items, { name: '', price: 0, quantity: 1, involvedParticipants: participants.map(p => p._id) }])} className="w-full py-6 border-2 border-dashed border-gray-100 rounded-[2rem] text-gray-300 hover:text-primary-600 hover:border-primary-100 transition-all flex flex-col items-center gap-2 group"><Plus className="w-8 h-8 group-hover:scale-125 transition-transform" /><span className="text-[10px] font-black uppercase tracking-widest">{language === 'id' ? 'TAMBAH ITEM' : 'ADD ITEM'}</span></button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t-2 border-dashed border-gray-100">
                        <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{language === 'id' ? 'PAJAK (%)' : 'TAX (%)'}</label><input type="number" value={taxPercent} onChange={(e) => setTaxPercent(Number(e.target.value))} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" /></div>
                        <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">SERVICE (%)</label><input type="number" value={servicePercent} onChange={(e) => setServicePercent(Number(e.target.value))} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" /></div>
                        <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{language === 'id' ? 'PEMBULATAN' : 'ROUNDING'}</label><select value={roundingIncrement} onChange={(e) => setRoundingIncrement(Number(e.target.value))} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold appearance-none cursor-pointer"><option value="1">NONE</option><option value="100">100</option><option value="500">500</option><option value="1000">1,000</option></select></div>
                    </div>
                </div>

                <div className="px-10 py-8 border-t border-gray-50 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex gap-8">
                        <div className="flex flex-col"><span className="text-[8px] font-black text-gray-400 uppercase">Subtotal</span><span className="text-sm font-black text-gray-900">{new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(items.reduce((sum, item) => sum + (item.price * item.quantity), 0))}</span></div>
                        <div className="flex flex-col"><span className="text-[8px] font-black text-gray-400 uppercase">Extra</span><span className="text-sm font-black text-emerald-600">+{new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(calculateTotals().tax + calculateTotals().service + calculateTotals().roundingDiff)}</span></div>
                        <div className="flex flex-col"><span className="text-[8px] font-black text-gray-400 uppercase">Grand Total</span><span className="text-2xl font-black text-primary-600">{new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(calculateTotals().roundedTotal)}</span></div>
                    </div>
                    <div className="flex gap-4 w-full sm:w-auto">
                        <button onClick={onClose} className="px-8 py-4 text-[10px] font-black uppercase text-gray-400 hover:text-gray-900 transition-all">{t.common.cancel}</button>
                        <button onClick={handleSubmit} disabled={loading} className="px-10 py-4 bg-primary-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all disabled:opacity-50">{loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : <div className="flex items-center gap-2"><Save className="w-5 h-5" /> <span>{editData ? t.common.save : (language === 'id' ? 'BAGI SEKARANG' : 'SPLIT NOW')}</span></div>}</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
