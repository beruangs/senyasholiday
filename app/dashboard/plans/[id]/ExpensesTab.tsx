'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

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
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<Expense>({
    itemName: '',
    detail: '',
    price: 0,
    quantity: 1,
    total: 0,
  })

  useEffect(() => {
    fetchExpenses()
  }, [planId])

  const fetchExpenses = async () => {
    try {
      const res = await fetch(`/api/expenses?planId=${planId}`)
      if (res.ok) {
        const data = await res.json()
        setExpenses(data)
      }
    } catch (error) {
      toast.error('Gagal memuat data pengeluaran')
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
        fetchExpenses()
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
        fetchExpenses()
      }
    } catch (error) {
      toast.error('Gagal menghapus pengeluaran')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const grandTotal = expenses.reduce((sum, exp) => sum + exp.total, 0)

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
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
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-6 space-y-4">
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
  )
}
