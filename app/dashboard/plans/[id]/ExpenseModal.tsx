'use client'

import { useState, useEffect } from 'react'
import { X, Save, DollarSign, User, Tag, Users, Check, HelpCircle, Loader2, Sparkles } from 'lucide-react'
import { useSession } from 'next-auth/react'
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
    const { data: session } = useSession()
    const [loading, setLoading] = useState(false)
    const [itemName, setItemName] = useState('')
    const [detail, setDetail] = useState('')
    const [price, setPrice] = useState(0)
    const [quantity, setQuantity] = useState(1)
    const [collectorId, setCollectorId] = useState('')
    const [downPayment, setDownPayment] = useState(0)
    const [isPaid, setIsPaid] = useState(false)
    const [categoryId, setCategoryId] = useState('')
    const [categories, setCategories] = useState<any[]>([])
    const [showNewCategory, setShowNewCategory] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
    const [currency, setCurrency] = useState('IDR')
    const [exchangeRate, setExchangeRate] = useState(1)
    const [originalPrice, setOriginalPrice] = useState(0)
    const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
    const isPremium = (session?.user as any)?.isPremium || (session?.user as any)?.role === 'superadmin'

    const currencies = [
        { code: 'IDR', symbol: 'Rp', name: 'Rupiah' },
        { code: 'USD', symbol: '$', name: 'US Dollar' },
        { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
        { code: 'KRW', symbol: '₩', name: 'Korean Won' },
        { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
        { code: 'EUR', symbol: '€', name: 'Euro' },
        { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
    ]

    useEffect(() => {
        if (isOpen) {
            fetchCategories()
            if (editData) {
                setItemName(editData.itemName); setDetail(editData.detail || ''); setPrice(editData.price); setQuantity(editData.quantity);
                setCollectorId(editData.collectorId?._id || editData.collectorId || ''); setDownPayment(editData.downPayment || 0);
                setIsPaid(editData.isPaid || false);
                setCategoryId(editData.categoryId?._id || editData.categoryId || '');
                setCurrency(editData.currency || 'IDR');
                setExchangeRate(editData.exchangeRate || 1);
                setOriginalPrice(editData.originalPrice || editData.price);
                setReceiptUrl(editData.receiptUrl || null);
                if (editData.contributors) setSelectedParticipants(editData.contributors.map((c: any) => c.participantId?._id || c.participantId))
            } else {
                setSelectedParticipants(participants.map(p => p._id))
                const userDefaultCurrency = (session?.user as any)?.defaultCurrency || 'IDR'
                setCurrency(userDefaultCurrency)
                if (userDefaultCurrency !== 'IDR') {
                    fetchExchangeRate(userDefaultCurrency)
                } else {
                    setExchangeRate(1)
                }
                setOriginalPrice(0); setPrice(0);
                setReceiptUrl(null);
            }
        }
    }, [editData, participants, isOpen, session])

    const fetchCategories = async () => {
        try {
            const res = await fetch(`/api/expense-categories?planId=${planId}`)
            if (res.ok) setCategories(await res.json())
        } catch { }
    }

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return
        try {
            const res = await fetch('/api/expense-categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ holidayPlanId: planId, name: newCategoryName.trim() })
            })
            if (res.ok) {
                const newCat = await res.json()
                setCategories([...categories, newCat])
                setCategoryId(newCat._id)
                setNewCategoryName('')
                setShowNewCategory(false)
                toast.success(language === 'id' ? 'Kategori ditambahkan' : 'Category added')
            }
        } catch { toast.error(t.common.failed) }
    }

    const fetchExchangeRate = async (code: string) => {
        if (code === 'IDR') {
            setExchangeRate(1)
            return
        }
        try {
            const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${code}`)
            if (res.ok) {
                const data = await res.json()
                const rate = data.rates['IDR']
                if (rate) {
                    setExchangeRate(rate)
                    setPrice(Math.round(originalPrice * rate))
                }
            }
        } catch {
            toast.error('Gagal mengambil kurs terbaru')
        }
    }

    const calculateTotal = () => (currency === 'IDR' ? price : Math.round(originalPrice * exchangeRate)) * quantity

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!itemName.trim() || price <= 0 || !collectorId || selectedParticipants.length === 0) {
            toast.error(language === 'id' ? 'Lengkapi data wajib' : 'Complete required fields')
            return
        }
        setLoading(true)
        const finalUnitPrice = currency === 'IDR' ? price : Math.round(originalPrice * exchangeRate)
        const total = finalUnitPrice * quantity
        const expenseId = editData?._id
        try {
            const res = await fetch('/api/expenses', {
                method: editData ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    holidayPlanId: planId,
                    _id: expenseId,
                    itemName,
                    detail,
                    price: finalUnitPrice,
                    quantity,
                    total,
                    currency,
                    exchangeRate,
                    originalPrice: currency === 'IDR' ? finalUnitPrice : originalPrice,
                    collectorId,
                    downPayment,
                    isPaid,
                    categoryId: categoryId || null,
                    receiptUrl: receiptUrl
                })
            })
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
                            <h2 className="text-lg font-black text-gray-900 tracking-tight">{editData ? t.plan.edit_expense : t.plan.add_expense}</h2>
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
                                <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full pl-10 pr-5 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-sm text-gray-900 focus:bg-white focus:border-primary-500 transition-all" placeholder="E.g. Villa" />
                            </div>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{t.common.description}</label>
                            <div className="relative group">
                                <HelpCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 group-focus-within:text-primary-600 transition-all font-bold" />
                                <input type="text" value={detail} onChange={(e) => setDetail(e.target.value)} className="w-full pl-10 pr-5 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-sm text-gray-900 focus:bg-white focus:border-primary-500 transition-all" placeholder="E.g. Room 2" />
                            </div>
                        </div>
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{language === 'id' ? 'MATA UANG' : 'CURRENCY'}</label>
                                <div className="relative group">
                                    <select
                                        value={currency}
                                        onChange={(e) => {
                                            const newCurrency = e.target.value
                                            if (newCurrency !== 'IDR' && !isPremium) {
                                                toast.error('Fitur Premium', { description: 'Multi-currency hanya tersedia untuk member Premium.' })
                                                return
                                            }
                                            setCurrency(newCurrency)
                                            fetchExchangeRate(newCurrency)
                                        }}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-black text-sm text-gray-900 appearance-none cursor-pointer"
                                    >
                                        {currencies.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                                    </select>
                                    {!isPremium && <Sparkles className="absolute right-10 top-1/2 -translate-y-1/2 w-3 h-3 text-amber-500 fill-amber-500" />}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{language === 'id' ? 'HARGA' : 'PRICE'} ({currency})</label>
                                <input
                                    type="number"
                                    value={currency === 'IDR' ? price : originalPrice}
                                    onChange={(e) => {
                                        const val = Number(e.target.value)
                                        if (currency === 'IDR') setPrice(val)
                                        else setOriginalPrice(val)
                                    }}
                                    className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-black text-sm text-gray-900"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{language === 'id' ? 'JUMLAH' : 'QUANTITY'}</label>
                                <input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-black text-sm text-gray-900" />
                            </div>
                        </div>
                        {currency !== 'IDR' && (
                            <div className="md:col-span-2 p-6 bg-slate-900 rounded-2xl text-white flex items-center justify-between animate-in slide-in-from-top-4">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Kurs Konversi (1 {currency} = ? IDR)</p>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            value={exchangeRate}
                                            onChange={(e) => setExchangeRate(Number(e.target.value))}
                                            className="bg-slate-800 border-none rounded-lg px-4 py-2 font-black text-sm w-32 outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                        <span className="font-black text-sm">IDR</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Hasil (Est. IDR)</p>
                                    <p className="text-lg font-black">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(originalPrice * exchangeRate)}</p>
                                </div>
                            </div>
                        )}
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{language === 'id' ? 'KATEGORI' : 'CATEGORY'}</label>
                            <div className="flex gap-2">
                                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="flex-1 px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-black text-sm text-gray-900 appearance-none cursor-pointer">
                                    <option value="">-- {language === 'id' ? 'Umum' : 'General'} --</option>
                                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                                <button type="button" onClick={() => setShowNewCategory(!showNewCategory)} className="px-4 bg-gray-50 border border-gray-100 rounded-xl text-primary-600 hover:bg-primary-50 transition-all font-black">+</button>
                            </div>
                            {showNewCategory && (
                                <div className="flex gap-2 animate-in slide-in-from-top-2">
                                    <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="flex-1 px-4 py-2 bg-white border border-primary-200 rounded-lg outline-none font-bold text-xs" placeholder={language === 'id' ? 'Nama kategori baru...' : 'New category name...'} />
                                    <button type="button" onClick={handleAddCategory} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">ADD</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 bg-primary-600 rounded-[1.5rem] text-white shadow-lg relative overflow-hidden">
                        <div className="absolute right-0 bottom-0 opacity-10"><DollarSign className="w-24 h-24" /></div>
                        <div className="relative z-10">
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1.5">{language === 'id' ? 'TOTAL ESTIMASI' : 'TOTAL ESTIMATION'}</p>
                            <p className="text-2xl font-black">{new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(calculateTotal())}</p>
                        </div>
                    </div>

                    {receiptUrl && (
                        <div className="space-y-3 pt-4 border-t border-dashed border-gray-100 animate-in fade-in">
                            <div className="flex justify-between items-center">
                                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{language === 'id' ? 'STRUK TERLAMPIR' : 'ATTACHED RECEIPT'}</label>
                                <button type="button" onClick={() => setReceiptUrl(null)} className="text-[8px] font-black uppercase tracking-widest text-rose-500 hover:underline">HAPUS</button>
                            </div>
                            <div className="relative aspect-video rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 group">
                                <img src={receiptUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Receipt" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                    <HelpCircle className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-all" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed border-gray-100">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{t.plan.expense_collector}</label>
                            <select value={collectorId} onChange={(e) => setCollectorId(e.target.value)} className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-black text-sm text-gray-900 appearance-none cursor-pointer">
                                <option value="">-- {language === 'id' ? 'Pilih' : 'Select'} --</option>
                                {participants.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{language === 'id' ? 'DP (UANG MUKA)' : 'DOWN PAYMENT'} ({currency})</label>
                            <div className="relative group">
                                <input
                                    type="number"
                                    value={currency === 'IDR' ? downPayment : Math.round(downPayment / exchangeRate)}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setDownPayment(currency === 'IDR' ? val : Math.round(val * exchangeRate));
                                    }}
                                    className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-black text-sm text-gray-900"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-emerald-50 transition-all border border-transparent hover:border-emerald-100" onClick={() => setIsPaid(!isPaid)}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isPaid ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-white text-gray-300'}`}>
                                <Check className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-gray-900 leading-none mb-1">{language === 'id' ? 'Lunas / Sudah Dibayar' : 'Fully Paid / Settled'}</p>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">{language === 'id' ? 'TANDAI BARANG INI SUDAH DIBAYAR SEMUA' : 'MARK THIS ITEM AS FULLY PAID'}</p>
                            </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isPaid ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-200'}`}>
                            {isPaid && <Check className="w-3.5 h-3.5" />}
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
