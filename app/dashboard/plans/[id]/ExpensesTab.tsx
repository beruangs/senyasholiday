'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, DollarSign, Users, Edit2, Save, X } from 'lucide-react'
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

interface Expense {
  _id?: string
  itemName: string
  detail: string
  price: number
  quantity: number
  total: number
  categoryId?: string
}

export default function ExpensesTab({ planId }: { planId: string }) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showAddPeople, setShowAddPeople] = useState(false)
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [nominalAmount, setNominalAmount] = useState(0)
  const [bakaranAmount, setBalkaranAmount] = useState(0)
  const [formData, setFormData] = useState<Expense>({
    itemName: '',
    detail: '',
    price: 0,
    quantity: 1,
    total: 0,
  })

  useEffect(() => {
    fetchData()
  }, [planId])

  const fetchData = async () => {
    try {
      const [expensesRes, participantsRes, contributionsRes] = await Promise.all([
        fetch(`/api/expenses?planId=${planId}`),
        fetch(`/api/participants?planId=${planId}`),
        fetch(`/api/contributions?planId=${planId}`),
      ])

      if (expensesRes.ok) {
        const data = await expensesRes.json()
        setExpenses(data)
      }

      if (participantsRes.ok) {
        const data = await participantsRes.json()
        setParticipants(data)
      }

      if (contributionsRes.ok) {
        const data = await contributionsRes.json()
        setContributions(data)
      }
    } catch (error) {
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const total = formData.price * formData.quantity

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          holidayPlanId: planId,
          ...formData,
          total,
        }),
      })

      if (res.ok) {
        toast.success('Pengeluaran berhasil ditambahkan')
        setShowForm(false)
        setFormData({ itemName: '', detail: '', price: 0, quantity: 1, total: 0 })
        fetchData()
      } else {
        const errorData = await res.json()
        toast.error(errorData.details || 'Gagal menambahkan pengeluaran')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal menambahkan pengeluaran')
    }
  }

  const deleteExpense = async (id: string) => {
    if (!confirm('Yakin ingin menghapus pengeluaran ini?')) return

    try {
      const res = await fetch(`/api/expenses?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Pengeluaran berhasil dihapus')
        fetchData()
      }
    } catch (error) {
      toast.error('Gagal menghapus pengeluaran')
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

  const availableParticipants = participants.filter(p =>
    !contributions.some(c => c.participantId === p._id)
  )

  const grandTotal = expenses.reduce((sum, exp) => sum + exp.total, 0)

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Add People for Contributions */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Penambahan Orang Iuran</h2>
          <button
            onClick={() => setShowAddPeople(!showAddPeople)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Orang untuk Iuran</span>
          </button>
        </div>

        {showAddPeople && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 shadow-xl mb-6">
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
                      <span>
                        <strong>{selectedParticipants.length}</strong> orang dipilih
                      </span>
                    </li>
                    {nominalAmount > 0 && (
                      <li className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span>
                          Nominal: <strong>{formatCurrency(nominalAmount)}</strong> per orang
                        </span>
                      </li>
                    )}
                    {bakaranAmount > 0 && (
                      <li className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>
                          Bakaran: <strong>{formatCurrency(bakaranAmount)}</strong> per orang
                        </span>
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
      </div>

      {/* Expenses Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Tabel Keuangan</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Pengeluaran</span>
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-6 space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Item <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="Contoh: Sewa Villa"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Detail</label>
                <input
                  type="text"
                  value={formData.detail}
                  onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="Contoh: Villa Patria Padma, +1 orang"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Harga <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="1"
                />
              </div>

              <div className="md:col-span-2 bg-primary-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  Total: <span className="font-bold text-primary-600 text-lg">
                    {formatCurrency(formData.price * formData.quantity)}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Simpan
              </button>
            </div>
          </form>
        )}

        {expenses.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Belum ada pengeluaran. Catat pengeluaran sekarang!</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Table for desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Keperluan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detail
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Harga
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      QTY
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((expense, index) => (
                    <tr key={expense._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {expense.itemName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {expense.detail || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(expense.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {expense.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                        {formatCurrency(expense.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => deleteExpense(expense._id!)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg inline-flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-primary-50 font-bold">
                    <td colSpan={5} className="px-6 py-4 text-right text-gray-900">
                      TOTAL
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-primary-600 text-lg">
                      {formatCurrency(grandTotal)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Card view for mobile */}
            <div className="md:hidden divide-y divide-gray-200">
              {expenses.map((expense, index) => (
                <div key={expense._id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs text-gray-500">#{index + 1}</span>
                      <h4 className="font-semibold text-gray-900">{expense.itemName}</h4>
                      {expense.detail && (
                        <p className="text-sm text-gray-600">{expense.detail}</p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteExpense(expense._id!)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Harga:</span>
                      <p className="font-medium">{formatCurrency(expense.price)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">QTY:</span>
                      <p className="font-medium">{expense.quantity}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Total:</span>
                      <p className="font-semibold text-primary-600">{formatCurrency(expense.total)}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="p-4 bg-primary-50">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">GRAND TOTAL</span>
                  <span className="font-bold text-primary-600 text-lg">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
