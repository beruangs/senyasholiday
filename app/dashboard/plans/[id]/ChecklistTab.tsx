'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, CheckCircle2, Circle, Loader2, Sparkles, ClipboardList, CheckSquare, Target } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/context/LanguageContext'

interface ChecklistItem {
    _id: string
    category: string
    item: string
    isCompleted: boolean
}

export default function ChecklistTab({ planId, planTitle = '', destination = '', isCompleted }: { planId: string, planTitle?: string, destination?: string, isCompleted?: boolean }) {
    const { language, t } = useLanguage()
    const [items, setItems] = useState<ChecklistItem[]>([])
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [newItem, setNewItem] = useState('')

    useEffect(() => {
        fetchChecklist()
    }, [planId])

    const fetchChecklist = async () => {
        try {
            const res = await fetch(`/api/plans/${planId}/checklist`)
            if (res.ok) {
                const data = await res.json()
                setItems(data)
            }
        } catch (error) { toast.error(t.dashboard.loading_data) } finally { setLoading(false) }
    }

    const addItem = async (itemText: string) => {
        if (!itemText.trim()) return
        setAdding(true)
        try {
            const res = await fetch(`/api/plans/${planId}/checklist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ item: itemText.trim(), category: 'packing' }),
            })
            if (res.ok) {
                setNewItem(''); fetchChecklist();
                toast.success(t.common.success)
            }
        } catch (error) { toast.error(t.common.loading) } finally { setAdding(false) }
    }

    const toggleItem = async (itemId: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/plans/${planId}/checklist`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: itemId, isCompleted: !currentStatus }),
            })
            if (res.ok) {
                setItems(items.map(it => it._id === itemId ? { ...it, isCompleted: !currentStatus } : it))
            }
        } catch (error) { toast.error(t.common.loading) }
    }

    const deleteItem = async (itemId: string) => {
        if (!confirm(t.common.confirm_delete)) return
        try {
            const res = await fetch(`/api/plans/${planId}/checklist?id=${itemId}`, { method: 'DELETE' })
            if (res.ok) {
                setItems(items.filter(it => it._id !== itemId))
                toast.success(`${t.plan.checklist} ${t.plan.delete_success}`)
            }
        } catch (error) { toast.error(t.common.loading) }
    }

    const getSmartRecommendations = () => {
        const text = (planTitle + ' ' + destination).toLowerCase()
        const recs = [{ item: language === 'id' ? 'Paspor' : 'Passport' }, { item: language === 'id' ? 'Tiket' : 'Ticket' }, { item: 'Charger' }, { item: 'Powerbank' }]
        if (text.includes('haji') || text.includes('umrah')) {
            recs.push({ item: language === 'id' ? 'Kain Ihram' : 'Ihram Cloth' }, { item: language === 'id' ? 'Buku Doa' : 'Prayer Book' })
        }
        if (text.includes('bali') || text.includes('pantai') || text.includes('beach')) {
            recs.push({ item: 'Sunblock' }, { item: language === 'id' ? 'Kacamata Hitam' : 'Sunglasses' }, { item: language === 'id' ? 'Baju Renang' : 'Swimsuit' })
        }
        return recs.filter(rec => !items.some(it => it.item.toLowerCase() === rec.item.toLowerCase()))
    }

    const smartRecs = getSmartRecommendations()

    if (loading) {
        return <div className="flex justify-center items-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
    }

    const completedCount = items.filter(it => it.isCompleted).length
    const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0

    return (
        <div className="space-y-8 pb-16 max-w-3xl mx-auto font-bold animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary-50">
                        <CheckSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{t.plan.checklist}</h2>
                        <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">{language === 'id' ? 'PERSIAPAN LIBURAN' : 'TRIP PREPARATION'}</p>
                    </div>
                </div>

                {items.length > 0 && (
                    <div className="bg-primary-50 px-5 py-2.5 rounded-xl border border-primary-100 min-w-[180px]">
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[8px] font-black uppercase text-primary-600 tracking-widest leading-none">PROGRESS</span>
                            <span className="text-xs font-black text-primary-600 leading-none">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-primary-600 transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                )}
            </div>

            {smartRecs.length > 0 && !isCompleted && (
                <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm space-y-3">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-primary-300" />
                        <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">SMART SUGGESTIONS</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {smartRecs.slice(0, 5).map((rec, i) => (
                            <button key={i} onClick={() => addItem(rec.item)} className="px-3 py-1.5 bg-gray-50 border border-gray-100 text-gray-500 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-primary-600 hover:text-white transition-all flex items-center gap-1.5">
                                <Plus className="w-2.5 h-2.5" /> {rec.item}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {!isCompleted && (
                <div className="relative group">
                    <Plus className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-primary-600 transition-all" />
                    <input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addItem(newItem)} placeholder={language === 'id' ? 'Apa lagi yang perlu disiapkan?' : 'What else to prepare?'} className="w-full pl-12 pr-32 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:bg-white focus:border-primary-500 outline-none transition-all font-black text-sm placeholder:text-gray-300" />
                    <button onClick={() => addItem(newItem)} disabled={adding || !newItem.trim()} className="absolute right-2 top-2 bottom-2 px-6 bg-primary-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-primary-700 disabled:opacity-50 transition-all shadow-lg shadow-primary-50 flex items-center gap-2">
                        {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Target className="w-3.5 h-3.5" />}
                        <span>{t.common.add}</span>
                    </button>
                </div>
            )}

            <div className="space-y-3">
                {items.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                        <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <h3 className="text-lg font-black text-gray-900 mb-1 uppercase tracking-tight">{language === 'id' ? 'KOSONG' : 'EMPTY'}</h3>
                        <p className="text-gray-400 font-black text-[9px] uppercase tracking-widest max-w-xs mx-auto leading-relaxed">{t.dashboard.no_plans_desc}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {items.map((item) => (
                            <div key={item._id} className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 ${item.isCompleted ? 'bg-primary-50/20 border-transparent opacity-60' : 'bg-white border-gray-100 hover:border-primary-100 hover:shadow-lg'}`}>
                                <button onClick={() => !isCompleted && toggleItem(item._id, item.isCompleted)} disabled={isCompleted} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${item.isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-50 text-gray-300 hover:text-primary-600 hover:bg-primary-100'}`}>
                                    {item.isCompleted ? <CheckCircle2 className="w-5 h-5 shadow-inner" /> : <Circle className="w-5 h-5 shadow-inner" />}
                                </button>
                                <span className={`flex-1 text-sm font-black transition-all tracking-tight ${item.isCompleted ? 'text-gray-300 line-through' : 'text-gray-900'}`}>{item.item}</span>
                                {!isCompleted && (
                                    <button onClick={() => deleteItem(item._id)} className="p-2 text-gray-200 hover:text-rose-500 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
