'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Calendar, MapPin, Trash2, Edit, Crown, User, Users, Sparkles, Loader2, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id, enUS } from 'date-fns/locale'
import ConfirmModal from '@/components/ConfirmModal'
import SuggestionButton from '@/components/SuggestionButton'
import { useLanguage } from '@/context/LanguageContext'

interface HolidayPlan { _id: string; title: string; destination: string; startDate: string; endDate: string; description?: string; hasPassword: boolean; createdAt: string; isOwner: boolean; isAdmin: boolean; isSenPlan?: boolean; ownerId?: { username: string; name: string }; }

export default function DashboardClient({ session }: any) {
  const { language, t } = useLanguage(); const [plans, setPlans] = useState<HolidayPlan[]>([]); const [userProfile, setUserProfile] = useState<any>(null); const [loading, setLoading] = useState(true); const [deletingId, setDeletingId] = useState<string | null>(null); const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, planId: '', planTitle: '' }); const [leaveConfirm, setLeaveConfirm] = useState({ isOpen: false, planId: '', planTitle: '' }); const [leavingId, setLeavingId] = useState<string | null>(null)
  const userRole = userProfile?.role || (session.user as any)?.role || 'user'; const dateLocale = language === 'id' ? id : enUS

  useEffect(() => { fetchPlans(); fetchUserProfile(); }, [])

  const fetchUserProfile = async () => { try { const res = await fetch('/api/user/profile'); if (res.ok) setUserProfile(await res.json()); } catch { } }
  const fetchPlans = async () => { try { const res = await fetch('/api/plans'); if (res.ok) setPlans(await res.json()); } catch { toast.error(t.dashboard.loading_data) } finally { setLoading(false) } }

  const moveToTrash = async () => {
    const { planId, planTitle } = deleteConfirm; setDeletingId(planId)
    try { const res = await fetch('/api/trash', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId }) }); if (res.ok) { toast.success(`"${planTitle}" ${t.dashboard.trash_success}`); fetchPlans(); setDeleteConfirm({ isOpen: false, planId: '', planTitle: '' }); } } catch { toast.error(t.common.loading) } finally { setDeletingId(null) }
  }

  const handleLeavePlan = async () => {
    const { planId, planTitle } = leaveConfirm; setLeavingId(planId)
    try { const res = await fetch(`/api/plans/admin-invite?planId=${planId}&userId=${session.user.id}&type=admin`, { method: 'DELETE' }); if (res.ok) { toast.success(`${t.dashboard.leave_success} "${planTitle}"`); fetchPlans(); setLeaveConfirm({ isOpen: false, planId: '', planTitle: '' }); } } catch { toast.error(t.common.loading) } finally { setLeavingId(null) }
  }

  const senPlans = plans.filter(p => p.isSenPlan); const personalPlans = plans.filter(p => !p.isSenPlan && p.isOwner); const sharedPlans = plans.filter(p => !p.isSenPlan && !p.isOwner && p.isAdmin)

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 font-bold min-h-screen">
      <ConfirmModal isOpen={deleteConfirm.isOpen} onClose={() => setDeleteConfirm({ isOpen: false, planId: '', planTitle: '' })} onConfirm={moveToTrash} title={t.dashboard.move_to_trash} message={`"${deleteConfirm.planTitle}" ${t.dashboard.trash_confirm}`} confirmText={t.dashboard.yes_move} cancelText={t.common.cancel} variant="danger" loading={deletingId === deleteConfirm.planId} />
      <ConfirmModal isOpen={leaveConfirm.isOpen} onClose={() => setLeaveConfirm({ isOpen: false, planId: '', planTitle: '' })} onConfirm={handleLeavePlan} title={t.dashboard.leave_plan} message={t.dashboard.leave_confirm} confirmText={t.dashboard.yes_leave} cancelText={t.common.cancel} variant="danger" loading={leavingId === leaveConfirm.planId} />

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 sm:gap-8 mb-12 sm:mb-16">
        <div>
          <h1 className="text-2xl sm:text-5xl font-black text-gray-900 uppercase tracking-tighter leading-tight mb-2 sm:mb-3">{t.dashboard.welcome_back}, <br className="sm:hidden" />{session.user.name.split(' ')[0]} 👋</h1>
          <p className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{plans.length > 0 ? `${plans.length} ${t.dashboard.stats_plans}` : t.dashboard.no_plans}</p>
        </div>
        <Link href="/dashboard/plans/create" className="w-full sm:w-auto px-8 py-4 bg-primary-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary-50 hover:bg-primary-700 transition-all flex items-center justify-center gap-3 group"><Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> <span>{t.dashboard.create_new}</span></Link>
      </div>

      {loading ? <div className="flex justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-primary-600" /></div> : plans.length === 0 ? (
        <div className="bg-gray-50 rounded-[3rem] p-16 text-center border border-gray-100"><div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-sm"><Calendar className="w-8 h-8 text-primary-600" /></div><h2 className="text-2xl font-black text-gray-900 uppercase mb-3">{t.dashboard.no_plans}</h2><p className="text-gray-400 uppercase text-[9px] font-black tracking-widest mb-10">{t.dashboard.no_plans_desc}</p><Link href="/dashboard/plans/create" className="px-10 py-5 bg-primary-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary-50">{t.dashboard.create_first}</Link></div>
      ) : (
        <div className="space-y-16 pb-20">
          {senPlans.length > 0 && <PlanSection title={t.dashboard.sen_plans} icon={<Sparkles className="w-4 h-4" />} plans={senPlans} onAction={setDeleteConfirm} onLeave={setLeaveConfirm} userRole={userRole} dateLocale={dateLocale} t={t} />}
          {personalPlans.length > 0 && <PlanSection title={t.dashboard.my_plans} icon={<User className="w-4 h-4" />} plans={personalPlans} onAction={setDeleteConfirm} onLeave={setLeaveConfirm} userRole={userRole} dateLocale={dateLocale} t={t} />}
          {sharedPlans.length > 0 && <PlanSection title={t.dashboard.shared_plans} icon={<Users className="w-4 h-4" />} plans={sharedPlans} onAction={setDeleteConfirm} onLeave={setLeaveConfirm} userRole={userRole} dateLocale={dateLocale} t={t} />}
          {senPlans.length > 0 && personalPlans.length === 0 && sharedPlans.length === 0 && (
            <div className="bg-gray-50/50 rounded-[2.5rem] p-12 text-center border-2 border-dashed border-gray-100"><p className="text-gray-400 font-black uppercase text-[9px] tracking-widest mb-6">{t.dashboard.no_personal_plans}</p><Link href="/dashboard/plans/create" className="px-8 py-4 bg-white text-primary-600 border border-primary-100 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-primary-50 transition-all">{t.dashboard.create_new}</Link></div>
          )}
        </div>
      )}
      <SuggestionButton page="Dashboard Main" />
    </div>
  )
}

function PlanSection({ title, icon, plans, onAction, onLeave, userRole, dateLocale, t }: any) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-8 text-gray-400"><div className="w-8 h-8 bg-gray-50 text-gray-400 rounded-lg flex items-center justify-center">{icon}</div><h2 className="text-[11px] font-black uppercase tracking-[0.3em]">{title}</h2></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map((p: any) => (<PlanCard key={p._id} plan={p} onAction={onAction} onLeave={onLeave} userRole={userRole} dateLocale={dateLocale} t={t} />))}
      </div>
    </section>
  )
}

function PlanCard({ plan, onAction, onLeave, userRole, dateLocale, t }: any) {
  const isSAdmin = userRole === 'superadmin'; const isOwner = plan.isOwner; const isSen = plan.isSenPlan
  return (
    <div className={`group bg-white rounded-[2rem] border border-gray-100 transition-all duration-500 hover:shadow-2xl hover:border-primary-100/50 p-1 relative overflow-hidden ${isSen ? 'ring-2 ring-primary-50 mb-4' : 'mb-4 shadow-sm'}`}>
      <div className="p-6">
        <div className="flex justify-between items-start gap-4 mb-6">
          <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight leading-tight line-clamp-2">{plan.title}</h3>
          <div className="flex shrink-0">{isSen ? <span className="px-2.5 py-1 bg-primary-600 text-white text-[7px] font-black rounded-lg uppercase tracking-widest shadow-md">SEN</span> : isOwner ? <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-[7px] font-black rounded-lg uppercase tracking-widest">OWNER</span> : <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[7px] font-black rounded-lg uppercase tracking-widest">EDITOR</span>}</div>
        </div>
        <div className="space-y-3 mb-8 uppercase text-[9px] font-black tracking-widest text-gray-400/80">
          <div className="flex items-center gap-3"><MapPin className="w-3.5 h-3.5 text-primary-400" /> <span className="truncate">{plan.destination}</span></div>
          <div className="flex items-center gap-3"><Calendar className="w-3.5 h-3.5 text-primary-400" /> <span>{format(new Date(plan.startDate), 'd MMM', { locale: dateLocale })} - {format(new Date(plan.endDate), 'd MMM yyyy', { locale: dateLocale })}</span></div>
        </div>
        <div className="flex gap-2 pt-6 border-t border-gray-50">
          <Link href={`/dashboard/plans/${plan._id}`} className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest text-center shadow-lg shadow-primary-50 hover:bg-primary-700 transition-all">{t.dashboard.manage}</Link>
          {(isOwner || (isSen && isSAdmin)) ? <button onClick={() => onAction({ isOpen: true, planId: plan._id, planTitle: plan.title })} className="p-3 bg-gray-50 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button> : <button onClick={() => onLeave({ isOpen: true, planId: plan._id, planTitle: plan.title })} className="p-3 bg-gray-50 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><LogOut className="w-4 h-4" /></button>}
        </div>
      </div>
    </div>
  )
}
