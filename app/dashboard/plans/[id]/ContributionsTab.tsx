'use client'

import { useState, useEffect } from 'react'
import { Check, X, DollarSign, ChevronDown, ChevronUp, Edit2, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Participant {
  _id: string
  name: string
}

interface ExpenseItem {
  _id: string
  itemName: string
  collectorId?: string
  downPayment?: number // percentage (0-100)
  total?: number
}

interface Contribution {
  _id?: string
  expenseItemId: string
  participantId: string
  amount: number
  paid: number
  isPaid: boolean
}

interface ParticipantContribution {
  participantId: string
  participantName: string
  expenseNames: string[]
  totalAmount: number
  totalPaid: number
  totalRemaining: number
  maxPay?: number // batas maksimal bayar (jika ada)
  overpaid?: number // kelebihan bayar (jika ada)
  share?: number // untuk perhitungan frontend
}

interface ContributionGroup {
  collectorId: string
  collectorName: string
  expenses: Array<{
    expenseId: string
    expenseName: string
  }>
  participants: ParticipantContribution[]
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
  const [editingMaxPay, setEditingMaxPay] = useState<string | null>(null)
  const [editMaxPayValue, setEditMaxPayValue] = useState<number | null>(null)
  
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

                    {group.participants
                      .sort((a, b) => {
                        const getStatus = (p: ParticipantContribution) => {
                          if (p.totalPaid === 0) return 0
                          if (p.totalPaid < p.totalAmount) return 1
                          return 2
                        }
                        return getStatus(a) - getStatus(b)
                      })
                      .map(participant => {
                        // Perhitungan maxPay dan overpaid untuk peserta ini (khusus per-collapse)
                        const locked = group.participants.filter((p) => typeof p.maxPay === 'number');
                        const unlocked = group.participants.filter((p) => typeof p.maxPay !== 'number');
                        const lockedTotal = locked.reduce((sum, p) => sum + (p.maxPay ?? 0), 0);
                        const remaining = group.participants.reduce((sum, p) => sum + p.totalAmount, 0) - lockedTotal;
                        const perUnlocked = unlocked.length > 0 ? remaining / unlocked.length : 0;
                        const share = typeof participant.maxPay === 'number' ? participant.maxPay : perUnlocked;
                        const overpaid = participant.totalPaid > share ? participant.totalPaid - share : 0;

                        const status = participant.totalPaid === 0 ? 'Belum' : participant.totalPaid >= share ? 'Lunas' : 'Sebagian';
                        const statusColor = status === 'Lunas' ? 'bg-green-100 text-green-800' : status === 'Sebagian' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
                        const percentage = Math.round((participant.totalPaid / share) * 100);

                        // Get contribution IDs for this participant in this collector's expenses
                        const participantContributionIds = contributions
                          .filter((c: Contribution) => {
                            const participantId = typeof c.participantId === 'object'
                              ? (c.participantId as any)?._id
                              : c.participantId
                            const expenseItemId = typeof c.expenseItemId === 'object'
                              ? (c.expenseItemId as any)?._id
                              : c.expenseItemId
                            // Check if this contribution belongs to this participant AND this collector's expenses
                            return participantId === participant.participantId && 
                                   group.expenses.some(exp => exp.expenseId === expenseItemId)
                          })
                          .map((c: Contribution) => c._id!)

                        const isEditingThis = editingContribution === `${group.collectorId}-${participant.participantId}`

                        // Calculate DP amount for this participant
                        let participantDPAmount = 0
                        let participantDPDetails: Array<{ expenseName: string; dpAmount: number; dpPercentage: number }> = []
                        if (dpInfo) {
                          // Get contributions for this participant that have DP
                          const participantContributions = contributions.filter((c: Contribution) => {
                            const cParticipantId = typeof c.participantId === 'object'
                              ? (c.participantId as any)?._id
                              : c.participantId
                            const cExpenseId = typeof c.expenseItemId === 'object'
                              ? (c.expenseItemId as any)?._id
                              : c.expenseItemId
                            // Check if contribution is for this participant and for an expense with DP
                            return cParticipantId === participant.participantId &&
                                   dpInfo.expenses.some(exp => exp.expenseId === cExpenseId)
                          })
                          // Calculate DP for each contribution
                          participantContributions.forEach((c: Contribution) => {
                            const cExpenseId = typeof c.expenseItemId === 'object'
                              ? (c.expenseItemId as any)?._id
                              : c.expenseItemId
                            const expenseWithDP = dpInfo.expenses.find(exp => exp.expenseId === cExpenseId)
                            if (expenseWithDP) {
                              const dpAmount = (c.amount * expenseWithDP.dpPercentage) / 100
                              participantDPAmount += dpAmount
                              participantDPDetails.push({
                                expenseName: expenseWithDP.expenseName,
                                dpAmount,
                                dpPercentage: expenseWithDP.dpPercentage,
                              })
                            }
                          })
                        }

                        return (
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
      const promises = selectedContributions.map((id: string) =>
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
      const promises = selectedContributions.map((id: string) =>
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

  const removeParticipantFromExpense = async (expenseId: string, participantId: string, participantName: string) => {
    if (!confirm(`Hapus ${participantName} dari iuran ini?\n\nCatatan: Iuran akan dibagi ulang ke peserta yang tersisa dengan TOTAL YANG SAMA.`)) return

    try {
      // Get expense data
  const expense = expenseItems.find((e: ExpenseItem) => e._id === expenseId)
      if (!expense || !expense.total) {
        toast.error('Expense tidak ditemukan')
        return
      }

      // Get all contributions for this expense
  const expenseContributions = contributions.filter((c: Contribution) => {
        const cExpenseId = typeof c.expenseItemId === 'object' 
          ? (c.expenseItemId as any)?._id 
          : c.expenseItemId
        return cExpenseId === expenseId
      })

  const remainingContributors = expenseContributions.filter((c: Contribution) => {
        const cParticipantId = typeof c.participantId === 'object'
          ? (c.participantId as any)?._id
          : c.participantId
        return cParticipantId !== participantId
      })

      // If this is the last participant, just delete
      if (remainingContributors.length === 0) {
        const res = await fetch(
          `/api/contributions?expenseItemId=${expenseId}&participantId=${participantId}`,
          {
            method: 'DELETE',
            credentials: 'include',
          }
        )

        if (res.ok) {
          toast.success(`${participantName} dihapus dari iuran`)
          fetchData()
        }
        return
      }

      // Calculate new split amount (total tetap sama, dibagi ke peserta tersisa)
      const rawNewAmount = expense.total / remainingContributors.length
      const newSplitAmount = Math.round(rawNewAmount / 100) * 100

      // Delete the participant first
      const deleteRes = await fetch(
        `/api/contributions?expenseItemId=${expenseId}&participantId=${participantId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )

      if (!deleteRes.ok) {
        toast.error('Gagal menghapus peserta')
        return
      }

      // Update all remaining contributions with new amount
      const updatePromises = remainingContributors.map((c: Contribution) => 
        fetch('/api/contributions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            _id: c._id,
            amount: newSplitAmount,
          }),
        })
      )

      await Promise.all(updatePromises)

      toast.success(
        `✅ ${participantName} dihapus. Iuran disesuaikan menjadi ${formatCurrency(newSplitAmount)}/orang untuk ${remainingContributors.length} peserta (Total tetap ${formatCurrency(expense.total)})`,
        { duration: 6000 }
      )
      fetchData()
    } catch (error) {
      toast.error('Gagal menghapus peserta')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate DP info for an expense group
  const getExpensesDPInfo = (expenseIds: string[]) => {
    const expensesWithDP = expenseIds
      .map(id => expenseItems.find((e: ExpenseItem) => e._id === id))
      .filter(e => e && e.downPayment && e.downPayment > 0 && e.total)
      .map(e => ({
        expenseId: e!._id,
        expenseName: e!.itemName,
        dpPercentage: e!.downPayment!,
        totalExpense: e!.total!,
        dpAmount: (e!.total! * e!.downPayment!) / 100,
      }))

    if (expensesWithDP.length === 0) return null

    const totalDPNeeded = expensesWithDP.reduce((sum, e) => sum + e.dpAmount, 0)
    
    return {
      expenses: expensesWithDP,
      totalDPNeeded,
      hasDPRequirement: true,
    }
  }

  // Group contributions by COLLECTOR, then by PARTICIPANT
  const groupedContributions: ContributionGroup[] = (() => {
    const collectorMap = new Map<string, ContributionGroup>()

  expenseItems.forEach((expense: ExpenseItem) => {
      const collectorId = expense.collectorId || 'unknown'
  const collectorName = participants.find((p: Participant) => p._id === collectorId)?.name || 'Unknown'

      if (!collectorMap.has(collectorId)) {
        collectorMap.set(collectorId, {
          collectorId,
          collectorName,
          expenses: [],
          participants: [],
          totalAmount: 0,
          totalPaid: 0,
          totalRemaining: 0,
        })
      }

      const group = collectorMap.get(collectorId)!

      // Add expense info
      group.expenses.push({
        expenseId: expense._id!,
        expenseName: expense.itemName,
      })

      // Get contributions for this expense
  const expenseContributions = contributions.filter((c: Contribution) => {
        const contributionExpenseId = typeof c.expenseItemId === 'object'
          ? (c.expenseItemId as any)?._id
          : c.expenseItemId
        return contributionExpenseId === expense._id
      })

      // Group by participant within this expense
  expenseContributions.forEach((contribution: Contribution) => {
        const participantId = typeof contribution.participantId === 'object'
          ? (contribution.participantId as any)?._id
          : contribution.participantId

        const participantName = typeof contribution.participantId === 'object'
          ? (contribution.participantId as any)?.name
          : participants.find((p: Participant) => p._id === participantId)?.name || 'Unknown'

        // Find or create participant entry
  let participant = group.participants.find((p: ParticipantContribution) => p.participantId === participantId)
        if (!participant) {
          participant = {
            participantId,
            participantName,
            expenseNames: [],
            totalAmount: 0,
            totalPaid: 0,
            totalRemaining: 0,
          }
          group.participants.push(participant)
        }

        // Add expense name if not already added
        if (!participant.expenseNames.includes(expense.itemName)) {
          participant.expenseNames.push(expense.itemName)
        }

        // Accumulate amounts
        participant.totalAmount += contribution.amount
        participant.totalPaid += contribution.paid
        participant.totalRemaining = participant.totalAmount - participant.totalPaid

        group.totalAmount += contribution.amount
        group.totalPaid += contribution.paid
      })

      group.totalRemaining = group.totalAmount - group.totalPaid
    })

    return Array.from(collectorMap.values()).filter(group => group.participants.length > 0)
  })()

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
        <div className="space-y-3">
          {/* Total Per Participant - Always Expanded */}
          <div className="bg-white border-2 border-primary-200 rounded-lg overflow-hidden">
            <div className="bg-primary-50 px-4 py-2.5 border-b border-primary-100 flex items-center justify-between">
              <h3 className="font-semibold text-primary-900 text-sm flex items-center gap-1.5">
                👥 Total Iuran Per Orang
              </h3>
              <button
                type="button"
                className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-xs font-medium border border-blue-200"
                onClick={() => {
                  // Ambil semua contributionId dari seluruh peserta
                  const allIds: string[] = [];
                  groupedContributions.forEach(group => {
                    group.participants.forEach(p => {
                      contributions.filter((c: Contribution) => {
                        const participantId = typeof c.participantId === 'object' ? (c.participantId as any)?._id : c.participantId;
                        return participantId === p.participantId;
                      }).forEach((c: Contribution) => allIds.push(c._id!));
                    });
                  });
                  const allSelected = allIds.every(id => selectedContributions.includes(id));
                  if (allSelected) {
                    // Unselect all
                    setSelectedContributions(selectedContributions.filter((id: string) => !allIds.includes(id)));
                  } else {
                    // Select all
                    setSelectedContributions(Array.from(new Set([...selectedContributions, ...allIds])));
                  }
                }}
              >
                {/* Cek apakah semua sudah terpilih */}
                {(() => {
                  const allIds: string[] = [];
                  groupedContributions.forEach(group => {
                    group.participants.forEach(p => {
                      contributions.filter((c: Contribution) => {
                        const participantId = typeof c.participantId === 'object' ? (c.participantId as any)?._id : c.participantId;
                        return participantId === p.participantId;
                      }).forEach((c: Contribution) => allIds.push(c._id!));
                    });
                  });
                  const allSelected = allIds.length > 0 && allIds.every(id => selectedContributions.includes(id));
                  return allSelected ? 'Uncheck Semua' : 'Pilih Semua';
                })()}
              </button>
            </div>
            <div className="divide-y divide-gray-100">{(() => {
                // Flatten all participants from all groups
                const allParticipants: ParticipantContribution[] = []
                groupedContributions.forEach(group => {
                  group.participants.forEach(p => allParticipants.push(p))
                })

                // Merge participants with same ID
                const participantMap = new Map<string, ParticipantContribution>()
                allParticipants.forEach(p => {
                  if (participantMap.has(p.participantId)) {
                    const existing = participantMap.get(p.participantId)!
                    existing.totalAmount += p.totalAmount
                    existing.totalPaid += p.totalPaid
                    existing.totalRemaining += p.totalRemaining
                    p.expenseNames.forEach(name => {
                      if (!existing.expenseNames.includes(name)) {
                        existing.expenseNames.push(name)
                      }
                    })
                  } else {
                    participantMap.set(p.participantId, { ...p })
                  }
                })

                // Tidak perlu logika max bayar/kelebihan di total semua peserta
                return Array.from(participantMap.values())
                  .sort((a, b) => a.participantName.localeCompare(b.participantName))
                  .map(participant => {
                    return (
                      <div key={participant.participantId} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm truncate">
                              {participant.participantName}
                            </h4>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                              {participant.expenseNames.join(', ')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="text-right">
                              <p className="font-semibold text-gray-900 text-sm">
                                {formatCurrency(participant.totalAmount)}
                              </p>
                              {participant.totalPaid > 0 && participant.totalPaid < participant.totalAmount && (
                                <div className="space-y-0.5">
                                  <p className="text-xs text-green-600">
                                    {formatCurrency(participant.totalPaid)}
                                  </p>
                                  <p className="text-xs text-red-600 font-medium">
                                    Kurang: {formatCurrency(participant.totalAmount - participant.totalPaid)}
                                  </p>
                                </div>
                              )}
                              {participant.totalPaid > 0 && participant.totalPaid >= participant.totalAmount && (
                                <p className="text-xs text-green-600">
                                  {formatCurrency(participant.totalPaid)}
                                </p>
                              )}
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${participant.totalPaid === 0 ? 'bg-red-100 text-red-800' : participant.totalPaid < participant.totalAmount ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                              {participant.totalPaid === 0 ? 'Belum' : participant.totalPaid >= participant.totalAmount ? 'Lunas' : 'Sebagian'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })
              })()}
// Tambahkan logika maxPay dan overpaid di per-collapse (per group/collector)
            // Hitung maxPay dan overpaid untuk peserta di group ini
            const locked = group.participants.filter((p) => typeof p.maxPay === 'number');
            const unlocked = group.participants.filter((p) => typeof p.maxPay !== 'number');
            const lockedTotal = locked.reduce((sum, p) => sum + (p.maxPay ?? 0), 0);
            const remaining = group.participants.reduce((sum, p) => sum + p.totalAmount, 0) - lockedTotal;
            const perUnlocked = unlocked.length > 0 ? remaining / unlocked.length : 0;
            group.participants.forEach((p) => {
              const share = typeof p.maxPay === 'number' ? p.maxPay! : perUnlocked;
              (p as any).share = share;
              (p as any).overpaid = p.totalPaid > share ? p.totalPaid - share : 0;
            });
            </div>
          </div>

          {/* Grouped by Collector - Collapsed by Default */}
          {groupedContributions.map(group => {
            const isExpanded = expandedExpense === group.collectorId
            const dpInfo = getExpensesDPInfo(group.expenses.map(e => e.expenseId))

            return (
              <div key={group.collectorId} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {/* Header - Collapsible */}
                <button
                  onClick={() => setExpandedExpense(isExpanded ? null : group.collectorId)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 text-left min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                      👤 {group.collectorName}
                      {dpInfo && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-semibold">
                          💳 Ada DP
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                      {group.expenses.map(e => e.expenseName).join(', ')} • {group.participants.length} peserta
                    </p>
                  </div>

                  <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {formatCurrency(group.totalAmount)}
                      </p>
                    </div>
                    <div className="text-gray-600">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </button>

                {/* Details - Expanded */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 divide-y divide-gray-200">
                    {/* DP Info Panel */}
                    {dpInfo && (
                      <div className="p-4 bg-yellow-50 border-b-2 border-yellow-200">
                        <div className="flex items-start gap-2">
                          <div className="text-2xl">💳</div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-yellow-900 text-sm mb-1">
                              Prioritas: Down Payment (DP)
                            </h4>
                            <div className="space-y-1 text-xs text-yellow-800">
                              {dpInfo.expenses.map(exp => (
                                <div key={exp.expenseId} className="flex justify-between">
                                  <span>{exp.expenseName} - DP {exp.dpPercentage}%</span>
                                  <span className="font-semibold">{formatCurrency(exp.dpAmount)}</span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 pt-2 border-t border-yellow-300 flex justify-between items-center">
                              <span className="font-bold text-sm text-yellow-900">Total DP yang harus dikumpulkan:</span>
                              <span className="font-bold text-base text-yellow-900">{formatCurrency(dpInfo.totalDPNeeded)}</span>
                            </div>
                            <p className="text-xs text-yellow-700 mt-2 bg-yellow-100 px-2 py-1 rounded">
                              ⚠️ Pastikan DP terkumpul terlebih dahulu sebelum pelunasan
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {group.participants
                      .sort((a, b) => {
                        const getStatus = (p: ParticipantContribution) => {
                          if (p.totalPaid === 0) return 0
                          if (p.totalPaid < p.totalAmount) return 1
                          return 2
                        }
                        return getStatus(a) - getStatus(b)
                      })
                      .map(participant => {
                        // Ambil share dan overpaid dari hasil perhitungan di atas
                        const share = (participant as any).share;
                        const overpaid = (participant as any).overpaid;
                        const status = participant.totalPaid === 0 ? 'Belum' : participant.totalPaid >= share ? 'Lunas' : 'Sebagian';
                        const statusColor = status === 'Lunas' ? 'bg-green-100 text-green-800' : status === 'Sebagian' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
                        const percentage = Math.round((participant.totalPaid / participant.totalAmount) * 100)

                        // Get contribution IDs for this participant in this collector's expenses
                        const participantContributionIds = contributions
                          .filter(c => {
                            const participantId = typeof c.participantId === 'object'
                              ? (c.participantId as any)?._id
                              : c.participantId
                            const expenseItemId = typeof c.expenseItemId === 'object'
                              ? (c.expenseItemId as any)?._id
                              : c.expenseItemId
                            // Check if this contribution belongs to this participant AND this collector's expenses
                            return participantId === participant.participantId && 
                                   group.expenses.some(exp => exp.expenseId === expenseItemId)
                          })
                          .map(c => c._id!)

                        const isEditingThis = editingContribution === `${group.collectorId}-${participant.participantId}`

                        // Calculate DP amount for this participant
                        let participantDPAmount = 0
                        let participantDPDetails: Array<{ expenseName: string; dpAmount: number; dpPercentage: number }> = []
                        
                        if (dpInfo) {
                          // Get contributions for this participant that have DP
                          const participantContributions = contributions.filter(c => {
                            const cParticipantId = typeof c.participantId === 'object'
                              ? (c.participantId as any)?._id
                              : c.participantId
                            const cExpenseId = typeof c.expenseItemId === 'object'
                              ? (c.expenseItemId as any)?._id
                              : c.expenseItemId
                            
                            // Check if contribution is for this participant and for an expense with DP
                            return cParticipantId === participant.participantId &&
                                   dpInfo.expenses.some(exp => exp.expenseId === cExpenseId)
                          })

                          // Calculate DP for each contribution
                          participantContributions.forEach(c => {
                            const cExpenseId = typeof c.expenseItemId === 'object'
                              ? (c.expenseItemId as any)?._id
                              : c.expenseItemId
                            const expenseWithDP = dpInfo.expenses.find(exp => exp.expenseId === cExpenseId)
                            if (expenseWithDP) {
                              const dpAmount = (c.amount * expenseWithDP.dpPercentage) / 100
                              participantDPAmount += dpAmount
                              participantDPDetails.push({
                                expenseName: expenseWithDP.expenseName,
                                dpAmount,
                                dpPercentage: expenseWithDP.dpPercentage,
                              })
                            }
                          })
                        }

                        return (
                          <div key={participant.participantId} className="px-4 py-3">
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm truncate">
                                  {participant.participantName}
                                </p>
                                <p className="text-xs text-gray-500 line-clamp-1">
                                  {participant.expenseNames.join(', ')}
                                </p>
                                {/* Show DP amount for this participant */}
                                {participantDPAmount > 0 && (
                                  <p className="text-xs text-yellow-700 font-semibold mt-1 bg-yellow-50 inline-block px-1.5 py-0.5 rounded">
                                    💳 DP: {formatCurrency(participantDPAmount)}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="text-right">
                                  <p className="font-semibold text-gray-900 text-sm">
                                    {formatCurrency(share)}
                                  </p>
                                  {participant.totalPaid > 0 && participant.totalPaid < share && (
                                    <div className="space-y-0.5">
                                      <p className="text-xs text-green-600">
                                        Bayar: {formatCurrency(participant.totalPaid)}
                                      </p>
                                      <p className="text-xs text-red-600 font-medium">
                                        Kurang: {formatCurrency(share - participant.totalPaid)}
                                      </p>
                                    </div>
                                  )}
                                  {participant.totalPaid > 0 && participant.totalPaid >= share && (
                                    <p className="text-xs text-green-600">
                                      Bayar: {formatCurrency(participant.totalPaid)}
                                    </p>
                                  )}
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                                  {status}
                                </span>
                                {/* Badge max bayar */}
                                {typeof participant.maxPay === 'number' && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-semibold mr-1">Max Bayar: {formatCurrency(participant.maxPay)}</span>
                                )}
                                {/* Badge kelebihan bayar */}
                                {overpaid > 0 && (
                                  <span className="text-xs bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded font-semibold">Kelebihan: {formatCurrency(overpaid)}</span>
                                )}
                                {/* Input edit max bayar */}
                                <button
                                  className="ml-2 text-blue-700 underline hover:text-blue-900 text-xs font-normal"
                                  onClick={() => {
                                    setEditingMaxPay(participant.participantId)
                                    setEditMaxPayValue(typeof participant.maxPay === 'number' ? participant.maxPay : null)
                                  }}
                                  title="Edit Max Bayar"
                                >
                                  Edit Max Bayar
                                </button>
                                {editingMaxPay === participant.participantId && (
                                  <div className="mt-2 flex gap-2 items-center">
                                    <input
                                      type="number"
                                      className="border border-blue-300 rounded px-2 py-1 text-xs w-28"
                                      value={editMaxPayValue ?? ''}
                                      min={0}
                                      placeholder="Max bayar (Rp)"
                                      onChange={e => setEditMaxPayValue(e.target.value === '' ? null : Number(e.target.value))}
                                    />
                                    <button
                                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                                      onClick={async () => {
                                        // Cari satu contribution id milik peserta ini
                                        const c = contributions.find((c: Contribution) => {
                                          const pid = typeof c.participantId === 'object' ? (c.participantId as any)?._id : c.participantId
                                          return pid === participant.participantId
                                        })
                                        if (!c) return toast.error('Data tidak ditemukan')
                                        await fetch('/api/contributions', {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          credentials: 'include',
                                          body: JSON.stringify({
                                            _id: c._id,
                                            maxPay: editMaxPayValue,
                                          }),
                                        })
                                        toast.success('Max bayar diupdate')
                                        setEditingMaxPay(null)
                                        fetchData()
                                      }}
                                    >Simpan</button>
                                    <button
                                      className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs"
                                      onClick={() => setEditingMaxPay(null)}
                                    >Batal</button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Input Pembayaran */}
                            {isEditingThis ? (
                              <div className="mt-2 p-2.5 bg-white rounded border border-gray-300">
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                  Input Pembayaran
                                </label>
                                <div className="flex gap-1.5">
                                  <input
                                    type="number"
                                    value={editAmount}
                                    onChange={(e) => setEditAmount(Number(e.target.value))}
                                    className="flex-1 border border-gray-300 rounded px-2.5 py-1.5 text-sm"
                                    placeholder="Jumlah"
                                  />
                                  <button
                                    onClick={() => {
                                      // Ambil hanya satu kontribusi (misal, kontribusi pertama milik peserta ini)
                                      const id = participantContributionIds[0];
                                      fetch('/api/contributions', {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        credentials: 'include',
                                        body: JSON.stringify({
                                          _id: id,
                                          paid: editAmount,
                                        }),
                                      }).then(() => {
                                        toast.success('✅ Berhasil')
                                        setEditingContribution(null)
                                        fetchData()
                                      })
                                    }}
                                    className="px-3 py-1.5 bg-primary-600 text-white rounded hover:bg-primary-700 text-xs flex items-center gap-1"
                                  >
                                    <Save className="w-3 h-3" />
                                    OK
                                  </button>
                                  <button
                                    onClick={() => setEditingContribution(null)}
                                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-xs"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setEditingContribution(`${group.collectorId}-${participant.participantId}`)
                                    setEditAmount(0)
                                  }}
                                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-xs font-medium"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  Input Pembayaran
                                </button>
                                {group.expenses.length === 1 && (
                                  <button
                                    onClick={() => {
                                      removeParticipantFromExpense(group.expenses[0].expenseId, participant.participantId, participant.participantName)
                                    }}
                                    className="px-3 py-1.5 bg-red-50 text-red-700 rounded hover:bg-red-100 text-xs font-medium flex items-center gap-1"
                                    title="Hapus dari iuran"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                )}
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
