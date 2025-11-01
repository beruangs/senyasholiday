'use client'

import { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'
import { toast } from 'sonner'

interface Participant {
  _id: string
  name: string
}

interface Contribution {
  _id?: string
  participantId: string
  amount: number
  isPaid: boolean
  type: 'nominal' | 'bakaran'
}

export default function ContributionsTab({ planId }: { planId: string }) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)
  const [nominalAmount, setNominalAmount] = useState(0)
  const [bakaranAmount, setBalkaranAmount] = useState(0)
  const [maxPay, setMaxPay] = useState<Record<string, number>>({})
  const [nominalDistribusi, setNominalDistribusi] = useState<Record<string, number>>({})

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

  const initializeContributions = async () => {
    if (participants.length === 0) {
      toast.error('Tambahkan peserta terlebih dahulu')
      return
    }

    try {
      const promises = participants.map((participant) => {
        return Promise.all([
          fetch('/api/contributions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              holidayPlanId: planId,
              participantId: participant._id,
              amount: nominalAmount,
              isPaid: false,
              type: 'nominal',
            }),
          }),
          fetch('/api/contributions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              holidayPlanId: planId,
              participantId: participant._id,
              amount: bakaranAmount,
              isPaid: false,
              type: 'bakaran',
            }),
          }),
        ])
      })

      await Promise.all(promises)
      toast.success('Iuran berhasil diinisialisasi')
      fetchData()
    } catch (error) {
      toast.error('Gagal menginisialisasi iuran')
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const nominalContributions = contributions.filter((c) => c.type === 'nominal')
  const bakaranContributions = contributions.filter((c) => c.type === 'bakaran')

  const nominalTotal = nominalContributions.reduce((sum: number, c: Contribution) => sum + c.amount, 0)
  const bakaranTotal = bakaranContributions.reduce((sum: number, c: Contribution) => sum + c.amount, 0)
  const grandTotal = nominalTotal + bakaranTotal

  // Kalkulasi ulang distribusi jika ada max bayar
  const recalcDistribusi = () => {
    // Ambil total iuran
    let total = nominalTotal
    // Ambil peserta yang set max
    const fixed: { id: string, max: number }[] = []
    const others: string[] = []
    participants.forEach(p => {
      const val = maxPay[p._id]
      if (val && val > 0) {
        fixed.push({ id: p._id, max: val })
        total -= val
      } else {
        others.push(p._id)
      }
    })
    // Sisa dibagi rata ke peserta lain
    const perOrang = others.length > 0 ? Math.floor(total / others.length / 100) * 100 : 0
    const distribusi: Record<string, number> = {}
    fixed.forEach(f => { distribusi[f.id] = f.max })
    others.forEach(id => { distribusi[id] = perOrang })
    setNominalDistribusi(distribusi)
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Manajemen Iuran</h2>

      {contributions.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-4">Inisialisasi Iuran</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Iuran Nominal per Orang
              </label>
              <input
                type="number"
                min="0"
                value={nominalAmount}
                onChange={(e) => setNominalAmount(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="Contoh: 60000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Iuran Bakaran per Orang
              </label>
              <input
                type="number"
                min="0"
                value={bakaranAmount}
                onChange={(e) => setBalkaranAmount(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="Contoh: 58283"
              />
            </div>
          </div>
          <button
            onClick={initializeContributions}
            className="w-full md:w-auto px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Inisialisasi Iuran untuk Semua Peserta
          </button>
          <p className="text-sm text-gray-600 mt-3">
            Total Peserta: <strong>{participants.length} orang</strong>
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Iuran Nominal */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-primary-50 px-6 py-3 border-b border-primary-100">
              <h3 className="font-semibold text-primary-900">Iuran Nominal</h3>
            </div>
            <div className="overflow-x-auto">
              <button
                onClick={recalcDistribusi}
                className="mb-2 px-4 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-xs font-medium border border-blue-200"
              >
                Kalkulasi Ulang Distribusi
              </button>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nominal</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Max Bayar</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Distribusi</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {participants.map((participant, index) => {
                    const contribution = nominalContributions.find((c) => c.participantId === participant._id)
                    return (
                      <tr key={participant._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{participant.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right">{contribution ? formatCurrency(contribution.amount) : '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right">
                          <input
                            type="number"
                            min="0"
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-xs text-right focus:ring-2 focus:ring-primary-500"
                            value={maxPay[participant._id] ?? ''}
                            onChange={e => {
                              setMaxPay({ ...maxPay, [participant._id]: Number(e.target.value) })
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right">
                          {nominalDistribusi[participant._id] ? formatCurrency(nominalDistribusi[participant._id]) : '-'}
                          {contribution && nominalDistribusi[participant._id] !== undefined && (
                            <span className="ml-2 text-xs text-gray-500">
                              {nominalDistribusi[participant._id] > contribution.amount ? `(+${formatCurrency(nominalDistribusi[participant._id] - contribution.amount)})` : nominalDistribusi[participant._id] < contribution.amount ? `(-${formatCurrency(contribution.amount - nominalDistribusi[participant._id])})` : ''}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {contribution && (
                            <button
                              onClick={() => togglePaid(contribution._id!, contribution.isPaid)}
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                contribution.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {contribution.isPaid ? (
                                <>
                                  <Check className="w-3 h-3 mr-1" /> SUDAH
                                </>
                              ) : (
                                <>
                                  <X className="w-3 h-3 mr-1" /> BELUM
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="bg-primary-50 font-bold">
                    <td colSpan={2} className="px-6 py-4 text-gray-900">TOTAL</td>
                    <td className="px-6 py-4 text-primary-600 text-right">{formatCurrency(nominalTotal)}</td>
                    <td colSpan={3}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Iuran Bakaran */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-primary-50 px-6 py-3 border-b border-primary-100">
              <h3 className="font-semibold text-primary-900">Iuran Bakaran</h3>
            </div>
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
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {participants.map((participant, index) => {
                    const contribution = bakaranContributions.find(
                      (c) => c.participantId === participant._id
                    )
                    return (
                      <tr key={participant._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {participant.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right">
                          {contribution ? formatCurrency(contribution.amount) : '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {contribution && (
                            <button
                              onClick={() => togglePaid(contribution._id!, contribution.isPaid)}
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                contribution.isPaid
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {contribution.isPaid ? (
                                <>
                                  <Check className="w-3 h-3 mr-1" /> SUDAH
                                </>
                              ) : (
                                <>
                                  <X className="w-3 h-3 mr-1" /> BELUM
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="bg-primary-50 font-bold">
                    <td colSpan={2} className="px-6 py-4 text-gray-900">
                      TOTAL
                    </td>
                    <td className="px-6 py-4 text-primary-600 text-right">
                      {formatCurrency(bakaranTotal)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Grand Total */}
          <div className="bg-primary-600 text-white rounded-lg p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-primary-100 text-sm mb-1">Total Iuran</p>
                <p className="text-2xl font-bold">{formatCurrency(grandTotal)}</p>
              </div>
              <div className="text-right">
                <p className="text-primary-100 text-sm mb-1">Urungan @ {participants.length} Orang</p>
                <p className="text-xl font-semibold">
                  {formatCurrency(grandTotal / participants.length)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
