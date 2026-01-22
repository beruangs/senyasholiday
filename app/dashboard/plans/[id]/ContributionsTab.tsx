'use client'

import { useState, useEffect, useMemo } from 'react'
import { Check, X, MoreVertical, DollarSign, ChevronDown, ChevronRight, Users, Wallet, AlertTriangle, History, Clock, ArrowUpRight, ArrowDownRight, Settings } from 'lucide-react'
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
  const [editingPayment, setEditingPayment] = useState<string | null>(null)
  const [editPaymentValue, setEditPaymentValue] = useState<number>(0)
  const [editPaymentMethod, setEditPaymentMethod] = useState<string>('manual')
  const [showPaymentForm, setShowPaymentForm] = useState<string | null>(null)
  const [showMobileMenu, setShowMobileMenu] = useState<string | null>(null)

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

  const togglePaid = async (contributionId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/contributions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: contributionId,
          isPaid: !currentStatus,
          paidAt: !currentStatus ? new Date() : null,
        }),
      })

      if (res.ok) {
        toast.success('Status pembayaran diupdate')
        fetchData()
      }
    } catch {
      toast.error('Gagal mengupdate status')
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
        toast.success('Max bayar berhasil diupdate')
        setEditingMaxPay(null)
        fetchData()
      }
    } catch {
      toast.error('Gagal mengupdate max bayar')
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
        setEditingPayment(null)
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
      case 'max_pay_set': return 'Set Max Bayar'
      case 'max_pay_removed': return 'Hapus Max Bayar'
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
    // Reset any editing states when closing
    setEditingMaxPay(null)
    setEditingPayment(null)
    setShowMobileMenu(null)
  }

  // Group contributions by collector (pengumpul) - bukan per expense
  const groupByCollector = (contribs: Contribution[]) => {
    const groups = new Map<string, {
      collectorId: string
      collectorName: string
      expenseItems: Array<{
        itemName: string
        expenseItemId: string
        contributions: Contribution[]
        totalAmount: number
      }>
      totalShare: number
      totalPaid: number
      totalKurang: number
      totalLebih: number
      participantCount: number
    }>()

    // First pass - group by expense item
    const expenseGroups = new Map<string, {
      collectorId: string
      collectorName: string
      itemName: string
      contributions: Contribution[]
      totalAmount: number
    }>()

    contribs.forEach(c => {
      let collectorId = 'no-collector'
      let collectorName = 'Tanpa Pengumpul'
      let itemName = 'Item Tidak Diketahui'
      let expenseItemId = ''

      if (c.expenseItemId && typeof c.expenseItemId === 'object') {
        const expenseItem = c.expenseItemId as ExpenseItem
        itemName = expenseItem.itemName || 'Item Tidak Diketahui'
        expenseItemId = expenseItem._id

        if (expenseItem.collectorId && typeof expenseItem.collectorId === 'object') {
          const collector = expenseItem.collectorId as Participant
          collectorId = collector._id
          collectorName = collector.name
        } else if (expenseItem.collectorId) {
          collectorId = expenseItem.collectorId as string
        }
      }

      const groupKey = expenseItemId || `unknown-${Math.random()}`

      if (!expenseGroups.has(groupKey)) {
        expenseGroups.set(groupKey, {
          collectorId,
          collectorName,
          itemName,
          contributions: [],
          totalAmount: 0,
        })
      }

      const group = expenseGroups.get(groupKey)!
      group.contributions.push(c)
      group.totalAmount += c.amount
    })

    // Second pass - group expense items by collector
    expenseGroups.forEach((expenseGroup, expenseItemId) => {
      const collectorId = expenseGroup.collectorId

      if (!groups.has(collectorId)) {
        groups.set(collectorId, {
          collectorId,
          collectorName: expenseGroup.collectorName,
          expenseItems: [],
          totalShare: 0,
          totalPaid: 0,
          totalKurang: 0,
          totalLebih: 0,
          participantCount: 0,
        })
      }

      const collectorGroup = groups.get(collectorId)!
      collectorGroup.expenseItems.push({
        itemName: expenseGroup.itemName,
        expenseItemId,
        contributions: expenseGroup.contributions,
        totalAmount: expenseGroup.totalAmount,
      })
    })

    // Calculate stats for each collector group with REDISTRIBUTION
    groups.forEach(group => {
      const uniqueParticipants = new Set<string>()

      group.expenseItems.forEach(item => {
        // Calculate redistribution per expense item
        const redistributedShares = calculateRedistributedShares(item.contributions)

        item.contributions.forEach(c => {
          const participantId = typeof c.participantId === 'object'
            ? (c.participantId as any)._id
            : c.participantId
          uniqueParticipants.add(participantId)

          const redistributedShare = redistributedShares.get(c._id || '') || c.amount
          const paid = c.paid || 0
          const remaining = Math.max(0, redistributedShare - paid)
          const overpaid = paid > redistributedShare ? paid - redistributedShare : 0

          group.totalShare += redistributedShare
          group.totalPaid += paid
          group.totalKurang += remaining
          group.totalLebih += overpaid
        })
      })

      group.participantCount = uniqueParticipants.size
    })

    return Array.from(groups.values())
  }

  // Calculate redistributed shares when someone has maxPay
  const calculateRedistributedShares = (contribs: Contribution[]) => {
    const shares = new Map<string, number>()

    if (contribs.length === 0) return shares

    // Total amount for this expense item
    const totalAmount = contribs.reduce((sum, c) => sum + c.amount, 0)

    // First pass: identify who has max pay restrictions
    let remainingAmount = totalAmount
    let remainingContributors: Contribution[] = []

    contribs.forEach(c => {
      if (typeof c.maxPay === 'number' && c.maxPay < c.amount) {
        // This person has a max pay limit
        shares.set(c._id || '', c.maxPay)
        remainingAmount -= c.maxPay
      } else {
        // This person will share the remaining amount
        remainingContributors.push(c)
      }
    })

    // Second pass: distribute remaining amount evenly among non-capped contributors
    if (remainingContributors.length > 0) {
      const sharePerPerson = remainingAmount / remainingContributors.length
      remainingContributors.forEach(c => {
        shares.set(c._id || '', sharePerPerson)
      })
    } else if (remainingAmount > 0) {
      // Everyone has max pay but there's still remaining - redistribute proportionally
      const maxPayTotal = contribs.reduce((sum, c) => sum + (c.maxPay || c.amount), 0)
      contribs.forEach(c => {
        const currentShare = shares.get(c._id || '') || 0
        const proportion = currentShare / maxPayTotal
        shares.set(c._id || '', currentShare + (remainingAmount * proportion))
      })
    }

    return shares
  }

  // Calculate share for display with redistribution context
  const calculateShareWithRedistribution = (contribution: Contribution, allContributions: Contribution[]) => {
    const redistributedShares = calculateRedistributedShares(allContributions)
    const redistributedShare = redistributedShares.get(contribution._id || '') || contribution.amount
    const paid = contribution.paid || 0

    const hasMaxPay = typeof contribution.maxPay === 'number' && contribution.maxPay < contribution.amount
    const originalShare = contribution.amount
    const remaining = Math.max(0, redistributedShare - paid)
    const overpaid = paid > redistributedShare ? paid - redistributedShare : 0
    const status = paid === 0 ? 'Belum' : paid >= redistributedShare ? 'Lunas' : 'Sebagian'

    return {
      redistributedShare,
      originalShare,
      paid,
      remaining,
      overpaid,
      status,
      hasMaxPay,
      maxPay: contribution.maxPay
    }
  }

  const contributionsByCollector = useMemo(() => groupByCollector(contributions), [contributions])

  // Hitung total keseluruhan
  const grandTotal = contributions.reduce((sum: number, c: Contribution) => sum + c.amount, 0)

  const totalStats = useMemo(() => {
    let totalShare = 0
    let totalPaid = 0
    let totalKurang = 0
    let totalLebih = 0

    contributionsByCollector.forEach(group => {
      totalShare += group.totalShare
      totalPaid += group.totalPaid
      totalKurang += group.totalKurang
      totalLebih += group.totalLebih
    })

    return { totalShare, totalPaid, totalKurang, totalLebih }
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
          <p className="text-sm text-gray-500 mt-2">Silakan tambahkan iuran melalui tab Pengeluaran atau menu lainnya.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Info redistribusi */}
          {totalStats.totalKurang > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Fitur Redistribusi Aktif</p>
                <p className="text-amber-700 mt-1">
                  Jika ada peserta dengan batas "Max Bayar", kekurangannya akan otomatis didistribusikan ke peserta lain dalam grup yang sama.
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
                      {collectorGroup.expenseItems.length} item • {collectorGroup.participantCount} peserta
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
                  {/* Loop through expense items within this collector */}
                  {collectorGroup.expenseItems.map((expenseItem, itemIndex) => (
                    <div key={expenseItem.expenseItemId} className={itemIndex > 0 ? 'border-t border-gray-100' : ''}>
                      {/* Item Header */}
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-primary-600" />
                          <span className="text-sm font-medium text-gray-700">{expenseItem.itemName}</span>
                          <span className="text-xs text-gray-500">({expenseItem.contributions.length} peserta)</span>
                        </div>
                      </div>

                      {/* Desktop Table */}
                      <div className="hidden md:block">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50/50">
                            <tr className="text-xs text-gray-500 uppercase">
                              <th className="px-4 py-2 text-left font-medium">Nama</th>
                              <th className="px-4 py-2 text-right font-medium">Share Awal</th>
                              <th className="px-4 py-2 text-right font-medium">Max Bayar</th>
                              <th className="px-4 py-2 text-right font-medium">Share Final</th>
                              <th className="px-4 py-2 text-right font-medium">Terbayar</th>
                              <th className="px-4 py-2 text-right font-medium">Sisa/Lebih</th>
                              <th className="px-4 py-2 text-center font-medium">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {expenseItem.contributions.map((contribution) => {
                              let participantName = 'Unknown'
                              if (typeof contribution.participantId === 'object' && contribution.participantId !== null) {
                                participantName = (contribution.participantId as any).name
                              } else {
                                const participant = participants.find(p => p._id === contribution.participantId)
                                participantName = participant?.name || 'Unknown'
                              }

                              const { redistributedShare, originalShare, paid, remaining, overpaid, status, hasMaxPay, maxPay } =
                                calculateShareWithRedistribution(contribution, expenseItem.contributions)
                              const isEditingMax = editingMaxPay === contribution._id

                              return (
                                <tr key={contribution._id} className="hover:bg-gray-50/50">
                                  <td className="px-4 py-2.5 font-medium text-gray-900">{participantName}</td>
                                  <td className="px-4 py-2.5 text-right text-gray-600">
                                    {formatCurrency(originalShare)}
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    {isEditingMax ? (
                                      <div className="flex gap-1 justify-end items-center">
                                        <input
                                          type="number"
                                          value={editMaxPayValue ?? ''}
                                          onChange={(e) => setEditMaxPayValue(e.target.value ? Number(e.target.value) : null)}
                                          className="w-24 px-2 py-1 text-xs border border-gray-300 rounded"
                                          placeholder="Max"
                                        />
                                        <button
                                          onClick={() => updateMaxPay(contribution._id!, editMaxPayValue)}
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
                                          setEditingMaxPay(contribution._id!)
                                          setEditMaxPayValue(maxPay ?? null)
                                        }}
                                        className={`text-xs px-2 py-1 rounded transition-colors ${hasMaxPay
                                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium'
                                          : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                                          }`}
                                      >
                                        {hasMaxPay ? formatCurrency(maxPay!) : 'Set Max'}
                                      </button>
                                    )}
                                  </td>
                                  <td className={`px-4 py-2.5 text-right font-medium ${hasMaxPay ? 'text-amber-600' : 'text-gray-900'
                                    }`}>
                                    {formatCurrency(redistributedShare)}
                                    {hasMaxPay && redistributedShare !== originalShare && (
                                      <span className="text-xs text-amber-500 block">+redistribusi</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5 text-right text-green-600 font-medium">
                                    {formatCurrency(paid)}
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    {remaining > 0 && (
                                      <span className="text-red-600 font-medium">-{formatCurrency(remaining)}</span>
                                    )}
                                    {overpaid > 0 && (
                                      <span className="text-orange-600 font-medium">+{formatCurrency(overpaid)}</span>
                                    )}
                                    {remaining === 0 && overpaid === 0 && (
                                      <span className="text-green-600">✓</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5 text-center">
                                    <button
                                      onClick={() => {
                                        setEditingPayment(contribution._id!)
                                        setEditPaymentValue(paid)
                                        setShowPaymentForm(contribution._id!)
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
                        {expenseItem.contributions.map((contribution) => {
                          let participantName = 'Unknown'
                          if (typeof contribution.participantId === 'object' && contribution.participantId !== null) {
                            participantName = (contribution.participantId as any).name
                          } else {
                            const participant = participants.find(p => p._id === contribution.participantId)
                            participantName = participant?.name || 'Unknown'
                          }

                          const { redistributedShare, originalShare, paid, remaining, overpaid, status, hasMaxPay, maxPay } =
                            calculateShareWithRedistribution(contribution, expenseItem.contributions)

                          return (
                            <div key={contribution._id} className="bg-gray-50 rounded-lg p-3">
                              {/* Header */}
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-medium text-gray-900">{participantName}</h4>
                                  <p className="text-xs text-gray-500">
                                    Share: {formatCurrency(redistributedShare)}
                                    {hasMaxPay && <span className="text-amber-600"> (max: {formatCurrency(maxPay!)})</span>}
                                  </p>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status === 'Lunas' ? 'bg-green-100 text-green-700' :
                                  status === 'Sebagian' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                  {status}
                                </span>
                              </div>

                              {/* Stats */}
                              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                                <div className="bg-white rounded p-2">
                                  <span className="text-gray-500">Terbayar</span>
                                  <p className="font-semibold text-green-600">{formatCurrency(paid)}</p>
                                </div>
                                <div className="bg-white rounded p-2">
                                  <span className="text-gray-500">Sisa</span>
                                  <p className={`font-semibold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {remaining > 0 ? formatCurrency(remaining) : '✓ Lunas'}
                                  </p>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setEditingMaxPay(contribution._id!)
                                    setEditMaxPayValue(maxPay ?? null)
                                  }}
                                  className="flex-1 text-xs px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-medium transition-colors border border-blue-200"
                                >
                                  {hasMaxPay ? `Max: ${formatCurrency(maxPay!)}` : 'Set Max Bayar'}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingPayment(contribution._id!)
                                    setEditPaymentValue(paid)
                                    setShowPaymentForm(contribution._id!)
                                  }}
                                  className="flex-1 text-xs px-3 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg font-medium transition-colors border border-green-200 flex items-center justify-center gap-1"
                                >
                                  <DollarSign className="w-3 h-3" />
                                  Input Bayar
                                </button>
                              </div>

                              {/* Edit Max Pay Inline - Mobile */}
                              {editingMaxPay === contribution._id && (
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
                                      onClick={() => updateMaxPay(contribution._id!, editMaxPayValue)}
                                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
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
                    </div>
                  ))}

                  {/* Collector Total */}
                  <div className="px-4 py-3 bg-gradient-to-r from-primary-50 to-primary-100 border-t border-primary-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Total {collectorGroup.collectorName}</span>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-600">
                          Share: <span className="font-semibold">{formatCurrency(collectorGroup.totalShare)}</span>
                        </span>
                        <span className="text-green-600">
                          Bayar: <span className="font-semibold">{formatCurrency(collectorGroup.totalPaid)}</span>
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
                  {contributionsByCollector.length} pengumpul • {contributions.length} iuran
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

                // Find the expense item contributions for redistribution calculation
                let allContribsInItem: Contribution[] = [contrib]
                contributionsByCollector.forEach(group => {
                  group.expenseItems.forEach(item => {
                    if (item.contributions.some(c => c._id === contrib._id)) {
                      allContribsInItem = item.contributions
                    }
                  })
                })

                const { redistributedShare, hasMaxPay, maxPay } = calculateShareWithRedistribution(contrib, allContribsInItem)

                return (
                  <>
                    <p className="text-sm text-gray-600">
                      Peserta: <span className="font-semibold">{participantName}</span>
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3 text-sm">
                      <p className="text-blue-900">
                        <span className="font-semibold">Nominal Share:</span> {formatCurrency(redistributedShare)}
                      </p>
                      {hasMaxPay && (
                        <p className="text-blue-700 text-xs mt-1">
                          (Max Bayar: {formatCurrency(maxPay!)})
                        </p>
                      )}
                    </div>
                  </>
                )
              })()}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nominal Pembayaran
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
                  <option value="manual">Transfer Langsung</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => {
                  setShowPaymentForm(null)
                  setEditingPayment(null)
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
                Simpan Pembayaran
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
                  <p className="text-sm text-gray-500">Log semua perubahan pembayaran</p>
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
                  <p className="text-gray-600 font-medium">Belum ada history pembayaran</p>
                  <p className="text-sm text-gray-500 mt-1">
                    History akan muncul setelah ada perubahan pembayaran
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentHistory.map((item, index) => {
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
