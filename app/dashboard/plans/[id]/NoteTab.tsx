'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Edit2, Save, X, Sparkles, Notebook, StickyNote, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import 'react-quill/dist/quill.snow.css'
import { useLanguage } from '@/context/LanguageContext'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

export default function NoteTab({ planId, isCompleted }: { planId: string; isCompleted?: boolean }) {
  const { language, t } = useLanguage()
  const [note, setNote] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchNote()
  }, [planId])

  const fetchNote = async () => {
    try {
      const res = await fetch(`/api/notes?planId=${planId}`)
      if (res.ok) {
        const data = await res.json()
        setNote(data.content || '')
      }
    } catch (error) { toast.error(t.dashboard.loading_data) } finally { setLoading(false) }
  }

  const saveNote = async () => {
    try {
      setIsSaving(true)
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, content: note }),
      })
      if (res.ok) {
        toast.success(t.plan.save_note_success)
        setIsEditing(false)
      }
    } catch (error) { toast.error(t.common.loading) } finally { setIsSaving(false) }
  }

  const cancelEdit = () => { fetchNote(); setIsEditing(false); }

  if (loading) {
    return <div className="flex justify-center items-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
  }

  return (
    <div className="space-y-8 pb-16 font-bold">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary-50">
            <Notebook className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{t.plan.notes}</h2>
            <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">{language === 'id' ? 'DETAIL PERJALANAN' : 'TRIP DETAILS'}</p>
          </div>
        </div>

        {!isEditing ? (
          note && !isCompleted && (
            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-100 transition-all shadow-sm">
              <Edit2 className="w-3.5 h-3.5" /> {t.common.edit}
            </button>
          )
        ) : (
          <div className="flex gap-2">
            <button onClick={cancelEdit} className="p-2.5 bg-gray-50 text-gray-400 hover:text-red-500 rounded-xl transition-all"><X className="w-4 h-4" /></button>
            <button onClick={saveNote} disabled={isSaving} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-50 font-black text-[10px] uppercase tracking-widest disabled:opacity-50">
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{t.common.save}</span>
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-xl overflow-hidden font-bold">
          <style jsx global>{`
            .quill-wrapper .ql-toolbar.ql-snow { border: none; border-bottom: 1px solid #f3f4f6; padding: 1rem; }
            .quill-wrapper .ql-container.ql-snow { border: none; font-family: inherit; font-size: 1rem; min-height: 400px; }
            .quill-wrapper .ql-editor { padding: 1.5rem; line-height: 1.6; color: #1f2937; font-weight: 700; }
            .quill-wrapper .ql-editor.ql-blank::before { color: #9ca3af; font-weight: 900; font-style: normal; text-transform: uppercase; font-size: 10px; letter-spacing: 1.5px; }
          `}</style>
          <div className="quill-wrapper">
            <ReactQuill value={note} onChange={setNote} theme="snow" modules={{ toolbar: [[{ header: [1, 2, 3, false] }], ['bold', 'italic', 'underline', 'strike'], [{ list: 'ordered' }, { list: 'bullet' }], ['blockquote', 'code-block'], [{ color: [] }, { background: [] }], ['clean']] }} placeholder={language === 'id' ? "Tulis detail perjalanan, nomor penting, atau info villa..." : "Write trip details, important numbers, or villa info..."} />
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in duration-500">
          {note ? (
            <div className="relative bg-white rounded-[2rem] border border-gray-100 p-8 sm:p-12 shadow-sm hover:shadow-xl transition-all overflow-hidden font-bold">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary-50/20 rounded-full blur-3xl -mr-24 -mt-24" />
              <div className="relative prose prose-base max-w-none prose-p:font-bold prose-headings:font-black prose-headings:tracking-tight" dangerouslySetInnerHTML={{ __html: note }} />
              <div className="mt-10 pt-6 border-t border-gray-50 flex items-center gap-2 text-gray-300 font-black text-[8px] uppercase tracking-widest leading-none">
                <Sparkles className="w-3 h-3 text-primary-200" /> {language === 'id' ? 'CATATAN INI TERINTEGRASI' : 'THIS NOTE IS INTEGRATED'}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200 flex flex-col items-center font-bold">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm"><StickyNote className="w-8 h-8 text-primary-600" /></div>
              <h3 className="text-lg font-black text-gray-900 mb-1.5 uppercase tracking-tight font-bold">{language === 'id' ? 'BELUM ADA CATATAN' : 'NO NOTES YET'}</h3>
              <p className="text-gray-400 font-bold max-w-xs mx-auto text-[10px] uppercase tracking-widest mb-8 leading-relaxed opacity-60">{language === 'id' ? 'Tulis info penting agar teman liburanmu tahu.' : 'Write important info for your travel buddies.'}</p>
              {!isCompleted && (
                <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-50 font-black uppercase tracking-widest text-[10px]">
                  <PlusIcon className="w-4 h-4" /> {language === 'id' ? 'Mulai Menulis' : 'Start Writing'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PlusIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" ><path d="M5 12h14" /><path d="M12 5v14" /></svg>
}
