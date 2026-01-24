'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Users as UsersIcon, X, Check, Search, UserPlus, FileText, Info, Loader2, Edit3, Save } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/context/LanguageContext'

interface Participant {
  _id?: string
  name: string
}

export default function ParticipantsTab({ planId, isCompleted }: { planId: string; isCompleted?: boolean }) {
  const { language, t } = useLanguage()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [name, setName] = useState('')
  const [bulkNames, setBulkNames] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    fetchParticipants()
  }, [planId])

  const fetchParticipants = async () => {
    try {
      const res = await fetch(`/api/participants?planId=${planId}`)
      if (res.ok) {
        const data = await res.json()
        setParticipants(data)
      }
    } catch (error) { toast.error(t.dashboard.loading_data) } finally { setLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (isSubmitting) return; if (!name.trim()) return;
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holidayPlanId: planId, name: name.trim(), order: participants.length }),
      })
      if (res.ok) {
        toast.success(`${t.plan.participant_name} ${t.plan.add_success}`)
        setShowForm(false); setName(''); fetchParticipants();
      }
    } catch (error) { toast.error(t.common.loading) } finally { setIsSubmitting(false) }
  }

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (isSubmitting) return;
    const names = bulkNames.split('\n').map(n => n.trim()).filter(n => n.length > 0)
    if (names.length === 0) return;
    setIsSubmitting(true)
    try {
      const promises = names.map((name, index) =>
        fetch('/api/participants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ holidayPlanId: planId, name, order: participants.length + index }),
        })
      )
      await Promise.all(promises)
      toast.success(language === 'id' ? 'Berhasil ditambahkan secara massal!' : 'Bulk add successful!')
      setShowBulkForm(false); setBulkNames(''); fetchParticipants();
    } catch (error) { toast.error(t.common.loading) } finally { setIsSubmitting(false) }
  }

  const handleUpdateName = async (id: string) => {
    if (!editName.trim()) return
    try {
      const res = await fetch(`/api/participants`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editName.trim() }),
      })
      if (res.ok) {
        toast.success(t.common.save_changes)
        setEditingId(null); fetchParticipants();
      }
    } catch (error) { toast.error(t.common.loading) }
  }

  const deleteParticipant = async (id: string, participantName: string) => {
    if (!confirm(`${t.common.confirm_delete} (${participantName})`)) return
    try {
      const res = await fetch(`/api/participants?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(`${t.plan.participant_name} ${t.plan.delete_success}`)
        fetchParticipants();
      }
    } catch (error) { toast.error(t.common.loading) }
  }

  const filteredParticipants = participants.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))

  if (loading) {
    return <div className="flex justify-center items-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
  }

  return (
    <div className="space-y-8 font-bold">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary-50">
            <UsersIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight leading-tight">{language === 'id' ? 'Daftar Peserta' : 'Guest List'}</h2>
            <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">{language === 'id' ? 'TEMAN LIBURAN' : 'TRAVEL BUDDIES'}</p>
          </div>
        </div>

        {!isCompleted && (
          <div className="flex items-center gap-1.5">
            <button onClick={() => { setShowBulkForm(!showBulkForm); if (!showBulkForm) setShowForm(false); }} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${showBulkForm ? 'bg-gray-100 text-gray-600' : 'bg-primary-50 text-primary-600 hover:bg-primary-100'}`}>
              <FileText className="w-4 h-4" /> {language === 'id' ? 'Bulk' : 'Massal'}
            </button>
            <button onClick={() => { setShowForm(!showForm); if (!showForm) setShowBulkForm(false); }} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg ${showForm ? 'bg-gray-50 text-gray-400' : 'bg-primary-600 text-white shadow-primary-50'}`}>
              <UserPlus className="w-4 h-4" /> {t.common.add}
            </button>
          </div>
        )}
      </div>

      {(showForm || showBulkForm) && (
        <div className="bg-gray-50 rounded-[1.5rem] p-6 sm:p-8 border border-gray-100 font-bold animate-in slide-in-from-top-4 duration-300">
          {showForm ? (
            <div className="space-y-5">
              <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">{t.plan.add_participant}</h3>
              <form onSubmit={handleSubmit} className="flex gap-3">
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="flex-1 px-5 py-3 bg-white border border-gray-100 rounded-xl outline-none font-bold text-gray-900 text-sm" placeholder={language === 'id' ? 'Isi nama teman kamu...' : "Type your buddy's name..."} />
                <button type="submit" className="px-8 py-3 bg-primary-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary-50">{t.common.save}</button>
              </form>
            </div>
          ) : (
            <div className="space-y-5">
              <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">{language === 'id' ? 'Tambah Teman Sekaligus' : 'Add Multiple Buddies'}</h3>
              <textarea required value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} className="w-full px-5 py-3 bg-white border border-gray-100 rounded-xl outline-none font-bold text-gray-900 text-sm min-h-[150px] resize-none" placeholder={language === 'id' ? 'Satu nama per baris...' : 'One name per line...'} />
              <div className="flex justify-between items-center text-[9px] font-black uppercase text-gray-400 tracking-widest">
                <p>{bulkNames.split('\n').filter(n => n.trim().length > 0).length} DETECTED</p>
                <button onClick={handleBulkSubmit} className="px-8 py-3 bg-primary-600 text-white rounded-xl font-black text-[10px] shadow-lg shadow-primary-50 transition-all">SAVE ALL</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-gray-50/50 rounded-[2rem] p-6 sm:p-8 border border-gray-100 font-bold">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <h3 className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">{language === 'id' ? 'Daftar Teman' : 'GUEST LIST'}</h3>
          <div className="relative w-full sm:w-64 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 group-focus-within:text-primary-600 transition-all font-bold" />
            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-5 py-2.5 bg-white border border-gray-100 rounded-xl outline-none font-black text-[10px] uppercase shadow-sm" />
          </div>
        </div>

        {filteredParticipants.length === 0 ? (
          <div className="text-center py-16 bg-white border-2 border-dashed border-gray-100 rounded-[2rem] font-bold">
            <UsersIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-black uppercase text-[9px] tracking-widest">{t.dashboard.no_plans_desc}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredParticipants.map((p, idx) => (
              <div key={p._id} className="group bg-white border border-gray-100 hover:border-primary-100 hover:shadow-lg p-4 rounded-xl transition-all relative overflow-hidden">
                <div className="flex justify-between items-start mb-3">
                  <div className="w-8 h-8 bg-gray-50 text-gray-400 group-hover:bg-primary-600 group-hover:text-white rounded-lg flex items-center justify-center font-black text-[10px] transition-all">{idx + 1}</div>
                  {!isCompleted && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      {editingId === p._id ? (
                        <button onClick={() => handleUpdateName(p._id!)} className="p-1 text-primary-600 hover:bg-primary-50 rounded-md transition-all"><Save className="w-3.5 h-3.5" /></button>
                      ) : (
                        <button onClick={() => { setEditingId(p._id!); setEditName(p.name); }} className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
                      )}
                      <button onClick={() => deleteParticipant(p._id!, p.name)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>
                {editingId === p._id ? (
                  <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleUpdateName(p._id!)} className="w-full px-2.5 py-1.5 bg-gray-50 border border-primary-100 rounded-lg outline-none font-black text-xs uppercase" />
                ) : (
                  <div>
                    <h4 className="font-black text-sm text-gray-900 group-hover:text-primary-600 transition-all uppercase leading-tight truncate">{p.name}</h4>
                    <span className="text-[7px] font-black text-primary-300 uppercase tracking-widest mt-0.5 block">CONFIRMED</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-primary-50/50 border border-primary-100 rounded-[1.5rem] p-6 flex items-center gap-4 font-bold">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0"><Info className="w-5 h-5 text-primary-600" /></div>
        <div>
          <h4 className="text-primary-900 font-black text-sm uppercase tracking-tight">{language === 'id' ? 'Kelola Peserta' : 'Manage Buddies'}</h4>
          <p className="text-primary-700/50 text-[9px] font-bold leading-relaxed mt-0.5 uppercase tracking-wide">{language === 'id' ? 'Gunakan fitur massal jika ingin mengimpor nama dari WhatsApp atau Spreadsheet dengan cepat.' : 'Use bulk feature to quickly import names from WhatsApp or Spreadsheets.'}</p>
        </div>
      </div>
    </div>
  )
}
