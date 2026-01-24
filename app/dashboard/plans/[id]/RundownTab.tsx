'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Calendar as CalendarIcon, Edit2, X } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id, enUS } from 'date-fns/locale'
import { useLanguage } from '@/context/LanguageContext'

interface Rundown {
  _id?: string
  date: string
  time: string
  activity: string
  location: string
  notes: string
}

export default function RundownTab({ planId, isCompleted }: { planId: string; isCompleted?: boolean }) {
  const { language, t } = useLanguage()
  const [rundowns, setRundowns] = useState<Rundown[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Rundown>({
    date: '',
    time: '',
    activity: '',
    location: '',
    notes: '',
  })

  useEffect(() => {
    fetchRundowns()
  }, [planId])

  const fetchRundowns = async () => {
    try {
      const res = await fetch(`/api/rundowns?planId=${planId}`)
      if (res.ok) {
        const data = await res.json()
        setRundowns(data)
      }
    } catch (error) {
      toast.error(t.dashboard.loading_data)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        const res = await fetch('/api/rundowns', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ _id: editingId, holidayPlanId: planId, ...formData }),
        })
        if (res.ok) {
          toast.success(`${t.plan.rundown} ${t.plan.update_success}`)
          setShowForm(false)
          setEditingId(null)
          setFormData({ date: '', time: '', activity: '', location: '', notes: '' })
          fetchRundowns()
        }
      } else {
        const res = await fetch('/api/rundowns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ holidayPlanId: planId, ...formData }),
        })
        if (res.ok) {
          toast.success(`${t.plan.rundown} ${t.plan.add_success}`)
          setShowForm(false)
          setFormData({ date: '', time: '', activity: '', location: '', notes: '' })
          fetchRundowns()
        }
      }
    } catch (error) {
      toast.error(t.common.loading)
    }
  }

  const startEdit = (rundown: Rundown) => {
    setEditingId(rundown._id || null)
    setFormData(rundown)
    setShowForm(true)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setShowForm(false)
    setFormData({ date: '', time: '', activity: '', location: '', notes: '' })
  }

  const deleteRundown = async (id: string) => {
    if (!confirm(t.common.confirm_delete)) return
    try {
      const res = await fetch(`/api/rundowns?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(`${t.plan.rundown} ${t.plan.delete_success}`)
        fetchRundowns()
      }
    } catch (error) { toast.error(t.common.loading); }
  }

  if (loading) {
    return <div className="text-center py-10"><CalendarIcon className="w-8 h-8 animate-pulse text-gray-200 mx-auto" /></div>
  }

  const groupedRundowns = rundowns.reduce((acc: any, rundown) => {
    const date = rundown.date; if (!acc[date]) acc[date] = []; acc[date].push(rundown); return acc
  }, {})

  const sortedGroupedRundowns = Object.keys(groupedRundowns).reduce((acc: any, date) => {
    acc[date] = groupedRundowns[date].sort((a: Rundown, b: Rundown) => (a.time || '').localeCompare(b.time || ''))
    return acc
  }, {})

  const dateLocale = language === 'id' ? id : enUS

  return (
    <div className="space-y-8 font-bold">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary-50">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{t.plan.rundown}</h2>
            <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em]">{language === 'id' ? 'MANAJEMEN AGENDA' : 'AGENDA MANAGEMENT'}</p>
          </div>
        </div>
        {!isCompleted && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-5 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-black text-[10px] uppercase tracking-widest group">
            <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
            <span>{t.common.add}</span>
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-[1.5rem] p-6 sm:p-8 border border-gray-100 font-bold relative animate-in slide-in-from-top-4 duration-300">
          <button onClick={cancelEdit} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><X className="w-4 h-4" /></button>
          <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-6">{editingId ? t.plan.edit_rundown : t.plan.add_rundown}</h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{t.plan.date} <span className="text-red-500">*</span></label>
                <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-5 py-3 bg-white border border-gray-100 rounded-xl outline-none font-bold text-sm" />
              </div>
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{t.plan.time}</label>
                <input type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} className="w-full px-5 py-3 bg-white border border-gray-100 rounded-xl outline-none font-bold text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{t.plan.activity} <span className="text-red-500">*</span></label>
                <input type="text" required value={formData.activity} onChange={(e) => setFormData({ ...formData, activity: e.target.value })} className="w-full px-5 py-3 bg-white border border-gray-100 rounded-xl outline-none font-bold text-sm" placeholder={language === 'id' ? 'Contoh: Perjalanan ke Bandara' : 'e.g. Travel to Airport'} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{t.plan.location}</label>
                <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-5 py-3 bg-white border border-gray-100 rounded-xl outline-none font-bold text-sm" placeholder={language === 'id' ? 'Contoh: Bandara Soekarno Hatta' : 'e.g. Heathrow Airport'} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{t.plan.notes}</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-5 py-3 bg-white border border-gray-100 rounded-xl outline-none resize-none font-bold text-sm" rows={3} placeholder="..." />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary-50">{t.common.save}</button>
              <button type="button" onClick={cancelEdit} className="flex-1 py-3 bg-white border border-gray-100 text-gray-400 rounded-xl font-black text-[10px] uppercase tracking-widest">{t.common.cancel}</button>
            </div>
          </form>
        </div>
      )}

      {rundowns.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
          <CalendarIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-black uppercase text-[9px] tracking-widest">{t.plan.no_rundown_desc}</p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.keys(sortedGroupedRundowns).sort().map((date) => (
            <div key={date} className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="px-4 py-1.5 bg-primary-50 rounded-lg border border-primary-100">
                  <h3 className="text-[10px] font-black text-primary-600 uppercase tracking-widest font-bold">
                    {format(new Date(date), 'EEEE, d MMM yyyy', { locale: dateLocale })}
                  </h3>
                </div>
              </div>
              <div className="space-y-3 ml-3 sm:ml-6 pl-6 sm:pl-10 border-l-2 border-dashed border-gray-100">
                {sortedGroupedRundowns[date].map((rundown: Rundown) => (
                  <div key={rundown._id} className="group bg-white border border-gray-100 hover:border-primary-50 hover:shadow-lg p-5 rounded-[1.5rem] transition-all duration-300 relative">
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      <div className="flex-1">
                        {rundown.time && (
                          <span className="text-[8px] font-black text-primary-600 px-2 py-0.5 bg-primary-50 rounded-lg mb-2 inline-block uppercase tracking-widest">
                            {rundown.time}
                          </span>
                        )}
                        <h4 className="text-base font-black text-gray-900 mb-1 uppercase tracking-tight">{rundown.activity}</h4>
                        <div className="flex flex-wrap gap-3 text-[9px] font-bold text-gray-400">
                          {rundown.location && <span className="flex items-center gap-1.5 uppercase tracking-tighter"><MapPinIcon className="w-3 h-3 text-primary-400" /> {rundown.location}</span>}
                          {rundown.notes && <span className="flex items-center gap-1.5 uppercase tracking-tighter opacity-60"><NotesIcon className="w-3 h-3" /> {rundown.notes}</span>}
                        </div>
                      </div>
                      {!isCompleted && (
                        <div className="flex gap-1.5">
                          <button onClick={() => startEdit(rundown)} className="p-2 bg-gray-50 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => deleteRundown(rundown._id!)} className="p-2 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MapPinIcon({ className }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> }
function NotesIcon({ className }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> }
