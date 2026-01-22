'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Calendar, MapPin, Trash2, Edit, Crown, User, AtSign } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

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
  ownerId?: { username: string; name: string }
}

export default function DashboardClient({ session }: any) {
  const [plans, setPlans] = useState<HolidayPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlans()
  }, [])

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

  const deletePlan = async (id: string) => {
    if (!confirm('Yakin ingin menghapus rencana liburan ini?')) return

    try {
      const res = await fetch(`/api/plans/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Rencana liburan berhasil dihapus')
        fetchPlans()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menghapus rencana')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    }
  }

  const username = (session.user as any)?.username || session.user?.email?.split('@')[0]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Dashboard
        </h1>
        <div className="flex items-center gap-3 text-gray-600">
          <span>Selamat datang,</span>
          <span className="font-semibold">{session.user.name}</span>
          {username && (
            <span className="flex items-center gap-1 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              <AtSign className="w-3 h-3" />
              {username}
            </span>
          )}
        </div>
      </div>

      {/* Create Button */}
      <div className="mb-6">
        <Link
          href="/dashboard/plans/create"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Buat Rencana Liburan Baru</span>
        </Link>
      </div>

      {/* Plans List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Belum ada rencana liburan
          </h3>
          <p className="text-gray-600 mb-6">
            Mulai buat rencana liburan pertama Anda sekarang!
          </p>
          <Link
            href="/dashboard/plans/create"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Buat Rencana Baru</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 flex-1">
                    {plan.title}
                  </h3>
                  <div className="flex gap-2 ml-2">
                    {plan.isOwner ? (
                      <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                        <Crown className="w-3 h-3" />
                        Owner
                      </span>
                    ) : plan.isAdmin ? (
                      <span className="flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full font-medium">
                        <User className="w-3 h-3" />
                        Admin
                      </span>
                    ) : null}
                    {plan.hasPassword && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        🔒
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-primary-600" />
                    {plan.destination}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2 text-primary-600" />
                    {format(new Date(plan.startDate), 'd MMM yyyy', { locale: id })} -{' '}
                    {format(new Date(plan.endDate), 'd MMM yyyy', { locale: id })}
                  </div>
                  {!plan.isOwner && plan.ownerId && (
                    <div className="flex items-center text-sm text-gray-500">
                      <AtSign className="w-4 h-4 mr-2 text-gray-400" />
                      by {plan.ownerId.username}
                    </div>
                  )}
                </div>

                {plan.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {plan.description}
                  </p>
                )}

                <div className="flex space-x-2 pt-4 border-t border-gray-100">
                  <Link
                    href={`/dashboard/plans/${plan._id}`}
                    className="flex-1 flex items-center justify-center space-x-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Kelola</span>
                  </Link>
                  {plan.isOwner && (
                    <button
                      onClick={() => deletePlan(plan._id)}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      title="Hapus (hanya owner)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
