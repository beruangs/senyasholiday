'use client'

import { useState, useEffect } from 'react'
import { Check, X, MoreVertical, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

interface Participant {
  _id: string
  name: string
}

interface ExpenseItem {
  _id: string
  itemName: string
  collectorId?: Participant | string // Bisa object Participant (populated) atau string ID
}

interface Contribution {
  _id?: string
  participantId: string
  expenseItemId?: ExpenseItem | string // Bisa object ExpenseItem (populated) atau string ID
  amount: number
  isPaid: boolean
  paid?: number // jumlah yang sudah dibayar
  maxPay?: number // batas maksimal bayar per peserta
  paymentMethod?: string // 'manual' | 'midtrans'
  paidAt?: string | Date
}

export default function ContributionsTab({ planId }: { planId: string }) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)
  
  // State untuk manage max bayar
  const [editingMaxPay, setEditingMaxPay] = useState<string | null>(null)
  const [editMaxPayValue, setEditMaxPayValue] = useState<number | null>(null)
  
  // State untuk manage pembayaran
  const [editingPayment, setEditingPayment] = useState<string | null>(null)
  const [editPaymentValue, setEditPaymentValue] = useState<number>(0)
  const [editPaymentMethod, setEditPaymentMethod] = useState<string>('manual')
  const [showPaymentForm, setShowPaymentForm] = useState<string | null>(null)
  const [showMobileMenu, setShowMobileMenu] = useState<string | null>(null)

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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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

  // Helper function untuk hitung share dengan max bayar
  const calculateShare = (contribution: Contribution) => {
    if (!contribution) return { share: 0, paid: 0, remaining: 0, overpaid: 0, status: 'Belum' as const }
    
    const amount = contribution.amount || 0
    const paid = contribution.paid || 0
    const maxPay = contribution.maxPay
    
    let share = amount
    let overpaid = 0
    
    // Jika ada max bayar dan lebih kecil dari amount, gunakan max bayar sebagai share
    if (typeof maxPay === 'number' && maxPay < amount) {
      share = maxPay
      // Jika sudah bayar lebih dari max bayar, hitung kelebihannya
      if (paid > maxPay) {
        overpaid = paid - maxPay
      }
    }
    
    const remaining = share - paid
    const status = paid === 0 ? 'Belum' : paid >= share ? 'Lunas' : 'Sebagian'
    
    return { share, paid, remaining, overpaid, status }
  }

  // Group contributions by collector
  const groupByCollector = (contribs: Contribution[]) => {
    const groups = new Map<string, {
      collectorId: string
      collectorName: string
      itemName: string
      expenseItemId: string
      contributions: Contribution[]
      stats: {
        totalShare: number
        totalPaid: number
        totalKurang: number
        totalLebih: number
      }
    }>()

    contribs.forEach(c => {
      // Extract collector info from populated expenseItemId
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
      
      // Gunakan expenseItemId sebagai key utama untuk grouping yang lebih akurat
      const groupKey = expenseItemId || collectorId
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          collectorId,
          collectorName,
          itemName,
          expenseItemId,
          contributions: [],
          stats: {
            totalShare: 0,
            totalPaid: 0,
            totalKurang: 0,
            totalLebih: 0,
          }
        })
      }

      const group = groups.get(groupKey)!
      group.contributions.push(c)
      
      // Calculate stats for this contribution
      const { share, paid, remaining, overpaid } = calculateShare(c)
      group.stats.totalShare += share
      group.stats.totalPaid += paid
      group.stats.totalKurang += remaining > 0 ? remaining : 0
      group.stats.totalLebih += overpaid
    })

    return Array.from(groups.values())
  }

  const contributionsByCollector = groupByCollector(contributions)

  console.log('=== DEBUG ContributionsTab ===')
  console.log('Total contributions:', contributions.length)
  console.log('Total participants:', participants.length)
  console.log('Groups by collector:', contributionsByCollector.length)
  console.log('Contributions data sample:', contributions[0])
  contributionsByCollector.forEach(group => {
    console.log(`Collector: ${group.collectorName}, Item: ${group.itemName}, Contributions: ${group.contributions.length}`)
  })

  // Hitung total keseluruhan
  const grandTotal = contributions.reduce((sum: number, c: Contribution) => sum + c.amount, 0)
  
  const totalStats = contributions.reduce((acc, c) => {
    const { share, paid, remaining, overpaid } = calculateShare(c)
    return {
      totalShare: acc.totalShare + share,
      totalPaid: acc.totalPaid + paid,
      totalKurang: acc.totalKurang + (remaining > 0 ? remaining : 0),
      totalLebih: acc.totalLebih + overpaid,
    }
  }, { totalShare: 0, totalPaid: 0, totalKurang: 0, totalLebih: 0 })

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Manajemen Iuran</h2>

      {contributions.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">Belum ada data iuran.</p>
          <p className="text-sm text-gray-500 mt-2">Silakan tambahkan iuran melalui tab Pengeluaran atau menu lainnya.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Loop per Collector */}
          {contributionsByCollector.map((collectorGroup) => (
            <div key={collectorGroup.collectorId} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Header Collector dengan info Kurang/Lebih */}
              <div className="bg-gradient-to-r from-primary-50 to-primary-100 px-6 py-4 border-b border-primary-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👤</span>
                  <div>
                    <h3 className="font-bold text-primary-900 text-lg">{collectorGroup.collectorName}</h3>
                    <p className="text-sm text-primary-700 font-medium">
                      📦 {collectorGroup.itemName}
                    </p>
                    <p className="text-xs text-primary-600">
                      {collectorGroup.contributions.length} peserta
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 text-sm">
                  {collectorGroup.stats.totalKurang > 0 && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 font-semibold rounded-full">
                      Kurang: {formatCurrency(collectorGroup.stats.totalKurang)}
                    </span>
                  )}
                  {collectorGroup.stats.totalLebih > 0 && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 font-semibold rounded-full">
                      Lebih: {formatCurrency(collectorGroup.stats.totalLebih)}
                    </span>
                  )}
                  {collectorGroup.stats.totalKurang === 0 && collectorGroup.stats.totalLebih === 0 && (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-semibold rounded-full">
                      ✓ Semua Lunas
                    </span>
                  )}
                </div>
              </div>

              {/* Table for this collector - Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Nama
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Nominal
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Max Bayar
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Sudah Bayar
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Kurang/Lebih
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {collectorGroup.contributions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                          <p>Tidak ada data kontribusi untuk pengumpul ini.</p>
                          <p className="text-sm mt-1">Silakan tambahkan dari tab Keuangan.</p>
                        </td>
                      </tr>
                    ) : (
                      collectorGroup.contributions.map((contribution, index) => {
                        // Handle participantId yang bisa berupa string atau object (populated)
                        let participantId = contribution.participantId
                        let participantName = 'Unknown'
                        
                        if (typeof contribution.participantId === 'object' && contribution.participantId !== null) {
                          participantId = (contribution.participantId as any)._id
                          participantName = (contribution.participantId as any).name
                        } else {
                          const participant = participants.find(p => p._id === contribution.participantId)
                          if (!participant) {
                            console.warn('Participant not found for:', contribution.participantId)
                            return null
                          }
                          participantName = participant.name
                        }
                        
                        const { share, paid, remaining, overpaid, status } = calculateShare(contribution)
                        const isEditingMax = editingMaxPay === contribution._id
                        const isEditingPay = editingPayment === contribution._id
                        
                        return (
                          <tr key={contribution._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {participantName}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 text-right">
                              {formatCurrency(contribution.amount)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {isEditingMax ? (
                                <div className="flex gap-2 justify-end items-center">
                                  <input
                                    type="number"
                                    value={editMaxPayValue ?? ''}
                                    onChange={(e) => setEditMaxPayValue(e.target.value ? Number(e.target.value) : null)}
                                    className="w-32 px-2 py-1 text-sm border border-gray-300 rounded"
                                    placeholder="Max bayar"
                                  />
                                  <button
                                    onClick={() => updateMaxPay(contribution._id!, editMaxPayValue)}
                                    className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                  >
                                    Simpan
                                  </button>
                                  <button
                                    onClick={() => setEditingMaxPay(null)}
                                    className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                                  >
                                    Batal
                                  </button>
                                </div>
                              ) : (
                                <div className="flex gap-2 justify-end items-center">
                                  {contribution.maxPay ? (
                                    <span className="text-sm font-medium text-blue-600">
                                      {formatCurrency(contribution.maxPay)}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-gray-400">-</span>
                                  )}
                                  <button
                                    onClick={() => {
                                      setEditingMaxPay(contribution._id!)
                                      setEditMaxPayValue(contribution.maxPay ?? null)
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                  >
                                    Edit
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {isEditingPay ? (
                              <div className="flex gap-2 justify-end items-center">
                                <input
                                  type="number"
                                  value={editPaymentValue}
                                  onChange={(e) => setEditPaymentValue(Number(e.target.value))}
                                  className="w-32 px-2 py-1 text-sm border border-gray-300 rounded"
                                  placeholder="Jumlah bayar"
                                />
                                <button
                                  onClick={() => updatePayment(contribution._id!, editPaymentValue)}
                                  className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                >
                                  Simpan
                                </button>
                                <button
                                  onClick={() => setEditingPayment(null)}
                                  className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-2 justify-end items-center">
                                <span className="text-sm font-medium text-green-600">
                                  {formatCurrency(paid)}
                                </span>
                                {contribution.paymentMethod === 'manual' && paid > 0 && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                    Manual
                                  </span>
                                )}
                                {/* Desktop Button */}
                                <button
                                  onClick={() => {
                                    setEditingPayment(contribution._id!)
                                    setEditPaymentValue(paid)
                                    setShowPaymentForm(contribution._id!)
                                  }}
                                  className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors border border-green-200"
                                >
                                  <DollarSign className="w-4 h-4" />
                                  Input
                                </button>
                                
                                {/* Mobile Menu Button */}
                                <div className="md:hidden relative">
                                  <button
                                    onClick={() => setShowMobileMenu(showMobileMenu === contribution._id ? null : contribution._id!)}
                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                  {showMobileMenu === contribution._id && (
                                    <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                      <button
                                        onClick={() => {
                                          setEditingPayment(contribution._id!)
                                          setEditPaymentValue(paid)
                                          setShowPaymentForm(contribution._id!)
                                          setShowMobileMenu(null)
                                        }}
                                        className="w-full text-left px-4 py-2.5 hover:bg-green-50 text-green-700 font-medium flex items-center gap-2 border-b border-gray-100"
                                      >
                                        <DollarSign className="w-4 h-4" />
                                        Input Pembayaran
                                      </button>
                                    </div>
                                  )}
                                </div>
                                </div>
                              )}

                              {/* Payment Form Modal */}
                              {showPaymentForm === contribution._id && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                  <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
                                    <div>
                                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        Input Pembayaran
                                      </h3>
                                      <p className="text-sm text-gray-600 mb-4">
                                        Peserta: <span className="font-semibold">{
                                          typeof contribution.participantId === 'object' && contribution.participantId !== null
                                            ? (contribution.participantId as any).name
                                            : participants.find(p => p._id === contribution.participantId)?.name || 'Unknown'
                                        }</span>
                                      </p>
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
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
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
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        >
                                          <option value="manual">Transfer Langsung</option>
                                          <option value="cash">Cash</option>
                                        </select>
                                      </div>

                                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <p className="text-sm text-blue-900">
                                          <span className="font-semibold">Nominal Iuran:</span> {formatCurrency(share)}
                                        </p>
                                        {editPaymentValue > 0 && (
                                          <p className="text-sm text-blue-900 mt-2">
                                            <span className="font-semibold">Terisi:</span> {formatCurrency(editPaymentValue)} ({Math.round((editPaymentValue / share) * 100)}%)
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                      <button
                                        onClick={() => {
                                          setShowPaymentForm(null)
                                          setEditingPayment(null)
                                        }}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                      >
                                        Batal
                                      </button>
                                      <button
                                        onClick={() => {
                                          updatePayment(contribution._id!, editPaymentValue)
                                          setShowPaymentForm(null)
                                        }}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                      >
                                        Simpan Pembayaran
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right text-sm">
                              {remaining > 0 && (
                                <span className="text-red-600 font-medium">
                                  Kurang: {formatCurrency(remaining)}
                                </span>
                              )}
                              {overpaid > 0 && (
                                <span className="text-orange-600 font-medium">
                                  Lebih: {formatCurrency(overpaid)}
                                </span>
                              )}
                              {remaining <= 0 && overpaid === 0 && (
                                <span className="text-green-600 font-medium">
                                  Lunas
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                status === 'Lunas' ? 'bg-green-100 text-green-800' :
                                status === 'Sebagian' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {overpaid > 0 && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                  Kelebihan
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                      {/* Total per collector */}
                      <tr className="bg-gray-50 font-semibold border-t-2 border-gray-300">
                        <td colSpan={2} className="px-6 py-3 text-gray-900">
                          Total - {collectorGroup.collectorName}
                        </td>
                        <td className="px-6 py-3 text-primary-600 text-right">
                          {formatCurrency(collectorGroup.contributions.reduce((sum, c) => sum + c.amount, 0))}
                        </td>
                        <td className="px-6 py-3 text-blue-600 text-right">
                          {formatCurrency(collectorGroup.stats.totalShare)}
                        </td>
                        <td className="px-6 py-3 text-green-600 text-right">
                          {formatCurrency(collectorGroup.stats.totalPaid)}
                        </td>
                        <td className="px-6 py-3 text-right">
                          {collectorGroup.stats.totalKurang > 0 && (
                            <span className="text-red-600">
                              Kurang: {formatCurrency(collectorGroup.stats.totalKurang)}
                            </span>
                          )}
                          {collectorGroup.stats.totalLebih > 0 && (
                            <div className="text-orange-600">
                              Lebih: {formatCurrency(collectorGroup.stats.totalLebih)}
                            </div>
                          )}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View - Simplified */}
                <div className="md:hidden space-y-3 p-4">
                  {collectorGroup.contributions.length === 0 ? (
                    <div className="text-center text-gray-500 py-6">
                      <p>Tidak ada data kontribusi</p>
                    </div>
                  ) : (
                    collectorGroup.contributions.map((contribution) => {
                      // Handle participantId yang bisa berupa string atau object
                      let participantName = 'Unknown'
                      if (typeof contribution.participantId === 'object' && contribution.participantId !== null) {
                        participantName = (contribution.participantId as any).name
                      } else {
                        const participant = participants.find(p => p._id === contribution.participantId)
                        participantName = participant?.name || 'Unknown'
                      }

                      const { share, paid, remaining, overpaid, status } = calculateShare(contribution)

                      return (
                        <div key={contribution._id} className="bg-white border border-gray-200 rounded-lg p-4">
                          {/* Header dengan nama dan menu */}
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{participantName}</h4>
                              <p className="text-sm text-gray-600 mt-1">{formatCurrency(contribution.amount)}</p>
                            </div>
                            
                            {/* 3-Dot Menu */}
                            <div className="relative">
                              <button
                                onClick={() => setShowMobileMenu(showMobileMenu === contribution._id ? null : contribution._id!)}
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900"
                              >
                                <MoreVertical className="w-5 h-5" />
                              </button>
                              {showMobileMenu === contribution._id && (
                                <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                  <button
                                    onClick={() => {
                                      setEditingMaxPay(contribution._id!)
                                      setEditMaxPayValue(contribution.maxPay ?? null)
                                      setShowMobileMenu(null)
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-blue-50 text-blue-700 font-medium border-b border-gray-100"
                                  >
                                    Edit Max Bayar
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingPayment(contribution._id!)
                                      setEditPaymentValue(paid)
                                      setShowPaymentForm(contribution._id!)
                                      setShowMobileMenu(null)
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-green-50 text-green-700 font-medium"
                                  >
                                    Input Pembayaran
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Status Grid */}
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div className="bg-gray-50 rounded p-2">
                              <p className="text-gray-600 text-xs mb-1">Max Bayar</p>
                              <p className="font-semibold text-gray-900">
                                {contribution.maxPay ? formatCurrency(contribution.maxPay) : '-'}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded p-2">
                              <p className="text-gray-600 text-xs mb-1">Terbayar</p>
                              <p className="font-semibold text-green-600">{formatCurrency(paid)}</p>
                            </div>
                            <div className="bg-gray-50 rounded p-2">
                              <p className="text-gray-600 text-xs mb-1">Status</p>
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                status === 'Lunas' ? 'bg-green-100 text-green-800' :
                                status === 'Sebagian' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {status}
                              </span>
                            </div>
                          </div>

                          {/* Kurang/Lebih Info */}
                          {remaining > 0 && (
                            <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                              <p className="text-sm text-red-700 font-medium">
                                Kurang: {formatCurrency(remaining)}
                              </p>
                            </div>
                          )}
                          {overpaid > 0 && (
                            <div className="mt-2 p-2 bg-orange-50 rounded border border-orange-200">
                              <p className="text-sm text-orange-700 font-medium">
                                Lebih: {formatCurrency(overpaid)}
                              </p>
                            </div>
                          )}

                          {/* Edit Max Bayar Inline - Mobile */}
                          {editingMaxPay === contribution._id && (
                            <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                              <input
                                type="number"
                                value={editMaxPayValue ?? ''}
                                onChange={(e) => setEditMaxPayValue(e.target.value ? Number(e.target.value) : null)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                                placeholder="Max bayar"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => updateMaxPay(contribution._id!, editMaxPayValue)}
                                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                >
                                  Simpan
                                </button>
                                <button
                                  onClick={() => setEditingMaxPay(null)}
                                  className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                                >
                                  Batal
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}

                  {/* Mobile Total */}
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mt-4">
                    <p className="text-sm text-gray-600 mb-2">Total - {collectorGroup.collectorName}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600 text-xs">Nominal</p>
                        <p className="font-bold text-primary-600">{formatCurrency(collectorGroup.contributions.reduce((sum, c) => sum + c.amount, 0))}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Terbayar</p>
                        <p className="font-bold text-green-600">{formatCurrency(collectorGroup.stats.totalPaid)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

          {/* Grand Total */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg p-6 shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-primary-100 text-sm mb-1">Total Iuran Keseluruhan</p>
                <p className="text-3xl font-bold">{formatCurrency(grandTotal)}</p>
                <p className="text-xs text-primary-200 mt-1">
                  {contributionsByCollector.length} pengumpul • {contributions.length} iuran
                </p>
              </div>
              <div className="text-right">
                <p className="text-primary-100 text-sm mb-1">Urungan @ {participants.length} Orang</p>
                <p className="text-2xl font-semibold">
                  {formatCurrency(participants.length > 0 ? grandTotal / participants.length : 0)}
                </p>
                <div className="flex gap-2 mt-2 justify-end flex-wrap">
                  {totalStats.totalKurang > 0 && (
                    <span className="text-xs px-3 py-1 bg-red-500 rounded-full font-medium">
                      Kurang: {formatCurrency(totalStats.totalKurang)}
                    </span>
                  )}
                  {totalStats.totalLebih > 0 && (
                    <span className="text-xs px-3 py-1 bg-green-500 rounded-full font-medium">
                      Lebih: {formatCurrency(totalStats.totalLebih)}
                    </span>
                  )}
                  {totalStats.totalPaid > 0 && (
                    <span className="text-xs px-3 py-1 bg-white bg-opacity-20 rounded-full font-medium">
                      Terbayar: {formatCurrency(totalStats.totalPaid)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
