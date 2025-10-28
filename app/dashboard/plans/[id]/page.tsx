'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Calendar, DollarSign, Users, Share2, Settings, Eye, EyeOff, Edit2, Save, X } from 'lucide-react'
import RundownTab from './RundownTab'
import ExpensesTab from './ExpensesTab'
import ParticipantsTab from './ParticipantsTab'
import ContributionsTab from './ContributionsTab'

type Tab = 'info' | 'rundown' | 'expenses' | 'participants' | 'contributions'

export default function PlanDetailPage() {
  const params = useParams()
  const planId = params.id as string
  const [activeTab, setActiveTab] = useState<Tab>('info')
  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [editingPassword, setEditingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')

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

  const copyShareLink = () => {
    const link = `${window.location.origin}/plan/${planId}`
    navigator.clipboard.writeText(link)
    toast.success('Link berhasil disalin!')
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
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Dashboard
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {plan?.title}
              </h1>
              <p className="text-gray-600">{plan?.destination}</p>
            </div>
            <button
              onClick={copyShareLink}
              className="mt-4 md:mt-0 inline-flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              <span>Share Link</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('info')}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === 'info'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span>Info</span>
              </button>

              <button
                onClick={() => setActiveTab('rundown')}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === 'rundown'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span>Rundown</span>
              </button>

              <button
                onClick={() => setActiveTab('participants')}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === 'participants'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Peserta</span>
              </button>

              <button
                onClick={() => setActiveTab('expenses')}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === 'expenses'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                <span>Keuangan</span>
              </button>

              <button
                onClick={() => setActiveTab('contributions')}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === 'contributions'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                <span>Iuran</span>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Judul</label>
                  <p className="text-gray-900 text-lg">{plan?.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Destinasi</label>
                  <p className="text-gray-900">{plan?.destination}</p>
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
                  <p className="text-gray-900">{plan?.description || '-'}</p>
                </div>
                
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
              </div>
            )}
            {activeTab === 'rundown' && <RundownTab planId={planId} />}
            {activeTab === 'participants' && <ParticipantsTab planId={planId} />}
            {activeTab === 'expenses' && <ExpensesTab planId={planId} />}
            {activeTab === 'contributions' && <ContributionsTab planId={planId} />}
          </div>
        </div>
      </div>
    </div>
  )
}
