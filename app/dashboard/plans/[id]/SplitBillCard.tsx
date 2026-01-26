'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Receipt, Edit2, Trash2, Eye, CheckCircle, XCircle, User, MessageCircle } from 'lucide-react'
import DigitalReceipt from '@/components/DigitalReceipt'

interface SplitBillCardProps {
    bill: any
    onEdit: () => void
    onDelete: () => void
    onPaymentUpdate: (participantId: string, amount: number, isPaid: boolean) => void
    readOnly?: boolean
    t: any
    language: string
    participants?: any[]
}

export default function SplitBillCard({ bill, onEdit, onDelete, onPaymentUpdate, readOnly, t, language, participants = [] }: SplitBillCardProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [showReceipt, setShowReceipt] = useState(false)

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    const handleShareWhatsApp = (e: React.MouseEvent) => {
        e.stopPropagation()
        const itemsList = bill.items.map((item: any) => `- ${item.name} (x${item.quantity})`).join('%0A')
        const payerName = bill.payerId?.name || 'Unknown'
        const sharesList = bill.participantPayments.map((p: any) => {
            const status = p.isPaid ? '✅ LUNAS' : '❌ BELUM'
            return `- *${p.participantId?.name}*: ${formatCurrency(p.shareAmount)} (${status})`
        }).join('%0A')
        const message = `*BILL SPLIT: ${bill.title.toUpperCase()}*%0A%0A` + `📅 Tanggal: ${formatDate(bill.date)}%0A` + `👤 Payer: *${payerName}*%0A` + `💰 Total Tagihan: *${formatCurrency(bill.totalAmount)}*%0A%0A` + `*Rincian Item:*%0A${itemsList}%0A%0A` + `*Tagihan Per Orang:*%0A${sharesList}%0A%0A` + `Link Receipt: ${window.location.origin}/plan/${bill.holidayPlanId?.planId || bill.holidayPlanId}`
        window.open(`https://wa.me/?text=${message}`, '_blank')
    }

    const totalPaid = bill.participantPayments.reduce((sum: number, p: any) => sum + (p.paidAmount || 0), 0)
    const progress = (totalPaid / (bill.totalAmount || 1)) * 100

    return (
        <div className="bg-white border border-gray-100 rounded-[1.5rem] shadow-sm hover:shadow-xl transition-all overflow-hidden font-bold">
            <div className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-50"><Receipt className="w-5 h-5" /></div>
                    <div>
                        <h3 className="text-base font-black text-gray-900 leading-tight uppercase tracking-tight">{bill.title}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-black text-primary-600">{formatCurrency(bill.totalAmount)}</span>
                            <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">{formatDate(bill.date)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex flex-col items-end mr-2">
                        <span className="text-[7px] font-black uppercase text-gray-400 tracking-widest">PAYER</span>
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5"><User className="w-2.5 h-2.5 text-primary-500" /> {bill.payerId?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={handleShareWhatsApp} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"><MessageCircle className="w-4 h-4" /></button>
                        {!readOnly && (
                            <>
                                <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                            </>
                        )}
                        <div className="ml-1 text-gray-300 transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}><ChevronDown className="w-5 h-5" /></div>
                    </div>
                </div>
            </div>

            <div className="h-1.5 w-full bg-gray-50"><div className="h-full bg-primary-600 transition-all duration-700 ease-out" style={{ width: `${progress}%` }} /></div>

            {isExpanded && (
                <div className="p-6 bg-gray-50/50 border-t border-gray-100 animate-in slide-in-from-top-2 duration-300 space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[8px] font-black uppercase text-gray-300 tracking-widest">PAYMENT SUMMARY</h4>
                        <button onClick={() => setShowReceipt(true)} className="text-[8px] font-black uppercase text-primary-600 hover:underline flex items-center gap-1.5 tracking-widest"><Eye className="w-3 h-3" /> {language === 'id' ? 'LIHAT RECEIPT' : 'VIEW RECEIPT'}</button>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                        <table className="w-full text-left uppercase text-[9px]">
                            <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="px-4 py-2.5 font-black tracking-widest text-gray-400">Nama</th><th className="px-4 py-2.5 font-black tracking-widest text-gray-400">Bagian</th><th className="px-4 py-2.5 font-black tracking-widest text-gray-400">Status</th>{!readOnly && <th className="px-4 py-2.5 font-black tracking-widest text-gray-400 text-right">Aksi</th>}</tr></thead>
                            <tbody className="divide-y divide-gray-50">{bill.participantPayments.map((p: any) => {
                                const isPayer = p.participantId?._id === bill.payerId?._id
                                return (
                                    <tr key={p.participantId?._id} className={isPayer ? 'bg-primary-50/20' : ''}>
                                        <td className="px-4 py-3 font-black text-gray-900 flex items-center gap-1.5">{p.participantId?.name} {isPayer && <span className="px-1.5 py-0.5 bg-primary-600 text-white rounded-md text-[6px]">PAYER</span>}</td>
                                        <td className="px-4 py-3 font-black text-gray-500">{formatCurrency(p.shareAmount)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full font-black tracking-widest text-[8px] ${p.isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{p.isPaid ? '✓' : '✗'}</span>
                                        </td>
                                        {!readOnly && (
                                            <td className="px-4 py-3 text-right">
                                                {!isPayer && <button onClick={() => onPaymentUpdate(p.participantId?._id, p.isPaid ? 0 : p.shareAmount, !p.isPaid)} className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${p.isPaid ? 'bg-gray-100 text-gray-300' : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'}`}>{p.isPaid ? 'RESET' : 'PAID'}</button>}
                                            </td>
                                        )}
                                    </tr>
                                )
                            })}</tbody>
                        </table>
                    </div>
                </div>
            )}
            {showReceipt && <DigitalReceipt bill={bill} onClose={() => setShowReceipt(false)} language={language} participants={participants} />}
        </div>
    )
}
