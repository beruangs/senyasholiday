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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [planId])

  const fetchData = async () => {
    try {
      const [expensesRes, contributionsRes, participantsRes] = await Promise.all([
        fetch(`/api/expenses?holidayPlanId=${planId}`),
        fetch(`/api/contributions?holidayPlanId=${planId}`),
        fetch(`/api/participants?holidayPlanId=${planId}`)
      ])

      if (expensesRes.ok && contributionsRes.ok && participantsRes.ok) {
        const [expensesData, contributionsData, participantsData] = await Promise.all([
          expensesRes.json(),
          contributionsRes.json(),
          participantsRes.json()
        ])

        setExpenses(expensesData)
        setContributions(contributionsData)
        setParticipants(participantsData)
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
    window.print()
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

  return (
    <div className="space-y-8 print:space-y-6">
      {/* Header Section - Print Friendly */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-xl p-8 text-white print:bg-white print:text-gray-900 print:border-2 print:border-gray-900">
        <div className="flex items-center justify-between mb-6 print:mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 print:text-2xl">{plan.title}</h1>
            <p className="text-xl text-primary-100 print:text-gray-700">{plan.destination}</p>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors print:hidden"
          >
            <Printer className="w-5 h-5" />
            <span>Cetak</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
          <div>
            <p className="text-sm text-primary-100 mb-1 print:text-gray-600">Tanggal Mulai</p>
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
      <div className="text-center text-sm text-gray-500 py-4 border-t border-gray-200 print:text-xs">
        <p>Laporan dicetak pada: {formatDate(new Date())}</p>
        <p className="mt-1">© {new Date().getFullYear()} - Sistem Manajemen Liburan</p>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  )
}
