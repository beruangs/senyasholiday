'use client'

import { useState, useEffect } from 'react'
import { useParams, notFound, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { ArrowLeft, Calendar, DollarSign, Users, Share2, Settings, Edit2, Save, X, CheckCircle, FileText, Upload, Image as ImageIcon, ClipboardCheck, Download, Loader2, MapPin, Trash2, Import, Shield, Sparkles, Cloud } from 'lucide-react'
import RundownTab from './RundownTab'
import ExpensesTab from './ExpensesTab'
import ParticipantsTab from './ParticipantsTab'
import RincianTab from './RincianTab'
import NoteTab from './NoteTab'
import ChecklistTab from './ChecklistTab'
import SplitBillTab from './SplitBillTab'
import AdminManager from './AdminManager'
import TravelDocumentTab from './VaultTab'
import SuggestionButton from '@/components/SuggestionButton'
import OfflineSync from '@/components/OfflineSync'
import { useLanguage } from '@/context/LanguageContext'

type Tab = 'info' | 'rundown' | 'expenses' | 'participants' | 'rincian' | 'note' | 'checklist' | 'splitbill' | 'personalize' | 'vault'

export default function PlanDetailPage() {
  const params = useParams(); const router = useRouter(); const planId = params.id as string; const { language, t } = useLanguage(); const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<Tab>('info'); const [plan, setPlan] = useState<any>(null); const [loading, setLoading] = useState(true)
  const [editingPassword, setEditingPassword] = useState(false); const [newPassword, setNewPassword] = useState(''); const [isCompleting, setIsCompleting] = useState(false); const [showCompleteModal, setShowCompleteModal] = useState(false); const [showReopenModal, setShowReopenModal] = useState(false)
  const [editingInfo, setEditingInfo] = useState(false); const [editForm, setEditForm] = useState({ title: '', destination: '', startDate: '', endDate: '', description: '', accommodationType: '', accommodationName: '', checkInTime: '', checkOutTime: '' }); const [bannerPreview, setBannerPreview] = useState<string | null>(null); const [logoPreview, setLogoPreview] = useState<string | null>(null); const [uploading, setUploading] = useState(false)
  const [personalizeForm, setPersonalizeForm] = useState({ slug: '', theme: 'default', customPrimaryColor: '#ff3838' });
  const [showExportModal, setShowExportModal] = useState(false); const [showImportModal, setShowImportModal] = useState(false); const [exportData, setExportData] = useState<string>(''); const [importText, setImportText] = useState(''); const [isImporting, setIsImporting] = useState(false); const [showPremiumPopup, setShowPremiumPopup] = useState(false)
  const [aiConsulting, setAiConsulting] = useState(false); const [aiAdvice, setAiAdvice] = useState<string | null>(null); const [userBudget, setUserBudget] = useState('');
  const [weatherData, setWeatherData] = useState<any>(null); const [weatherLoading, setWeatherLoading] = useState(false);
  const [isOfflineData, setIsOfflineData] = useState(false);

  useEffect(() => {
    fetchPlan()

    // Smart Throttled Ad Popup (Only every 10 minutes)
    const isPremium = (session?.user as any)?.isPremium
    const isSuperadmin = (session?.user as any)?.role === 'superadmin'

    if (session && !isPremium && !isSuperadmin) {
      const LAST_POPUP_KEY = 'syd_last_premium_popup'
      const TEN_MINUTES = 10 * 60 * 1000
      const lastShown = localStorage.getItem(LAST_POPUP_KEY)
      const now = Date.now()

      if (!lastShown || (now - parseInt(lastShown)) > TEN_MINUTES) {
        // Show with a slight delay so it's not immediate/aggressive
        const timer = setTimeout(() => {
          setShowPremiumPopup(true)
          localStorage.setItem(LAST_POPUP_KEY, now.toString())
        }, 3000)
        return () => clearTimeout(timer)
      }
    }
  }, [planId, session])

  const fetchPlan = async () => {
    try {
      const res = await fetch(`/api/plans/${planId}`)
      if (res.ok) {
        const d = await res.json(); setPlan(d); setNewPassword(d.password || '');
        setEditForm({
          title: d.title || '',
          destination: d.destination || '',
          startDate: d.startDate ? new Date(d.startDate).toISOString().split('T')[0] : '',
          endDate: d.endDate ? new Date(d.endDate).toISOString().split('T')[0] : '',
          description: d.description || '',
          accommodationType: d.accommodationType || '',
          accommodationName: d.accommodationName || '',
          checkInTime: d.checkInTime || '',
          checkOutTime: d.checkOutTime || ''
        });
        setBannerPreview(d.bannerImage || null); setLogoPreview(d.logoImage || null);
        fetchWeather(d.destination);
        setPersonalizeForm({ slug: d.slug || '', theme: d.theme || 'default', customPrimaryColor: d.customPrimaryColor || '#ff3838' });
        setIsOfflineData(false);
      } else {
        throw new Error('Fetch failed');
      }
    } catch {
      const cached = localStorage.getItem(`offline_plan_${planId}`);
      if (cached) {
        const d = JSON.parse(cached);
        setPlan(d);
        setIsOfflineData(true);
        toast.info(language === 'id' ? 'Mode Offline Aktif' : 'Offline Mode Active');
      } else {
        toast.error(t.dashboard.loading_data);
      }
    } finally { setLoading(false) }
  }

  const fetchWeather = async (dest: string) => {
    if (!dest) return;
    setWeatherLoading(true);
    try {
      const res = await fetch(`/api/weather?q=${encodeURIComponent(dest)}`);
      if (res.ok) setWeatherData(await res.json());
    } catch { } finally { setWeatherLoading(false); }
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
      else { const err = await res.json(); toast.error(err.error || t.common.failed); }
    } catch { toast.error(t.common.failed) }
  }

  const handleUpdatePersonalization = async () => {
    try {
      const res = await fetch(`/api/plans/${planId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(personalizeForm), })
      if (res.ok) { toast.success(t.common.success); fetchPlan(); }
      else { const err = await res.json(); toast.error(err.error || t.common.failed); }
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

  const handleConsultAI = async (action: 'budget' | 'tips') => {
    if (action === 'budget' && !userBudget) {
      toast.error(t.plan.budget_input_placeholder)
      return
    }
    setAiConsulting(true)
    try {
      const res = await fetch('/api/ai/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, budget: userBudget, action, lang: language })
      })
      if (res.ok) {
        const data = await res.json()
        setAiAdvice(data.advice)
      } else {
        const err = await res.json()
        toast.error(err.error || 'AI Failed')
      }
    } catch {
      toast.error(t.common.failed)
    } finally {
      setAiConsulting(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-bold"><Loader2 className="animate-spin h-8 w-8 text-primary-600" /></div>
  if (!plan) return notFound();

  // Permissions
  const userRole = (session?.user as any)?.role
  const isPremium = (session?.user as any)?.isPremium || userRole === 'superadmin'
  const isPremiumAI = (session?.user as any)?.planType === 'premium_ai' || userRole === 'superadmin'

  // Generate theme styles for the dashboard
  const themeStyles = personalizeForm.theme === 'custom' ? {
    '--primary': personalizeForm.customPrimaryColor,
    '--primary-dark': personalizeForm.customPrimaryColor, // Could be darkened further
    '--tw-shadow-color': `${personalizeForm.customPrimaryColor}33`, // 20% opacity for shadows
    '--bg-primary-50': `${personalizeForm.customPrimaryColor}10`, // 6% opacity
  } as React.CSSProperties : {}

  return (
    <div className="min-h-screen bg-gray-50/30 font-bold" data-plan-theme={personalizeForm.theme} style={themeStyles}>
      <OfflineSync planId={planId} isPremium={isPremium} data={plan} />
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
                  {isOfflineData && <span className="px-4 py-1.5 bg-amber-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm animate-pulse"><Shield className="w-3.5 h-3.5" /> {language === 'id' ? 'MODE OFFLINE' : 'OFFLINE MODE'}</span>}
                  {plan.status === 'completed' && <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm"><CheckCircle className="w-3.5 h-3.5" /> {t.plan.trip_completed}</span>}
                  <span className="px-4 py-1.5 bg-gray-50 text-gray-400 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm"><Calendar className="w-3.5 h-3.5" /> {new Date(plan.startDate).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' })} - {new Date(plan.endDate).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (!(session?.user as any)?.isPremium && userRole !== 'superadmin') {
                      toast.error('Fitur Premium', { description: 'Cetak Laporan Keuangan hanya tersedia untuk pengguna Premium.' });
                      return;
                    }
                    window.open(`/plan/${planId}?print=true`, '_blank');
                  }}
                  className="p-3.5 bg-gray-50 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-2xl transition-all shadow-sm"
                >
                  <FileText className="w-5 h-5" />
                </button>
                <button onClick={() => { const link = plan.slug ? `${window.location.origin}/plan/${plan.slug}` : `${window.location.origin}/plan/${planId}`; navigator.clipboard.writeText(link); toast.success(t.plan.link_copied); }} className="p-3.5 bg-gray-50 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-2xl transition-all shadow-sm"><Share2 className="w-5 h-5" /></button>
                {plan.status !== 'completed' ? <button onClick={() => setShowCompleteModal(true)} className="px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-3"><CheckCircle className="w-4 h-4" /> <span>{language === 'id' ? 'SELESAIKAN' : 'COMPLETE'}</span></button> : <button onClick={() => setShowReopenModal(true)} className="px-6 py-4 bg-primary-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary-100 hover:bg-primary-700 transition-all flex items-center gap-3"><Edit2 className="w-4 h-4" /> <span>{t.plan.yes_reopen}</span></button>}
              </div>
            </div>

            <div className="mt-10 overflow-x-auto no-scrollbar py-2"><nav className="flex items-center gap-2 border-t border-gray-100 pt-6 pb-6">{[
              { id: 'info', label: 'INFO', icon: Settings },
              { id: 'personalize', label: (t.common?.personalize || 'Personalize').toUpperCase(), icon: Sparkles, premium: true },
              { id: 'rundown', label: t.plan.rundown, icon: Calendar },
              { id: 'participants', label: t.plan.participants.toUpperCase(), icon: Users },
              { id: 'expenses', label: t.plan.finance, icon: DollarSign },
              { id: 'splitbill', label: t.plan.split_bill, icon: ClipboardCheck },
              { id: 'vault', label: t.plan.vault, icon: Shield },
              { id: 'note', label: t.plan.notes, icon: FileText },
              { id: 'checklist', label: t.plan.checklist, icon: CheckCircle }
            ].map(tab => {
              const isPremium = (session?.user as any)?.isPremium || (session?.user as any)?.role === 'superadmin';
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-primary-600 text-white shadow-lg shadow-primary-100 scale-105' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}>
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.premium && <Sparkles className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />}
                </button>
              )
            })}</nav></div>
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
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t.plan.accommodation_type}</label>
                    <div className="relative">
                      <select
                        value={editForm.accommodationType}
                        onChange={e => setEditForm({ ...editForm, accommodationType: e.target.value })}
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black text-gray-900 focus:bg-white focus:border-primary-500 transition-all appearance-none"
                      >
                        <option value="">{language === 'id' ? '-- PILIH TIPE --' : '-- SELECT TYPE --'}</option>
                        <option value="hotel">{t.plan.accommodation_types.hotel}</option>
                        <option value="villa">{t.plan.accommodation_types.villa}</option>
                        <option value="apartment">{t.plan.accommodation_types.apartment}</option>
                        <option value="homestay">{t.plan.accommodation_types.homestay}</option>
                        <option value="house">{t.plan.accommodation_types.house}</option>
                        <option value="other">{t.plan.accommodation_types.other}</option>
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <ArrowLeft className="w-4 h-4 -rotate-90" />
                      </div>
                    </div>
                  </div>
                  <InputBox label={t.plan.accommodation_name.toUpperCase()} val={editForm.accommodationName} setVal={(v: any) => setEditForm({ ...editForm, accommodationName: v })} />
                </div>
                <div className="grid grid-cols-2 gap-6 pb-4">
                  <InputBox label={t.plan.check_in.toUpperCase()} val={editForm.checkInTime} setVal={(v: any) => setEditForm({ ...editForm, checkInTime: v })} type="time" />
                  <InputBox label={t.plan.check_out.toUpperCase()} val={editForm.checkOutTime} setVal={(v: any) => setEditForm({ ...editForm, checkOutTime: v })} type="time" />
                </div>
                <div className="space-y-3"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">DESKRIPSI</label><textarea rows={5} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black text-gray-900 focus:bg-white transition-all resize-none" /></div><div className="flex gap-3 pt-4"><button onClick={handleUpdateInfo} className="flex-1 py-4 bg-primary-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary-50 transition-all">SAVE CHANGES</button><button onClick={() => setEditingInfo(false)} className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">CANCEL</button></div></div>) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                  <div className="space-y-12">
                    <div><label className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mb-3 block">Destination Name</label><p className="text-3xl font-black text-primary-600 tracking-tight leading-none">{plan.destination}</p></div>
                    <div>
                      <label className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mb-3 block">{t.plan.accommodation}</label>
                      <p className="text-xl font-black text-gray-800 tracking-tight leading-none uppercase">
                        {plan.accommodationType ? (t.plan.accommodation_types[plan.accommodationType] || plan.accommodationType) : '-'}
                        {plan.accommodationName && <span className="text-primary-600 block sm:inline mt-2 sm:mt-0 font-black"> @ {plan.accommodationName}</span>}
                      </p>
                      {(plan.checkInTime || plan.checkOutTime) && (
                        <div className="flex gap-4 mt-3">
                          {plan.checkInTime && <span className="px-3 py-1 bg-primary-50 text-primary-600 rounded-lg text-[8px] font-black uppercase tracking-widest">{t.plan.check_in}: {plan.checkInTime}</span>}
                          {plan.checkOutTime && <span className="px-3 py-1 bg-gray-50 text-gray-400 rounded-lg text-[8px] font-black uppercase tracking-widest">{t.plan.check_out}: {plan.checkOutTime}</span>}
                        </div>
                      )}
                    </div>
                    <div><label className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mb-3 block">Description</label><p className="text-base font-bold text-gray-400 leading-relaxed">{plan.description || (language === 'id' ? 'Tidak ada deskripsi.' : 'No description.')}</p></div>
                  </div>
                  <div className="space-y-12">
                    <div className="p-8 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-6"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t.plan.share_link_password}</label>{editingPassword ? (<div className="flex gap-3"><input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="flex-1 px-5 py-3 bg-white border border-gray-100 rounded-xl font-black outline-none" /><button onClick={handleUpdatePassword} className="px-6 bg-primary-600 text-white rounded-xl uppercase text-[9px] font-black shadow-md">SAVE</button><button onClick={() => setEditingPassword(false)} className="p-2.5 text-gray-400 hover:text-rose-500 transition-all"><X className="w-4 h-4" /></button></div>) : (<div className="flex justify-between items-center"><p className="text-xl font-black uppercase tracking-[0.2em]">{plan.password ? '••••••••' : 'PUBLIC'}</p><button onClick={() => setEditingPassword(true)} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary-600 shadow-sm hover:scale-110 transition-all border border-gray-100"><Edit2 className="w-4 h-4" /></button></div>)}</div>
                    <div className="p-8 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-8">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">BRANDING ASSETS</h4>
                        {!(session?.user as any)?.isPremium && userRole !== 'superadmin' && <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-[9px] font-black text-gray-900 uppercase mb-4">{t.plan.banner}</p>
                          <label className="block w-full h-28 bg-white rounded-2xl border-2 border-dashed border-gray-100 cursor-pointer overflow-hidden relative group transition-all hover:border-primary-200">
                            {bannerPreview ? (
                              <>
                                <img src={bannerPreview} className="w-full h-full object-cover group-hover:opacity-40 transition-all" />
                                <button onClick={e => { e.preventDefault(); handleDeleteImage('banner'); }} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100"><Trash2 className="w-8 h-8 text-white bg-rose-600 p-2 rounded-xl" /></button>
                              </>
                            ) : (
                              <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                                {!(session?.user as any)?.isPremium && userRole !== 'superadmin' ? <Shield className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                                <span className="text-[8px] font-black uppercase text-center px-4">{!(session?.user as any)?.isPremium && userRole !== 'superadmin' ? 'PREMIUM ONLY' : 'UPLOAD'}</span>
                              </div>
                            )}
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              disabled={!(session?.user as any)?.isPremium && userRole !== 'superadmin'}
                              onChange={e => {
                                if (!(session?.user as any)?.isPremium && userRole !== 'superadmin') {
                                  toast.error('Fitur Premium', { description: 'Gunakan akun Premium untuk upload logo & banner.' });
                                  return;
                                }
                                e.target.files?.[0] && handleImageUpload(e.target.files[0], 'banner');
                              }}
                            />
                          </label>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-900 uppercase mb-4">{t.plan.logo}</p>
                          <label className="block w-full h-28 bg-white rounded-2xl border-2 border-dashed border-gray-100 cursor-pointer overflow-hidden relative group transition-all hover:border-primary-200">
                            {logoPreview ? (
                              <>
                                <img src={logoPreview} className="w-full h-full object-contain p-4 group-hover:opacity-40 transition-all" />
                                <button onClick={e => { e.preventDefault(); handleDeleteImage('logo'); }} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100"><Trash2 className="w-8 h-8 text-white bg-rose-600 p-2 rounded-xl" /></button>
                              </>
                            ) : (
                              <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                                {!(session?.user as any)?.isPremium && userRole !== 'superadmin' ? <Shield className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                                <span className="text-[8px] font-black uppercase text-center px-4">{!(session?.user as any)?.isPremium && userRole !== 'superadmin' ? 'PREMIUM ONLY' : 'UPLOAD'}</span>
                              </div>
                            )}
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              disabled={!(session?.user as any)?.isPremium && userRole !== 'superadmin'}
                              onChange={e => {
                                if (!(session?.user as any)?.isPremium && userRole !== 'superadmin') {
                                  toast.error('Fitur Premium', { description: 'Gunakan akun Premium untuk upload logo & banner.' });
                                  return;
                                }
                                e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logo');
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {weatherData && (
              <section className="space-y-8 pt-12 relative">
                {!isPremiumAI && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[2px] bg-white/10 rounded-[2.5rem] border-2 border-dashed border-gray-100 group">
                    <div className="text-center p-8 bg-white/90 shadow-2xl rounded-3xl border border-gray-50 scale-95 group-hover:scale-100 transition-transform">
                      <Sparkles className="w-10 h-10 text-amber-500 mx-auto mb-4 animate-bounce" />
                      <h3 className="text-sm font-black uppercase tracking-tight text-gray-900 mb-2">Weather Forecast</h3>
                      <p className="text-[10px] font-bold text-gray-500 mb-6 uppercase tracking-widest leading-loose max-w-[200px] mx-auto">Tersedia untuk pengguna Premium + AI</p>
                      <button
                        onClick={() => router.push('/pricing')}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                      >
                        Upgrade Sekarang
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-100">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight">{t.plan.weather_forecast}</h2>
                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">{weatherData.location || plan.destination}</p>
                  </div>
                </div>

                <div className={`flex gap-4 overflow-x-auto pb-4 no-scrollbar ${!isPremiumAI ? 'opacity-20 grayscale cursor-not-allowed pointer-events-none' : ''}`}>
                  {weatherData.daily.time.map((time: string, i: number) => {
                    const code = weatherData.daily.weathercode[i];
                    return (
                      <div key={time} className="min-w-[120px] p-6 bg-white rounded-[2rem] border border-gray-100 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-all group">
                        <div className="text-center">
                          <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest leading-none">
                            {new Date(time).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { weekday: 'short' })}
                          </p>
                          <p className="text-[8px] font-bold text-gray-300 uppercase tracking-tighter mt-1">
                            {new Date(time).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <div className="text-3xl filter group-hover:scale-110 transition-transform">
                          {code <= 1 ? '☀️' : code <= 3 ? '⛅' : code <= 48 ? '☁️' : code <= 67 ? '🌧️' : code <= 77 ? '❄️' : '⛈️'}
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-black text-gray-900">{Math.round(weatherData.daily.temperature_2m_max[i])}°</p>
                          <p className="text-[8px] font-bold text-gray-400">{Math.round(weatherData.daily.temperature_2m_min[i])}°</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {plan.canEdit && (
              <section className="space-y-12">
                <div className="pt-24 border-t border-gray-100">
                  <div className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-tight">{t.plan.ai_consultant}</h2>
                      <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">{language === 'id' ? 'ASISTEN PINTAR ANDA' : 'YOUR SMART ASSISTANT'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
                    {!isPremiumAI && (
                      <div className="absolute inset-x-0 inset-y-0 z-50 flex items-center justify-center bg-white/10 backdrop-blur-[2px] rounded-[2.5rem] -m-4">
                        <div className="bg-white/90 p-8 rounded-[2rem] shadow-2xl border border-gray-100 text-center max-w-sm animate-in zoom-in-95 duration-500">
                          <Sparkles className="w-10 h-10 text-indigo-500 mx-auto mb-4 animate-pulse" />
                          <h3 className="text-sm font-black uppercase tracking-tight mb-2">AI Consultant Required</h3>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed mb-6">
                            Buka fitur Travel AI (Estimasi Anggaran & Tips Lokal) dengan paket Premium + AI.
                          </p>
                          <button
                            onClick={() => router.push('/pricing')}
                            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                          >
                            UPGRADE KE PREMIUM+AI
                          </button>
                        </div>
                      </div>
                    )}
                    <div className={`p-8 bg-indigo-50/30 rounded-[2.5rem] border border-indigo-100 space-y-6 ${!isPremiumAI ? 'opacity-20 grayscale' : ''}`}>
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-black uppercase tracking-widest text-indigo-900">{t.plan.budget_estimator}</h3>
                        {isPremiumAI && <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                      </div>
                      <div className="space-y-4">
                        <input
                          type="number"
                          value={userBudget}
                          onChange={e => setUserBudget(e.target.value)}
                          placeholder={t.plan.budget_input_placeholder}
                          className="w-full px-6 py-4 bg-white border border-indigo-100 rounded-2xl outline-none font-black text-gray-900 focus:border-indigo-500 transition-all shadow-sm"
                          disabled={!isPremiumAI}
                        />
                        <button
                          disabled={aiConsulting || !isPremiumAI}
                          onClick={() => handleConsultAI('budget')}
                          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                          {aiConsulting ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                          <span>{t.plan.estimate_button}</span>
                        </button>
                      </div>
                    </div>

                    <div className={`p-8 bg-amber-50/30 rounded-[2.5rem] border border-amber-100 space-y-6 ${!isPremiumAI ? 'opacity-20 grayscale' : ''}`}>
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-black uppercase tracking-widest text-amber-900">{t.plan.travel_advice}</h3>
                        {isPremiumAI && <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                      </div>
                      <p className="text-[10px] font-bold text-amber-800/60 uppercase tracking-widest leading-relaxed">
                        {language === 'id' ? 'Dapatkan tips budaya, cuaca, dan aturan lokal di destinasi Anda.' : 'Get cultural tips, weather, and local rules for your destination.'}
                      </p>
                      <button
                        disabled={aiConsulting || !isPremiumAI}
                        onClick={() => handleConsultAI('tips')}
                        className="w-full py-4 bg-amber-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-amber-100 hover:bg-amber-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {aiConsulting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                        <span>{t.plan.get_advice_button}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-24 border-t border-gray-50">
                  <AdminManager planId={planId} isOwner={plan.isOwner} isSenPlan={plan.isSenPlan} userRole={userRole} />
                </div>

                <div className="pt-24 border-t border-gray-50 flex items-center gap-6 opacity-40 hover:opacity-100 transition-opacity">
                  <h4 className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em]">{language === 'id' ? 'SYSTEM TOOLS' : 'ADVANCED'}</h4>
                  <div className="flex gap-3">
                    <button onClick={handleExport} className="px-6 py-3 bg-gray-50 text-gray-400 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-gray-900 hover:text-white transition-all flex items-center gap-3"><Download className="w-3.5 h-3.5" /> {t.plan.export}</button>
                    <button onClick={() => setShowImportModal(true)} className="px-6 py-3 bg-gray-50 text-gray-400 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-primary-600 hover:text-white transition-all flex items-center gap-3"><Import className="w-3.5 h-3.5" /> {t.plan.import}</button>
                  </div>
                </div>
              </section>
            )}
          </div>
          )}

          {activeTab === 'personalize' && (
            <div className="relative">
              {!(session?.user as any)?.isPremium && (session?.user as any)?.role !== 'superadmin' && (
                <div className="absolute inset-x-0 inset-y-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[6px] rounded-[2.5rem] -m-5 sm:-m-12">
                  <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-100 text-center max-w-md animate-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                      <Sparkles className="w-10 h-10 text-amber-500 animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Fitur Premium</h3>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-relaxed mb-10">
                      {language === 'id'
                        ? 'Personalisasi tema dan URL kustom hanya tersedia untuk pengguna Premium.'
                        : 'Theme personalization and custom URL are available for Premium users only.'}
                    </p>
                    <Link
                      href="/pricing"
                      className="block w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:bg-black transition-all active:scale-95"
                    >
                      UPGRADE SEKARANG
                    </Link>
                  </div>
                </div>
              )}
              <div className={`space-y-16 animate-in slide-in-from-bottom-2 duration-500 ${!(session?.user as any)?.isPremium && (session?.user as any)?.role !== 'superadmin' ? 'pointer-events-none select-none grayscale-[0.8] opacity-20' : ''}`}>
                <section className="space-y-12">
                  <div className="flex items-center gap-4 border-b border-gray-50 pb-8">
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black uppercase tracking-tight">{language === 'id' ? 'Personalisasi Premium' : 'Premium Personalization'}</h2>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">{language === 'id' ? 'Eksklusif untuk member Premium' : 'Exclusive for Premium members'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    <div className="space-y-10">
                      <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 block">{t.common.customize_url.toUpperCase()}</label>
                        <div className="flex gap-2 items-center bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 focus-within:bg-white focus-within:border-primary-500 transition-all">
                          <span className="text-gray-400 font-black text-sm">/</span>
                          <input
                            type="text"
                            value={personalizeForm.slug}
                            onChange={e => setPersonalizeForm({ ...personalizeForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                            placeholder="trip-saya"
                            className="flex-1 bg-transparent border-none outline-none font-black text-gray-900"
                          />
                        </div>
                        <div className="mt-3 space-y-2">
                          <p className="text-[9px] text-primary-600 font-black uppercase tracking-widest flex items-center gap-2">
                            <span className="text-gray-300">LINK:</span>
                            {typeof window !== 'undefined' ? window.location.origin : 'https://senyasholiday.vercel.app'}/plan/{personalizeForm.slug || '...'}
                          </p>
                          <p className="text-[9px] text-gray-400 font-bold italic uppercase leading-relaxed">
                            {language === 'id' ? 'Bagikan rencana Anda dengan URL yang mudah diingat.' : 'Share your plan with a memorable and clean URL.'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4">
                        <button onClick={handleUpdatePersonalization} className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-primary-50 hover:bg-primary-700 transition-all active:scale-[0.98]">
                          {t.common.save_changes.toUpperCase()}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-10">
                      <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-6 block">{t.common.select_theme.toUpperCase()}</label>
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { id: 'default', name: t.common.themes.default, colors: 'bg-[#ff3838]' },
                            { id: 'tropical', name: t.common.themes.tropical, colors: 'bg-emerald-500' },
                            { id: 'cyberpunk', name: t.common.themes.cyberpunk, colors: 'bg-fuchsia-600' },
                            { id: 'elegant', name: t.common.themes.elegant, colors: 'bg-stone-700' },
                            { id: 'custom', name: language === 'id' ? 'Warna Kustom' : 'Custom Color', colors: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500' },
                          ].map((th) => (
                            <button
                              key={th.id}
                              onClick={() => setPersonalizeForm({ ...personalizeForm, theme: th.id })}
                              className={`relative p-6 rounded-[2rem] border-2 transition-all text-left overflow-hidden group ${personalizeForm.theme === th.id ? 'border-primary-600 bg-primary-50/10' : 'border-gray-100 hover:border-gray-300 bg-white'}`}
                            >
                              <div className={`w-10 h-10 ${th.colors} rounded-xl mb-4 shadow-lg group-hover:scale-110 transition-transform`} />
                              <p className="font-black uppercase text-[10px] tracking-tight">{th.name}</p>
                              {personalizeForm.theme === th.id && <div className="absolute top-4 right-4 text-primary-600"><CheckCircle className="w-5 h-5" /></div>}
                            </button>
                          ))}
                        </div>

                        {personalizeForm.theme === 'custom' && (
                          <div className="mt-8 p-8 bg-white border border-gray-100 rounded-[2.5rem] animate-in slide-in-from-top-4 duration-300">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-6 block">{language === 'id' ? 'PILIH WARNA UTAMA' : 'CHOOSE PRIMARY COLOR'}</label>
                            <div className="flex items-center gap-6">
                              <input
                                type="color"
                                value={personalizeForm.customPrimaryColor}
                                onChange={(e) => setPersonalizeForm({ ...personalizeForm, customPrimaryColor: e.target.value })}
                                className="w-20 h-20 rounded-2xl cursor-pointer border-none p-0 overflow-hidden bg-transparent"
                              />
                              <div className="flex-1 space-y-2">
                                <input
                                  type="text"
                                  value={personalizeForm.customPrimaryColor.toUpperCase()}
                                  onChange={(e) => setPersonalizeForm({ ...personalizeForm, customPrimaryColor: e.target.value })}
                                  className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-black text-sm uppercase tracking-widest"
                                  placeholder="#FF0000"
                                />
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none">HEX CODE</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}

          {activeTab === 'rundown' && <RundownTab planId={planId} isCompleted={plan.status === 'completed'} />}
          {activeTab === 'expenses' && <ExpensesTab planId={planId} isCompleted={plan.status === 'completed'} />}
          {activeTab === 'participants' && <ParticipantsTab planId={planId} isCompleted={plan.status === 'completed'} />}
          {activeTab === 'rincian' && <RincianTab planId={planId} isCompleted={plan.status === 'completed'} />}
          {activeTab === 'note' && <NoteTab planId={planId} isCompleted={plan.status === 'completed'} />}
          {activeTab === 'vault' && <TravelDocumentTab planId={planId} isCompleted={plan.status === 'completed'} userRole={(session?.user as any)?.role} />}
          {activeTab === 'checklist' && <ChecklistTab planId={planId} isCompleted={plan.status === 'completed'} />}
          {activeTab === 'splitbill' && <SplitBillTab planId={planId} isCompleted={plan.status === 'completed'} />}
        </main>
      </div >

      {/* Modals Scaled Down */}
      {showCompleteModal && (<Modal title={t.plan.complete_event} desc={t.plan.complete_desc} onConfirm={() => updateStatus('completed')} onCancel={() => setShowCompleteModal(false)} okText={t.plan.yes_complete} variant="emerald" loading={isCompleting} />)}
      {showReopenModal && (<Modal title={t.plan.reopen_event} desc={t.plan.reopen_desc} onConfirm={() => updateStatus('active')} onCancel={() => setShowReopenModal(false)} okText={t.plan.yes_reopen} variant="primary" loading={isCompleting} />)}

      {
        aiAdvice && (
          <div className="fixed inset-0 z-[6000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in">
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl relative border border-gray-100 flex flex-col max-h-[85vh] overflow-hidden">
              <div className="px-10 py-8 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{t.plan.ai_advice_title}</h3>
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{t.plan.ai_consultant}</p>
                  </div>
                </div>
                <button onClick={() => setAiAdvice(null)} className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-400">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 prose prose-slate max-w-none no-scrollbar">
                <div className="text-sm font-bold text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {aiAdvice}
                </div>
              </div>
              <div className="px-10 py-6 border-t border-gray-100 bg-gray-50/50 flex justify-end shrink-0">
                <button onClick={() => setAiAdvice(null)} className="px-8 py-3 bg-primary-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary-50">
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        )
      }

      {showExportModal && (<div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in"><div className="bg-white rounded-[2.5rem] p-10 w-full max-w-xl shadow-2xl relative border border-gray-100"><h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-3">{t.plan.export}</h3><p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest mb-8">{t.plan.export_desc}</p><div className="bg-gray-50 p-6 rounded-2xl font-mono text-[8px] break-all max-h-[250px] overflow-y-auto text-gray-400 mb-8 leading-relaxed uppercase border border-gray-100">{exportData}</div><div className="flex gap-3"><button onClick={() => { navigator.clipboard.writeText(exportData); toast.success(t.common.success); }} className="flex-[2] py-4 bg-primary-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-primary-50 hover:bg-primary-700 transition-all">COPY STRING</button><button onClick={() => setShowExportModal(false)} className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase text-[10px] transition-all">CLOSE</button></div></div></div>)}
      {showImportModal && (<div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in"><div className="bg-white rounded-[2.5rem] p-10 w-full max-w-xl shadow-2xl relative border border-gray-100"><h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-3">{t.plan.import}</h3><p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest mb-8">{t.plan.import_desc}</p><textarea value={importText} onChange={e => setImportText(e.target.value)} rows={6} className="w-full p-6 bg-gray-50 rounded-2xl font-mono text-[8px] outline-none border-2 border-transparent focus:border-primary-500 transition-all mb-8 uppercase" placeholder="PASTE DATA STRING HERE..." /><div className="flex gap-3"><button onClick={handleImport} disabled={isImporting} className="flex-[2] py-4 bg-primary-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-primary-50 hover:bg-primary-700 transition-all">{isImporting ? 'IMPORTING...' : 'RUN IMPORT'}</button><button onClick={() => setShowImportModal(false)} className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase text-[10px] transition-all">CANCEL</button></div></div></div>)}
      <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
      <SuggestionButton page={`Dashboard Plan Manage - ${plan.title}`} />

      {/* Premium Ad Floating Notification (Less Intrusive) */}
      {
        showPremiumPopup && (
          <div className="fixed bottom-8 right-8 z-[5000] w-full max-w-sm animate-in slide-in-from-right-10 duration-500 font-bold">
            <div className="relative bg-white rounded-[2rem] p-8 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100">
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full -mr-16 -mt-16 blur-2xl opacity-50" />

              <button
                onClick={() => setShowPremiumPopup(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-xl transition-all"
              >
                <X size={14} />
              </button>

              <div className="flex items-start gap-6">
                <div className="w-14 h-14 shrink-0 bg-gradient-to-br from-amber-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-100">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black uppercase tracking-tight text-gray-900 mb-2 leading-tight">
                    {t.common.premium_ad_title.split(' ').slice(0, 2).join(' ')} <span className="text-primary-600">{t.common.premium_ad_title.split(' ').slice(2).join(' ')}</span>
                  </h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed mb-6">
                    {t.common.premium_ad_desc.split('.')[0]}...
                  </p>

                  <div className="flex gap-3">
                    <Link
                      href="/pricing"
                      onClick={() => setShowPremiumPopup(false)}
                      className="flex-1 py-3 bg-primary-600 text-white rounded-xl text-center font-black uppercase tracking-widest text-[8px] shadow-lg shadow-primary-50 hover:bg-primary-700 transition-all"
                    >
                      {t.common.premium_ad_button}
                    </Link>
                    <button
                      onClick={() => setShowPremiumPopup(false)}
                      className="px-4 py-3 bg-gray-50 text-gray-400 rounded-xl font-black uppercase tracking-widest text-[8px] hover:text-gray-600 transition-colors"
                    >
                      {language === 'id' ? 'NANTI' : 'LATER'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  )
}

function InputBox({ label, val, setVal, type = 'text' }: any) {
  return (<div className="space-y-3"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</label><input type={type} value={val} onChange={e => setVal(e.target.value)} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black text-gray-900 focus:bg-white focus:border-primary-500 transition-all" /></div>)
}

function Modal({ title, desc, onConfirm, onCancel, okText, variant, loading }: any) {
  const isEmerald = variant === 'emerald'
  return (<div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in transition-all"><div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl animate-in zoom-in-95 text-center border border-gray-50"><div className={`w-20 h-20 ${isEmerald ? 'bg-emerald-50 text-emerald-600' : 'bg-primary-50 text-primary-600'} rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner`}>{isEmerald ? <CheckCircle className="w-10 h-10" /> : <Edit2 className="w-10 h-10" />}</div><h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-3">{title}</h3><p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest mb-10 leading-relaxed">{desc}</p><div className="space-y-3"><button disabled={loading} onClick={onConfirm} className={`w-full py-4 ${isEmerald ? 'bg-emerald-600 shadow-emerald-50' : 'bg-primary-600 shadow-primary-50'} text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95`}>{loading ? 'WAIT...' : okText}</button><button onClick={onCancel} className="w-full py-4 text-gray-300 font-black uppercase text-[10px] tracking-widest hover:text-gray-600 transition-all">NOT NOW</button></div></div></div>)
}
