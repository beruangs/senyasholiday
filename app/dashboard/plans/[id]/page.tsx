'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Calendar, DollarSign, Users, Share2, Settings, Eye, EyeOff, Edit2, Save, X, CheckCircle, FileText, Upload, Image as ImageIcon } from 'lucide-react'
import { usePageTitle, pageTitle } from '@/lib/usePageTitle'
import RundownTab from './RundownTab'
import ExpensesTab from './ExpensesTab'
import ParticipantsTab from './ParticipantsTab'
import ContributionsTab from './ContributionsTab'
import RincianTab from './RincianTab'
import NoteTab from './NoteTab'
import AdminManager from './AdminManager'

type Tab = 'info' | 'rundown' | 'expenses' | 'participants' | 'contributions' | 'rincian' | 'note'

export default function PlanDetailPage() {
  const params = useParams()
  const planId = params.id as string
  const [activeTab, setActiveTab] = useState<Tab>('info')
  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [editingPassword, setEditingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [completingEvent, setCompletingEvent] = useState(false)

  // Set page title when plan loads
  usePageTitle(plan ? pageTitle.dashboardPlan(plan.title) : 'Dashboard | Loading...')

  // Edit Info states
  const [editingInfo, setEditingInfo] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    description: ''
  })
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  useEffect(() => {
    fetchPlan()
  }, [planId])

  const fetchPlan = async () => {
    try {
      const res = await fetch(`/api/plans/${planId}`)
      if (res.ok) {
        const data = await res.json()
        setPlan(data)
        setNewPassword(data.password || '')
        // Initialize edit form with current data
        setEditForm({
          title: data.title || '',
          destination: data.destination || '',
          startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '',
          endDate: data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : '',
          description: data.description || ''
        })
        // Set image previews
        setBannerPreview(data.bannerImage || null)
        setLogoPreview(data.logoImage || null)
      }
    } catch (error) {
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async () => {
    try {
      const res = await fetch(`/api/plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      })

      if (res.ok) {
        toast.success('Password berhasil diupdate!')
        setEditingPassword(false)
        fetchPlan()
      } else {
        toast.error('Gagal update password')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    }
  }

  const handleUpdateInfo = async () => {
    // Validation
    if (!editForm.title.trim()) {
      toast.error('Judul tidak boleh kosong')
      return
    }
    if (!editForm.destination.trim()) {
      toast.error('Destinasi tidak boleh kosong')
      return
    }
    if (!editForm.startDate || !editForm.endDate) {
      toast.error('Tanggal mulai dan selesai harus diisi')
      return
    }
    if (new Date(editForm.startDate) > new Date(editForm.endDate)) {
      toast.error('Tanggal mulai tidak boleh lebih dari tanggal selesai')
      return
    }

    try {
      const res = await fetch(`/api/plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title.trim(),
          destination: editForm.destination.trim(),
          startDate: new Date(editForm.startDate),
          endDate: new Date(editForm.endDate),
          description: editForm.description.trim()
        }),
      })

      if (res.ok) {
        toast.success('Info acara berhasil diupdate!')
        setEditingInfo(false)
        fetchPlan()
      } else {
        toast.error('Gagal update info')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    }
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2MB')
      return
    }

    setUploadingBanner(true)

    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = reader.result as string

        // Update to API
        const res = await fetch(`/api/plans/${planId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bannerImage: base64String }),
        })

        if (res.ok) {
          toast.success('Banner berhasil diupload! 🎨')
          setBannerPreview(base64String)
          fetchPlan()
        } else {
          toast.error('Gagal upload banner')
        }
        setUploadingBanner(false)
      }
      reader.onerror = () => {
        toast.error('Gagal membaca file')
        setUploadingBanner(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      toast.error('Terjadi kesalahan')
      setUploadingBanner(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar')
      return
    }

    // Validate file size (max 1MB)
    if (file.size > 1 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 1MB')
      return
    }

    setUploadingLogo(true)

    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = reader.result as string

        // Update to API
        const res = await fetch(`/api/plans/${planId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logoImage: base64String }),
        })

        if (res.ok) {
          toast.success('Logo berhasil diupload! 🎨')
          setLogoPreview(base64String)
          fetchPlan()
        } else {
          toast.error('Gagal upload logo')
        }
        setUploadingLogo(false)
      }
      reader.onerror = () => {
        toast.error('Gagal membaca file')
        setUploadingLogo(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      toast.error('Terjadi kesalahan')
      setUploadingLogo(false)
    }
  }

  const handleRemoveBanner = async () => {
    if (!confirm('Hapus banner dan kembali ke default?')) return

    try {
      const res = await fetch(`/api/plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bannerImage: null }),
      })

      if (res.ok) {
        toast.success('Banner dihapus, kembali ke default')
        setBannerPreview(null)
        fetchPlan()
      } else {
        toast.error('Gagal menghapus banner')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    }
  }

  const handleRemoveLogo = async () => {
    if (!confirm('Hapus logo dan kembali ke default?')) return

    try {
      const res = await fetch(`/api/plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoImage: null }),
      })

      if (res.ok) {
        toast.success('Logo dihapus, kembali ke default')
        setLogoPreview(null)
        fetchPlan()
      } else {
        toast.error('Gagal menghapus logo')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    }
  }

  const copyShareLink = () => {
    const link = `${window.location.origin}/plan/${planId}`
    navigator.clipboard.writeText(link)
    toast.success('Link berhasil disalin!')
  }

  const handleCompleteEvent = async () => {
    if (!confirm('Yakin ingin menyelesaikan acara ini? Tab Rincian akan muncul dan data tidak bisa diubah lagi.')) {
      return
    }

    setCompletingEvent(true)
    try {
      const res = await fetch(`/api/plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed', completedAt: new Date() }),
      })

      if (res.ok) {
        toast.success('Acara berhasil diselesaikan! 🎉')
        fetchPlan()
        setActiveTab('rincian')
      } else {
        toast.error('Gagal menyelesaikan acara')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    } finally {
      setCompletingEvent(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6 print:hidden"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Dashboard
        </Link>

        {/* Header with Banner & Logo */}
        <div className="mb-6 rounded-2xl overflow-hidden shadow-xl print:hidden">
          {/* Banner Section */}
          <div className="relative h-32 sm:h-40 md:h-48 lg:h-56">
            {plan?.bannerImage ? (
              <img
                src={plan.bannerImage}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700" />
            )}

            {/* Logo Overlay - Responsive positioning */}
            <div className="absolute -bottom-8 left-4 sm:left-6 md:left-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-xl overflow-hidden bg-white shadow-lg border-4 border-white">
                {plan?.logoImage ? (
                  <img
                    src={plan.logoImage}
                    alt="Logo"
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                    <span className="text-white font-bold text-lg sm:text-xl md:text-2xl">SYD</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="bg-white px-4 sm:px-6 md:px-8 pt-12 pb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between">
              <div className="flex-1 mb-4 md:mb-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  {plan?.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-base sm:text-lg text-gray-600">{plan?.destination}</p>
                  {plan?.status === 'completed' && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm font-medium inline-flex items-center">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Selesai
                    </span>
                  )}
                </div>

                {/* Dates - Mobile friendly */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>{new Date(plan?.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <span>→</span>
                  <span>{new Date(plan?.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {plan?.status !== 'completed' && (
                  <button
                    onClick={handleCompleteEvent}
                    disabled={completingEvent}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>{completingEvent ? 'Menyimpan...' : 'Selesaikan Acara'}</span>
                  </button>
                )}
                <button
                  onClick={copyShareLink}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base"
                >
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm print:shadow-none print:rounded-none">
          <div className="border-b border-gray-200 print:hidden">
            <nav className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('info')}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === 'info'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Settings className="w-5 h-5" />
                <span>Info</span>
              </button>

              <button
                onClick={() => setActiveTab('rundown')}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === 'rundown'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Calendar className="w-5 h-5" />
                <span>Rundown</span>
              </button>

              <button
                onClick={() => setActiveTab('participants')}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === 'participants'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Users className="w-5 h-5" />
                <span>Peserta</span>
              </button>

              <button
                onClick={() => setActiveTab('expenses')}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === 'expenses'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <DollarSign className="w-5 h-5" />
                <span>Keuangan</span>
              </button>

              <button
                onClick={() => setActiveTab('contributions')}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === 'contributions'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <DollarSign className="w-5 h-5" />
                <span>Iuran</span>
              </button>

              <button
                onClick={() => setActiveTab('note')}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === 'note'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <FileText className="w-5 h-5" />
                <span>Note</span>
              </button>

              {plan?.status === 'completed' && (
                <button
                  onClick={() => setActiveTab('rincian')}
                  className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === 'rincian'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <FileText className="w-5 h-5" />
                  <span>Rincian</span>
                </button>
              )}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'info' && (
              <div className="space-y-6">
                {/* Edit Button */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Informasi Acara</h3>
                  {!editingInfo && plan?.status !== 'completed' && (
                    <button
                      onClick={() => setEditingInfo(true)}
                      className="flex items-center space-x-2 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit Info</span>
                    </button>
                  )}
                </div>

                {editingInfo ? (
                  // Edit Mode
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Judul <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="Nama acara liburan"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Destinasi <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editForm.destination}
                        onChange={(e) => setEditForm({ ...editForm, destination: e.target.value })}
                        placeholder="Tujuan liburan"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tanggal Mulai <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={editForm.startDate}
                          onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tanggal Selesai <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={editForm.endDate}
                          onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Deskripsi
                      </label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Deskripsi atau catatan tambahan tentang acara ini"
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={handleUpdateInfo}
                        className="flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        <span>Simpan Perubahan</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingInfo(false)
                          // Reset form to current plan data
                          setEditForm({
                            title: plan?.title || '',
                            destination: plan?.destination || '',
                            startDate: plan?.startDate ? new Date(plan.startDate).toISOString().split('T')[0] : '',
                            endDate: plan?.endDate ? new Date(plan.endDate).toISOString().split('T')[0] : '',
                            description: plan?.description || ''
                          })
                        }}
                        className="flex items-center space-x-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span>Batal</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Judul</label>
                      <p className="text-gray-900 text-lg font-semibold">{plan?.title}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Destinasi</label>
                      <p className="text-gray-900 text-lg">{plan?.destination}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Mulai</label>
                        <p className="text-gray-900">{new Date(plan?.startDate).toLocaleDateString('id-ID', {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        })}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Selesai</label>
                        <p className="text-gray-900">{new Date(plan?.endDate).toLocaleDateString('id-ID', {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        })}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
                      <p className="text-gray-900 whitespace-pre-wrap">{plan?.description || '-'}</p>
                    </div>
                  </div>
                )}

                {/* Password Section */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">Password Share Link</label>
                    {!editingPassword && (
                      <button
                        onClick={() => {
                          setEditingPassword(true)
                          setNewPassword(plan?.password || '')
                        }}
                        className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 text-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>

                  {editingPassword ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Masukkan password (kosongkan jika publik)"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleUpdatePassword}
                          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          <span>Simpan</span>
                        </button>
                        <button
                          onClick={() => {
                            setEditingPassword(false)
                            setNewPassword(plan?.password || '')
                          }}
                          className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          <X className="w-4 h-4" />
                          <span>Batal</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {plan?.password ? (
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg font-mono">
                            {showPassword ? plan.password : '••••••••'}
                          </div>
                          <button
                            onClick={() => setShowPassword(!showPassword)}
                            className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5 text-gray-600" /> : <Eye className="w-5 h-5 text-gray-600" />}
                          </button>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">Plan ini tidak memiliki password (publik)</p>
                      )}
                      <div className="flex items-center space-x-2 mt-2">
                        {plan?.password ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">🔒 Terproteksi</span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">🌍 Publik</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Banner & Logo Upload Section */}
                <div className="border-t pt-6 space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Kustomisasi Tampilan</h3>

                  {/* Banner Upload */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Banner Image</label>
                        <p className="text-xs text-gray-500 mt-1">
                          Rekomendasi: Landscape 16:9 atau 21:9, maksimal 2MB
                        </p>
                      </div>
                      {bannerPreview && (
                        <button
                          onClick={handleRemoveBanner}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Hapus & Reset
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      {/* Preview */}
                      <div className="w-full h-32 md:h-48 rounded-lg overflow-hidden bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                        {bannerPreview ? (
                          <img
                            src={bannerPreview}
                            alt="Banner"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-white text-center">
                            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm opacity-75">Default Gradient Banner</p>
                          </div>
                        )}
                      </div>

                      {/* Upload Button */}
                      <label className="absolute bottom-3 right-3 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerUpload}
                          className="hidden"
                          disabled={uploadingBanner}
                        />
                        <div className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors shadow-lg">
                          <Upload className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {uploadingBanner ? 'Uploading...' : 'Upload Banner'}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Logo Upload */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Logo</label>
                        <p className="text-xs text-gray-500 mt-1">
                          Rekomendasi: Square 1:1, maksimal 1MB
                        </p>
                      </div>
                      {logoPreview && (
                        <button
                          onClick={handleRemoveLogo}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Hapus & Reset
                        </button>
                      )}
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Preview */}
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden bg-white border-2 border-gray-200 flex items-center justify-center">
                        {logoPreview ? (
                          <img
                            src={logoPreview}
                            alt="Logo"
                            className="w-full h-full object-contain p-2"
                          />
                        ) : (
                          <div className="text-center">
                            <ImageIcon className="w-8 h-8 mx-auto text-gray-400" />
                            <p className="text-xs text-gray-500 mt-1">SYD Logo</p>
                          </div>
                        )}
                      </div>

                      {/* Upload Button */}
                      <label className="cursor-pointer flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          disabled={uploadingLogo}
                        />
                        <div className="flex items-center justify-center space-x-2 px-4 py-3 bg-white border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors">
                          <Upload className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Admin Manager Section */}
                <div className="border-t pt-6">
                  <AdminManager planId={planId} isOwner={plan?.isOwner || false} />
                </div>
              </div>
            )}
            {activeTab === 'rundown' && <RundownTab planId={planId} />}
            {activeTab === 'participants' && <ParticipantsTab planId={planId} />}
            {activeTab === 'expenses' && <ExpensesTab planId={planId} />}
            {activeTab === 'contributions' && <ContributionsTab planId={planId} />}
            {activeTab === 'note' && <NoteTab planId={planId} />}
            {activeTab === 'rincian' && plan?.status === 'completed' && <RincianTab planId={planId} plan={plan} />}
          </div>
        </div>
      </div>
    </div>
  )
}
