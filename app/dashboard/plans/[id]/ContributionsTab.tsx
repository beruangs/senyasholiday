'use client'

import { useState, useEffect } from 'react'
import { Check, X, DollarSign, ChevronDown, ChevronUp, Edit2, Save } from 'lucide-react'
import { toast } from 'sonner'

interface Participant {
  _id: string
  name: string
}

interface ExpenseItem {
  _id: string
  itemName: string
  collectorId?: string
}

interface Contribution {
  _id?: string
  expenseItemId: string
  participantId: string
  amount: number
  paid: number
  isPaid: boolean
}

interface ContributionGroup {
  expenseId: string
  expenseName: string
  collectorId: string
  collectorName: string
  contributions: Array<Contribution & {
    participantName: string
  }>
  totalAmount: number
  totalPaid: number
  totalRemaining: number
  contributors: Contribution[]
}

export default function ContributionsTab({ planId }: { planId: string }) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedExpense, setExpandedExpense] = useState<string | null>(null)
  const [editingContribution, setEditingContribution] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState(0)

  useEffect(() => {
    fetchData()
  }, [planId])

  const fetchData = async () => {
    try {
      const [participantsRes, expensesRes, contributionsRes] = await Promise.all([
        fetch(`/api/participants?planId=${planId}`),
        fetch(`/api/expenses?planId=${planId}`),
        fetch(`/api/contributions?planId=${planId}`),
      ])

      let participantsData: Participant[] = []
      let expensesData: ExpenseItem[] = []
      let contributionsData: Contribution[] = []

      if (participantsRes.ok) {
        participantsData = await participantsRes.json()
        setParticipants(participantsData)
      }

      if (expensesRes.ok) {
        expensesData = await expensesRes.json()
        setExpenseItems(expensesData)
      }

      if (contributionsRes.ok) {
        contributionsData = await contributionsRes.json()
        setContributions(contributionsData)
      }
    } catch (error) {
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const updatePayment = async (contributionId: string, newPaid: number) => {
    try {
      const res = await fetch('/api/contributions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: contributionId,
          paid: newPaid,
        }),
      })

      if (res.ok) {
        toast.success('Pembayaran berhasil diupdate')
        setEditingContribution(null)
        fetchData()
      }
    } catch (error) {
      toast.error('Gagal mengupdate pembayaran')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Group contributions by expense
  const groupedContributions: ContributionGroup[] = expenseItems
    .map(expense => {
      const expenseContributions = contributions.filter(c => c.expenseItemId === expense._id)
      const collectorName = participants.find(p => p._id === expense.collectorId)?.name || 'Unknown'

      const contributionsWithDetails = expenseContributions.map(c => ({
        ...c,
        participantName: participants.find(p => p._id === c.participantId)?.name || 'Unknown',
      }))

      const totalAmount = expenseContributions.reduce((sum, c) => sum + c.amount, 0)
      const totalPaid = expenseContributions.reduce((sum, c) => sum + c.paid, 0)
      const totalRemaining = totalAmount - totalPaid

      return {
        expenseId: expense._id!,
        expenseName: expense.itemName,
        collectorId: expense.collectorId || '',
        collectorName,
        contributions: contributionsWithDetails,
        totalAmount,
        totalPaid,
        totalRemaining,
        contributors: expenseContributions,
      }
    })
    .filter(group => group.contributions.length > 0)

  const grandTotal = groupedContributions.reduce((sum, group) => sum + group.totalAmount, 0)
  const grandPaid = groupedContributions.reduce((sum, group) => sum + group.totalPaid, 0)
  const grandRemaining = grandTotal - grandPaid

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Tabel Iuran</h2>

      {groupedContributions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Belum ada iuran. Tambahkan iuran di tab Keuangan.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Grouped Expenses */}
          {groupedContributions.map(group => (
            <div key={group.expenseId} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Header - Collapsible */}
              <button
                onClick={() =>
                  setExpandedExpense(expandedExpense === group.expenseId ? null : group.expenseId)
                }
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-900">
                    {group.expenseName} - {group.collectorName}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {group.contributions.length} peserta iuran
                  </p>
                </div>

                <div className="flex items-center space-x-4 mr-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Total / Terbayar</p>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(group.totalPaid)} / {formatCurrency(group.totalAmount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Sisa</p>
                    <p className={`font-semibold ${group.totalRemaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(group.totalRemaining)}
                    </p>
                  </div>
                </div>

                <div className="text-gray-600">
                  {expandedExpense === group.expenseId ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </button>

              {/* Details - Expanded */}
              {expandedExpense === group.expenseId && (
                <div className="border-t border-gray-200 bg-gray-50 divide-y divide-gray-200">
                  {group.contributions.map((contrib, idx) => {
                    const remaining = contrib.amount - contrib.paid
                    const isEditing = editingContribution === contrib._id
                    const percentage = Math.round((contrib.paid / contrib.amount) * 100)

                    return (
                      <div key={contrib._id} className="px-6 py-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{contrib.participantName}</p>
                            <p className="text-sm text-gray-600">
                              Nominal: {formatCurrency(contrib.amount)}
                            </p>
                          </div>
                          <div className="text-right">
                            {contrib.amount === contrib.paid ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                                <Check className="w-3 h-3 mr-1" />
                                Lunas
                              </span>
                            ) : contrib.paid > 0 ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
                                Sebagian
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                                <X className="w-3 h-3 mr-1" />
                                Belum
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-600">
                              {formatCurrency(contrib.paid)} dari {formatCurrency(contrib.amount)}
                            </span>
                            <span className="text-sm font-semibold text-gray-700">{percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                remaining === 0 ? 'bg-green-500' : 'bg-primary-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Payment Input */}
                        {isEditing ? (
                          <div className="bg-white rounded-lg p-3 border border-primary-300 space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Jumlah yang sudah dibayar (Rp)
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={contrib.amount}
                                value={editAmount}
                                onChange={(e) => setEditAmount(Math.min(Number(e.target.value), contrib.amount))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                autoFocus
                              />
                            </div>

                            {editAmount > 0 && editAmount < contrib.amount && (
                              <div className="bg-blue-50 p-2 rounded text-sm text-blue-800">
                                Sisa iuran: <span className="font-semibold">{formatCurrency(contrib.amount - editAmount)}</span>
                              </div>
                            )}

                            <div className="flex space-x-2">
                              <button
                                onClick={() =>
                                  updatePayment(contrib._id!, editAmount)
                                }
                                className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center space-x-1 text-sm font-medium"
                              >
                                <Save className="w-4 h-4" />
                                <span>Simpan</span>
                              </button>
                              <button
                                onClick={() => setEditingContribution(null)}
                                className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm font-medium"
                              >
                                Batal
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingContribution(contrib._id!)
                              setEditAmount(contrib.paid)
                            }}
                            className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center space-x-2 text-sm font-medium"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span>
                              {contrib.paid > 0 ? 'Edit Pembayaran' : 'Input Pembayaran'}
                            </span>
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Grand Total */}
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-3">📊 TOTAL KESELURUHAN</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-600">Total Iuran</p>
                <p className="font-bold text-lg text-gray-900">{formatCurrency(grandTotal)}</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-green-600 font-medium">Terbayar</p>
                <p className="font-bold text-lg text-green-600">{formatCurrency(grandPaid)}</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-red-600 font-medium">Sisa</p>
                <p className="font-bold text-lg text-red-600">{formatCurrency(grandRemaining)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
