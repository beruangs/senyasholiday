'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Calendar, DollarSign, Users, Share2, Settings } from 'lucide-react'
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

  useEffect(() => {
    fetchPlan()
  }, [planId])

  const fetchPlan = async () => {
    try {
      const res = await fetch(`/api/plans/${planId}`)
      if (res.ok) {
        const data = await res.json()
        setPlan(data)
      }
    } catch (error) {
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
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
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Judul</label>
                  <p className="text-gray-900">{plan?.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Destinasi</label>
                  <p className="text-gray-900">{plan?.destination}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Mulai</label>
                    <p className="text-gray-900">{new Date(plan?.startDate).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Selesai</label>
                    <p className="text-gray-900">{new Date(plan?.endDate).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
                  <p className="text-gray-900">{plan?.description || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status Password</label>
                  <p className="text-gray-900">
                    {plan?.hasPassword ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Terproteksi</span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">Publik</span>
                    )}
                  </p>
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
