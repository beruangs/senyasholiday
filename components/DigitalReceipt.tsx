'use client'

import { X, Receipt, User, Tag, CheckCircle } from 'lucide-react'

interface DigitalReceiptProps {
    bill: any
    onClose: () => void
    language: string
    participants?: any[]
}

export default function DigitalReceipt({ bill, onClose, language, participants = [] }: DigitalReceiptProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    }

    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300 font-bold">
            <div className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="bg-primary-600 px-6 md:px-10 pt-8 md:pt-12 pb-16 md:pb-20 text-center text-white relative">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"><X className="w-5 h-5" /></button>
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 border border-white/30"><Receipt className="w-6 h-6 md:w-8 md:h-8 text-white" /></div>
                    <h2 className="text-xl md:text-2xl font-black tracking-tight mb-1">{bill.title}</h2>
                    <p className="text-primary-100 text-[10px] font-black uppercase tracking-widest opacity-60">{formatDate(bill.date)}</p>
                    <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]"><svg className="relative block w-full h-8 translate-y-1" viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5,73.84-4.36,147.54,16.88,218.2,52.38,57.18,28.73,114,58.85,176.1,58,69.59-1,123.6-26.69,183.1-62.5,60.89-36.63,123.51-60.67,196-51.49,14.39,1.8,28.61,4.36,42.7,7.69V0Z" className="fill-white" /></svg></div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 md:px-10 py-6 md:py-10 space-y-6 md:space-y-10 no-scrollbar">
                    <div className="flex items-center justify-between p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary-600 shadow-sm"><User className="w-6 h-6" /></div>
                            <div><span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">{language === 'id' ? 'DIBAYAR OLEH' : 'PAID BY'}</span><p className="text-sm font-black text-gray-900 tracking-tight">{bill.payerId?.name}</p></div>
                        </div>
                        <div className="text-right"><span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">{language === 'id' ? 'TOTAL BILL' : 'TOTAL BILL'}</span><p className="text-xl font-black text-primary-600 tracking-tighter">{formatCurrency(bill.totalAmount)}</p></div>
                    </div>

                    <div>
                        <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-6 flex items-center gap-2"><Tag className="w-3.5 h-3.5" /> {language === 'id' ? 'RINCIAN ITEM' : 'ITEM BREAKDOWN'}</h3>
                        <div className="space-y-6">{bill.items.map((item: any, idx: number) => (
                            <div key={idx} className="group">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex flex-col"><span className="text-sm font-black text-gray-900 tracking-tight leading-tight">{item.name}</span><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">x{item.quantity} · {formatCurrency(item.price)}</span></div>
                                    <span className="text-sm font-black text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">{language === 'id' ? 'Dipesan oleh:' : 'Ordered by:'}</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {item.involvedParticipants?.map((p: any, pIdx: number) => (
                                            <span key={p._id || pIdx} className="px-2 py-1 rounded-md bg-gray-50 text-gray-600 text-[9px] font-black tracking-tighter border border-gray-100">
                                                {typeof p === 'object' ? p.name : (participants.find((part: any) => part._id === p)?.name || 'User')}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="mt-6 border-b border-gray-100 group-last:hidden" />
                            </div>
                        ))}</div>
                    </div>

                    <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white shadow-2xl">
                        <div className="space-y-3 mb-6 border-b border-gray-800 pb-6">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest"><span className="text-gray-500">Subtotal</span><span className="text-gray-300">{formatCurrency(bill.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0))}</span></div>
                            {bill.taxPercent > 0 && <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest"><span className="text-gray-500">{language === 'id' ? 'Pajak' : 'Tax'} ({bill.taxPercent}%)</span><span className="text-gray-300">{formatCurrency((bill.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) * bill.taxPercent) / 100)}</span></div>}
                            {bill.servicePercent > 0 && <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest"><span className="text-gray-500">Service ({bill.servicePercent}%)</span><span className="text-gray-300">{formatCurrency((bill.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) * bill.servicePercent) / 100)}</span></div>}
                        </div>
                        <div className="flex flex-col mb-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Grand Total</span>
                            <span className="text-3xl md:text-4xl font-black text-primary-400 tracking-tighter leading-none">{formatCurrency(bill.totalAmount)}</span>
                        </div>
                        <div className="space-y-4">
                            <p className="text-[8px] font-black uppercase text-gray-500 tracking-[0.3em] mb-4">{language === 'id' ? 'BAGIAN PER ORANG' : 'PARTICIPANT SHARES'}</p>
                            {bill.participantPayments.map((p: any) => (
                                <div key={p.participantId?._id} className="flex justify-between items-center">
                                    <div className="flex items-center gap-3"><span className="text-[10px] font-black tracking-widest text-gray-400">{p.participantId?.name}</span>{p.isPaid && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}</div>
                                    <span className="text-xs font-black text-white">{formatCurrency(p.shareAmount)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 border-t border-gray-100 p-8 text-center"><p className="text-[8px] font-black uppercase text-gray-300 tracking-[0.4em]">Receipt powered by SEN Holiday App</p></div>
            </div>
        </div>
    )
}
