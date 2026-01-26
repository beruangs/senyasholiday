'use client'

import { useState, useEffect } from 'react'
import { useParams, notFound } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { ArrowLeft, Calendar, DollarSign, Users, Share2, Settings, Edit2, Save, X, CheckCircle, FileText, Upload, Image as ImageIcon, ClipboardCheck, Download, Loader2, MapPin, Trash2, Import, Shield } from 'lucide-react'
import RundownTab from './RundownTab'
import ExpensesTab from './ExpensesTab'
import ParticipantsTab from './ParticipantsTab'
import RincianTab from './RincianTab'
import NoteTab from './NoteTab'
import ChecklistTab from './ChecklistTab'
import SplitBillTab from './SplitBillTab'
import AdminManager from './AdminManager'
import SuggestionButton from '@/components/SuggestionButton'
import { useLanguage } from '@/context/LanguageContext'

type Tab = 'info' | 'rundown' | 'expenses' | 'participants' | 'rincian' | 'note' | 'checklist' | 'splitbill'

export default function PlanDetailPage() {
  const params = useParams(); const planId = params.id as string; const { language, t } = useLanguage(); const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<Tab>('rundown'); const [plan, setPlan] = useState<any>(null); const [loading, setLoading] = useState(true)
  const [editingPassword, setEditingPassword] = useState(false); const [newPassword, setNewPassword] = useState(''); const [isCompleting, setIsCompleting] = useState(false); const [showCompleteModal, setShowCompleteModal] = useState(false); const [showReopenModal, setShowReopenModal] = useState(false)
  const [editingInfo, setEditingInfo] = useState(false); const [editForm, setEditForm] = useState({ title: '', destination: '', startDate: '', endDate: '', description: '' }); const [bannerPreview, setBannerPreview] = useState<string | null>(null); const [logoPreview, setLogoPreview] = useState<string | null>(null); const [uploading, setUploading] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false); const [showImportModal, setShowImportModal] = useState(false); const [exportData, setExportData] = useState<string>(''); const [importText, setImportText] = useState(''); const [isImporting, setIsImporting] = useState(false)

  useEffect(() => { fetchPlan() }, [planId])

  const fetchPlan = async () => {
    try {
      const res = await fetch(`/api/plans/${planId}`)
      if (res.ok) {
        const d = await res.json(); setPlan(d); setNewPassword(d.password || '');
        setEditForm({ title: d.title || '', destination: d.destination || '', startDate: d.startDate ? new Date(d.startDate).toISOString().split('T')[0] : '', endDate: d.endDate ? new Date(d.endDate).toISOString().split('T')[0] : '', description: d.description || '' });
        setBannerPreview(d.bannerImage || null); setLogoPreview(d.logoImage || null);
      }
    } catch { toast.error(t.dashboard.loading_data) } finally { setLoading(false) }
  }

  const handleUpdatePassword = async () => {
    try {
      const res = await fetch(`/api/plans/${planId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: newPassword }), })
      if (res.ok) { toast.success(t.common.success); setEditingPassword(false); fetchPlan(); }
    } catch { toast.error(t.common.failed) }
  }

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/plans/${planId}/export`)
      if (res.ok) { setExportData(btoa(JSON.stringify(await res.json()))); setShowExportModal(true); }
    } catch { toast.error(t.common.failed) }
  }

  const handleImport = async () => {
    if (!importText.trim()) return; setIsImporting(true)
    try {
      const res = await fetch(`/api/plans/${planId}/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(JSON.parse(atob(importText.trim()))) })
      if (res.ok) { toast.success(t.common.success); setShowImportModal(false); window.location.reload(); }
    } catch { toast.error(t.plan.invalid_format) } finally { setIsImporting(false) }
  }

  const handleUpdateInfo = async () => {
    if (!editForm.title.trim() || !editForm.destination.trim()) return;
    try {
      const res = await fetch(`/api/plans/${planId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...editForm, startDate: new Date(editForm.startDate), endDate: new Date(editForm.endDate) }), })
      if (res.ok) { toast.success(t.common.success); setEditingInfo(false); fetchPlan(); }
    } catch { toast.error(t.common.failed) }
  }

  const handleImageUpload = async (file: File, type: 'banner' | 'logo') => {
    if (!file.type.startsWith('image/')) return; setUploading(true)
    try {
      const reader = new FileReader(); reader.onloadend = async () => {
        const res = await fetch(`/api/plans/${planId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [type === 'banner' ? 'bannerImage' : 'logoImage']: reader.result as string }), })
        if (res.ok) { toast.success(t.common.success); fetchPlan(); } setUploading(false)
      }; reader.readAsDataURL(file)
    } catch { setUploading(false); toast.error(t.common.failed); }
  }

  const updateStatus = async (status: string) => {
    setIsCompleting(true)
    try {
      const res = await fetch(`/api/plans/${planId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, completedAt: status === 'completed' ? new Date() : null }), })
      if (res.ok) { toast.success(t.common.success); fetchPlan(); setShowCompleteModal(false); setShowReopenModal(false); }
    } catch { toast.error(t.common.failed) } finally { setIsCompleting(false) }
  }

  const handleDeleteImage = async (type: 'banner' | 'logo') => {
    if (!confirm(t.common.confirm_delete)) return; setUploading(true)
    try {
      const res = await fetch(`/api/plans/${planId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [type === 'banner' ? 'bannerImage' : 'logoImage']: null }), })
      if (res.ok) { toast.success(t.common.success); fetchPlan(); }
    } catch { toast.error(t.common.failed) } finally { setUploading(false) }
  }

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-bold"><Loader2 className="animate-spin h-8 w-8 text-primary-600" /></div>
  if (!plan) return notFound();

  const userRole = (session?.user as any)?.role

  return (
    <div className="min-h-screen bg-gray-50/30 font-bold">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/dashboard" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6 font-black uppercase text-[9px] tracking-widest group transition-all"><ArrowLeft className="w-3.5 h-3.5 mr-2 group-hover:-translate-x-1 transition-transform" /> {t.common.back}</Link>

        {/* Scaled Down Premium Header */}
        <div className="mb-8 rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100 bg-white relative">
          <div className="relative h-40 sm:h-64">
            {plan.bannerImage ? <img src={plan.bannerImage} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-900" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute -bottom-8 sm:-bottom-10 left-4 sm:left-8">
              <div className="w-20 h-20 sm:w-36 sm:h-36 rounded-[1.2rem] sm:rounded-[2.5rem] bg-white p-2 shadow-2xl overflow-hidden border-4 border-white">
                {plan.logoImage ? <img src={plan.logoImage} className="w-full h-full object-contain" /> : <div className="w-full h-full bg-primary-600 rounded-[0.8rem] sm:rounded-[1.8rem] flex items-center justify-center"><span className="text-white font-black text-xl sm:text-4xl">SYD</span></div>}
              </div>
            </div>
          </div>

          <div className="pt-14 sm:pt-16 px-4 sm:px-8 pb-6 sm:pb-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
              <div className="flex-1 space-y-4 w-full">
                <h1 className="text-2xl sm:text-5xl font-black text-gray-900 tracking-tight leading-none break-words">{plan.title}</h1>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-4 py-1.5 bg-primary-50 text-primary-600 rounded-full text-[9px] font-black tracking-widest flex items-center gap-2 shadow-sm"><MapPin className="w-3.5 h-3.5" /> {plan.destination}</span>
                  {plan.status === 'completed' && <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm"><CheckCircle className="w-3.5 h-3.5" /> {t.plan.trip_completed}</span>}
                  <span className="px-4 py-1.5 bg-gray-50 text-gray-400 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm"><Calendar className="w-3.5 h-3.5" /> {new Date(plan.startDate).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' })} - {new Date(plan.endDate).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => window.open(`/plan/${planId}?print=true`, '_blank')} className="p-3.5 bg-gray-50 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-2xl transition-all shadow-sm"><FileText className="w-5 h-5" /></button>
                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/plan/${planId}`); toast.success(t.plan.link_copied); }} className="p-3.5 bg-gray-50 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-2xl transition-all shadow-sm"><Share2 className="w-5 h-5" /></button>
                {plan.status !== 'completed' ? <button onClick={() => setShowCompleteModal(true)} className="px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-3"><CheckCircle className="w-4 h-4" /> <span>{language === 'id' ? 'SELESAIKAN' : 'COMPLETE'}</span></button> : <button onClick={() => setShowReopenModal(true)} className="px-6 py-4 bg-primary-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary-100 hover:bg-primary-700 transition-all flex items-center gap-3"><Edit2 className="w-4 h-4" /> <span>{t.plan.yes_reopen}</span></button>}
              </div>
            </div>

            <div className="mt-10 overflow-x-auto no-scrollbar py-2"><nav className="flex items-center gap-2 border-t border-gray-100 pt-6 pb-6">{[
              { id: 'info', label: 'INFO', icon: Settings }, { id: 'rundown', label: t.plan.rundown, icon: Calendar }, { id: 'participants', label: language === 'id' ? 'PESERTA' : 'GUESTS', icon: Users }, { id: 'expenses', label: t.plan.finance, icon: DollarSign }, { id: 'splitbill', label: t.plan.split_bill, icon: ClipboardCheck }, { id: 'note', label: t.plan.notes, icon: FileText }, { id: 'checklist', label: t.plan.checklist, icon: CheckCircle }
            ].map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-primary-600 text-white shadow-lg shadow-primary-100 scale-105' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}><tab.icon className="w-3.5 h-3.5" /> {tab.label}</button>))}</nav></div>
          </div>
        </div>

        <main className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-12 border border-gray-100 shadow-sm min-h-[600px] font-bold animate-in fade-in duration-500">
          {activeTab === 'info' && (<div className="space-y-20">
            <section className="space-y-12">
              <div className="flex justify-between items-center border-b border-gray-50 pb-8"><h2 className="text-2xl font-black uppercase tracking-tight">{t.plan.event_info}</h2>{!editingInfo && plan.status !== 'completed' && <button onClick={() => setEditingInfo(true)} className="px-6 py-3 bg-primary-50 text-primary-600 rounded-xl font-black uppercase text-[9px] tracking-widest">{t.plan.edit_info}</button>}</div>
              {editingInfo ? (<div className="max-w-2xl space-y-8"><InputBox label="JUDUL TRIP" val={editForm.title} setVal={(v: any) => setEditForm({ ...editForm, title: v })} />
                <InputBox label="DESTINASI" val={editForm.destination} setVal={(v: any) => setEditForm({ ...editForm, destination: v })} />
                <div className="grid grid-cols-2 gap-6">
                  <InputBox label="MULAI" val={editForm.startDate} setVal={(v: any) => setEditForm({ ...editForm, startDate: v })} type="date" />
                  <InputBox label="SELESAI" val={editForm.endDate} setVal={(v: any) => setEditForm({ ...editForm, endDate: v })} type="date" />
                </div><div className="space-y-3"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">DESKRIPSI</label><textarea rows={5} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black text-gray-900 focus:bg-white transition-all resize-none" /></div><div className="flex gap-3 pt-4"><button onClick={handleUpdateInfo} className="flex-1 py-4 bg-primary-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary-50 transition-all">SAVE CHANGES</button><button onClick={() => setEditingInfo(false)} className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">CANCEL</button></div></div>) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                  <div className="space-y-12">
                    <div><label className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mb-3 block">Destination Name</label><p className="text-3xl font-black text-primary-600 tracking-tight leading-none">{plan.destination}</p></div>
                    <div><label className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mb-3 block">Description</label><p className="text-base font-bold text-gray-400 leading-relaxed">{plan.description || 'No description provided.'}</p></div>
                  </div>
                  <div className="space-y-12">
                    <div className="p-8 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-6"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t.plan.share_link_password}</label>{editingPassword ? (<div className="flex gap-3"><input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="flex-1 px-5 py-3 bg-white border border-gray-100 rounded-xl font-black outline-none" /><button onClick={handleUpdatePassword} className="px-6 bg-primary-600 text-white rounded-xl uppercase text-[9px] font-black shadow-md">SAVE</button><button onClick={() => setEditingPassword(false)} className="p-2.5 text-gray-400 hover:text-rose-500 transition-all"><X className="w-4 h-4" /></button></div>) : (<div className="flex justify-between items-center"><p className="text-xl font-black uppercase tracking-[0.2em]">{plan.password ? '••••••••' : 'PUBLIC'}</p><button onClick={() => setEditingPassword(true)} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary-600 shadow-sm hover:scale-110 transition-all border border-gray-100"><Edit2 className="w-4 h-4" /></button></div>)}</div>
                    <div className="p-8 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-8"><h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">BRANDING ASSETS</h4><div className="grid grid-cols-2 gap-6"><div><p className="text-[9px] font-black text-gray-900 uppercase mb-4">{t.plan.banner}</p><label className="block w-full h-28 bg-white rounded-2xl border-2 border-dashed border-gray-100 cursor-pointer overflow-hidden relative group transition-all hover:border-primary-200">{bannerPreview ? (<><img src={bannerPreview} className="w-full h-full object-cover group-hover:opacity-40 transition-all" /><button onClick={e => { e.preventDefault(); handleDeleteImage('banner'); }} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100"><Trash2 className="w-8 h-8 text-white bg-rose-600 p-2 rounded-xl" /></button></>) : (<div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2"><Upload className="w-6 h-6" /><span className="text-[8px] font-black uppercase">UPLOAD</span></div>)}<input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'banner')} /></label></div><div><p className="text-[9px] font-black text-gray-900 uppercase mb-4">{t.plan.logo}</p><label className="block w-full h-28 bg-white rounded-2xl border-2 border-dashed border-gray-100 cursor-pointer overflow-hidden relative group transition-all hover:border-primary-200">{logoPreview ? (<><img src={logoPreview} className="w-full h-full object-contain p-4 group-hover:opacity-40 transition-all" /><button onClick={e => { e.preventDefault(); handleDeleteImage('logo'); }} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100"><Trash2 className="w-8 h-8 text-white bg-rose-600 p-2 rounded-xl" /></button></>) : (<div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2"><ImageIcon className="w-6 h-6" /><span className="text-[8px] font-black uppercase">UPLOAD</span></div>)}<input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logo')} /></label></div></div></div>
                  </div>
                </div>
              )}
            </section>

            {plan.canEdit && (
              <section className="pt-24 border-t border-gray-50">
                <AdminManager planId={planId} isOwner={plan.isOwner} isSenPlan={plan.isSenPlan} userRole={userRole} />
              </section>
            )}

            <section className="pt-24 border-t border-gray-50 flex items-center gap-6 opacity-40 hover:opacity-100 transition-opacity"><h4 className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em]">{language === 'id' ? 'SYSTEM TOOLS' : 'ADVANCED'}</h4><div className="flex gap-3"><button onClick={handleExport} className="px-6 py-3 bg-gray-50 text-gray-400 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-gray-900 hover:text-white transition-all flex items-center gap-3"><Download className="w-3.5 h-3.5" /> {t.plan.export}</button><button onClick={() => setShowImportModal(true)} className="px-6 py-3 bg-gray-50 text-gray-400 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-primary-600 hover:text-white transition-all flex items-center gap-3"><Import className="w-3.5 h-3.5" /> {t.plan.import}</button></div></section>
          </div>
          )}

          {activeTab === 'rundown' && <RundownTab planId={planId} isCompleted={plan.status === 'completed'} />}
          {activeTab === 'expenses' && <ExpensesTab planId={planId} isCompleted={plan.status === 'completed'} />}
          {activeTab === 'participants' && <ParticipantsTab planId={planId} isCompleted={plan.status === 'completed'} />}
          {activeTab === 'rincian' && <RincianTab planId={planId} isCompleted={plan.status === 'completed'} />}
          {activeTab === 'note' && <NoteTab planId={planId} isCompleted={plan.status === 'completed'} />}
          {activeTab === 'checklist' && <ChecklistTab planId={planId} isCompleted={plan.status === 'completed'} />}
          {activeTab === 'splitbill' && <SplitBillTab planId={planId} isCompleted={plan.status === 'completed'} />}
        </main>
      </div>

      {/* Modals Scaled Down */}
      {showCompleteModal && (<Modal title={t.plan.complete_event} desc={t.plan.complete_desc} onConfirm={() => updateStatus('completed')} onCancel={() => setShowCompleteModal(false)} okText={t.plan.yes_complete} variant="emerald" loading={isCompleting} />)}
      {showReopenModal && (<Modal title={t.plan.reopen_event} desc={t.plan.reopen_desc} onConfirm={() => updateStatus('active')} onCancel={() => setShowReopenModal(false)} okText={t.plan.yes_reopen} variant="primary" loading={isCompleting} />)}

      {showExportModal && (<div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in"><div className="bg-white rounded-[2.5rem] p-10 w-full max-w-xl shadow-2xl relative border border-gray-100"><h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-3">{t.plan.export}</h3><p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest mb-8">{t.plan.export_desc}</p><div className="bg-gray-50 p-6 rounded-2xl font-mono text-[8px] break-all max-h-[250px] overflow-y-auto text-gray-400 mb-8 leading-relaxed uppercase border border-gray-100">{exportData}</div><div className="flex gap-3"><button onClick={() => { navigator.clipboard.writeText(exportData); toast.success(t.common.success); }} className="flex-[2] py-4 bg-primary-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-primary-50 hover:bg-primary-700 transition-all">COPY STRING</button><button onClick={() => setShowExportModal(false)} className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase text-[10px] transition-all">CLOSE</button></div></div></div>)}
      {showImportModal && (<div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in"><div className="bg-white rounded-[2.5rem] p-10 w-full max-w-xl shadow-2xl relative border border-gray-100"><h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-3">{t.plan.import}</h3><p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest mb-8">{t.plan.import_desc}</p><textarea value={importText} onChange={e => setImportText(e.target.value)} rows={6} className="w-full p-6 bg-gray-50 rounded-2xl font-mono text-[8px] outline-none border-2 border-transparent focus:border-primary-500 transition-all mb-8 uppercase" placeholder="PASTE DATA STRING HERE..." /><div className="flex gap-3"><button onClick={handleImport} disabled={isImporting} className="flex-[2] py-4 bg-primary-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-primary-50 hover:bg-primary-700 transition-all">{isImporting ? 'IMPORTING...' : 'RUN IMPORT'}</button><button onClick={() => setShowImportModal(false)} className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase text-[10px] transition-all">CANCEL</button></div></div></div>)}
      <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
      <SuggestionButton page={`Dashboard Plan Manage - ${plan.title}`} />
    </div>
  )
}

function InputBox({ label, val, setVal, type = 'text' }: any) {
  return (<div className="space-y-3"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</label><input type={type} value={val} onChange={e => setVal(e.target.value)} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black text-gray-900 focus:bg-white focus:border-primary-500 transition-all" /></div>)
}

function Modal({ title, desc, onConfirm, onCancel, okText, variant, loading }: any) {
  const isEmerald = variant === 'emerald'
  return (<div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in transition-all"><div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl animate-in zoom-in-95 text-center border border-gray-50"><div className={`w-20 h-20 ${isEmerald ? 'bg-emerald-50 text-emerald-600' : 'bg-primary-50 text-primary-600'} rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner`}>{isEmerald ? <CheckCircle className="w-10 h-10" /> : <Edit2 className="w-10 h-10" />}</div><h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-3">{title}</h3><p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest mb-10 leading-relaxed">{desc}</p><div className="space-y-3"><button disabled={loading} onClick={onConfirm} className={`w-full py-4 ${isEmerald ? 'bg-emerald-600 shadow-emerald-50' : 'bg-primary-600 shadow-primary-50'} text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95`}>{loading ? 'WAIT...' : okText}</button><button onClick={onCancel} className="w-full py-4 text-gray-300 font-black uppercase text-[10px] tracking-widest hover:text-gray-600 transition-all">NOT NOW</button></div></div></div>)
}
