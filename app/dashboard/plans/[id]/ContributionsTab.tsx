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
  participantId: string
  participantName: string
  expenseNames: string[]
  totalAmount: number
  totalPaid: number
  totalRemaining: number
}

export default function ContributionsTab({ planId }: { planId: string }) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedExpense, setExpandedExpense] = useState<string | null>(null)
  const [editingContribution, setEditingContribution] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState(0)
  
  // Bulk actions state
  const [selectedContributions, setSelectedContributions] = useState<string[]>([])
  const [showBulkPaymentModal, setShowBulkPaymentModal] = useState(false)
  const [bulkPaymentAmount, setBulkPaymentAmount] = useState(0)

  useEffect(() => {
    fetchData()
    
    // Auto-refresh every 10 seconds for real-time sync
    const refreshInterval = setInterval(() => {
      fetchData()
    }, 10000) // 10 seconds

    // Cleanup on unmount
    return () => clearInterval(refreshInterval)
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
        console.log('Participants loaded:', participantsData.length)
        setParticipants(participantsData)
      }

      if (expensesRes.ok) {
        expensesData = await expensesRes.json()
        console.log('Expenses loaded:', expensesData.length)
        setExpenseItems(expensesData)
      }

      if (contributionsRes.ok) {
        contributionsData = await contributionsRes.json()
        console.log('Contributions loaded:', contributionsData.length)
        console.log('Sample contribution:', contributionsData[0])
        setContributions(contributionsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
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
        credentials: 'include',
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

  // Bulk actions handlers
  const toggleSelectAll = () => {
    if (selectedContributions.length === contributions.length) {
      setSelectedContributions([])
    } else {
      setSelectedContributions(contributions.map(c => c._id!))
    }
  }

  const toggleSelectContribution = (id: string) => {
    if (selectedContributions.includes(id)) {
      setSelectedContributions(selectedContributions.filter(cid => cid !== id))
    } else {
      setSelectedContributions([...selectedContributions, id])
    }
  }

  const bulkMarkAsPaid = async () => {
    if (selectedContributions.length === 0) {
      toast.error('Pilih minimal 1 iuran')
      return
    }

    if (!confirm(`Tandai ${selectedContributions.length} iuran sebagai lunas?`)) return

    try {
      const promises = selectedContributions.map(id => {
        const contribution = contributions.find(c => c._id === id)
        if (!contribution) return Promise.resolve()
        
        return fetch('/api/contributions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            _id: id,
            paid: contribution.amount, // Mark as fully paid
          }),
        })
      })

      await Promise.all(promises)
      toast.success(`✅ ${selectedContributions.length} iuran ditandai lunas`)
      setSelectedContributions([])
      fetchData()
    } catch (error) {
      toast.error('Gagal mengupdate pembayaran')
    }
  }

  const bulkMarkAsUnpaid = async () => {
    if (selectedContributions.length === 0) {
      toast.error('Pilih minimal 1 iuran')
      return
    }

    if (!confirm(`Reset ${selectedContributions.length} iuran menjadi belum bayar?`)) return

    try {
      const promises = selectedContributions.map(id =>
        fetch('/api/contributions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            _id: id,
            paid: 0,
          }),
        })
      )

      await Promise.all(promises)
      toast.success(`✅ ${selectedContributions.length} iuran direset`)
      setSelectedContributions([])
      fetchData()
    } catch (error) {
      toast.error('Gagal mengupdate pembayaran')
    }
  }

  const bulkPayment = async () => {
    if (selectedContributions.length === 0) {
      toast.error('Pilih minimal 1 iuran')
      return
    }

    if (bulkPaymentAmount <= 0) {
      toast.error('Masukkan jumlah pembayaran')
      return
    }

    try {
      const promises = selectedContributions.map(id =>
        fetch('/api/contributions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            _id: id,
            paid: bulkPaymentAmount,
          }),
        })
      )

      await Promise.all(promises)
      toast.success(`✅ Pembayaran Rp ${bulkPaymentAmount.toLocaleString()} diterapkan ke ${selectedContributions.length} iuran`)
      setSelectedContributions([])
      setBulkPaymentAmount(0)
      setShowBulkPaymentModal(false)
      fetchData()
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

  // Group contributions by PARTICIPANT
  const groupedContributions: ContributionGroup[] = (() => {
    const participantMap = new Map<string, ContributionGroup>()

    contributions.forEach(contribution => {
      const participantId = typeof contribution.participantId === 'object'
        ? (contribution.participantId as any)?._id
        : contribution.participantId

      const participantName = typeof contribution.participantId === 'object'
        ? (contribution.participantId as any)?.name
        : participants.find(p => p._id === participantId)?.name || 'Unknown'

      const expenseItemId = typeof contribution.expenseItemId === 'object'
        ? (contribution.expenseItemId as any)?._id
        : contribution.expenseItemId

      const expenseName = typeof contribution.expenseItemId === 'object'
        ? (contribution.expenseItemId as any)?.itemName
        : expenseItems.find(e => e._id === expenseItemId)?.itemName || 'Unknown'

      if (!participantMap.has(participantId)) {
        participantMap.set(participantId, {
          participantId,
          participantName,
          expenseNames: [],
          totalAmount: 0,
          totalPaid: 0,
          totalRemaining: 0,
        })
      }

      const group = participantMap.get(participantId)!
      
      // Add expense name if not already added
      if (!group.expenseNames.includes(expenseName)) {
        group.expenseNames.push(expenseName)
      }

      // Accumulate amounts
      group.totalAmount += contribution.amount
      group.totalPaid += contribution.paid
      group.totalRemaining = group.totalAmount - group.totalPaid
    })

    return Array.from(participantMap.values())
  })()

  const grandTotal = groupedContributions.reduce((sum, group) => sum + group.totalAmount, 0)
  const grandPaid = groupedContributions.reduce((sum, group) => sum + group.totalPaid, 0)
  const grandRemaining = grandTotal - grandPaid

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  // Calculate percentage
  const collectionPercentage = grandTotal > 0 ? Math.round((grandPaid / grandTotal) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Dashboard Summary Widget */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <DollarSign className="w-7 h-7" />
          Ringkasan Iuran
        </h2>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-primary-100">Progress Pengumpulan</span>
            <span className="text-2xl font-bold">{collectionPercentage}%</span>
          </div>
          <div className="w-full bg-primary-300/30 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-400 to-green-500 h-full rounded-full transition-all duration-500 shadow-lg"
              style={{ width: `${collectionPercentage}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Target */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-primary-100">🎯 Target Total</span>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(grandTotal)}</p>
            <p className="text-xs text-primary-200 mt-1">
              {groupedContributions.length} peserta
            </p>
          </div>

          {/* Total Collected */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-primary-100">✅ Terkumpul</span>
            </div>
            <p className="text-3xl font-bold text-green-300">{formatCurrency(grandPaid)}</p>
            <p className="text-xs text-primary-200 mt-1">
              {contributions.filter(c => c.paid > 0).length} pembayaran
            </p>
          </div>

          {/* Remaining */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-primary-100">⏳ Sisa</span>
            </div>
            <p className="text-3xl font-bold text-red-300">{formatCurrency(grandRemaining)}</p>
            <p className="text-xs text-primary-200 mt-1">
              {contributions.filter(c => c.paid === 0).length} belum bayar
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-red-300">
              {contributions.filter(c => c.paid === 0).length}
            </p>
            <p className="text-xs text-primary-200">Belum Bayar</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-yellow-300">
              {contributions.filter(c => c.paid > 0 && c.paid < c.amount).length}
            </p>
            <p className="text-xs text-primary-200">Sebagian</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-300">
              {contributions.filter(c => c.paid >= c.amount).length}
            </p>
            <p className="text-xs text-primary-200">Lunas</p>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-gray-900">Tabel Iuran</h2>

      {/* Bulk Actions Toolbar */}
      {groupedContributions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Select All Checkbox */}
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedContributions.length === contributions.length && contributions.length > 0}
                onChange={toggleSelectAll}
                className="w-5 h-5 rounded text-primary-600"
              />
              <span className="font-medium text-gray-700">
                {selectedContributions.length > 0 
                  ? `${selectedContributions.length} iuran dipilih` 
                  : 'Pilih Semua'}
              </span>
            </label>

            {/* Bulk Action Buttons */}
            {selectedContributions.length > 0 && (
              <div className="flex items-center space-x-2 flex-wrap gap-2">
                <button
                  onClick={() => setShowBulkPaymentModal(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Input Bayar
                </button>
                <button
                  onClick={bulkMarkAsPaid}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Tandai Lunas
                </button>
                <button
                  onClick={bulkMarkAsUnpaid}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Reset
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {groupedContributions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Belum ada iuran. Tambahkan iuran di tab Keuangan.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Grouped by Participant */}
          {groupedContributions
            .sort((a, b) => {
              // Sort by status: Belum -> Sebagian -> Lunas
              const getStatus = (g: ContributionGroup) => {
                if (g.totalPaid === 0) return 0
                if (g.totalPaid < g.totalAmount) return 1
                return 2
              }
              return getStatus(a) - getStatus(b)
            })
            .map(group => {
            const status = group.totalPaid === 0 ? 'Belum' : group.totalPaid >= group.totalAmount ? 'Lunas' : 'Sebagian'
            const statusColor = status === 'Lunas' ? 'bg-green-100 text-green-800' : status === 'Sebagian' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
            const percentage = Math.round((group.totalPaid / group.totalAmount) * 100)

            // Get all contribution IDs for this participant
            const participantContributionIds = contributions
              .filter(c => {
                const participantId = typeof c.participantId === 'object'
                  ? (c.participantId as any)?._id
                  : c.participantId
                return participantId === group.participantId
              })
              .map(c => c._id!)

            const allSelected = participantContributionIds.every(id => selectedContributions.includes(id))

            return (
              <div key={group.participantId} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="px-6 py-4">
                  <div className="flex items-start gap-4">
                    {/* Checkbox - selects all contributions for this participant */}
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => {
                        if (allSelected) {
                          setSelectedContributions(selectedContributions.filter(id => !participantContributionIds.includes(id)))
                        } else {
                          setSelectedContributions([...selectedContributions, ...participantContributionIds])
                        }
                      }}
                      className="w-5 h-5 rounded text-primary-600 mt-1"
                    />

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {group.participantName}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            ({group.expenseNames.join(', ')}) • {formatCurrency(group.totalAmount)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                            {status}
                          </span>
                        </div>
                      </div>

                      {/* Payment Progress Bar */}
                      {group.totalPaid > 0 && group.totalPaid < group.totalAmount && (
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Progress: {percentage}%</span>
                            <span>{formatCurrency(group.totalPaid)} / {formatCurrency(group.totalAmount)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Edit Payment Section */}
                      {editingContribution === group.participantId ? (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Input Pembayaran
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={editAmount}
                              onChange={(e) => setEditAmount(Number(e.target.value))}
                              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                              placeholder="Masukkan jumlah"
                            />
                            <button
                              onClick={() => {
                                // Update all contributions for this participant
                                const updatePromises = participantContributionIds.map(id =>
                                  fetch('/api/contributions', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    credentials: 'include',
                                    body: JSON.stringify({
                                      _id: id,
                                      paid: editAmount,
                                    }),
                                  })
                                )
                                Promise.all(updatePromises).then(() => {
                                  toast.success('✅ Pembayaran berhasil diupdate')
                                  setEditingContribution(null)
                                  fetchData()
                                })
                              }}
                              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm flex items-center gap-1"
                            >
                              <Save className="w-4 h-4" />
                              Simpan
                            </button>
                            <button
                              onClick={() => setEditingContribution(null)}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingContribution(group.participantId)
                              setEditAmount(group.totalPaid)
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm"
                          >
                            <Edit2 className="w-3 h-3" />
                            Input Pembayaran
                          </button>
                          
                          <div className="text-sm text-gray-600">
                            Terbayar: <span className="font-semibold text-green-600">{formatCurrency(group.totalPaid)}</span>
                            {group.totalRemaining > 0 && (
                              <> • Sisa: <span className="font-semibold text-red-600">{formatCurrency(group.totalRemaining)}</span></>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

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

      {/* Bulk Payment Modal */}
      {showBulkPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Input Pembayaran Massal
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Akan diterapkan ke <span className="font-bold text-primary-600">{selectedContributions.length} iuran</span> yang dipilih
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah Pembayaran
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-500 font-medium">Rp</span>
                <input
                  type="number"
                  min="0"
                  value={bulkPaymentAmount}
                  onChange={(e) => setBulkPaymentAmount(Number(e.target.value))}
                  className="w-full pl-14 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-lg font-medium"
                  placeholder="0"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBulkPaymentModal(false)
                  setBulkPaymentAmount(0)
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Batal
              </button>
              <button
                onClick={bulkPayment}
                className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
