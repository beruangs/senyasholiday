'use client'

import { useState, useEffect } from 'react'
import { X, Save, DollarSign, User, Tag, Users, Check, HelpCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/context/LanguageContext'

interface ExpenseModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    planId: string
    participants: any[]
    editData?: any
}

export default function ExpenseModal({ isOpen, onClose, onSuccess, planId, participants, editData }: ExpenseModalProps) {
    const { language, t } = useLanguage()
    const [loading, setLoading] = useState(false)
    const [itemName, setItemName] = useState('')
    const [detail, setDetail] = useState('')
    const [price, setPrice] = useState(0)
    const [quantity, setQuantity] = useState(1)
    const [collectorId, setCollectorId] = useState('')
    const [downPayment, setDownPayment] = useState(0)
    const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])

    useEffect(() => {
        if (editData) {
            setItemName(editData.itemName); setDetail(editData.detail || ''); setPrice(editData.price); setQuantity(editData.quantity);
            setCollectorId(editData.collectorId?._id || editData.collectorId || ''); setDownPayment(editData.downPayment || 0);
            if (editData.contributors) setSelectedParticipants(editData.contributors.map((c: any) => c.participantId?._id || c.participantId))
        } else { setSelectedParticipants(participants.map(p => p._id)) }
    }, [editData, participants, isOpen])

    const calculateTotal = () => price * quantity

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!itemName.trim() || price <= 0 || !collectorId || selectedParticipants.length === 0) {
            toast.error(language === 'id' ? 'Lengkapi data wajib' : 'Complete required fields')
            return
        }
        setLoading(true)
        const total = calculateTotal(); const expenseId = editData?._id
        try {
            const res = await fetch('/api/expenses', { method: editData ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ holidayPlanId: planId, _id: expenseId, itemName, detail, price, quantity, total, collectorId, downPayment }) })
            if (!res.ok) throw new Error()
            const savedExpense = await res.json(); const finalExpenseId = expenseId || savedExpense._id

            const contribRes = await fetch(`/api/contributions?planId=${planId}`)
            if (contribRes.ok) {
                const allContribs = await contribRes.json()
                const existingContribs = allContribs.filter((c: any) => (c.expenseItemId?._id || c.expenseItemId) === finalExpenseId)
                const existingParticipantIds = existingContribs.map((c: any) => c.participantId?._id || c.participantId)
                const toAdd = selectedParticipants.filter(id => !existingParticipantIds.includes(id))
                const toRemove = existingContribs.filter((c: any) => !selectedParticipants.includes(c.participantId?._id || c.participantId))
                const newSplitAmount = Math.round((total / selectedParticipants.length) / 100) * 100
                const promises: any[] = []
                toAdd.forEach(pId => promises.push(fetch('/api/contributions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ holidayPlanId: planId, expenseItemId: finalExpenseId, participantId: pId, amount: newSplitAmount, paid: 0, isPaid: false }) })))
                toRemove.forEach((c: any) => promises.push(fetch(`/api/contributions?expenseItemId=${finalExpenseId}&participantId=${c.participantId?._id || c.participantId}`, { method: 'DELETE' })))
                existingContribs.filter((c: any) => selectedParticipants.includes(c.participantId?._id || c.participantId)).forEach((c: any) => promises.push(fetch('/api/contributions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _id: c._id, amount: newSplitAmount }) })))
                await Promise.all(promises)
            }
            toast.success(t.common.success); onSuccess();
        } catch { toast.error(t.common.failed) } finally { setLoading(false) }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300 font-bold">
            <div className="relative w-full max-w-xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-100"><DollarSign className="w-5 h-5" /></div>
                        <div>
                            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">{editData ? t.plan.edit_expense : t.plan.add_expense}</h2>
                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{language === 'id' ? 'RINCIAN KEUANGAN' : 'FINANCIAL DETAILS'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-all text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 no-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{t.plan.item_name}</label>
                            <div className="relative group">
                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 group-focus-within:text-primary-600 transition-all font-bold" />
                                <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full pl-10 pr-5 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-sm text-gray-900 focus:bg-white focus:border-primary-500 transition-all uppercase" placeholder="E.g. VILLA" />
                            </div>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{t.common.description}</label>
                            <div className="relative group">
                                <HelpCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 group-focus-within:text-primary-600 transition-all font-bold" />
                                <input type="text" value={detail} onChange={(e) => setDetail(e.target.value)} className="w-full pl-10 pr-5 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-sm text-gray-900 focus:bg-white focus:border-primary-500 transition-all uppercase" placeholder="E.g. ROOM 2" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{language === 'id' ? 'HARGA SATUAN' : 'UNIT PRICE'}</label>
                            <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-black text-sm text-gray-900" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{language === 'id' ? 'JUMLAH' : 'QUANTITY'}</label>
                            <input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-black text-sm text-gray-900" />
                        </div>
                    </div>

                    <div className="p-6 bg-primary-600 rounded-[1.5rem] text-white shadow-lg relative overflow-hidden">
                        <div className="absolute right-0 bottom-0 opacity-10"><DollarSign className="w-24 h-24" /></div>
                        <div className="relative z-10">
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1.5">{language === 'id' ? 'TOTAL ESTIMASI' : 'TOTAL ESTIMATION'}</p>
                            <p className="text-2xl font-black">{new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(calculateTotal())}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed border-gray-100">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{t.plan.expense_collector}</label>
                            <select value={collectorId} onChange={(e) => setCollectorId(e.target.value)} className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-black text-sm text-gray-900 appearance-none cursor-pointer">
                                <option value="">-- {language === 'id' ? 'Pilih' : 'Select'} --</option>
                                {participants.map(p => <option key={p._id} value={p._id}>{p.name.toUpperCase()}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">DP %</label>
                            <div className="relative group">
                                <input type="number" min="0" max="100" value={downPayment} onChange={(e) => setDownPayment(Number(e.target.value))} className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-black text-sm text-gray-900" />
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs">%</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-dashed border-gray-100">
                        <div className="flex items-center justify-between">
                            <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{t.plan.split_with} ({selectedParticipants.length})</label>
                            <button type="button" onClick={() => { if (selectedParticipants.length === participants.length) setSelectedParticipants([]); else setSelectedParticipants(participants.map(p => p._id)); }} className="text-[8px] font-black uppercase tracking-widest text-primary-600 hover:underline">TOGGLE ALL</button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {participants.map(p => {
                                const isSelected = selectedParticipants.includes(p._id)
                                return <button key={p._id} type="button" onClick={() => { if (isSelected) setSelectedParticipants(selectedParticipants.filter(id => id !== p._id)); else setSelectedParticipants([...selectedParticipants, p._id]); }} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isSelected ? 'bg-primary-600 text-white shadow-md' : 'bg-gray-50 text-gray-400'}`}>{isSelected && '✓ '} {p.name}</button>
                            })}
                        </div>
                    </div>
                </div>

                <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} className="px-8 py-3 bg-primary-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary-50 hover:bg-primary-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-3.5 h-3.5" /> <span>{t.common.save}</span></>}
                    </button>
                </div>
            </div>
        </div>
    )
}
