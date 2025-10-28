'use client'

import { useState, useEffect } from 'react'
import { Check, X, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

interface Participant {
  _id: string
  name: string
}

interface ExpenseItem {
  _id: string
  itemName: string
  detail: string
  price: number
  quantity: number
  total: number
}

interface Contribution {
  _id?: string
  expenseItemId: string
  participantId: string
  amount: number
  paid: number
  isPaid: boolean
}

interface ContributionWithDetails extends Contribution {
  participantName?: string
  expenseItemName?: string
  expenseTotal?: number
}

export default function ContributionsTab({ planId }: { planId: string }) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([])
  const [contributions, setContributions] = useState<ContributionWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
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
        setParticipants(participantsData)
      }

      if (expensesRes.ok) {
        expensesData = await expensesRes.json()
        setExpenseItems(expensesData)
      }

      if (contributionsRes.ok) {
        contributionsData = await contributionsRes.json()
      }

      // Merge data with details
      const contributionsWithDetails: ContributionWithDetails[] = contributionsData.map(contribution => {
        const participant = participantsData.find(p => p._id === contribution.participantId)
        const expense = expensesData.find(e => e._id === contribution.expenseItemId)

        return {
          ...contribution,
          participantName: participant?.name || 'Unknown',
          expenseItemName: expense?.itemName || 'Unknown',
          expenseTotal: expense?.total || 0,
        }
      })

      setContributions(contributionsWithDetails)
    } catch (error) {
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const grandTotal = contributions.reduce((sum, row) => sum + row.amount, 0)
  const totalPaid = contributions.reduce((sum, row) => sum + row.paid, 0)
  const totalRemaining = grandTotal - totalPaid

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Tabel Iuran</h2>

      {contributions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Belum ada iuran. Tambahkan iuran di tab Keuangan.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    NO
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    NAMA PESERTA
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    NAMA IURAN
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                    NOMINAL IURAN
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                    TERBAYAR
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                    SISA
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    STATUS
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contributions.map((row, index) => (
                  <tr key={row._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {row.participantName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {row.expenseItemName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                      {formatCurrency(row.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                      {formatCurrency(row.paid)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                      {formatCurrency(row.amount - row.paid)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {row.isPaid ? (
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                          <Check className="w-3 h-3 mr-1" />
                          Lunas
                        </span>
                      ) : row.paid > 0 ? (
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
                          Sebagian
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                          <X className="w-3 h-3 mr-1" />
                          Belum
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold">
                  <td colSpan={3} className="px-6 py-4 text-sm text-gray-900">
                    TOTAL
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900">
                    {formatCurrency(grandTotal)}
                  </td>
                  <td className="px-6 py-4 text-right text-green-600">
                    {formatCurrency(totalPaid)}
                  </td>
                  <td className="px-6 py-4 text-right text-red-600">
                    {formatCurrency(totalRemaining)}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-200">
            {contributions.map((row, index) => (
              <div key={row._id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <span className="text-sm font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded inline-block mb-2">
                      #{index + 1}
                    </span>
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-900">{row.participantName}</p>
                      <p className="text-sm text-gray-600">{row.expenseItemName}</p>
                    </div>
                  </div>
                  {row.isPaid ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                      <Check className="w-3 h-3 mr-1" />
                      Lunas
                    </span>
                  ) : row.paid > 0 ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
                      Sebagian
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                      <X className="w-3 h-3 mr-1" />
                      Belum
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm bg-gray-50 p-3 rounded">
                  <div>
                    <span className="text-gray-500 text-xs">Nominal</span>
                    <p className="font-medium">{formatCurrency(row.amount)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Terbayar</span>
                    <p className="font-medium text-green-600">{formatCurrency(row.paid)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Sisa</span>
                    <p className="font-bold text-red-600">{formatCurrency(row.amount - row.paid)}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="p-4 bg-gray-100 border-t-2 border-gray-300">
              <h3 className="font-bold text-gray-900 mb-3">TOTAL</h3>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-gray-500 text-xs">Nominal</span>
                  <p className="font-bold">{formatCurrency(grandTotal)}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Terbayar</span>
                  <p className="font-bold text-green-600">{formatCurrency(totalPaid)}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Sisa</span>
                  <p className="font-bold text-red-600">{formatCurrency(totalRemaining)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
