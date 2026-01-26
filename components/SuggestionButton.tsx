'use client'

import { useState } from 'react'
import { MessageSquare, X, Send, Lightbulb } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/context/LanguageContext'

export default function SuggestionButton({ page = 'Unknown' }: { page?: string }) {
  const { language } = useLanguage(); const [isOpen, setIsOpen] = useState(false); const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [message, setMessage] = useState(''); const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!message.trim()) return; setSubmitting(true)
    try {
      const res = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim() || 'Anonymous', email: email.trim() || undefined, message: message.trim(), page }), })
      if (res.ok) { toast.success('THANK YOU! 🎉'); setName(''); setEmail(''); setMessage(''); setIsOpen(false); }
    } catch { toast.error('FAILED') } finally { setSubmitting(false) }
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[500] p-3 sm:p-3.5 bg-primary-600 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all group border-4 border-white"><Lightbulb className="w-4 h-4 sm:w-5 h-5 group-hover:rotate-12 transition-transform" /></button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[2000] flex items-center justify-center p-6 font-bold animate-in fade-in">
          <div className="bg-white rounded-[3.5rem] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100">
            <div className="bg-primary-600 p-12 text-white relative">
              <button onClick={() => setIsOpen(false)} className="absolute top-8 right-8 p-2 hover:bg-white/20 rounded-full transition-all"><X className="w-6 h-6" /></button>
              <div className="flex items-center gap-4 mb-4"><div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><MessageSquare className="w-6 h-6" /></div><span className="text-[10px] font-black uppercase tracking-[0.3em]">Feedback Hub</span></div>
              <h2 className="text-3xl font-black uppercase tracking-tight leading-none">{language === 'id' ? 'Saran & Kritik' : 'Suggestions'}</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-12 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{language === 'id' ? 'NAMA' : 'NAME'}</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold focus:bg-white transition-all uppercase tracking-tight text-[11px]" placeholder="..." /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">EMAIL</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold focus:bg-white transition-all lowercase text-[11px]" placeholder="..." /></div>
              </div>
              <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{language === 'id' ? 'PESAN' : 'MESSAGE'} *</label><textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-3xl outline-none font-bold focus:bg-white transition-all resize-none uppercase tracking-tight text-[11px]" placeholder="..." required /></div>

              <div className="flex gap-4 pt-4"><button type="submit" disabled={submitting || !message.trim()} className="flex-1 py-5 bg-primary-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all flex items-center justify-center gap-3">{submitting ? '...' : <><Send className="w-4 h-4" /> SEND</>}</button><button type="button" onClick={() => setIsOpen(false)} className="px-8 py-5 bg-gray-50 text-gray-400 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-gray-100 transition-all">CANCEL</button></div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
