'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Save } from 'lucide-react'
import { usePageTitle, pageTitle } from '@/lib/usePageTitle'

export default function CreatePlanPage() {
  usePageTitle(pageTitle.dashboard())
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    description: '',
    password: '',
    planCategory: 'individual' as 'individual' | 'sen_yas_daddy',
  })

  const userRole = (session?.user as any)?.role || 'user'
  const canSelectCategory = userRole === 'sen_user' || userRole === 'superadmin'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Rencana liburan berhasil dibuat!')
        router.push(`/dashboard/plans/${data._id}`)
      } else {
        console.error('Create plan error:', data)
        toast.error(data.details || data.error || 'Gagal membuat rencana')
      }
    } catch (error: any) {
      console.error('Create plan exception:', error)
      toast.error('Terjadi kesalahan: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Buat Rencana Liburan Baru
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Judul Liburan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="Contoh: SEN YAS DADDY GOES TO JOGJA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destinasi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="Contoh: Yogyakarta"
                />
              </div>

              {/* Plan Category Selector - Only for SEN User and Superadmin */}
              {canSelectCategory && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori Database <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.planCategory}
                    onChange={(e) => setFormData({ ...formData, planCategory: e.target.value as 'individual' | 'sen_yas_daddy' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white"
                  >
                    <option value="individual">Individu</option>
                    <option value="sen_yas_daddy">SEN Yas Daddy</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.planCategory === 'individual'
                      ? 'Plan pribadi, hanya Anda yang bisa melihat'
                      : 'Plan organisasi SEN Yas Daddy, dapat dilihat oleh SEN User dan Superadmin'}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password (Opsional)
                </label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="Untuk proteksi sharing link"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Mulai <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Selesai <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                  placeholder="Ceritakan tentang rencana liburan ini..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Link
                href="/dashboard"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-5 h-5" />
                <span>{loading ? 'Menyimpan...' : 'Buat Rencana'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
