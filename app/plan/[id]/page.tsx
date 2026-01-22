'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Lock, Calendar, MapPin, DollarSign, Users, CreditCard, FileText, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { usePageTitle, pageTitle } from '@/lib/usePageTitle'
import SuggestionButton from '@/components/SuggestionButton'

export default function PublicPlanPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = params.id as string
  
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [plan, setPlan] = useState<any>(null)
  const [rundowns, setRundowns] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [participants, setParticipants] = useState<any[]>([])
  const [contributions, setContributions] = useState<any[]>([])
  const [note, setNote] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'rundown' | 'keuangan' | 'iuran' | 'peserta' | 'note'>('rundown')

  // Set page title when plan loads
  usePageTitle(plan ? pageTitle.publicPlan(plan.title) : 'Loading...')
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchPlan()
  }, [planId])

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData()
    }
  }, [isAuthenticated])

  useEffect(() => {
    // Handle payment result from Midtrans
    const paymentStatus = searchParams.get('payment')
    if (paymentStatus === 'success') {
      toast.success('Pembayaran berhasil! Terima kasih 🎉')
      // Refresh data
      if (isAuthenticated) {
        fetchAllData()
      }
    } else if (paymentStatus === 'error') {
      toast.error('Pembayaran gagal. Silakan coba lagi.')
    } else if (paymentStatus === 'pending') {
      toast.info('Pembayaran pending. Mohon selesaikan pembayaran Anda.')
    }
  }, [searchParams, isAuthenticated])

  const fetchPlan = async () => {
    try {
      const res = await fetch(`/api/plans/${planId}`)
      if (res.ok) {
        const data = await res.json()
        setPlan(data)
        // If no password required, authenticate automatically
        if (!data.hasPassword) {
          setIsAuthenticated(true)
        }
      }
    } catch (error) {
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const fetchAllData = async () => {
    try {
      const [rundownsRes, expensesRes, participantsRes, contributionsRes, notesRes] = await Promise.all([
        fetch(`/api/rundowns?planId=${planId}`),
        fetch(`/api/expenses?planId=${planId}`),
        fetch(`/api/participants?planId=${planId}`),
        fetch(`/api/contributions?planId=${planId}`),
        fetch(`/api/notes?planId=${planId}`),
      ])

      if (rundownsRes.ok) setRundowns(await rundownsRes.json())
      if (expensesRes.ok) setExpenses(await expensesRes.json())
      if (participantsRes.ok) setParticipants(await participantsRes.json())
      if (contributionsRes.ok) setContributions(await contributionsRes.json())
      if (notesRes.ok) {
        const data = await notesRes.json()
        setNote(data.content || '')
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const res = await fetch(`/api/plans/${planId}/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      
      const data = await res.json()
      
      if (data.valid) {
        setIsAuthenticated(true)
        toast.success('Akses diberikan!')
      } else {
        toast.error('Password salah!')
        setPassword('')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handlePayment = async (participantId: string, participantName: string) => {
    setPaymentLoading(participantId)
    
    try {
      // Get all contributions for this participant that are not fully paid
      const participantContributions = contributions.filter((c: any) => {
        const cParticipantId = typeof c.participantId === 'object'
          ? c.participantId._id
          : c.participantId
        return cParticipantId === participantId && c.paid < c.amount
      })

      if (participantContributions.length === 0) {
        toast.error('Tidak ada iuran yang perlu dibayar')
        setPaymentLoading(null)
        return
      }

      const contributionIds = participantContributions.map((c: any) => c._id)

      // Create payment
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contributionIds,
          participantId,
          planId,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to create payment')
      }

      const data = await res.json()

      // Redirect to Midtrans payment page
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
      } else {
        toast.error('Gagal membuat payment link')
        setPaymentLoading(null)
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Gagal membuat pembayaran. Silakan coba lagi.')
      setPaymentLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Plan tidak ditemukan</h1>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    )
  }

  if (plan.hasPassword && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-center mb-6">
            <Image src="/logo.png" alt="SEN YAS DADDY" width={80} height={80} className="rounded-xl" />
          </div>
          <div className="text-center mb-6">
            <Lock className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{plan.title}</h1>
            <p className="text-gray-600">Rencana ini dilindungi password</p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="Masukkan password"
              />
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Akses Rencana
            </button>
          </form>
        </div>
        <SuggestionButton page={`Shared Link - ${plan?.title || 'Unknown'}`} />
      </div>
    )
  }

  const grandTotal = expenses.reduce((sum, exp) => sum + exp.total, 0)
  
  // Group contributions by COLLECTOR, then by PARTICIPANT
  const groupedContributions = (() => {
    const collectorMap = new Map()

    expenses.forEach(expense => {
      const collectorId = expense.collectorId || 'unknown'
      const collectorName = participants.find(p => p._id === collectorId)?.name || 'Unknown'

      if (!collectorMap.has(collectorId)) {
        collectorMap.set(collectorId, {
          collectorId,
          collectorName,
          expenses: [],
          participants: [],
          totalAmount: 0,
          totalPaid: 0,
        })
      }

      const group = collectorMap.get(collectorId)

      group.expenses.push({
        expenseId: expense._id,
        expenseName: expense.itemName,
      })

      // Get contributions for this expense
      const expenseContributions = contributions.filter(c => {
        const contributionExpenseId = typeof c.expenseItemId === 'object'
          ? c.expenseItemId?._id
          : c.expenseItemId
        return contributionExpenseId === expense._id
      })

      // Group by participant
      expenseContributions.forEach(contribution => {
        const participantId = typeof contribution.participantId === 'object'
          ? contribution.participantId?._id
          : contribution.participantId

        const participantName = typeof contribution.participantId === 'object'
          ? contribution.participantId?.name
          : participants.find(p => p._id === participantId)?.name || 'Unknown'

        let participant = group.participants.find((p: any) => p.participantId === participantId)
        if (!participant) {
          participant = {
            participantId,
            participantName,
            expenseNames: [],
            totalAmount: 0,
            totalPaid: 0,
          }
          group.participants.push(participant)
        }

        if (!participant.expenseNames.includes(expense.itemName)) {
          participant.expenseNames.push(expense.itemName)
        }

        participant.totalAmount += contribution.amount
        participant.totalPaid += contribution.paid

        group.totalAmount += contribution.amount
        group.totalPaid += contribution.paid
      })
    })

    return Array.from(collectorMap.values()).filter((group: any) => group.participants.length > 0)
  })()

  // Flatten all participants for "Total Per Orang" section
  const allParticipantsFlattened = (() => {
    const participantMap = new Map()
    
    groupedContributions.forEach((group: any) => {
      group.participants.forEach((p: any) => {
        if (participantMap.has(p.participantId)) {
          const existing = participantMap.get(p.participantId)
          existing.totalAmount += p.totalAmount
          existing.totalPaid += p.totalPaid
          p.expenseNames.forEach((name: string) => {
            if (!existing.expenseNames.includes(name)) {
              existing.expenseNames.push(name)
            }
          })
        } else {
          participantMap.set(p.participantId, { ...p })
        }
      })
    })

    return Array.from(participantMap.values())
  })()

  const allContributionsTotal = groupedContributions.reduce((sum: number, g: any) => sum + g.totalAmount, 0)
  const allContributionsPaid = groupedContributions.reduce((sum: number, g: any) => sum + g.totalPaid, 0)

  const groupedRundowns = rundowns.reduce((acc: any, rundown) => {
    const date = rundown.date
    if (!acc[date]) acc[date] = []
    acc[date].push(rundown)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Banner & Logo */}
      <div className="relative">
        {/* Banner */}
        <div className="h-40 sm:h-48 md:h-56 lg:h-64 w-full">
          {plan.bannerImage ? (
            <img 
              src={plan.bannerImage} 
              alt="Banner" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700" />
          )}
        </div>

        {/* Content Container */}
        <div className="relative">
          {/* Logo - Overlapping banner */}
          <div className="absolute -top-10 sm:-top-12 md:-top-14 left-1/2 transform -translate-x-1/2">
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-2xl overflow-hidden bg-white shadow-xl border-4 border-white">
              {plan.logoImage ? (
                <img 
                  src={plan.logoImage} 
                  alt="Logo" 
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl sm:text-3xl md:text-4xl">SYD</span>
                </div>
              )}
            </div>
          </div>

          {/* Title & Info */}
          <div className="bg-white pt-14 sm:pt-16 md:pt-20 pb-6 px-4">
            <div className="max-w-7xl mx-auto text-center">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">{plan.title}</h1>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm sm:text-base text-gray-600">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary-600" />
                  <span>{plan.destination}</span>
                </div>
                <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-400" />
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary-600" />
                  <span>
                    {format(new Date(plan.startDate), 'd MMM', { locale: id })} -{' '}
                    {format(new Date(plan.endDate), 'd MMM yyyy', { locale: id })}
                  </span>
                </div>
              </div>
              {plan.description && (
                <p className="mt-4 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
                  {plan.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'info'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500'
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
                  : 'border-transparent text-gray-500'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span>Rundown</span>
            </button>
            <button
              onClick={() => setActiveTab('peserta')}
              className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'peserta'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Peserta</span>
            </button>
            <button
              onClick={() => setActiveTab('keuangan')}
              className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'keuangan'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              <DollarSign className="w-5 h-5" />
              <span>Keuangan</span>
            </button>
            <button
              onClick={() => setActiveTab('iuran')}
              className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'iuran'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>Iuran</span>
            </button>
            <button
              onClick={() => setActiveTab('note')}
              className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'note'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>Note</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'info' && (
          <div className="space-y-6">
            {/* Plan Details Card */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">Destinasi</h3>
                  <p className="text-lg text-gray-900">{plan.destination}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">Tanggal Mulai</h3>
                    <p className="text-lg text-gray-900">
                      {format(new Date(plan.startDate), 'd MMMM yyyy', { locale: id })}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">Tanggal Berakhir</h3>
                    <p className="text-lg text-gray-900">
                      {format(new Date(plan.endDate), 'd MMMM yyyy', { locale: id })}
                    </p>
                  </div>
                </div>
                {plan.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">Deskripsi</h3>
                    <p className="text-gray-700 leading-relaxed">{plan.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'rundown' && (
          <div className="space-y-6">
            {Object.keys(groupedRundowns).length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Belum ada rundown tersedia</p>
              </div>
            ) : (
              Object.keys(groupedRundowns)
                .sort()
                .map((date) => (
                  <div key={date} className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="bg-primary-50 px-6 py-3 border-b border-primary-100">
                      <h3 className="font-semibold text-primary-900">
                        {format(new Date(date), 'EEEE, d MMMM yyyy', { locale: id })}
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {groupedRundowns[date].map((rundown: any) => (
                        <div key={rundown._id} className="p-6">
                          {rundown.time && (
                            <span className="text-sm font-medium text-primary-600 mb-1 block">
                              {rundown.time}
                            </span>
                          )}
                          <h4 className="font-semibold text-gray-900 mb-2">{rundown.activity}</h4>
                          {rundown.location && (
                            <p className="text-sm text-gray-600 mb-1">📍 {rundown.location}</p>
                          )}
                          {rundown.notes && (
                            <p className="text-sm text-gray-600 mt-2">{rundown.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {activeTab === 'keuangan' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {expenses.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Belum ada data keuangan</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          No
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Keperluan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Detail
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Harga
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          QTY
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {expenses.map((expense, index) => (
                        <tr key={expense._id}>
                          <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{expense.itemName}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{expense.detail || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right">
                            {formatCurrency(expense.price)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-center">
                            {expense.quantity}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                            {formatCurrency(expense.total)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-primary-50 font-bold">
                        <td colSpan={5} className="px-6 py-4 text-right text-gray-900">
                          TOTAL
                        </td>
                        <td className="px-6 py-4 text-right text-primary-600 text-lg">
                          {formatCurrency(grandTotal)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'iuran' && (
          <div className="space-y-6">
            {groupedContributions.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Belum ada data iuran</p>
              </div>
            ) : (
              <>
                {/* Total Per Participant - Always Expanded */}
                <div className="bg-white border-2 border-primary-200 rounded-lg overflow-hidden">
                  <div className="bg-primary-50 px-6 py-3 border-b border-primary-100">
                    <h3 className="font-semibold text-primary-900 flex items-center gap-2">
                      👥 Total Iuran Per Orang
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {allParticipantsFlattened
                      .sort((a: any, b: any) => {
                        const getStatus = (p: any) => {
                          if (p.totalPaid === 0) return 0
                          if (p.totalPaid < p.totalAmount) return 1
                          return 2
                        }
                        return getStatus(a) - getStatus(b)
                      })
                      .map((participant: any) => {
                        const status = participant.totalPaid === 0 ? 'Belum' : participant.totalPaid >= participant.totalAmount ? 'Lunas' : 'Sebagian'
                        const statusColor = status === 'Lunas' ? 'bg-green-100 text-green-800' : status === 'Sebagian' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        const percentage = Math.round((participant.totalPaid / participant.totalAmount) * 100)
                        const remaining = participant.totalAmount - participant.totalPaid

                        return (
                          <div key={participant.participantId} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">
                                  {participant.participantName}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  ({participant.expenseNames.join(', ')}) • {formatCurrency(participant.totalAmount)}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                                  {status}
                                </span>
                                {remaining > 0 && (
                                  <button
                                    onClick={() => handlePayment(participant.participantId, participant.participantName)}
                                    disabled={paymentLoading === participant.participantId}
                                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                                  >
                                    <CreditCard className="w-4 h-4" />
                                    <span>{paymentLoading === participant.participantId ? 'Loading...' : 'Bayar'}</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Progress Bar */}
                            {participant.totalPaid > 0 && participant.totalPaid < participant.totalAmount && (
                              <div className="mb-2">
                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                  <span>Progress: {percentage}%</span>
                                  <span>{formatCurrency(participant.totalPaid)} / {formatCurrency(participant.totalAmount)}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            <div className="text-sm text-gray-600">
                              Terbayar: <span className="font-semibold text-green-600">{formatCurrency(participant.totalPaid)}</span>
                              {remaining > 0 && (
                                <> • Sisa: <span className="font-semibold text-red-600">{formatCurrency(remaining)}</span></>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>

                {/* Grouped by Collector - Collapsed (not interactive in public view, just showing data) */}
                {groupedContributions.map((group: any) => (
                  <details key={group.collectorId} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <summary className="px-4 py-3 sm:px-6 sm:py-4 cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg sm:text-lg font-semibold text-gray-900">👤 {group.collectorName}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${group.totalAmount - group.totalPaid > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{group.totalAmount - group.totalPaid > 0 ? 'Belum Lunas' : 'Lunas'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-base">
                          <span className="font-semibold text-gray-900">{formatCurrency(group.totalAmount)}</span>
                          <span className="text-green-700 font-semibold">{formatCurrency(group.totalPaid)}</span>
                          <span className={group.totalAmount - group.totalPaid > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>{formatCurrency(group.totalAmount - group.totalPaid)}</span>
                          {group.totalAmount - group.totalPaid > 0 && (
                            <span className="hidden sm:inline text-xs text-gray-400 ml-2">Sisa</span>
                          )}
                        </div>
                      </div>
                    </summary>

                    <div className="border-t border-gray-200 bg-gray-50 divide-y divide-gray-200">
                      {group.participants
                        .sort((a: any, b: any) => {
                          const getStatus = (p: any) => {
                            if (p.totalPaid === 0) return 0
                            if (p.totalPaid < p.totalAmount) return 1
                            return 2
                          }
                          return getStatus(a) - getStatus(b)
                        })
                        .map((participant: any) => {
                          const status = participant.totalPaid === 0 ? 'Belum' : participant.totalPaid >= participant.totalAmount ? 'Lunas' : 'Sebagian'
                          const statusColor = status === 'Lunas' ? 'bg-green-100 text-green-800' : status === 'Sebagian' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          const percentage = Math.round((participant.totalPaid / participant.totalAmount) * 100)
                          const remaining = participant.totalAmount - participant.totalPaid

                          return (
                            <div key={participant.participantId} className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-100 last:border-b-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900 text-base sm:text-lg">{participant.participantName}</span>
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}>{status}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs sm:text-base">
                                  <span className="font-semibold text-gray-900">{formatCurrency(participant.totalAmount)}</span>
                                  {remaining > 0 && (
                                    <button
                                      onClick={() => handlePayment(participant.participantId, participant.participantName)}
                                      disabled={paymentLoading === participant.participantId}
                                      className="flex items-center space-x-1 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm whitespace-nowrap"
                                    >
                                      <CreditCard className="w-4 h-4" />
                                      <span>{paymentLoading === participant.participantId ? 'Loading...' : 'Bayar'}</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                              {/* Progress & Info (only show if Sebagian, minimal in mobile) */}
                              {status === 'Sebagian' && (
                                <div className="mt-2">
                                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                                    <span>Progress: {percentage}%</span>
                                    <span>{formatCurrency(participant.totalPaid)} / {formatCurrency(participant.totalAmount)}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                      className="bg-yellow-500 h-1.5 rounded-full transition-all"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                              {/* Info Terbayar & Sisa (minimal) */}
                              <div className="text-xs text-gray-600 mt-1">
                                {participant.totalPaid > 0 && (
                                  <>
                                    <span className="font-semibold text-green-600">{formatCurrency(participant.totalPaid)}</span>
                                    {remaining > 0 && (
                                      <> • <span className="font-semibold text-red-600">{formatCurrency(remaining)}</span></>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </details>
                ))}

                {/* Grand Total */}
                <div className="bg-primary-600 text-white rounded-lg p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-primary-100 text-sm mb-1">Total Iuran</p>
                      <p className="text-2xl font-bold">{formatCurrency(allContributionsTotal)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-primary-100 text-sm mb-1">Terbayar</p>
                      <p className="text-xl font-semibold">{formatCurrency(allContributionsPaid)}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'peserta' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {participants.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Belum ada peserta</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {participants.map((participant) => (
                  <div key={participant._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <h3 className="font-semibold text-lg text-gray-900">{participant.name}</h3>
                    {participant.phoneNumber && (
                      <p className="text-sm text-gray-600 mt-1">📱 {participant.phoneNumber}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'note' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {note ? (
              <div className="p-6">
                <div 
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: note }}
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Belum ada catatan</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-8">
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
        >
          ← Kembali ke Beranda
        </button>
      </div>

      {/* Suggestion Button */}
      <SuggestionButton page={`Shared Link - ${plan?.title || 'Unknown'}`} />
    </div>
  )
}
