'use client'

import { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'
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
        }),
      })

      if (res.ok) {
        toast.success('Pembayaran berhasil diupdate')
        setEditingPayment(null)
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

              {/* Table for this collector */}
              <div className="overflow-x-auto">
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
                        const participant = participants.find(p => p._id === contribution.participantId)
                        if (!participant) return null
                        
                        const { share, paid, remaining, overpaid, status } = calculateShare(contribution)
                        const isEditingMax = editingMaxPay === contribution._id
                        const isEditingPay = editingPayment === contribution._id
                        
                        return (
                          <tr key={contribution._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {participant.name}
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
                                <button
                                  onClick={() => {
                                    setEditingPayment(contribution._id!)
                                    setEditPaymentValue(paid)
                                  }}
                                  className="text-xs text-green-600 hover:text-green-800 underline"
                                >
                                  Input
                                </button>
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
