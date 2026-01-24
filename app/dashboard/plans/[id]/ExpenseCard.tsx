'use client'

import { useState } from 'react'
import { MoreVertical, Edit2, Trash2, ChevronDown, ChevronUp, User, Wallet } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

interface ExpenseCardProps {
    expense: any
    onEdit: (expense: any) => void
    onDelete: (id: string) => void
    readOnly?: boolean
    t: any
    language: string
}

export default function ExpenseCard({ expense, onEdit, onDelete, readOnly, t, language }: ExpenseCardProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [showMenu, setShowMenu] = useState(false)

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
    }

    return (
        <div className="group relative bg-white border border-gray-100 rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 h-full flex flex-col font-bold">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary-600 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0 w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-inner">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base font-black text-gray-900 truncate leading-tight uppercase tracking-tight group-hover:text-primary-600 transition-colors">{expense.itemName}</h3>
                            <p className="text-[7px] font-black text-gray-300 uppercase tracking-widest mt-0.5 font-bold">BY {expense.collectorName?.toUpperCase() || '-'}</p>
                        </div>
                    </div>

                    {!readOnly && (
                        <div className="relative shrink-0">
                            <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 hover:bg-gray-50 rounded-lg transition-all text-gray-300 hover:text-primary-600"><MoreVertical className="w-4 h-4" /></button>
                            {showMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 animate-in zoom-in-95 duration-200">
                                        <button onClick={() => { onEdit(expense); setShowMenu(false); }} className="w-full px-4 py-2 text-left text-[9px] font-black uppercase text-gray-600 hover:bg-primary-50 hover:text-primary-600 flex items-center gap-2 transition-colors tracking-widest"><Edit2 className="w-3.5 h-3.5" /> {t.common.edit}</button>
                                        <button onClick={() => { onDelete(expense._id); setShowMenu(false); }} className="w-full px-4 py-2 text-left text-[9px] font-black uppercase text-rose-500 hover:bg-rose-50 flex items-center gap-2 transition-colors tracking-widest"><Trash2 className="w-3.5 h-3.5" /> {t.common.delete}</button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-4 bg-gray-50/50 rounded-xl border border-transparent group-hover:border-primary-100/50 transition-all flex flex-col">
                        <span className="text-[7px] font-black uppercase text-gray-400 tracking-widest mb-1 leading-none">TOTAL COST</span>
                        <span className="text-[13px] font-black text-gray-900 truncate">{formatCurrency(expense.total)}</span>
                    </div>
                    <div className="p-4 bg-gray-50/50 rounded-xl border border-transparent group-hover:border-primary-100/50 transition-all flex flex-col">
                        <span className="text-[7px] font-black uppercase text-gray-400 tracking-widest mb-1 leading-none">PER HEAD</span>
                        <span className="text-[13px] font-black text-primary-600 truncate">{expense.contributorCount > 0 ? formatCurrency(expense.total / expense.contributorCount) : '-'}</span>
                    </div>
                </div>

                <div className="mt-auto">
                    <div className="flex justify-between items-center text-[7px] font-black uppercase tracking-widest mb-1.5 opacity-60">
                        <span>CONTRIBUTION</span>
                        <span>{expense.contributorCount || 0} GUESTS</span>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-6">
                        <div className="h-full bg-primary-600 rounded-full" style={{ width: '100%' }} />
                    </div>

                    <button onClick={() => setIsExpanded(!isExpanded)} className="w-full py-2 bg-gray-50 hover:bg-primary-50 text-gray-400 hover:text-primary-600 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {isExpanded ? 'CLOSE' : 'DETAILS'}
                    </button>
                </div>

                {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-dashed border-gray-100 space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                        {expense.contributors && expense.contributors.length > 0 ? expense.contributors.map((c: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-50/30 rounded-lg">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-5 h-5 rounded-md bg-white flex items-center justify-center text-gray-300 shadow-sm"><User className="w-3 h-3" /></div>
                                    <span className="text-[9px] font-black text-gray-700 truncate uppercase">{c.participantName}</span>
                                </div>
                                <span className="text-[9px] font-black text-gray-900 ml-3">{formatCurrency(c.amount)}</span>
                            </div>
                        )) : (
                            <p className="text-center text-[7px] font-black uppercase text-gray-300 tracking-widest py-3">NO DATA YET</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
