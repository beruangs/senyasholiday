'use client'

import { useEffect } from 'react'
import { AlertTriangle, Trash2, X, Check, Loader2 } from 'lucide-react'

interface ConfirmModalProps { isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmText?: string; cancelText?: string; variant?: 'danger' | 'warning' | 'info'; loading?: boolean; }

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger', loading = false, }: ConfirmModalProps) {
    useEffect(() => { document.body.style.overflow = isOpen ? 'hidden' : 'unset'; return () => { document.body.style.overflow = 'unset'; }; }, [isOpen])
    useEffect(() => { const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen && !loading) onClose(); }; document.addEventListener('keydown', handleEscape); return () => document.removeEventListener('keydown', handleEscape); }, [isOpen, loading, onClose])

    if (!isOpen) return null

    const variantStyles = {
        danger: { icon: <Trash2 className="w-8 h-8 text-rose-600" />, iconBg: 'bg-rose-50', button: 'bg-rose-600 hover:bg-rose-700 shadow-rose-100' },
        warning: { icon: <AlertTriangle className="w-8 h-8 text-amber-600" />, iconBg: 'bg-amber-50', button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-100' },
        info: { icon: <Check className="w-8 h-8 text-primary-600" />, iconBg: 'bg-primary-50', button: 'bg-primary-600 hover:bg-primary-700 shadow-primary-100' },
    }
    const s = variantStyles[variant]

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 font-bold">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in transition-all" onClick={loading ? undefined : onClose} />
            <div className="relative bg-white rounded-[3.5rem] shadow-2xl max-w-md w-full p-12 text-center animate-in zoom-in-95 duration-300 overflow-hidden border border-gray-100">
                <div className={`w-20 h-20 rounded-[2.5rem] ${s.iconBg} flex items-center justify-center mx-auto mb-10 shadow-inner`}>{s.icon}</div>
                <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-4">{title}</h3>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest leading-relaxed mb-12">{message}</p>
                <div className="flex flex-col gap-3">
                    <button onClick={onConfirm} disabled={loading} className={`w-full py-6 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 ${s.button}`}>{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null} <span>{loading ? 'PROCESSING' : confirmText.toUpperCase()}</span></button>
                    <button onClick={onClose} disabled={loading} className="w-full py-6 text-gray-300 font-black uppercase text-xs tracking-widest hover:text-gray-600 transition-all">{cancelText.toUpperCase()}</button>
                </div>
            </div>
        </div>
    )
}
