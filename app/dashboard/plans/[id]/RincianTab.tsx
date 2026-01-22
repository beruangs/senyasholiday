'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { FileText, DollarSign, Users, Calendar, CheckCircle, XCircle, Printer } from 'lucide-react'

interface RincianTabProps {
  planId: string
  plan: any
}

export default function RincianTab({ planId, plan }: RincianTabProps) {
  const [expenses, setExpenses] = useState<any[]>([])
  const [contributions, setContributions] = useState<any[]>([])
  const [participants, setParticipants] = useState<any[]>([])
  const [rundowns, setRundowns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showPrintView, setShowPrintView] = useState(false)

  useEffect(() => {
    fetchData()
  }, [planId])

  const fetchData = async () => {
    try {
      const [expensesRes, contributionsRes, participantsRes, rundownsRes] = await Promise.all([
        fetch(`/api/expenses?planId=${planId}`),
        fetch(`/api/contributions?planId=${planId}`),
        fetch(`/api/participants?planId=${planId}`),
        fetch(`/api/rundowns?planId=${planId}`)
      ])

      if (expensesRes.ok && contributionsRes.ok && participantsRes.ok) {
        const [expensesData, contributionsData, participantsData, rundownsData] = await Promise.all([
          expensesRes.json(),
          contributionsRes.json(),
          participantsRes.json(),
          rundownsRes.json()
        ])

        setExpenses(expensesData)
        setContributions(contributionsData)
        setParticipants(participantsData)
        setRundowns(rundownsData)
      }
    } catch (error) {
      toast.error('Gagal memuat data rincian')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handlePrint = () => {
    setShowPrintView(true)
    setTimeout(() => {
      window.print()
    }, 500)
  }

  const handleClosePrint = () => {
    setShowPrintView(false)
  }

  if (loading) {
    return <div className="text-center py-8">Memuat rincian...</div>
  }

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.total, 0)
  const totalDP = expenses.reduce((sum, exp) => {
    const dpAmount = (exp.total * (exp.downPayment || 0)) / 100
    return sum + dpAmount
  }, 0)
  const totalRegular = totalExpenses - totalDP

  const totalCollected = contributions.reduce((sum, c) => sum + c.paid, 0)
  const totalDPCollected = contributions.reduce((sum, c) => {
    const expense = expenses.find(e => e._id === c.expenseItemId?._id || c.expenseItemId)
    if (expense && expense.downPayment > 0) {
      return sum + c.paid
    }
    return sum
  }, 0)
  const totalRegularCollected = totalCollected - totalDPCollected

  const totalRemaining = totalExpenses - totalCollected

  // Group contributions by participant
  const participantSummary = participants.map(participant => {
    const participantContributions = contributions.filter(
      c => (c.participantId?._id || c.participantId) === participant._id
    )

    const totalAmount = participantContributions.reduce((sum, c) => sum + c.amount, 0)
    const totalPaid = participantContributions.reduce((sum, c) => sum + c.paid, 0)
    const remaining = totalAmount - totalPaid

    // Separate DP and regular
    let dpAmount = 0
    let regularAmount = 0
    let dpPaid = 0
    let regularPaid = 0

    participantContributions.forEach(c => {
      const expense = expenses.find(e => e._id === (c.expenseItemId?._id || c.expenseItemId))
      if (expense && expense.downPayment > 0) {
        dpAmount += c.amount
        dpPaid += c.paid
      } else {
        regularAmount += c.amount
        regularPaid += c.paid
      }
    })

    return {
      participant,
      totalAmount,
      totalPaid,
      remaining,
      dpAmount,
      regularAmount,
      dpPaid,
      regularPaid,
      contributions: participantContributions,
      status: totalPaid >= totalAmount ? 'lunas' : totalPaid > 0 ? 'sebagian' : 'belum'
    }
  }).sort((a, b) => a.participant.name.localeCompare(b.participant.name))

  // Group rundowns by date
  const groupedRundowns = rundowns.reduce((acc: any, rundown: any) => {
    const date = new Date(rundown.date).toISOString().split('T')[0]
    if (!acc[date]) acc[date] = []
    acc[date].push(rundown)
    return acc
  }, {})

  return (
    <>
      <div className="space-y-8 print:hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{plan.title}</h1>
              <p className="text-xl text-primary-100">{plan.destination}</p>
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <Printer className="w-5 h-5" />
              <span>Cetak Rincian</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-primary-100 mb-1">Tanggal Mulai</p>
              <p className="font-semibold">{formatDate(plan.startDate)}</p>
            </div>
            <div>
              <p className="text-sm text-primary-100 mb-1 print:text-gray-600">Tanggal Selesai</p>
              <p className="font-semibold">{formatDate(plan.endDate)}</p>
            </div>
            <div>
              <p className="text-sm text-primary-100 mb-1 print:text-gray-600">Diselesaikan</p>
              <p className="font-semibold">{plan.completedAt ? formatDate(plan.completedAt) : '-'}</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 print:p-2">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-medium text-blue-900">Total Pengeluaran</p>
            </div>
            <p className="text-2xl font-bold text-blue-700 print:text-xl">{formatCurrency(totalExpenses)}</p>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 print:p-2">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-900">Terkumpul</p>
            </div>
            <p className="text-2xl font-bold text-green-700 print:text-xl">{formatCurrency(totalCollected)}</p>
            <p className="text-xs text-green-600 mt-1">
              {Math.round((totalCollected / totalExpenses) * 100)}%
            </p>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 print:p-2">
            <div className="flex items-center space-x-2 mb-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm font-medium text-red-900">Sisa</p>
            </div>
            <p className="text-2xl font-bold text-red-700 print:text-xl">{formatCurrency(totalRemaining)}</p>
          </div>

          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 print:p-2">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="w-5 h-5 text-purple-600" />
              <p className="text-sm font-medium text-purple-900">Total Peserta</p>
            </div>
            <p className="text-2xl font-bold text-purple-700 print:text-xl">{participants.length}</p>
          </div>
        </div>

        {/* DP Summary */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 print:p-4 print:shadow-none">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center print:text-lg">
            <DollarSign className="w-6 h-6 mr-2 text-primary-600" />
            Ringkasan DP & Pelunasan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-2">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 print:p-2">
              <p className="text-sm text-yellow-800 mb-1">Total DP (Down Payment)</p>
              <p className="text-2xl font-bold text-yellow-700 print:text-xl">{formatCurrency(totalDP)}</p>
              <p className="text-xs text-yellow-600 mt-1">Terkumpul: {formatCurrency(totalDPCollected)}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 print:p-2">
              <p className="text-sm text-blue-800 mb-1">Total Pelunasan</p>
              <p className="text-2xl font-bold text-blue-700 print:text-xl">{formatCurrency(totalRegular)}</p>
              <p className="text-xs text-blue-600 mt-1">Terkumpul: {formatCurrency(totalRegularCollected)}</p>
            </div>
          </div>
        </div>

        {/* Detailed Expense Table */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 overflow-hidden print:shadow-none">
          <div className="p-6 border-b border-gray-200 print:p-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center print:text-lg">
              <FileText className="w-6 h-6 mr-2 text-primary-600" />
              Detail Pengeluaran
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full print:text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-1">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-1">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-1">
                    Kolektor
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-1">
                    Total
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-1">
                    DP (%)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-1">
                    Jumlah DP
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-1">
                    Peserta
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((expense, index) => {
                  const dpAmount = (expense.total * (expense.downPayment || 0)) / 100
                  const participantCount = contributions.filter(
                    c => (c.expenseItemId?._id || c.expenseItemId) === expense._id
                  ).length

                  return (
                    <tr key={expense._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:px-2 print:py-1">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 print:px-2 print:py-1">
                        <div className="font-medium">{expense.itemName}</div>
                        {expense.detail && (
                          <div className="text-gray-500 text-xs">{expense.detail}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:px-2 print:py-1">
                        {expense.collectorId?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right print:px-2 print:py-1">
                        {formatCurrency(expense.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right print:px-2 print:py-1">
                        {expense.downPayment || 0}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-yellow-700 text-right print:px-2 print:py-1">
                        {formatCurrency(dpAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center print:px-2 print:py-1">
                        {participantCount} orang
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-gray-100 font-bold">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-sm text-gray-900 text-right print:px-2 print:py-2">
                    TOTAL
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right print:px-2 print:py-2">
                    {formatCurrency(totalExpenses)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right print:px-2 print:py-2">
                    -
                  </td>
                  <td className="px-6 py-4 text-sm text-yellow-700 text-right print:px-2 print:py-2">
                    {formatCurrency(totalDP)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-center print:px-2 print:py-2">
                    -
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Participant Summary Table */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 overflow-hidden print:shadow-none print:break-before-page">
          <div className="p-6 border-b border-gray-200 print:p-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center print:text-lg">
              <Users className="w-6 h-6 mr-2 text-primary-600" />
              Ringkasan Per Peserta
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full print:text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-1">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-1">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-1">
                    Total Iuran
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-1">
                    DP
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-1">
                    Pelunasan
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-1">
                    Terbayar
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-1">
                    Sisa
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:px-2 print:py-1">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {participantSummary.map((item, index) => (
                  <tr key={item.participant._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:px-2 print:py-1">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 print:px-2 print:py-1">
                      {item.participant.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right print:px-2 print:py-1">
                      {formatCurrency(item.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-700 text-right print:px-2 print:py-1">
                      {formatCurrency(item.dpAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700 text-right print:px-2 print:py-1">
                      {formatCurrency(item.regularAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-700 text-right print:px-2 print:py-1">
                      {formatCurrency(item.totalPaid)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-700 text-right print:px-2 print:py-1">
                      {formatCurrency(item.remaining)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center print:px-2 print:py-1">
                      {item.status === 'lunas' && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium print:px-2">
                          ✅ Lunas
                        </span>
                      )}
                      {item.status === 'sebagian' && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium print:px-2">
                          ⏳ Sebagian
                        </span>
                      )}
                      {item.status === 'belum' && (
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium print:px-2">
                          ❌ Belum
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 font-bold">
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-sm text-gray-900 text-right print:px-2 print:py-2">
                    TOTAL
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right print:px-2 print:py-2">
                    {formatCurrency(participantSummary.reduce((sum, p) => sum + p.totalAmount, 0))}
                  </td>
                  <td className="px-6 py-4 text-sm text-yellow-700 text-right print:px-2 print:py-2">
                    {formatCurrency(participantSummary.reduce((sum, p) => sum + p.dpAmount, 0))}
                  </td>
                  <td className="px-6 py-4 text-sm text-blue-700 text-right print:px-2 print:py-2">
                    {formatCurrency(participantSummary.reduce((sum, p) => sum + p.regularAmount, 0))}
                  </td>
                  <td className="px-6 py-4 text-sm text-green-700 text-right print:px-2 print:py-2">
                    {formatCurrency(participantSummary.reduce((sum, p) => sum + p.totalPaid, 0))}
                  </td>
                  <td className="px-6 py-4 text-sm text-red-700 text-right print:px-2 print:py-2">
                    {formatCurrency(participantSummary.reduce((sum, p) => sum + p.remaining, 0))}
                  </td>
                  <td className="px-6 py-4 print:px-2 print:py-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-sm text-gray-500 py-4 border-t border-gray-200">
          <p>Data terakhir diperbarui: {formatDate(new Date())}</p>
          <p className="mt-1">© {new Date().getFullYear()} - Sistem Manajemen Liburan</p>
        </div>
      </div>

      {/* Print Modal */}
      {showPrintView && (
        <div className="fixed inset-0 z-50 bg-white overflow-auto print-modal">
          {/* Print Header */}
          <div className="max-w-5xl mx-auto p-8">
            {/* Header */}
            <div className="border-b-4 border-primary-600 pb-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{plan.title}</h1>
                  <p className="text-xl text-gray-700">{plan.destination}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    {formatDate(plan.startDate)} - {formatDate(plan.endDate)}
                  </p>
                </div>
                <button
                  onClick={handleClosePrint}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg print:hidden"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Info Acara */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
                📋 Informasi Acara
              </h2>
              {plan.description && (
                <p className="text-gray-700 mb-4">{plan.description}</p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-semibold text-green-600">✓ Selesai</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Diselesaikan Pada</p>
                  <p className="font-semibold">{plan.completedAt ? formatDate(plan.completedAt) : '-'}</p>
                </div>
              </div>
            </div>

            {/* Daftar Peserta */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
                👥 Daftar Peserta
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {participants.map((p: any, idx: number) => (
                  <div key={p._id} className="flex items-center space-x-2 text-gray-700">
                    <span className="font-semibold">{idx + 1}.</span>
                    <span>{p.name}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-gray-600">Total: <strong>{participants.length} orang</strong></p>
            </div>

            {/* Rundown */}
            {rundowns.length > 0 && (
              <div className="mb-8 page-break">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
                  📅 Rundown Acara
                </h2>
                {Object.keys(groupedRundowns).sort().map((date) => (
                  <div key={date} className="mb-4">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">{formatDate(date)}</h3>
                    <div className="space-y-2">
                      {groupedRundowns[date].map((r: any) => (
                        <div key={r._id} className="flex gap-3 text-gray-700">
                          {r.time && <span className="font-semibold min-w-[80px]">{r.time}</span>}
                          <div className="flex-1">
                            <p className="font-medium">{r.activity}</p>
                            {r.location && <p className="text-sm text-gray-600">📍 {r.location}</p>}
                            {r.notes && <p className="text-sm text-gray-600 italic">{r.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Keuangan - Summary */}
            <div className="mb-8 page-break">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
                💰 Ringkasan Keuangan
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="border border-gray-300 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Pengeluaran</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
                </div>
                <div className="border border-green-300 rounded-lg p-4 bg-green-50">
                  <p className="text-sm text-gray-600 mb-1">Terkumpul</p>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(totalCollected)}</p>
                </div>
                <div className="border border-red-300 rounded-lg p-4 bg-red-50">
                  <p className="text-sm text-gray-600 mb-1">Sisa</p>
                  <p className="text-2xl font-bold text-red-700">{formatCurrency(totalRemaining)}</p>
                </div>
                <div className="border border-yellow-300 rounded-lg p-4 bg-yellow-50">
                  <p className="text-sm text-gray-600 mb-1">Total DP</p>
                  <p className="text-2xl font-bold text-yellow-700">{formatCurrency(totalDP)}</p>
                </div>
              </div>

              {/* Detail Pengeluaran */}
              <h3 className="font-bold text-lg text-gray-800 mb-3">Detail Pengeluaran</h3>
              <table className="w-full border-collapse border border-gray-300 mb-6">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left text-sm">No</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-sm">Item</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-sm">Kolektor</th>
                    <th className="border border-gray-300 px-3 py-2 text-right text-sm">Total</th>
                    <th className="border border-gray-300 px-3 py-2 text-right text-sm">DP</th>
                    <th className="border border-gray-300 px-3 py-2 text-center text-sm">Peserta</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp: any, idx: number) => {
                    const dpAmount = (exp.total * (exp.downPayment || 0)) / 100
                    const participantCount = contributions.filter(
                      (c: any) => (c.expenseItemId?._id || c.expenseItemId) === exp._id
                    ).length

                    return (
                      <tr key={exp._id}>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{idx + 1}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">
                          <div className="font-medium">{exp.itemName}</div>
                          {exp.detail && <div className="text-xs text-gray-600">{exp.detail}</div>}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{exp.collectorId?.name || '-'}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm text-right font-medium">{formatCurrency(exp.total)}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm text-right text-yellow-700">{formatCurrency(dpAmount)}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm text-center">{participantCount}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-200 font-bold">
                    <td colSpan={3} className="border border-gray-300 px-3 py-2 text-sm text-right">TOTAL</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-right">{formatCurrency(totalExpenses)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-right text-yellow-700">{formatCurrency(totalDP)}</td>
                    <td className="border border-gray-300 px-3 py-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Iuran Per Peserta */}
            <div className="mb-8 page-break">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
                💳 Iuran Per Peserta
              </h2>
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left text-sm">No</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-sm">Nama</th>
                    <th className="border border-gray-300 px-3 py-2 text-right text-sm">Total Iuran</th>
                    <th className="border border-gray-300 px-3 py-2 text-right text-sm">DP</th>
                    <th className="border border-gray-300 px-3 py-2 text-right text-sm">Pelunasan</th>
                    <th className="border border-gray-300 px-3 py-2 text-right text-sm">Terbayar</th>
                    <th className="border border-gray-300 px-3 py-2 text-right text-sm">Sisa</th>
                    <th className="border border-gray-300 px-3 py-2 text-center text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {participantSummary.map((item: any, idx: number) => (
                    <tr key={item.participant._id}>
                      <td className="border border-gray-300 px-3 py-2 text-sm">{idx + 1}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm font-medium">{item.participant.name}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-right font-medium">{formatCurrency(item.totalAmount)}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-right text-yellow-700">{formatCurrency(item.dpAmount)}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-right text-blue-700">{formatCurrency(item.regularAmount)}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-right text-green-700 font-medium">{formatCurrency(item.totalPaid)}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-right text-red-700 font-medium">{formatCurrency(item.remaining)}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-center">
                        <span className={`px-2 py-1 rounded text-xs ${item.status === 'lunas' ? 'bg-green-100 text-green-800' :
                            item.status === 'sebagian' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                          }`}>
                          {item.status === 'lunas' ? '✓ Lunas' : item.status === 'sebagian' ? '⏳ Sebagian' : '✗ Belum'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-200 font-bold">
                    <td colSpan={2} className="border border-gray-300 px-3 py-2 text-sm text-right">TOTAL</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-right">{formatCurrency(participantSummary.reduce((sum: number, p: any) => sum + p.totalAmount, 0))}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-right text-yellow-700">{formatCurrency(participantSummary.reduce((sum: number, p: any) => sum + p.dpAmount, 0))}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-right text-blue-700">{formatCurrency(participantSummary.reduce((sum: number, p: any) => sum + p.regularAmount, 0))}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-right text-green-700">{formatCurrency(participantSummary.reduce((sum: number, p: any) => sum + p.totalPaid, 0))}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-right text-red-700">{formatCurrency(participantSummary.reduce((sum: number, p: any) => sum + p.remaining, 0))}</td>
                    <td className="border border-gray-300 px-3 py-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-gray-300 pt-4 mt-8 text-center text-sm text-gray-600">
              <p>Dokumen dicetak pada: {formatDate(new Date())}</p>
              <p className="mt-1">© {new Date().getFullYear()} - Sistem Manajemen Liburan</p>
            </div>
          </div>

          {/* Print Styles */}
          <style jsx global>{`
          @media print {
            /* Hide everything except print modal */
            body > *:not(.print-modal) {
              display: none !important;
            }
            .print-modal {
              display: block !important;
              position: static !important;
              overflow: visible !important;
            }
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            @page {
              margin: 1.5cm;
              size: A4;
            }
            /* Prevent table headers from repeating on every page */
            thead {
              display: table-header-group;
            }
            /* For tables that should NOT repeat headers, use this class */
            table {
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            /* Prevent elements from breaking in the middle */
            .page-break {
              page-break-before: always;
              break-before: page;
            }
            /* Avoid orphaned content */
            h2, h3 {
              page-break-after: avoid;
              break-after: avoid;
            }
            /* Hide buttons */
            button {
              display: none !important;
            }
            /* Ensure content flows properly without fixed positioning */
            .print-modal > div {
              position: static !important;
            }
          }
          @media screen {
            .print-modal {
              background: white;
            }
          }
        `}</style>
        </div>
      )}
    </>
  )
}
