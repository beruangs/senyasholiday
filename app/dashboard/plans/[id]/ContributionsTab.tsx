'use client'

import { useState, useEffect } from 'react'
import { Check, X, Plus, Users, DollarSign, Edit2, Save } from 'lucide-react'
import { toast } from 'sonner'

interface Participant {
  _id: string
  name: string
}

interface Contribution {
  _id?: string
  participantId: string
  amount: number
  paid: number
  isPaid: boolean
  type: 'nominal' | 'bakaran'
}

export default function ContributionsTab({ planId }: { planId: string }) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)
  const [nominalAmount, setNominalAmount] = useState(0)
  const [bakaranAmount, setBalkaranAmount] = useState(0)
  const [showAddPeople, setShowAddPeople] = useState(false)
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [editingPayment, setEditingPayment] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState(0)

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

  const addPeopleToContributions = async () => {
    if (selectedParticipants.length === 0) {
      toast.error('Pilih minimal 1 peserta')
      return
    }

    if (nominalAmount === 0 && bakaranAmount === 0) {
      toast.error('Isi minimal satu jenis iuran')
      return
    }

    try {
      const promises = selectedParticipants.flatMap((participantId) => {
        const requests = []
        
        if (nominalAmount > 0) {
          requests.push(
            fetch('/api/contributions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                holidayPlanId: planId,
                participantId,
                amount: nominalAmount,
                paid: 0,
                isPaid: false,
                type: 'nominal',
              }),
            })
          )
        }
        
        if (bakaranAmount > 0) {
          requests.push(
            fetch('/api/contributions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                holidayPlanId: planId,
                participantId,
                amount: bakaranAmount,
                paid: 0,
                isPaid: false,
                type: 'bakaran',
              }),
            })
          )
        }
        
        return requests
      })

      await Promise.all(promises)
      toast.success(`Berhasil menambahkan ${selectedParticipants.length} orang ke iuran`)
      setShowAddPeople(false)
      setSelectedParticipants([])
      setNominalAmount(0)
      setBalkaranAmount(0)
      fetchData()
    } catch (error) {
      toast.error('Gagal menambahkan peserta')
    }
  }

  const updatePayment = async (contributionId: string, paidAmount: number, totalAmount: number) => {
    const isPaid = paidAmount >= totalAmount

    try {
      const res = await fetch('/api/contributions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: contributionId,
          paid: paidAmount,
          isPaid,
          paidAt: isPaid ? new Date() : null,
        }),
      })

      if (res.ok) {
        toast.success('Pembayaran diupdate')
        setEditingPayment(null)
        fetchData()
      }
    } catch (error) {
      toast.error('Gagal mengupdate pembayaran')
    }
  }

  const toggleSelectAll = () => {
    const availableParticipants = participants.filter(p => 
      !contributions.some(c => c.participantId === p._id)
    )
    
    if (selectedParticipants.length === availableParticipants.length) {
      setSelectedParticipants([])
    } else {
      setSelectedParticipants(availableParticipants.map(p => p._id))
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Group contributions by participant
  const participantContributions = participants.map(participant => {
    const nominal = contributions.find(c => c.participantId === participant._id && c.type === 'nominal')
    const bakaran = contributions.find(c => c.participantId === participant._id && c.type === 'bakaran')
    
    const totalAmount = (nominal?.amount || 0) + (bakaran?.amount || 0)
    const totalPaid = (nominal?.paid || 0) + (bakaran?.paid || 0)
    const remaining = totalAmount - totalPaid
    
    return {
      participant,
      nominal,
      bakaran,
      totalAmount,
      totalPaid,
      remaining,
      isPaid: totalPaid >= totalAmount && totalAmount > 0,
    }
  }).filter(pc => pc.totalAmount > 0)

  const grandTotalAmount = participantContributions.reduce((sum, pc) => sum + pc.totalAmount, 0)
  const grandTotalPaid = participantContributions.reduce((sum, pc) => sum + pc.totalPaid, 0)
  const grandTotalRemaining = grandTotalAmount - grandTotalPaid

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  const availableParticipants = participants.filter(p => 
    !contributions.some(c => c.participantId === p._id)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Manajemen Iuran</h2>
        <button
          onClick={() => setShowAddPeople(!showAddPeople)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Orang untuk Iuran</span>
        </button>
      </div>

      {/* Add People Form */}
      {showAddPeople && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 shadow-xl">
          <h3 className="font-bold text-blue-900 mb-4 flex items-center space-x-2 text-lg">
            <Users className="w-6 h-6" />
            <span>Tambah Peserta ke Iuran</span>
          </h3>
          
          <div className="space-y-5">
            {/* Participant Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Pilih Peserta ({selectedParticipants.length} dipilih)
                </label>
                {availableParticipants.length > 0 && (
                  <button
                    onClick={toggleSelectAll}
                    className="text-sm text-primary-600 hover:text-primary-700 font-semibold hover:underline transition-colors"
                  >
                    {selectedParticipants.length === availableParticipants.length ? '✕ Batal Semua' : '✓ Pilih Semua'}
                  </button>
                )}
              </div>
              
              {availableParticipants.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto bg-white p-4 rounded-xl border-2 border-gray-200 shadow-inner">
                  {availableParticipants.map(participant => (
                    <label
                      key={participant._id}
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${
                        selectedParticipants.includes(participant._id)
                          ? 'bg-primary-100 border-2 border-primary-500 shadow-md'
                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedParticipants.includes(participant._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedParticipants([...selectedParticipants, participant._id])
                          } else {
                            setSelectedParticipants(selectedParticipants.filter(id => id !== participant._id))
                          }
                        }}
                        className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-900">{participant.name}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-6 rounded-xl border-2 border-dashed border-gray-300 text-center">
                  <p className="text-sm text-gray-500">
                    {participants.length === 0 
                      ? 'Belum ada peserta. Tambahkan peserta terlebih dahulu di tab Peserta.'
                      : 'Semua peserta sudah ditambahkan ke iuran.'}
                  </p>
                </div>
              )}
            </div>

            {/* Amount Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  💰 Iuran Nominal per Orang
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-500 font-medium">Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={nominalAmount}
                    onChange={(e) => setNominalAmount(Number(e.target.value))}
                    className="w-full pl-14 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🍔 Iuran Bakaran per Orang
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-500 font-medium">Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={bakaranAmount}
                    onChange={(e) => setBalkaranAmount(Number(e.target.value))}
                    className="w-full pl-14 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            {selectedParticipants.length > 0 && (nominalAmount > 0 || bakaranAmount > 0) && (
              <div className="bg-white p-5 rounded-xl border-2 border-primary-300 shadow-md">
                <p className="text-sm font-bold text-gray-800 mb-3 flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-primary-600" />
                  <span>Ringkasan:</span>
                </p>
                <ul className="text-sm space-y-2 text-gray-700">
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                    <span><strong>{selectedParticipants.length}</strong> orang dipilih</span>
                  </li>
                  {nominalAmount > 0 && (
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span>Nominal: <strong>{formatCurrency(nominalAmount)}</strong> per orang</span>
                    </li>
                  )}
                  {bakaranAmount > 0 && (
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>Bakaran: <strong>{formatCurrency(bakaranAmount)}</strong> per orang</span>
                    </li>
                  )}
                  <li className="flex items-center space-x-2 pt-2 mt-2 border-t-2 border-primary-200">
                    <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                    <span className="font-bold text-primary-700">
                      Total per orang: {formatCurrency(nominalAmount + bakaranAmount)}
                    </span>
                  </li>
                  <li className="flex items-center space-x-2 text-base">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span className="font-bold text-red-600">
                      Grand Total: {formatCurrency((nominalAmount + bakaranAmount) * selectedParticipants.length)}
                    </span>
                  </li>
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => {
                  setShowAddPeople(false)
                  setSelectedParticipants([])
                  setNominalAmount(0)
                  setBalkaranAmount(0)
                }}
                className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium"
              >
                Batal
              </button>
              <button
                onClick={addPeopleToContributions}
                disabled={selectedParticipants.length === 0 || (nominalAmount === 0 && bakaranAmount === 0)}
                className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                ✓ Tambahkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contributions Table */}
      {participantContributions.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
          <DollarSign className="w-20 h-20 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold mb-2 text-lg">Belum ada iuran yang diatur</p>
          <p className="text-sm text-gray-500">Klik tombol "Tambah Orang untuk Iuran" untuk memulai</p>
        </div>
      ) : (
        <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-lg">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-primary-600 to-pink-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Nama Peserta
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">
                    💰 Nominal
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">
                    🍔 Bakaran
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">
                    Total Iuran
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">
                    ✓ Terbayar
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">
                    ⚠ Kekurangan
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y-2 divide-gray-100">
                {participantContributions.map((pc, index) => (
                  <tr key={pc.participant._id} className={`hover:bg-primary-50 transition-colors ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-sm">
                          {pc.participant.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-gray-900">{pc.participant.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {pc.nominal ? (
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-gray-900">{formatCurrency(pc.nominal.amount)}</div>
                          {editingPayment === `nominal-${pc.nominal._id}` ? (
                            <div className="flex items-center justify-end space-x-1">
                              <input
                                type="number"
                                min="0"
                                max={pc.nominal.amount}
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                className="w-28 px-2 py-1 text-xs border-2 border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="Jumlah bayar"
                              />
                              <button
                                onClick={() => updatePayment(pc.nominal!._id!, paymentAmount, pc.nominal!.amount)}
                                className="p-1.5 bg-green-500 text-white hover:bg-green-600 rounded-lg transition-colors"
                                title="Simpan"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingPayment(null)}
                                className="p-1.5 bg-gray-300 text-gray-700 hover:bg-gray-400 rounded-lg transition-colors"
                                title="Batal"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end space-x-1">
                              <span className="text-xs text-green-600 font-medium">Bayar: {formatCurrency(pc.nominal.paid || 0)}</span>
                              <button
                                onClick={() => {
                                  setEditingPayment(`nominal-${pc.nominal!._id}`)
                                  setPaymentAmount(pc.nominal!.paid || 0)
                                }}
                                className="text-primary-600 hover:text-primary-700 transition-colors"
                                title="Edit pembayaran"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {pc.bakaran ? (
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-gray-900">{formatCurrency(pc.bakaran.amount)}</div>
                          {editingPayment === `bakaran-${pc.bakaran._id}` ? (
                            <div className="flex items-center justify-end space-x-1">
                              <input
                                type="number"
                                min="0"
                                max={pc.bakaran.amount}
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                className="w-28 px-2 py-1 text-xs border-2 border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="Jumlah bayar"
                              />
                              <button
                                onClick={() => updatePayment(pc.bakaran!._id!, paymentAmount, pc.bakaran!.amount)}
                                className="p-1.5 bg-green-500 text-white hover:bg-green-600 rounded-lg transition-colors"
                                title="Simpan"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingPayment(null)}
                                className="p-1.5 bg-gray-300 text-gray-700 hover:bg-gray-400 rounded-lg transition-colors"
                                title="Batal"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end space-x-1">
                              <span className="text-xs text-green-600 font-medium">Bayar: {formatCurrency(pc.bakaran.paid || 0)}</span>
                              <button
                                onClick={() => {
                                  setEditingPayment(`bakaran-${pc.bakaran!._id}`)
                                  setPaymentAmount(pc.bakaran!.paid || 0)
                                }}
                                className="text-primary-600 hover:text-primary-700 transition-colors"
                                title="Edit pembayaran"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900 text-base">
                      {formatCurrency(pc.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-right text-green-600 font-bold text-base">
                      {formatCurrency(pc.totalPaid)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {pc.remaining > 0 ? (
                        <span className="text-red-600 font-bold text-base">{formatCurrency(pc.remaining)}</span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {pc.isPaid ? (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border-2 border-green-300">
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Lunas
                        </span>
                      ) : pc.totalPaid > 0 ? (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border-2 border-yellow-300">
                          <DollarSign className="w-3.5 h-3.5 mr-1" />
                          Sebagian
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border-2 border-red-300">
                          <X className="w-3.5 h-3.5 mr-1" />
                          Belum Bayar
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                
                {/* Grand Total Row */}
                <tr className="bg-gradient-to-r from-primary-100 to-pink-100 font-bold text-gray-900 border-t-4 border-primary-300">
                  <td className="px-6 py-5 text-base uppercase">📊 GRAND TOTAL</td>
                  <td className="px-6 py-5 text-right text-gray-600">-</td>
                  <td className="px-6 py-5 text-right text-gray-600">-</td>
                  <td className="px-6 py-5 text-right text-xl text-primary-700">
                    {formatCurrency(grandTotalAmount)}
                  </td>
                  <td className="px-6 py-5 text-right text-xl text-green-600">
                    {formatCurrency(grandTotalPaid)}
                  </td>
                  <td className="px-6 py-5 text-right text-xl text-red-600">
                    {grandTotalRemaining > 0 ? formatCurrency(grandTotalRemaining) : '-'}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-sm">
                      {grandTotalRemaining === 0 ? '✓ Selesai' : `${participantContributions.filter(pc => pc.isPaid).length}/${participantContributions.length} Lunas`}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y-2 divide-gray-200">
            {participantContributions.map((pc) => (
              <div key={pc.participant._id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
                      {pc.participant.name.charAt(0)}
                    </div>
                    <h4 className="font-bold text-gray-900 text-lg">{pc.participant.name}</h4>
                  </div>
                  {pc.isPaid ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300">
                      <Check className="w-3 h-3 mr-1" />
                      Lunas
                    </span>
                  ) : pc.totalPaid > 0 ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">
                      Sebagian
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                      Belum
                    </span>
                  )}
                </div>
                
                <div className="space-y-2.5 text-sm bg-gray-50 p-4 rounded-xl">
                  {pc.nominal && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">💰 Nominal:</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(pc.nominal.amount)}</span>
                    </div>
                  )}
                  {pc.bakaran && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">🍔 Bakaran:</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(pc.bakaran.amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t-2 border-gray-200">
                    <span className="text-gray-700 font-bold">Total Iuran:</span>
                    <span className="font-bold text-gray-900 text-base">{formatCurrency(pc.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">✓ Terbayar:</span>
                    <span className="text-green-600 font-bold">{formatCurrency(pc.totalPaid)}</span>
                  </div>
                  {pc.remaining > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">⚠ Kekurangan:</span>
                      <span className="text-red-600 font-bold">{formatCurrency(pc.remaining)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Mobile Total */}
            <div className="p-5 bg-gradient-to-r from-primary-100 to-pink-100 font-bold border-t-4 border-primary-300">
              <h3 className="text-gray-800 mb-3 text-sm uppercase">📊 Grand Total</h3>
              <div className="flex justify-between mb-2 text-base">
                <span className="text-gray-700">Total Iuran:</span>
                <span className="text-primary-700">{formatCurrency(grandTotalAmount)}</span>
              </div>
              <div className="flex justify-between mb-2 text-base">
                <span className="text-gray-700">Terbayar:</span>
                <span className="text-green-600">{formatCurrency(grandTotalPaid)}</span>
              </div>
              {grandTotalRemaining > 0 && (
                <div className="flex justify-between text-base">
                  <span className="text-gray-700">Kekurangan:</span>
                  <span className="text-red-600">{formatCurrency(grandTotalRemaining)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
