'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Calendar as CalendarIcon, Edit2, X, Download, Sparkles, Loader2, MapPin, Search, Wand2, MessageSquare } from 'lucide-react'
import { useSession } from 'next-auth/react'
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
  coordinates?: {
    lat: number
    lng: number
    formattedAddress?: string
  }
}

export default function RundownTab({ planId, isCompleted }: { planId: string; isCompleted?: boolean }) {
  const { language, t } = useLanguage()
  const { data: session } = useSession()
  const [rundowns, setRundowns] = useState<Rundown[]>([])
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [aiPreferences, setAiPreferences] = useState('')
  const [formData, setFormData] = useState<Rundown>({
    date: '',
    time: '',
    activity: '',
    location: '',
    notes: '',
  })

  const formRef = useRef<HTMLDivElement>(null)

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
          // Don't reset date to make it easier to add multiple items for same date
          const lastDate = formData.date
          setFormData({ date: lastDate, time: '', activity: '', location: '', notes: '' })
          fetchRundowns()
          // Optional: keep form open for continuous adding
          // setShowForm(false) 
        }
      }
    } catch (error) {
      toast.error(t.common.loading)
    }
  }

  const startEdit = (rundown: Rundown) => {
    setEditingId(rundown._id || null)
    // Format date for HTML5 input (YYYY-MM-DD)
    const formattedDate = rundown.date ? format(new Date(rundown.date), 'yyyy-MM-dd') : ''
    setFormData({ ...rundown, date: formattedDate })
    setShowForm(true)
    // Scroll to form with offset
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const startAddAtDate = (date: string) => {
    const formattedDate = format(new Date(date), 'yyyy-MM-dd')
    setFormData({
      date: formattedDate,
      time: '',
      activity: '',
      location: '',
      notes: '',
    })
    setEditingId(null)
    setShowForm(true)
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
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

  const handleAIGenerate = async () => {
    if (!aiPreferences.trim()) {
      toast.error(language === 'id' ? 'Ceritakan sedikit tentang keinginan Anda!' : 'Please tell us a bit about your preferences!')
      return
    }

    setIsGenerating(true)
    setShowAIModal(false)

    try {
      const res = await fetch('/api/ai/itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': language
        },
        body: JSON.stringify({ planId, preferences: aiPreferences }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to generate')
      }

      const data = await res.json()

      // Save each item to the database
      toast.loading(language === 'id' ? 'Menyusun jadwal ke database...' : 'Saving itinerary to database...', { id: 'ai-sync' })

      for (const item of data) {
        await fetch('/api/rundowns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ holidayPlanId: planId, ...item }),
        })
      }

      toast.success(language === 'id' ? 'Jadwal ajaib berhasil dibuat!' : 'AI Magic Itinerary created!', { id: 'ai-sync' })
      setAiPreferences('')
      fetchRundowns()
    } catch (error: any) {
      toast.error(error.message || 'AI Generation failed', { id: 'ai-sync' })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSyncCalendar = async () => {
    const isPremium = (session?.user as any)?.isPremium || (session?.user as any)?.role === 'superadmin'

    if (!isPremium) {
      toast.error(t.plan.sync_calendar, {
        description: t.plan.premium_sync_desc
      })
      return
    }

    if (rundowns.length === 0) {
      toast.error(t.plan.no_rundown)
      return
    }

    setIsSyncing(true)
    try {
      // Generate ICS format
      let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//SenYas Daddy//Holiday Planner//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
      ]

      rundowns.forEach((item) => {
        const dateStr = format(new Date(item.date), 'yyyyMMdd')
        let startTime = '000000'
        let endTime = '010000'

        if (item.time) {
          startTime = item.time.replace(':', '') + '00'
          // End time 1 hour after start as default
          const [h, m] = item.time.split(':').map(Number)
          endTime = format(new Date(2000, 0, 1, h + 1, m), 'HHmm') + '00'
        }

        icsContent.push('BEGIN:VEVENT')
        icsContent.push(`UID:${item._id}@senyasholiday.vercel.app`)
        icsContent.push(`DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`)
        icsContent.push(`DTSTART;TZID=Asia/Jakarta:${dateStr}T${startTime}`)
        icsContent.push(`DTEND;TZID=Asia/Jakarta:${dateStr}T${endTime}`)
        icsContent.push(`SUMMARY:${item.activity}`)
        if (item.location) icsContent.push(`LOCATION:${item.location}`)
        if (item.notes) icsContent.push(`DESCRIPTION:${item.notes.replace(/\n/g, '\\n')}`)
        icsContent.push('END:VEVENT')
      })

      icsContent.push('END:VCALENDAR')

      const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `trip-rundown-${planId}.ics`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success(t.plan.sync_success, {
        description: t.plan.sync_success_desc
      })
    } catch (error) {
      toast.error(t.common.failed)
    } finally {
      setIsSyncing(false)
    }
  }

  if (loading) {
    return <div className="text-center py-10"><CalendarIcon className="w-8 h-8 animate-pulse text-gray-200 mx-auto" /></div>
  }

  const groupedRundowns = rundowns.reduce((acc: any, rundown) => {
    const dateKey = format(new Date(rundown.date), 'yyyy-MM-dd')
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(rundown)
    return acc
  }, {})

  const sortedGroupedRundowns = Object.keys(groupedRundowns).reduce((acc: any, date) => {
    acc[date] = groupedRundowns[date].sort((a: Rundown, b: Rundown) => (a.time || '').localeCompare(b.time || ''))
    return acc
  }, {})

  const isPremium = (session?.user as any)?.isPremium || (session?.user as any)?.role === 'superadmin'

  const openInGoogleMaps = (location: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
    window.open(url, '_blank')
  }

  const openDayRoute = (date: string) => {
    if (!isPremium) {
      toast.error('Fitur Premium', { description: 'Tampilan rute perjalanan harian hanya tersedia untuk member Premium.' })
      return
    }
    const dayItems = sortedGroupedRundowns[date]
    const locations = dayItems.map((item: Rundown) => item.location).filter(Boolean)
    if (locations.length < 2) {
      toast.error(language === 'id' ? 'Butuh minimal 2 lokasi untuk membuat rute.' : 'Need at least 2 locations to create a route.')
      return
    }

    // Google Maps Route URL: https://www.google.com/maps/dir/Loc1/Loc2/Loc3...
    const origin = encodeURIComponent(locations[0])
    const destination = encodeURIComponent(locations[locations.length - 1])
    const waypoints = locations.slice(1, -1).map(encodeURIComponent).join('|')
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`
    window.open(url, '_blank')
  }

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
        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncCalendar}
            disabled={isSyncing}
            className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl hover:bg-black transition-all font-black text-[10px] uppercase tracking-widest group shadow-xl"
          >
            {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 group-hover:-translate-y-1 transition-transform" />}
            <span>SYNC</span>
            {!(session?.user as any)?.isPremium && (session?.user as any)?.role !== 'superadmin' && (
              <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
            )}
          </button>

          <button
            onClick={() => {
              if (!isPremium) {
                toast.error('AI Magic Itinerary', { description: 'Fitur AI hanya tersedia untuk member Premium.' })
                return
              }
              setShowAIModal(true)
            }}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-black text-[10px] uppercase tracking-widest group shadow-xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />}
            <span>MAGIC</span>
            {!isPremium && <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />}
          </button>
          {!isCompleted && (
            <button onClick={() => {
              if (showForm && !editingId) setShowForm(false)
              else {
                setEditingId(null)
                setFormData({ date: '', time: '', activity: '', location: '', notes: '' })
                setShowForm(true)
                setTimeout(() => {
                  formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }, 100)
              }
            }} className="flex items-center gap-2 px-5 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-black text-[10px] uppercase tracking-widest group shadow-xl">
              <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
              <span>{t.common.add}</span>
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div ref={formRef} className="bg-gray-50 rounded-[1.5rem] p-6 sm:p-8 border border-gray-100 font-bold relative animate-in slide-in-from-top-4 duration-300 scroll-mt-24">
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
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex justify-between items-center">
                  <span>{t.plan.location}</span>
                </label>
                <LocationSearch
                  value={formData.location}
                  onChange={(val, coords) => {
                    setFormData(prev => ({
                      ...prev,
                      location: val,
                      coordinates: coords || prev.coordinates
                    }))
                  }}
                  placeholder={language === 'id' ? 'Cari lokasi...' : 'Search location...'}
                />
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

      {showAIModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl relative border border-gray-100 animate-in zoom-in-95">
            <button onClick={() => setShowAIModal(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><X className="w-4 h-4" /></button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">{language === 'id' ? 'AI Itinerary Magic' : 'AI Trip Designer'}</h3>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">GEMINI 1.5 FLASH ENGINE</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                <p className="text-[10px] font-bold text-indigo-900 leading-relaxed uppercase">
                  {language === 'id'
                    ? 'Beri tahu kami gaya liburan Anda (misal: "Santai, banyak kuliner, ramah anak") dan AI akan menyusun jadwal otomatis untuk Anda.'
                    : 'Tell us your travel style (e.g., "Relaxed, foodie focus, kid-friendly") and AI will draft your schedule automatically.'}
                </p>
              </div>

              <div className="relative">
                <MessageSquare className="absolute top-4 left-4 w-4 h-4 text-gray-300" />
                <textarea
                  value={aiPreferences}
                  onChange={(e) => setAiPreferences(e.target.value)}
                  className="w-full pl-11 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-sm resize-none focus:bg-white focus:border-indigo-500 transition-all"
                  rows={4}
                  placeholder={language === 'id' ? 'Tulis keinginan Anda di sini...' : 'Write your wishes here...'}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleAIGenerate}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 fill-white" />
                {language === 'id' ? 'BUAT JADWAL' : 'GENERATE'}
              </button>
            </div>
          </div>
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
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="px-4 py-1.5 bg-primary-50 rounded-lg border border-primary-100">
                    <h3 className="text-[10px] font-black text-primary-600 uppercase tracking-widest font-bold">
                      {format(new Date(date), 'EEEE, d MMM yyyy', { locale: dateLocale })}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openDayRoute(date)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-black transition-all font-black text-[8px] uppercase tracking-widest group shadow-md"
                  >
                    <MapPin className="w-3 h-3 text-primary-400" />
                    <span>{language === 'id' ? 'LIHAT RUTE' : 'DAY ROUTE'}</span>
                    {!isPremium && <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />}
                  </button>
                  {!isCompleted && (
                    <button onClick={() => startAddAtDate(date)} className="p-2 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg transition-all group" title={t.common.add}>
                      <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
                    </button>
                  )}
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
                        <h4 className="text-base font-black text-gray-900 mb-1 tracking-tight">{rundown.activity}</h4>
                        <div className="flex flex-wrap gap-3 text-[9px] font-bold text-gray-400">
                          {rundown.location && (
                            <button
                              onClick={() => openInGoogleMaps(rundown.location)}
                              disabled={!isPremium && rundown.location.length > 20} // Just a demo restriction
                              className={`flex items-center gap-1.5 tracking-tighter transition-all ${isPremium ? 'text-primary-600 hover:underline cursor-pointer' : 'text-gray-400'}`}
                            >
                              <MapPin className={`w-3 h-3 ${isPremium ? 'text-primary-600' : 'text-primary-400'}`} />
                              {rundown.location}
                              {!isPremium && <span className="ml-1 text-[7px] opacity-40">(Premium navigasi)</span>}
                            </button>
                          )}
                          {rundown.notes && <span className="flex items-center gap-1.5 tracking-tighter opacity-60"><NotesIcon className="w-3 h-3" /> {rundown.notes}</span>}
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

function NotesIcon({ className }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> }

function LocationSearch({ value, onChange, placeholder }: { value: string, onChange: (val: string, coords?: any) => void, placeholder: string }) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [showDropdown, setShowDropdown] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const fetchSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setStatus('idle');
      return;
    }

    setStatus('loading');
    try {
      // Using Photon API (OpenStreetMap based) - Zero cost, no API key
      const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`);
      const data = await response.json();

      if (data.features) {
        setSuggestions(data.features);
        setStatus('ok');
        setShowDropdown(true);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
      setStatus('error');
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 500);
  };

  const handleSelect = (feature: any) => {
    const { properties, geometry } = feature;

    // Construct address string
    const parts = [
      properties.name,
      properties.city || properties.town,
      properties.state,
      properties.country
    ].filter(Boolean);

    const description = parts.join(', ');
    const [lng, lat] = geometry.coordinates;

    setInputValue(description);
    setShowDropdown(false);

    onChange(description, {
      lat,
      lng,
      formattedAddress: description
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          value={inputValue}
          onChange={handleInput}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          className="w-full px-5 py-3 bg-white border border-gray-100 rounded-xl outline-none font-bold text-sm pr-10"
          placeholder={placeholder}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {status === 'loading' ? <Loader2 className="w-4 h-4 text-primary-500 animate-spin" /> : <Search className="w-4 h-4 text-gray-300" />}
        </div>
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {suggestions.map((feature, idx) => {
            const { properties } = feature;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(feature)}
                className="w-full text-left px-5 py-3.5 hover:bg-primary-50 transition-colors flex items-start gap-3 group"
              >
                <div className="mt-0.5 p-1.5 bg-gray-50 rounded-lg text-gray-400 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-sm font-black text-gray-900 group-hover:text-primary-700 truncate">{properties.name}</div>
                  <div className="text-[10px] font-bold text-gray-400 group-hover:text-primary-400 truncate">
                    {[properties.city, properties.state, properties.country].filter(Boolean).join(', ')}
                  </div>
                </div>
              </button>
            );
          })}
          <div className="px-5 py-2 bg-gray-50 border-t border-gray-100 flex justify-end items-center gap-1.5">
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Data by OpenStreetMap</span>
          </div>
        </div>
      )}
    </div>
  );
}
