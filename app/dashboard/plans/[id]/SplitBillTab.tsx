'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Receipt, Loader2 } from 'lucide-react'
import SplitBillCard from './SplitBillCard'
import SplitBillModal from './SplitBillModal'
import { useLanguage } from '@/context/LanguageContext'

interface SplitBillTabProps {
    planId: string
    isCompleted?: boolean
}

export default function SplitBillTab({ planId, isCompleted }: SplitBillTabProps) {
    const { language, t } = useLanguage()
    const [splitBills, setSplitBills] = useState<any[]>([])
    const [participants, setParticipants] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingBill, setEditingBill] = useState<any>(null)

    useEffect(() => {
        fetchData()
    }, [planId])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [billsRes, participantsRes] = await Promise.all([
                fetch(`/api/split-bills?planId=${planId}`),
                fetch(`/api/participants?planId=${planId}`)
            ])

            if (billsRes.ok && participantsRes.ok) {
                const billsData = await billsRes.json()
                const participantsData = await participantsRes.json()
                setSplitBills(billsData)
                setParticipants(participantsData)
            } else {
                toast.error(t.dashboard.loading_data)
            }
        } catch (error) {
            toast.error(t.common.loading)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateNew = () => { setEditingBill(null); setShowModal(true); }
    const handleEdit = (bill: any) => { setEditingBill(bill); setShowModal(true); }

    const handleDelete = async (billId: string) => {
        if (!confirm(t.common.confirm_delete)) return
        try {
            const res = await fetch(`/api/split-bills/${billId}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success(`${t.plan.split_bill} ${t.plan.delete_success}`)
                fetchData()
            }
        } catch (error) { toast.error(t.common.loading) }
    }

    const handlePaymentUpdate = async (billId: string, participantId: string, paidAmount: number, isPaid: boolean) => {
        try {
            const res = await fetch(`/api/split-bills/${billId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'payment_update', participantId, paidAmount, isPaid })
            })
            if (res.ok) {
                toast.success(t.common.save_changes)
                fetchData()
            }
        } catch (error) { toast.error(t.common.loading) }
    }

    if (loading) {
        return <div className="flex justify-center items-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
    }

    return (
        <div className="space-y-8 pb-16 font-bold">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary-50">
                        <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{t.plan.split_bill}</h2>
                        <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">{language === 'id' ? 'BAGI TAGIHAN' : 'SPLIT BILLS'}</p>
                    </div>
                </div>

                {!isCompleted && (
                    <button onClick={handleCreateNew} className="flex items-center gap-2 px-5 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-50 font-black text-[10px] uppercase tracking-widest group">
                        <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
                        <span>{t.common.add}</span>
                    </button>
                )}
            </div>

            {splitBills.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-[2rem] border border-dashed border-gray-100 font-bold">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm"><Receipt className="w-8 h-8 text-gray-200" /></div>
                    <h3 className="text-lg font-black text-gray-900 mb-1.5 uppercase tracking-tight leading-none">{language === 'id' ? 'KOSONG' : 'EMPTY'}</h3>
                    <p className="text-gray-400 font-black text-[9px] uppercase tracking-widest max-w-xs mx-auto leading-relaxed">{language === 'id' ? 'Catat dan bagi tagihan makan atau belanjaan bareng temen-temen di sini.' : 'Record and split dining or shopping bills with your friends here.'}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {splitBills.map((bill) => (
                        <SplitBillCard key={bill._id} bill={bill} onEdit={() => handleEdit(bill)} onDelete={() => handleDelete(bill._id)} onPaymentUpdate={(pId: string, amount: number, paid: boolean) => handlePaymentUpdate(bill._id, pId, amount, paid)} readOnly={isCompleted} t={t} language={language} participants={participants} />
                    ))}
                </div>
            )}

            {showModal && (
                <SplitBillModal isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); fetchData(); }} planId={planId} participants={participants} editData={editingBill} t={t} language={language} />
            )}
        </div>
    )
}
