'use client'

import { useState, useEffect, useMemo } from 'react'
import { Check, X, DollarSign, ChevronDown, Users, AlertTriangle, History, Clock, ArrowUpRight, ArrowDownRight, Settings } from 'lucide-react'
import { toast } from 'sonner'

interface PaymentHistoryItem {
  _id: string
  contributionId: string
  participantId: { _id: string; name: string } | string
  expenseItemId?: { _id: string; itemName: string } | string
  action: 'payment' | 'refund' | 'adjustment' | 'max_pay_set' | 'max_pay_removed'
  previousAmount: number
  newAmount: number
  changeAmount: number
  paymentMethod: string
  note?: string
  createdAt: string
}

interface Participant {
  _id: string
  name: string
}

interface ExpenseItem {
  _id: string
  itemName: string
  collectorId?: Participant | string
}

interface Contribution {
  _id?: string
  participantId: string
  expenseItemId?: ExpenseItem | string
  amount: number
  isPaid: boolean
  paid?: number
  maxPay?: number
  paymentMethod?: string
  paidAt?: string | Date
}

export default function ContributionsTab({ planId }: { planId: string }) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)

  // State untuk manage accordion - hanya satu yang bisa terbuka
  const [openAccordion, setOpenAccordion] = useState<string | null>(null)

  // State untuk manage max bayar
  const [editingMaxPay, setEditingMaxPay] = useState<string | null>(null)
  const [editMaxPayValue, setEditMaxPayValue] = useState<number | null>(null)

  // State untuk manage pembayaran
  const [editPaymentValue, setEditPaymentValue] = useState<number>(0)
  const [editPaymentMethod, setEditPaymentMethod] = useState<string>('manual')
  const [showPaymentForm, setShowPaymentForm] = useState<string | null>(null)

  // State untuk payment history
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    fetchData()
  }, [planId])

  const fetchData = async () => {
    try {
      const [participantsRes, contributionsRes] = await Promise.all([
        fetch(`/api/participants?planId=${planId}`),
        fetch(`/api/contributions?planId=${planId}`),
      ])

      if (participantsRes.ok) {
        const participantsData = await participantsRes.json()
        setParticipants(participantsData)
      }

      if (contributionsRes.ok) {
        const contributionsData = await contributionsRes.json()
        setContributions(contributionsData)
      }
    } catch {
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const updateMaxPay = async (contributionId: string, maxPay: number | null) => {
    try {
      const res = await fetch('/api/contributions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: contributionId,
          maxPay: maxPay,
        }),
      })

      if (res.ok) {
        toast.success('Batas bayar berhasil diupdate')
        setEditingMaxPay(null)
        fetchData()
      }
    } catch {
      toast.error('Gagal mengupdate batas bayar')
    }
  }

  const updatePayment = async (contributionId: string, paidAmount: number) => {
    try {
      const res = await fetch('/api/contributions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: contributionId,
          paid: paidAmount,
          isPaid: paidAmount > 0,
          paymentMethod: editPaymentMethod,
          paidAt: paidAmount > 0 ? new Date() : null,
        }),
      })

      if (res.ok) {
        toast.success('Pembayaran berhasil diinput')
        setShowPaymentForm(null)
        setEditPaymentValue(0)
        setEditPaymentMethod('manual')
        fetchData()
      }
    } catch {
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

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const fetchPaymentHistory = async () => {
    setLoadingHistory(true)
    try {
      const res = await fetch(`/api/payment-history?planId=${planId}&limit=100`)
      if (res.ok) {
        const data = await res.json()
        setPaymentHistory(data)
      }
    } catch {
      toast.error('Gagal memuat history pembayaran')
    } finally {
      setLoadingHistory(false)
    }
  }

  const openHistoryModal = () => {
    setShowHistoryModal(true)
    fetchPaymentHistory()
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'payment': return 'Pembayaran'
      case 'refund': return 'Refund'
      case 'adjustment': return 'Penyesuaian'
      case 'max_pay_set': return 'Set Batas Bayar'
      case 'max_pay_removed': return 'Hapus Batas Bayar'
      default: return action
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'payment': return <ArrowUpRight className="w-4 h-4 text-green-600" />
      case 'refund': return <ArrowDownRight className="w-4 h-4 text-red-600" />
      case 'adjustment': return <Settings className="w-4 h-4 text-blue-600" />
      case 'max_pay_set': return <Settings className="w-4 h-4 text-amber-600" />
      case 'max_pay_removed': return <X className="w-4 h-4 text-gray-600" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'payment': return 'bg-green-100 text-green-800'
      case 'refund': return 'bg-red-100 text-red-800'
      case 'adjustment': return 'bg-blue-100 text-blue-800'
      case 'max_pay_set': return 'bg-amber-100 text-amber-800'
      case 'max_pay_removed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Helper function untuk toggle accordion
  const toggleAccordion = (collectorId: string) => {
    setOpenAccordion(prev => prev === collectorId ? null : collectorId)
    setEditingMaxPay(null)
  }

  // Group contributions by collector, then aggregate per participant
  const groupByCollector = (contribs: Contribution[]) => {
    // First, group all contributions by collector
    const collectorMap = new Map<string, {
      collectorId: string
      collectorName: string
      itemNames: string[]
      contributions: Contribution[]
    }>()

    contribs.forEach(c => {
      let collectorId = 'no-collector'
      let collectorName = 'Tanpa Pengumpul'
      let itemName = 'Item Tidak Diketahui'

      if (c.expenseItemId && typeof c.expenseItemId === 'object') {
        const expenseItem = c.expenseItemId as ExpenseItem
        itemName = expenseItem.itemName || 'Item Tidak Diketahui'

        if (expenseItem.collectorId && typeof expenseItem.collectorId === 'object') {
          const collector = expenseItem.collectorId as Participant
          collectorId = collector._id
          collectorName = collector.name
        } else if (expenseItem.collectorId) {
          collectorId = expenseItem.collectorId as string
        }
      }

      if (!collectorMap.has(collectorId)) {
        collectorMap.set(collectorId, {
          collectorId,
          collectorName,
          itemNames: [],
          contributions: [],
        })
      }

      const group = collectorMap.get(collectorId)!
      group.contributions.push(c)
      if (!group.itemNames.includes(itemName)) {
        group.itemNames.push(itemName)
      }
    })

    // Now aggregate per participant within each collector
    const result: Array<{
      collectorId: string
      collectorName: string
      itemNames: string[]
      participantSummaries: Array<{
        participantId: string
        participantName: string
        totalIuran: number  // Total bagian awal
        totalHarusBayar: number  // Setelah redistribusi
        totalTerbayar: number
        totalKurang: number
        contributions: Contribution[]  // Original contributions for this participant
      }>
      totalShare: number
      totalPaid: number
      totalKurang: number
    }> = []

    collectorMap.forEach((group) => {
      // Group contributions by participant
      const participantMap = new Map<string, {
        participantId: string
        participantName: string
        contributions: Contribution[]
        totalIuran: number
        totalPaid: number
      }>()

      group.contributions.forEach(c => {
        let participantId = ''
        let participantName = 'Unknown'

        if (typeof c.participantId === 'object' && c.participantId !== null) {
          participantId = (c.participantId as any)._id
          participantName = (c.participantId as any).name
        } else {
          participantId = c.participantId
          const p = participants.find(p => p._id === participantId)
          participantName = p?.name || 'Unknown'
        }

        if (!participantMap.has(participantId)) {
          participantMap.set(participantId, {
            participantId,
            participantName,
            contributions: [],
            totalIuran: 0,
            totalPaid: 0,
          })
        }

        const pData = participantMap.get(participantId)!
        pData.contributions.push(c)
        pData.totalIuran += c.amount
        pData.totalPaid += c.paid || 0
      })

      // Calculate redistribution for this collector group
      // Total amount that needs to be collected
      const totalAmount = group.contributions.reduce((sum, c) => sum + c.amount, 0)

      // Find who has max pay limits
      let cappedAmount = 0
      let uncappedParticipants: string[] = []

      participantMap.forEach((pData, pId) => {
        // Check if any of this participant's contributions have maxPay
        const hasMaxPay = pData.contributions.some(c =>
          typeof c.maxPay === 'number' && c.maxPay < c.amount
        )

        if (hasMaxPay) {
          // Sum up their max pays
          const maxPayTotal = pData.contributions.reduce((sum, c) => {
            if (typeof c.maxPay === 'number' && c.maxPay < c.amount) {
              return sum + c.maxPay
            }
            return sum + c.amount
          }, 0)
          cappedAmount += maxPayTotal
        } else {
          uncappedParticipants.push(pId)
        }
      })

      // Remaining amount to be distributed
      const remainingAmount = totalAmount - cappedAmount
      const perUncappedPerson = uncappedParticipants.length > 0
        ? remainingAmount / uncappedParticipants.length
        : 0

      // Build participant summaries with redistributed amounts
      const participantSummaries: typeof result[0]['participantSummaries'] = []
      let groupTotalShare = 0
      let groupTotalPaid = 0
      let groupTotalKurang = 0

      participantMap.forEach((pData) => {
        // Check if capped
        const hasMaxPay = pData.contributions.some(c =>
          typeof c.maxPay === 'number' && c.maxPay < c.amount
        )

        let harusBayar = pData.totalIuran
        if (hasMaxPay) {
          harusBayar = pData.contributions.reduce((sum, c) => {
            if (typeof c.maxPay === 'number' && c.maxPay < c.amount) {
              return sum + c.maxPay
            }
            return sum + c.amount
          }, 0)
        } else if (uncappedParticipants.includes(pData.participantId)) {
          // This person gets extra from redistribution
          const originalShare = pData.totalIuran
          const extraShare = (perUncappedPerson * uncappedParticipants.length / participantMap.size) - (totalAmount / participantMap.size)
          harusBayar = originalShare + (cappedAmount > 0 ? (remainingAmount / uncappedParticipants.length) - originalShare + originalShare : 0)

          // Simpler: just recalculate based on uncapped share
          if (cappedAmount > 0) {
            harusBayar = remainingAmount / uncappedParticipants.length
          }
        }

        const kurang = Math.max(0, harusBayar - pData.totalPaid)

        participantSummaries.push({
          participantId: pData.participantId,
          participantName: pData.participantName,
          totalIuran: pData.totalIuran,
          totalHarusBayar: harusBayar,
          totalTerbayar: pData.totalPaid,
          totalKurang: kurang,
          contributions: pData.contributions,
        })

        groupTotalShare += harusBayar
        groupTotalPaid += pData.totalPaid
        groupTotalKurang += kurang
      })

      // Sort by name
      participantSummaries.sort((a, b) => a.participantName.localeCompare(b.participantName))

      result.push({
        collectorId: group.collectorId,
        collectorName: group.collectorName,
        itemNames: group.itemNames,
        participantSummaries,
        totalShare: groupTotalShare,
        totalPaid: groupTotalPaid,
        totalKurang: groupTotalKurang,
      })
    })

    return result
  }

  const contributionsByCollector = useMemo(() => groupByCollector(contributions), [contributions, participants])

  // Hitung total keseluruhan
  const grandTotal = contributions.reduce((sum: number, c: Contribution) => sum + c.amount, 0)

  const totalStats = useMemo(() => {
    let totalShare = 0
    let totalPaid = 0
    let totalKurang = 0

    contributionsByCollector.forEach(group => {
      totalShare += group.totalShare
      totalPaid += group.totalPaid
      totalKurang += group.totalKurang
    })

    return { totalShare, totalPaid, totalKurang }
  }, [contributionsByCollector])

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Manajemen Iuran</h2>
        <button
          onClick={openHistoryModal}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          <History className="w-4 h-4" />
          <span className="hidden sm:inline">History</span>
        </button>
      </div>

      {contributions.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">Belum ada data iuran.</p>
          <p className="text-sm text-gray-500 mt-2">Silakan tambahkan iuran melalui tab Keuangan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Info redistribusi */}
          {totalStats.totalKurang > 0 && contributions.some(c => c.maxPay !== undefined && c.maxPay !== null) && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Redistribusi Aktif</p>
                <p className="text-amber-700 mt-1">
                  Ada peserta dengan batas bayar, kekurangannya dibagi ke peserta lain.
                </p>
              </div>
            </div>
          )}

          {/* Loop per Collector - Accordion Style */}
          {contributionsByCollector.map((collectorGroup) => (
            <div
              key={collectorGroup.collectorId}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
            >
              {/* Accordion Header */}
              <button
                onClick={() => toggleAccordion(collectorGroup.collectorId)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-colors duration-200 ${openAccordion === collectorGroup.collectorId
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-200 text-gray-600'
                    }`}>
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">{collectorGroup.collectorName}</h3>
                    <p className="text-xs text-gray-500">
                      {collectorGroup.itemNames.length} item • {collectorGroup.participantSummaries.length} peserta
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Status badges */}
                  {collectorGroup.totalKurang > 0 && (
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-medium hidden sm:inline">
                      Kurang: {formatCurrency(collectorGroup.totalKurang)}
                    </span>
                  )}
                  {collectorGroup.totalKurang === 0 && collectorGroup.totalPaid > 0 && (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                      ✓ Lunas
                    </span>
                  )}
                  {/* Chevron */}
                  <div className={`p-1 transition-transform duration-300 ${openAccordion === collectorGroup.collectorId ? 'rotate-180' : ''
                    }`}>
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  </div>
                </div>
              </button>

              {/* Accordion Content with Animation */}
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${openAccordion === collectorGroup.collectorId
                    ? 'max-h-[2000px] opacity-100'
                    : 'max-h-0 opacity-0'
                  }`}
              >
                <div className="border-t border-gray-100">
                  {/* Item list - compact */}
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">Item:</span> {collectorGroup.itemNames.join(', ')}
                    </p>
                  </div>

                  {/* Desktop Table - Simplified */}
                  <div className="hidden md:block">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50/50">
                        <tr className="text-xs text-gray-500 uppercase">
                          <th className="px-4 py-2 text-left font-medium">Nama</th>
                          <th className="px-4 py-2 text-right font-medium">Iuran</th>
                          <th className="px-4 py-2 text-right font-medium">Batas Bayar</th>
                          <th className="px-4 py-2 text-right font-medium">Harus Bayar</th>
                          <th className="px-4 py-2 text-right font-medium">Terbayar</th>
                          <th className="px-4 py-2 text-right font-medium">Kurang</th>
                          <th className="px-4 py-2 text-center font-medium">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {collectorGroup.participantSummaries.map((summary) => {
                          // Check if any contribution has maxPay set
                          const maxPayContrib = summary.contributions.find(c =>
                            typeof c.maxPay === 'number' && c.maxPay < c.amount
                          )
                          const hasMaxPay = !!maxPayContrib
                          const maxPayValue = hasMaxPay
                            ? summary.contributions.reduce((sum, c) => sum + (c.maxPay ?? c.amount), 0)
                            : null

                          const isEditingMax = summary.contributions.some(c => editingMaxPay === c._id)
                          const firstContrib = summary.contributions[0]

                          return (
                            <tr key={summary.participantId} className="hover:bg-gray-50/50">
                              <td className="px-4 py-2.5 font-medium text-gray-900">
                                {summary.participantName}
                              </td>
                              <td className="px-4 py-2.5 text-right text-gray-600">
                                {formatCurrency(summary.totalIuran)}
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                {isEditingMax ? (
                                  <div className="flex gap-1 justify-end items-center">
                                    <input
                                      type="number"
                                      value={editMaxPayValue ?? ''}
                                      onChange={(e) => setEditMaxPayValue(e.target.value ? Number(e.target.value) : null)}
                                      className="w-24 px-2 py-1 text-xs border border-gray-300 rounded"
                                      placeholder="Batas"
                                    />
                                    <button
                                      onClick={() => {
                                        if (firstContrib?._id) {
                                          updateMaxPay(firstContrib._id, editMaxPayValue)
                                        }
                                      }}
                                      className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                                    >
                                      <Check className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => setEditingMaxPay(null)}
                                      className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      if (firstContrib?._id) {
                                        setEditingMaxPay(firstContrib._id)
                                        setEditMaxPayValue(maxPayValue)
                                      }
                                    }}
                                    className={`text-xs px-2 py-1 rounded transition-colors ${hasMaxPay
                                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 font-medium'
                                        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                                      }`}
                                  >
                                    {hasMaxPay ? formatCurrency(maxPayValue!) : 'Set Batas'}
                                  </button>
                                )}
                              </td>
                              <td className={`px-4 py-2.5 text-right font-medium ${hasMaxPay || summary.totalHarusBayar !== summary.totalIuran
                                  ? 'text-amber-600'
                                  : 'text-gray-900'
                                }`}>
                                {formatCurrency(summary.totalHarusBayar)}
                              </td>
                              <td className="px-4 py-2.5 text-right text-green-600 font-medium">
                                {formatCurrency(summary.totalTerbayar)}
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                {summary.totalKurang > 0 ? (
                                  <span className="text-red-600 font-medium">
                                    {formatCurrency(summary.totalKurang)}
                                  </span>
                                ) : (
                                  <span className="text-green-600">✓ Lunas</span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <button
                                  onClick={() => {
                                    if (firstContrib?._id) {
                                      setEditPaymentValue(summary.totalTerbayar)
                                      setShowPaymentForm(firstContrib._id)
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 rounded-lg font-medium transition-colors border border-green-200"
                                >
                                  <DollarSign className="w-3 h-3" />
                                  Input
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden p-3 space-y-2">
                    {collectorGroup.participantSummaries.map((summary) => {
                      const maxPayContrib = summary.contributions.find(c =>
                        typeof c.maxPay === 'number' && c.maxPay < c.amount
                      )
                      const hasMaxPay = !!maxPayContrib
                      const firstContrib = summary.contributions[0]

                      return (
                        <div key={summary.participantId} className="bg-gray-50 rounded-lg p-3">
                          {/* Header */}
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900">{summary.participantName}</h4>
                              <p className="text-xs text-gray-500">
                                Harus bayar: {formatCurrency(summary.totalHarusBayar)}
                              </p>
                            </div>
                            {summary.totalKurang > 0 ? (
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
                                Kurang {formatCurrency(summary.totalKurang)}
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                                ✓ Lunas
                              </span>
                            )}
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                            <div className="bg-white rounded p-2">
                              <span className="text-gray-500">Terbayar</span>
                              <p className="font-semibold text-green-600">{formatCurrency(summary.totalTerbayar)}</p>
                            </div>
                            <div className="bg-white rounded p-2">
                              <span className="text-gray-500">Iuran</span>
                              <p className="font-semibold text-gray-900">{formatCurrency(summary.totalIuran)}</p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (firstContrib?._id) {
                                  setEditingMaxPay(firstContrib._id)
                                  setEditMaxPayValue(hasMaxPay ? summary.totalHarusBayar : null)
                                }
                              }}
                              className="flex-1 text-xs px-3 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg font-medium transition-colors border border-amber-200"
                            >
                              {hasMaxPay ? 'Edit Batas' : 'Set Batas Bayar'}
                            </button>
                            <button
                              onClick={() => {
                                if (firstContrib?._id) {
                                  setEditPaymentValue(summary.totalTerbayar)
                                  setShowPaymentForm(firstContrib._id)
                                }
                              }}
                              className="flex-1 text-xs px-3 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg font-medium transition-colors border border-green-200 flex items-center justify-center gap-1"
                            >
                              <DollarSign className="w-3 h-3" />
                              Input Bayar
                            </button>
                          </div>

                          {/* Edit Max Pay Inline - Mobile */}
                          {summary.contributions.some(c => editingMaxPay === c._id) && (
                            <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                              <label className="text-xs text-gray-600">Batas maksimal bayar:</label>
                              <input
                                type="number"
                                value={editMaxPayValue ?? ''}
                                onChange={(e) => setEditMaxPayValue(e.target.value ? Number(e.target.value) : null)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                placeholder="Kosongkan untuk tanpa batas"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    if (firstContrib?._id) {
                                      updateMaxPay(firstContrib._id, editMaxPayValue)
                                    }
                                  }}
                                  className="flex-1 px-3 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700"
                                >
                                  Simpan
                                </button>
                                <button
                                  onClick={() => setEditingMaxPay(null)}
                                  className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                                >
                                  Batal
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Collector Total */}
                  <div className="px-4 py-3 bg-gradient-to-r from-primary-50 to-primary-100 border-t border-primary-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Total {collectorGroup.collectorName}</span>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="text-green-600">
                          Terbayar: <span className="font-semibold">{formatCurrency(collectorGroup.totalPaid)}</span>
                        </span>
                        {collectorGroup.totalKurang > 0 && (
                          <span className="text-red-600">
                            Kurang: <span className="font-semibold">{formatCurrency(collectorGroup.totalKurang)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Grand Total */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <p className="text-primary-100 text-sm mb-1">Total Iuran Keseluruhan</p>
                <p className="text-2xl font-bold">{formatCurrency(grandTotal)}</p>
                <p className="text-xs text-primary-200 mt-1">
                  {contributionsByCollector.length} pengumpul
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-primary-100 text-sm mb-1">Per {participants.length} Orang</p>
                <p className="text-xl font-semibold">
                  {formatCurrency(participants.length > 0 ? grandTotal / participants.length : 0)}
                </p>
                <div className="flex gap-2 mt-2 sm:justify-end flex-wrap">
                  {totalStats.totalKurang > 0 && (
                    <span className="text-xs px-2 py-1 bg-red-500 rounded-full font-medium">
                      Kurang: {formatCurrency(totalStats.totalKurang)}
                    </span>
                  )}
                  {totalStats.totalPaid > 0 && (
                    <span className="text-xs px-2 py-1 bg-white bg-opacity-20 rounded-full font-medium">
                      Terbayar: {formatCurrency(totalStats.totalPaid)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Input Pembayaran
              </h3>
              {(() => {
                const contrib = contributions.find(c => c._id === showPaymentForm)
                if (!contrib) return null

                let participantName = 'Unknown'
                if (typeof contrib.participantId === 'object' && contrib.participantId !== null) {
                  participantName = (contrib.participantId as any).name
                } else {
                  participantName = participants.find(p => p._id === contrib.participantId)?.name || 'Unknown'
                }

                return (
                  <p className="text-sm text-gray-600">
                    Peserta: <span className="font-semibold">{participantName}</span>
                  </p>
                )
              })()}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah Pembayaran
                </label>
                <div className="flex items-center">
                  <span className="text-gray-500 mr-2">Rp</span>
                  <input
                    type="number"
                    value={editPaymentValue}
                    onChange={(e) => setEditPaymentValue(Number(e.target.value))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metode Pembayaran
                </label>
                <select
                  value={editPaymentMethod}
                  onChange={(e) => setEditPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="manual">Transfer</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => {
                  setShowPaymentForm(null)
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  updatePayment(showPaymentForm!, editPaymentValue)
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <History className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">History Pembayaran</h3>
                  <p className="text-sm text-gray-500">Log semua perubahan</p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  <span className="ml-3 text-gray-600">Memuat history...</span>
                </div>
              ) : paymentHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Belum ada history</p>
                  <p className="text-sm text-gray-500 mt-1">
                    History akan muncul setelah ada perubahan pembayaran
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentHistory.map((item) => {
                    const participantName = typeof item.participantId === 'object'
                      ? item.participantId.name
                      : 'Unknown'
                    const expenseItemName = item.expenseItemId && typeof item.expenseItemId === 'object'
                      ? item.expenseItemId.itemName
                      : null

                    return (
                      <div
                        key={item._id}
                        className="relative pl-8 pb-4 border-l-2 border-gray-200 last:border-l-0"
                      >
                        {/* Timeline dot */}
                        <div className="absolute left-0 top-0 -translate-x-1/2 p-1.5 bg-white rounded-full border-2 border-gray-200">
                          {getActionIcon(item.action)}
                        </div>

                        {/* Content */}
                        <div className="bg-gray-50 rounded-lg p-4 ml-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-gray-900">{participantName}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getActionColor(item.action)}`}>
                                  {getActionLabel(item.action)}
                                </span>
                              </div>
                              {expenseItemName && (
                                <p className="text-sm text-gray-500 mt-1">
                                  Item: {expenseItemName}
                                </p>
                              )}
                              {item.note && (
                                <p className="text-sm text-gray-600 mt-1 italic">
                                  {item.note}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              {item.action === 'payment' || item.action === 'refund' || item.action === 'adjustment' ? (
                                <>
                                  <p className={`font-semibold ${item.changeAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {item.changeAmount >= 0 ? '+' : ''}{formatCurrency(item.changeAmount)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatCurrency(item.previousAmount)} → {formatCurrency(item.newAmount)}
                                  </p>
                                </>
                              ) : (
                                <p className="text-sm text-gray-600">
                                  {item.newAmount > 0 ? formatCurrency(item.newAmount) : '-'}
                                </p>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDateTime(item.createdAt)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{paymentHistory.length} catatan</span>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
