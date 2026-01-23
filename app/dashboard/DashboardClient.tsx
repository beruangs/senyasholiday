'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Calendar, MapPin, Trash2, Edit, Crown, User, Sparkles, Loader2, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import ConfirmModal from '@/components/ConfirmModal'

interface HolidayPlan {
  _id: string
  title: string
  destination: string
  startDate: string
  endDate: string
  description?: string
  hasPassword: boolean
  createdAt: string
  isOwner: boolean
  isAdmin: boolean
  isSenPlan?: boolean
  canEdit?: boolean
  ownerId?: { username: string; name: string }
  planCategory?: 'individual' | 'sen_yas_daddy'
}

interface DeleteConfirmState {
  isOpen: boolean
  planId: string
  planTitle: string
}

export default function DashboardClient({ session }: any) {
  const [plans, setPlans] = useState<HolidayPlan[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    isOpen: false,
    planId: '',
    planTitle: '',
  })
  const [leaveConfirm, setLeaveConfirm] = useState({
    isOpen: false,
    planId: '',
    planTitle: '',
  })
  const [leavingId, setLeavingId] = useState<string | null>(null)

  const userRole = userProfile?.role || (session.user as any)?.role || 'user'

  useEffect(() => {
    fetchPlans()
    fetchUserProfile()

    // Listen for updates from Navbar
    window.addEventListener('plans-updated', fetchPlans)
    return () => window.removeEventListener('plans-updated', fetchPlans)
  }, [])

  const fetchUserProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        setUserProfile(data)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/plans')
      if (res.ok) {
        const data = await res.json()
        setPlans(data)
      }
    } catch (error) {
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const openDeleteConfirm = (planId: string, planTitle: string) => {
    setDeleteConfirm({
      isOpen: true,
      planId,
      planTitle,
    })
  }

  const closeDeleteConfirm = () => {
    setDeleteConfirm({
      isOpen: false,
      planId: '',
      planTitle: '',
    })
  }

  const openLeaveConfirm = (planId: string, planTitle: string) => {
    setLeaveConfirm({
      isOpen: true,
      planId,
      planTitle,
    })
  }

  const moveToTrash = async () => {
    const { planId, planTitle } = deleteConfirm
    setDeletingId(planId)

    try {
      const res = await fetch('/api/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })

      if (res.ok) {
        toast.success(`"${planTitle}" dipindahkan ke Trash`)
        fetchPlans()
        closeDeleteConfirm()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal memindahkan ke Trash')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    } finally {
      setDeletingId(null)
    }
  }

  const handleLeavePlan = async () => {
    const { planId, planTitle } = leaveConfirm
    setLeavingId(planId)

    try {
      const res = await fetch(`/api/plans/admin-invite?planId=${planId}&userId=${session.user.id}&type=admin`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success(`Berhasil keluar dari plan "${planTitle}"`)
        fetchPlans()
        setLeaveConfirm({ isOpen: false, planId: '', planTitle: '' })
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal keluar dari plan')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    } finally {
      setLeavingId(null)
    }
  }

  // Separate plans into three categories using flags from the API
  const senPlans = plans.filter(p => p.isSenPlan)
  const personalPlans = plans.filter(p => p.isOwner && !p.isSenPlan)
  const sharedPlans = plans.filter(p => p.isAdmin && !p.isOwner && !p.isSenPlan)

  const totalPlans = plans.length

  return (
    <>
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={closeDeleteConfirm}
        onConfirm={moveToTrash}
        title="Pindahkan ke Trash?"
        message={`"${deleteConfirm.planTitle}" akan dipindahkan ke Trash.\n\nPlan akan dihapus permanen dalam 1 menit.`}
        confirmText="Ya, Pindahkan"
        cancelText="Batal"
        variant="danger"
        loading={deletingId === deleteConfirm.planId}
      />

      {/* Leave Confirmation Modal */}
      <ConfirmModal
        isOpen={leaveConfirm.isOpen}
        onClose={() => setLeaveConfirm({ isOpen: false, planId: '', planTitle: '' })}
        onConfirm={handleLeavePlan}
        title="Keluar dari Plan?"
        message={`Apakah Anda yakin ingin berhenti menjadi editor di plan "${leaveConfirm.planTitle}"?\n\nAnda tidak akan bisa melihat atau mengedit plan ini lagi kecuali diundang kembali.`}
        confirmText="Ya, Keluar"
        cancelText="Batal"
        variant="danger"
        loading={leavingId === leaveConfirm.planId}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header - Minimalis */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Selamat datang, {session.user.name} 👋
              </h1>
              <p className="text-gray-500 mt-1">
                {totalPlans > 0 ? `${totalPlans} rencana liburan` : 'Belum ada rencana liburan'}
              </p>
            </div>
            <Link
              href="/dashboard/plans/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-sm hover:shadow-md font-medium"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Buat Rencana Baru</span>
              <span className="sm:hidden">Buat</span>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
          </div>
        ) : plans.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-primary-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Belum ada rencana liburan
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Mulai rencanakan liburan impianmu bersama teman-teman!
            </p>
            <Link
              href="/dashboard/plans/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Buat Rencana Pertama
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* SEN Yas Daddy Plans */}
            {senPlans.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Plan SEN Yas Daddy</h2>
                  <span className="text-sm text-gray-400">({senPlans.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {senPlans.map((plan) => (
                    <PlanCard
                      key={plan._id}
                      plan={plan}
                      onDelete={openDeleteConfirm}
                      onLeave={openLeaveConfirm}
                      userRole={userRole}
                      isDeleting={deletingId === plan._id}
                      isLeaving={leavingId === plan._id}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Personal Plans */}
            {personalPlans.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Plan Saya</h2>
                  <span className="text-sm text-gray-400">({personalPlans.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {personalPlans.map((plan) => (
                    <PlanCard
                      key={plan._id}
                      plan={plan}
                      onDelete={openDeleteConfirm}
                      onLeave={openLeaveConfirm}
                      userRole={userRole}
                      isDeleting={deletingId === plan._id}
                      isLeaving={leavingId === plan._id}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Show empty personal plans section if only SEN plans exist */}
            {senPlans.length > 0 && personalPlans.length === 0 && sharedPlans.length === 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Plan Saya</h2>
                </div>
                <div className="bg-gray-50 rounded-xl p-8 text-center border border-dashed border-gray-200">
                  <p className="text-gray-500 mb-4">
                    Belum ada plan pribadi
                  </p>
                  <Link
                    href="/dashboard/plans/create"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Buat Plan Baru
                  </Link>
                </div>
              </section>
            )}

            {/* Shared Plans - Plans where user is editor/admin */}
            {sharedPlans.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Plan Yang Dibagikan</h2>
                  <span className="text-sm text-gray-400">({sharedPlans.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sharedPlans.map((plan) => (
                    <PlanCard
                      key={plan._id}
                      plan={plan}
                      onDelete={openDeleteConfirm}
                      onLeave={openLeaveConfirm}
                      userRole={userRole}
                      isDeleting={deletingId === plan._id}
                      isLeaving={leavingId === plan._id}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// Plan Card Component - Redesigned
function PlanCard({
  plan,
  onDelete,
  onLeave,
  userRole,
  isDeleting,
  isLeaving
}: {
  plan: HolidayPlan
  onDelete: (id: string, title: string) => void
  onLeave?: (id: string, title: string) => void
  userRole: string
  isDeleting: boolean
  isLeaving?: boolean
}) {
  const canDelete = plan.isOwner || (plan.isSenPlan && userRole === 'superadmin')
  const canLeave = plan.isAdmin && !plan.isOwner && !plan.isSenPlan

  return (
    <div className={`group bg-white rounded-xl border transition-all hover:shadow-lg ${plan.isSenPlan ? 'border-primary-200 hover:border-primary-300' : 'border-gray-100 hover:border-gray-200'
      }`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-semibold text-gray-900 line-clamp-1 flex-1">
            {plan.title}
          </h3>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {plan.isSenPlan ? (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-primary-100 to-pink-100 text-primary-700 text-xs rounded-full font-medium">
                <Sparkles className="w-3 h-3" />
                SEN
              </span>
            ) : plan.isOwner ? (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                <Crown className="w-3 h-3" />
                Milik Saya
              </span>
            ) : plan.isAdmin ? (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                <User className="w-3 h-3" />
                Editor
              </span>
            ) : null}
            {plan.hasPassword && (
              <span className="text-xs">🔒</span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-1.5 mb-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="truncate">{plan.destination}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>
              {format(new Date(plan.startDate), 'd MMM', { locale: id })} - {format(new Date(plan.endDate), 'd MMM yyyy', { locale: id })}
            </span>
          </div>
          {/* Show owner info for plans where user is admin/editor */}
          {!plan.isOwner && !plan.isSenPlan && plan.ownerId && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Crown className="w-3 h-3" />
              <span>oleh @{plan.ownerId.username}</span>
            </div>
          )}
          {/* SEN plans show managed by superadmin */}
          {plan.isSenPlan && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Sparkles className="w-3 h-3" />
              <span>Dikelola Superadmin</span>
            </div>
          )}
        </div>

        {/* Description */}
        {plan.description && (
          <p className="text-sm text-gray-400 line-clamp-2 mb-4">
            {plan.description}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <Link
            href={`/dashboard/plans/${plan._id}`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            <Edit className="w-4 h-4" />
            Kelola
          </Link>
          {canLeave && onLeave && (
            <button
              onClick={() => onLeave(plan._id, plan.title)}
              disabled={isLeaving}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Keluar dari Plan"
            >
              {isLeaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(plan._id, plan.title)}
              disabled={isDeleting}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Pindahkan ke Trash"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
