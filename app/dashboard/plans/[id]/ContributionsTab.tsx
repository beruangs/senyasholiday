'use client'

import { useState, useEffect } from 'react'
import { Check, X, DollarSign } from 'lucide-react'
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Build table data
  const tableData = participants.map((participant, index) => {
    const nominalContribution = contributions.find(
      c => c.participantId === participant._id && c.type === 'nominal'
    )
    const bakaranContribution = contributions.find(
      c => c.participantId === participant._id && c.type === 'bakaran'
    )

    const nominalAmount = nominalContribution?.amount || 0
    const bakaranAmount = bakaranContribution?.amount || 0
    const isChecked = nominalAmount > 0 || bakaranAmount > 0

    return {
      no: index + 1,
      name: participant.name,
      isChecked,
      nominalAmount,
      bakaranAmount,
      totalAmount: nominalAmount + bakaranAmount,
    }
  })

  const grandTotalNominal = tableData.reduce((sum, row) => sum + row.nominalAmount, 0)
  const grandTotalBakaran = tableData.reduce((sum, row) => sum + row.bakaranAmount, 0)
  const grandTotal = grandTotalNominal + grandTotalBakaran

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Tabel Iuran</h2>

      {tableData.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Belum ada peserta. Tambahkan peserta terlebih dahulu.</p>
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
                    NAMA
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    CHECKLIST
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                    NOMINAL
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                    BAKARAN
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                    TOTAL
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableData.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row.no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {row.isChecked ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-green-100 text-green-700">
                          <Check className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gray-100 text-gray-400">
                          <X className="w-4 h-4" />
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                      {row.nominalAmount > 0 ? formatCurrency(row.nominalAmount) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                      {row.bakaranAmount > 0 ? formatCurrency(row.bakaranAmount) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-bold">
                      {row.totalAmount > 0 ? formatCurrency(row.totalAmount) : '-'}
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold">
                  <td colSpan={2} className="px-6 py-4 text-sm text-gray-900">
                    TOTAL
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg">
                      {tableData.filter(row => row.isChecked).length}/{tableData.length}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900">
                    {formatCurrency(grandTotalNominal)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900">
                    {formatCurrency(grandTotalBakaran)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900">
                    {formatCurrency(grandTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-200">
            {tableData.map((row, index) => (
              <div key={index} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded">
                      {row.no}
                    </span>
                    <span className="font-semibold text-gray-900">{row.name}</span>
                  </div>
                  {row.isChecked ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-green-100 text-green-700">
                      <Check className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gray-100 text-gray-400">
                      <X className="w-4 h-4" />
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm bg-gray-50 p-3 rounded">
                  <div>
                    <span className="text-gray-500 text-xs">Nominal</span>
                    <p className="font-medium">{row.nominalAmount > 0 ? formatCurrency(row.nominalAmount) : '-'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Bakaran</span>
                    <p className="font-medium">{row.bakaranAmount > 0 ? formatCurrency(row.bakaranAmount) : '-'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Total</span>
                    <p className="font-bold text-gray-900">{row.totalAmount > 0 ? formatCurrency(row.totalAmount) : '-'}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="p-4 bg-gray-100 border-t-2 border-gray-300">
              <h3 className="font-bold text-gray-900 mb-3">TOTAL</h3>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-gray-500 text-xs">Nominal</span>
                  <p className="font-bold">{formatCurrency(grandTotalNominal)}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Bakaran</span>
                  <p className="font-bold">{formatCurrency(grandTotalBakaran)}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Total</span>
                  <p className="font-bold text-lg text-gray-900">{formatCurrency(grandTotal)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
