'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, DollarSign, Users, X, ChevronDown, ChevronUp, Edit2, Check } from 'lucide-react'
import { toast } from 'sonner'

interface Participant {
  _id: string
  name: string
}

interface Contribution {
  _id?: string
  expenseItemId: string
  participantId: string
  amount: number
  paid: number
  isPaid: boolean
}

interface Expense {
  _id?: string
  itemName: string
  detail: string
  price: number
  quantity: number
  total: number
  categoryId?: string
  collectorId?: string
  collectorName?: string
  downPayment?: number // percentage (0-100)
}

interface ExpenseWithContributions extends Expense {
  contributors?: Array<{
    participantName: string
    amount: number
    participantId: string
  }>
  contributorCount?: number
}

export default function ExpensesTab({ planId }: { planId: string }) {
  const [expenses, setExpenses] = useState<ExpenseWithContributions[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [expandedExpense, setExpandedExpense] = useState<string | null>(null)
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  const [editingExpenseData, setEditingExpenseData] = useState<Partial<Expense>>({})
  const [selectedExpenseId, setSelectedExpenseId] = useState<string>('')
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [splitAmount, setSplitAmount] = useState(0)
  const [autoDistribute, setAutoDistribute] = useState(true) // Auto redistribute when adding participants
  
  // State untuk edit nominal iuran peserta
  const [editingContributionId, setEditingContributionId] = useState<string | null>(null)
  const [editingContributionAmount, setEditingContributionAmount] = useState<number>(0)
  
  // Form state untuk penambahan pengeluaran
  const [formParticipants, setFormParticipants] = useState<string[]>([])
  const [formSplitAmount, setFormSplitAmount] = useState(0)
  const [formCollector, setFormCollector] = useState<string>('')
  const [formDownPayment, setFormDownPayment] = useState<number>(0)
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

  // Reset selected participants when expanding/collapsing
  useEffect(() => {
    setSelectedParticipants([])
    setSplitAmount(0)
  }, [expandedExpense])

  const fetchData = async () => {
    try {
      const [expensesRes, participantsRes, contributionsRes] = await Promise.all([
        fetch(`/api/expenses?planId=${planId}`),
        fetch(`/api/participants?planId=${planId}`),
        fetch(`/api/contributions?planId=${planId}`),
      ])

      let expensesData: Expense[] = []
      let participantsData: Participant[] = []
      let contributionsData: Contribution[] = []

      if (expensesRes.ok) {
        expensesData = await expensesRes.json()
      }

      if (participantsRes.ok) {
        participantsData = await participantsRes.json()
        setParticipants(participantsData)
      }

      if (contributionsRes.ok) {
        contributionsData = await contributionsRes.json()
        console.log('Contributions fetched:', contributionsData.length)
        console.log('Sample contribution:', contributionsData[0])
        setContributions(contributionsData)
      }

      // Add contributors info to expenses
      const expensesWithDetails: ExpenseWithContributions[] = expensesData.map(expense => {
        // Handle both populated (object) and non-populated (string) expenseItemId
        const expenseContributions = contributionsData.filter(c => {
          const contributionExpenseId = typeof c.expenseItemId === 'object' 
            ? (c.expenseItemId as any)?._id 
            : c.expenseItemId
          return contributionExpenseId === expense._id
        })
        
        console.log(`Expense "${expense.itemName}" (${expense._id}): Found ${expenseContributions.length} contributions`)
        
        const contributors = expenseContributions.map(c => {
          // Handle populated participantId
          const participantId = typeof c.participantId === 'object'
            ? (c.participantId as any)?._id
            : c.participantId
          const participantName = typeof c.participantId === 'object'
            ? (c.participantId as any)?.name
            : participantsData.find(p => p._id === participantId)?.name
            
          return {
            participantName: participantName || 'Unknown',
            amount: c.amount,
            participantId: participantId,
          }
        })
        const collectorName = participantsData.find(p => p._id === expense.collectorId)?.name

        return {
          ...expense,
          contributors,
          contributorCount: expenseContributions.length,
          collectorName,
        }
      })

      console.log('Expenses with details:', expensesWithDetails)
      setExpenses(expensesWithDetails)
    } catch (error) {
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent double submit
    if (isSubmitting) return
    setIsSubmitting(true)

    console.log('=== FORM SUBMIT START ===')
    console.log('Form Data:', formData)
    console.log('Form Participants:', formParticipants)
    console.log('Form Collector:', formCollector)
    
    const total = formData.price * formData.quantity

    if (formParticipants.length === 0) {
      toast.error('Pilih minimal 1 peserta untuk iuran')
      setIsSubmitting(false)
      return
    }

    if (!formCollector) {
      toast.error('Pilih siapa yang mengumpulkan uang')
      setIsSubmitting(false)
      return
    }

    // Auto-calculate split amount - round to nearest 100 to avoid floating point issues
    const rawSplitAmount = total / formParticipants.length
    const splitAmount = Math.round(rawSplitAmount / 100) * 100 // Round to nearest 100

    console.log('Raw split amount:', rawSplitAmount)
    console.log('Rounded split amount:', splitAmount)

    if (splitAmount <= 0) {
      toast.error('Jumlah iuran per orang harus lebih dari 0')
      setIsSubmitting(false)
      return
    }

    try {
      // 1. Create expense
      const expenseRes = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          holidayPlanId: planId,
          ...formData,
          total,
          collectorId: formCollector,
          downPayment: formDownPayment,
        }),
      })

      if (!expenseRes.ok) {
        const errorData = await expenseRes.json()
        toast.error(errorData.details || 'Gagal menambahkan pengeluaran')
        setIsSubmitting(false)
        return
      }

      const expense = await expenseRes.json()

      // 2. Create contributions
      console.log('Creating contributions for participants:', formParticipants)
      const contributionPromises = formParticipants.map(participantId =>
        fetch('/api/contributions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            holidayPlanId: planId,
            expenseItemId: expense._id,
            participantId,
            amount: splitAmount,
            paid: 0,
            isPaid: false,
          }),
        })
      )

      const contributionResults = await Promise.all(contributionPromises)
      console.log('Contribution results:', contributionResults.map(r => r.status))

      // Check if all contributions were created successfully
      let failedContributions = 0
      for (const result of contributionResults) {
        if (!result.ok) {
          failedContributions++
          const errorData = await result.json()
          console.error('Failed to create contribution:', result.status, errorData)
        }
      }

      console.log(`Created ${formParticipants.length - failedContributions} contributions successfully`)
      
      if (failedContributions > 0) {
        toast.warning(
          `Pengeluaran berhasil ditambahkan, tapi ${failedContributions} iuran gagal ditambahkan`
        )
      } else {
        toast.success('Pengeluaran dan iuran berhasil ditambahkan')
      }

      setShowForm(false)
      setFormData({ itemName: '', detail: '', price: 0, quantity: 1, total: 0 })
      setFormParticipants([])
      setFormSplitAmount(0)
      setFormCollector('')
      setFormDownPayment(0)
      setIsSubmitting(false)
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal menambahkan pengeluaran')
      setIsSubmitting(false)
    }
  }

  const deleteExpense = async (id: string) => {
    if (!confirm('Yakin ingin menghapus pengeluaran ini?')) return

    try {
      const res = await fetch(`/api/expenses?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (res.ok) {
        toast.success('Pengeluaran berhasil dihapus')
        fetchData()
      }
    } catch (error) {
      toast.error('Gagal menghapus pengeluaran')
    }
  }

  const updateExpense = async (id: string) => {
    if (!id) return
    try {
      const expense = expenses.find(e => e._id === id)
      if (!expense) {
        toast.error('Expense tidak ditemukan')
        return
      }

      // Calculate new total from price and quantity
      const newPrice = editingExpenseData.price ?? expense.price
      const newQuantity = editingExpenseData.quantity ?? expense.quantity
      const newTotal = newPrice * newQuantity

      const body: any = {
        _id: id,
        itemName: editingExpenseData.itemName ?? expense.itemName,
        detail: editingExpenseData.detail ?? expense.detail,
        price: newPrice,
        quantity: newQuantity,
        total: newTotal,
        collectorId: editingExpenseData.collectorId ?? expense.collectorId,
        downPayment: editingExpenseData.downPayment ?? expense.downPayment,
      }

      let shouldRecalculateContributions = false
      
      // Check if total changed - need to recalculate contributions
      if (newTotal !== expense.total) {
        shouldRecalculateContributions = true
      }

      const res = await fetch('/api/expenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errorData = await res.json()
        toast.error(errorData.details || 'Gagal mengupdate pengeluaran')
        return
      }

      // If total changed, recalculate all contributions for this expense
      if (shouldRecalculateContributions) {
        const expenseContributions = contributions.filter(c => {
          const cExpenseId = typeof c.expenseItemId === 'object' 
            ? (c.expenseItemId as any)?._id 
            : c.expenseItemId
          return cExpenseId === id
        })

        if (expenseContributions.length > 0) {
          const rawNewAmount = newTotal / expenseContributions.length
          const newAmount = Math.round(rawNewAmount / 100) * 100

          const updatePromises = expenseContributions.map(c => 
            fetch('/api/contributions', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                _id: c._id,
                amount: newAmount,
              }),
            })
          )

          await Promise.all(updatePromises)
          
          toast.success(
            `✅ Pengeluaran diupdate. Iuran disesuaikan menjadi ${formatCurrency(newAmount)}/orang untuk ${expenseContributions.length} peserta`,
            { duration: 5000 }
          )
        } else {
          toast.success('Pengeluaran berhasil diupdate')
        }
      } else {
        toast.success('Pengeluaran berhasil diupdate')
      }

      setEditingExpenseId(null)
      setEditingExpenseData({})
      fetchData()
    } catch (err) {
      console.error(err)
      toast.error('Gagal mengupdate pengeluaran')
    }
  }

  const addParticipantsToExpense = async (expenseId?: string) => {
    const targetExpenseId = expenseId || selectedExpenseId
    
    if (!targetExpenseId) {
      toast.error('Pilih pengeluaran terlebih dahulu')
      return
    }

    if (selectedParticipants.length === 0) {
      toast.error('Pilih minimal 1 peserta')
      return
    }

    try {
      const expense = expenses.find(e => e._id === targetExpenseId)
      if (!expense) {
        toast.error('Expense tidak ditemukan')
        return
      }

      // Get existing contributions for this expense
      const existingContributions = contributions.filter(c => {
        const cExpenseId = typeof c.expenseItemId === 'object' 
          ? (c.expenseItemId as any)?._id 
          : c.expenseItemId
        return cExpenseId === targetExpenseId
      })

      let amountPerPerson = splitAmount

      // If auto-distribute is enabled, recalculate for all participants
      if (autoDistribute) {
        const totalParticipants = existingContributions.length + selectedParticipants.length
        const rawAmount = expense.total / totalParticipants
        amountPerPerson = Math.round(rawAmount / 100) * 100 // Round to nearest 100

        // Update existing contributions with new amount
        if (existingContributions.length > 0) {
          const updatePromises = existingContributions.map(c => 
            fetch('/api/contributions', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                _id: c._id,
                amount: amountPerPerson,
              }),
            })
          )
          await Promise.all(updatePromises)
        }
      } else {
        // Manual mode: require split amount
        if (splitAmount <= 0) {
          toast.error('Masukkan nominal iuran')
          return
        }
      }

      // Add new participants
      const promises = selectedParticipants.map(participantId =>
        fetch('/api/contributions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            holidayPlanId: planId,
            expenseItemId: targetExpenseId,
            participantId,
            amount: amountPerPerson,
            paid: 0,
            isPaid: false,
          }),
        })
      )

      await Promise.all(promises)
      
      const totalParticipantsAfter = existingContributions.length + selectedParticipants.length
      
      if (autoDistribute) {
        toast.success(
          `✅ ${selectedParticipants.length} peserta ditambahkan. Iuran disesuaikan menjadi ${formatCurrency(amountPerPerson)}/orang untuk ${totalParticipantsAfter} peserta`,
          { duration: 5000 }
        )
      } else {
        toast.success(`✅ ${selectedParticipants.length} peserta ditambahkan ke iuran`)
      }

      setSelectedExpenseId('')
      setSelectedParticipants([])
      setSplitAmount(0)
      setExpandedExpense(null)
      fetchData()
    } catch (error) {
      toast.error('Gagal menambahkan peserta')
    }
  }

  const deleteContribution = async (expenseId: string, participantId: string) => {
    if (!confirm('Yakin ingin menghapus peserta ini dari iuran?')) return

    try {
      // Get expense data to recalculate
      const expense = expenses.find(e => e._id === expenseId)
      if (!expense) {
        toast.error('Expense tidak ditemukan')
        return
      }

      // Get all contributions for this expense
      const expenseContributions = contributions.filter(c => {
        const cExpenseId = typeof c.expenseItemId === 'object' 
          ? (c.expenseItemId as any)?._id 
          : c.expenseItemId
        return cExpenseId === expenseId
      })

      const remainingContributors = expenseContributions.filter(c => {
        const cParticipantId = typeof c.participantId === 'object'
          ? (c.participantId as any)?._id
          : c.participantId
        return cParticipantId !== participantId
      })

      // If this is the last participant, just delete
      if (remainingContributors.length === 0) {
        const res = await fetch(
          `/api/contributions?expenseItemId=${expenseId}&participantId=${participantId}`,
          {
            method: 'DELETE',
            credentials: 'include',
          }
        )

        if (res.ok) {
          toast.success('Peserta berhasil dihapus dari iuran')
          fetchData()
        }
        return
      }

      // Calculate new split amount (rounded to nearest 100)
      const rawNewAmount = expense.total / (remainingContributors.length)
      const newSplitAmount = Math.round(rawNewAmount / 100) * 100

      // Delete the participant first
      const deleteRes = await fetch(
        `/api/contributions?expenseItemId=${expenseId}&participantId=${participantId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )

      if (!deleteRes.ok) {
        toast.error('Gagal menghapus peserta')
        return
      }

      // Update all remaining contributions with new amount
      const updatePromises = remainingContributors.map(c => 
        fetch('/api/contributions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            _id: c._id,
            amount: newSplitAmount,
          }),
        })
      )

      await Promise.all(updatePromises)

      const deletedParticipant = participants.find(p => p._id === participantId)
      toast.success(
        `✅ ${deletedParticipant?.name || 'Peserta'} dihapus. Iuran disesuaikan menjadi ${formatCurrency(newSplitAmount)}/orang untuk ${remainingContributors.length} peserta`,
        { duration: 5000 }
      )
      fetchData()
    } catch (error) {
      toast.error('Gagal menghapus iuran')
    }
  }

  const updateContributionAmount = async (expenseId: string, participantId: string, newAmount: number) => {
    if (newAmount <= 0) {
      toast.error('Nominal iuran harus lebih dari 0')
      return
    }

    try {
      // Find the contribution ID
      const contribution = contributions.find(c => {
        const cExpenseId = typeof c.expenseItemId === 'object' 
          ? (c.expenseItemId as any)?._id 
          : c.expenseItemId
        const cParticipantId = typeof c.participantId === 'object'
          ? (c.participantId as any)?._id
          : c.participantId
        return cExpenseId === expenseId && cParticipantId === participantId
      })

      if (!contribution || !contribution._id) {
        toast.error('Iuran tidak ditemukan')
        return
      }

      const res = await fetch('/api/contributions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          _id: contribution._id,
          amount: newAmount,
        }),
      })

      if (res.ok) {
        toast.success('Nominal iuran berhasil diupdate')
        setEditingContributionId(null)
        setEditingContributionAmount(0)
        fetchData()
      } else {
        const errorData = await res.json()
        toast.error(errorData.details || 'Gagal mengupdate nominal iuran')
      }
    } catch (error) {
      toast.error('Gagal mengupdate nominal iuran')
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
  const availableParticipants = participants.filter(
    p =>
      !contributions.some(
        c => c.expenseItemId === selectedExpenseId && c.participantId === p._id
      )
  )

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
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
                  Total Pengeluaran: <span className="font-bold text-primary-600 text-lg">
                    {formatCurrency(formData.price * formData.quantity)}
                  </span>
                </p>
              </div>

              {/* Collector Selection */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  👤 Siapa yang Mengumpulkan Uang? <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formCollector}
                  onChange={(e) => setFormCollector(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="">-- Pilih Collector --</option>
                  {participants.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Down Payment Percentage */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  💳 Down Payment (DP) - Opsional
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formDownPayment}
                    onChange={(e) => setFormDownPayment(Number(e.target.value))}
                    className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="0"
                  />
                  <span className="text-gray-700">%</span>
                  {formDownPayment > 0 && (
                    <div className="flex-1 bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-2">
                      <p className="text-sm text-yellow-800">
                        DP: <span className="font-bold">{formatCurrency((formData.price * formData.quantity) * formDownPayment / 100)}</span>
                        {' '} dari total {formatCurrency(formData.price * formData.quantity)}
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Jika ada DP, pembayaran iuran akan diprioritaskan untuk DP terlebih dahulu
                </p>
              </div>

              {/* Participants Selection for Contribution */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  👥 Pilih Peserta yang Iuran <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">{formParticipants.length} peserta dipilih</span>
                  <button
                    type="button"
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-xs font-medium border border-blue-200"
                    onClick={() => {
                      if (formParticipants.length === participants.length) {
                        setFormParticipants([])
                      } else {
                        setFormParticipants(participants.map(p => p._id))
                      }
                    }}
                  >
                    {formParticipants.length === participants.length ? 'Uncheck Semua' : 'Pilih Semua'}
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto bg-white p-4 rounded border-2 border-gray-200">
                  {participants.map(participant => (
                    <label
                      key={participant._id}
                      className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-all ${
                        formParticipants.includes(participant._id)
                          ? 'bg-primary-100 border border-primary-500'
                          : 'bg-gray-50 border border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formParticipants.includes(participant._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormParticipants([...formParticipants, participant._id])
                          } else {
                            setFormParticipants(
                              formParticipants.filter(id => id !== participant._id)
                            )
                          }
                        }}
                        className="w-4 h-4 rounded text-primary-600"
                      />
                      <span className="text-sm text-gray-700">{participant.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Auto-calculated Iuran Amount */}
              {formParticipants.length > 0 && (
                <div className="md:col-span-2">
                  <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      💰 Nominal Iuran per Orang <span className="text-green-600">(Otomatis)</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-xs text-gray-600">Total Pengeluaran</p>
                        <p className="font-bold text-lg text-gray-900">
                          {formatCurrency(formData.price * formData.quantity)}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-200 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-xl font-bold text-gray-600">÷</p>
                          <p className="text-sm text-gray-600">{formParticipants.length}</p>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded border-2 border-primary-500">
                        <p className="text-xs text-primary-700 font-semibold">Per Orang</p>
                        <p className="font-bold text-lg text-primary-600">
                          {formatCurrency(Math.round((formData.price * formData.quantity) / formParticipants.length / 100) * 100)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-3">
                      📌 Nominal ini otomatis dihitung dari total pengeluaran dibagi jumlah peserta (dibulatkan ke ratusan terdekat)
                    </p>
                  </div>
                </div>
              )}

              {/* Summary */}
              {formParticipants.length > 0 && formCollector && (
                <div className="md:col-span-2 bg-blue-50 border-2 border-blue-300 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-bold text-blue-900">✓ Ringkasan Siap Disimpan:</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-700">Peserta Iuran:</p>
                      <p className="font-bold text-blue-900">{formParticipants.length} orang</p>
                    </div>
                    <div>
                      <p className="text-blue-700">Nominal Per Orang:</p>
                      <p className="font-bold text-blue-900">
                        {formatCurrency(Math.round((formData.price * formData.quantity) / formParticipants.length / 100) * 100)}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-700">Total Iuran Terkumpul:</p>
                      <p className="font-bold text-blue-900">
                        {formatCurrency(formData.price * formData.quantity)}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-700">Diumpulkan oleh:</p>
                      <p className="font-bold text-blue-900">
                        {participants.find(p => p._id === formCollector)?.name || '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setFormData({ itemName: '', detail: '', price: 0, quantity: 1, total: 0 })
                  setFormParticipants([])
                  setFormSplitAmount(0)
                  setFormCollector('')
                  setFormDownPayment(0)
                }}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Simpan Pengeluaran & Iuran</span>
                )}
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
          <div className="space-y-4">
            {expenses.map((expense, index) => (
              <div
                key={expense._id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Desktop View */}
                <div className="hidden md:block">
                  <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer">
                    <div className="flex-1 flex items-center space-x-4">
                      <span className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded">
                        #{index + 1}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{expense.itemName}</h3>
                        {expense.detail && (
                          <p className="text-sm text-gray-600">{expense.detail}</p>
                        )}
                        {expense.collectorName && (
                          <p className="text-xs text-primary-600 font-medium mt-1">
                            💰 Diumpulkan oleh: {expense.collectorName}
                          </p>
                        )}
                        {expense.downPayment && expense.downPayment > 0 && (
                          <p className="text-xs text-yellow-700 font-semibold mt-1 bg-yellow-50 inline-block px-2 py-0.5 rounded">
                            💳 DP {expense.downPayment}% = {formatCurrency(expense.total * expense.downPayment / 100)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(expense.total)}</p>
                        <div className="text-xs text-gray-500 flex items-center justify-end gap-2">
                          <span className="pr-2 border-r border-gray-200">{formatCurrency(expense.price)}</span>
                          <span className="pl-2">× {expense.quantity}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => setEditingExpenseId(editingExpenseId === expense._id ? null : (expense._id ?? null))}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                          aria-label="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            setExpandedExpense(expandedExpense === expense._id ? null : (expense._id || ''))
                          }
                          className="ml-0 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
                        >
                          <Users className="w-4 h-4" />
                          <span>
                            {expense.contributorCount || 0} peserta
                          </span>
                          {expandedExpense === expense._id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteExpense(expense._id!)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Expanded Contributors Section - EDIT MODE */}
                  {expandedExpense === expense._id && (
                    <div className="border-t border-gray-200 bg-gray-50 p-6 space-y-4">
                      {/* Edit Participants Form */}
                      <div className="bg-white border-2 border-primary-200 rounded-lg p-4 space-y-4">
                        <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                          <Users className="w-5 h-5 text-primary-600" />
                          <span>Edit Peserta Iuran</span>
                        </h4>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pilih Peserta ({expense.contributors?.length || 0} terpilih dari {participants.length} total)
                          </label>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto bg-gray-50 p-3 rounded border border-gray-200">
                            {participants.map(participant => {
                              const isContributor = expense.contributors?.some(c => c.participantId === participant._id) || false
                              const wasInitiallySelected = isContributor
                              
                              return (
                                <label
                                  key={participant._id}
                                  className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-all ${
                                    selectedParticipants.includes(participant._id)
                                      ? 'bg-primary-100 border border-primary-500'
                                      : wasInitiallySelected
                                      ? 'bg-green-50 border border-green-300'
                                      : 'bg-white border border-gray-200 hover:border-primary-300'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedParticipants.includes(participant._id) || isContributor}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        if (!isContributor) {
                                          // Adding new participant
                                          setSelectedParticipants([...selectedParticipants, participant._id])
                                        }
                                      } else {
                                        if (isContributor) {
                                          // Removing existing participant - will be handled by removal
                                          if (confirm(`Hapus ${participant.name} dari iuran? Nominal akan disesuaikan untuk peserta lain.`)) {
                                            deleteContribution(expense._id!, participant._id)
                                          }
                                        } else {
                                          // Removing from selection
                                          setSelectedParticipants(selectedParticipants.filter(id => id !== participant._id))
                                        }
                                      }
                                    }}
                                    className="w-4 h-4 rounded text-primary-600"
                                  />
                                  <span className="text-sm text-gray-700">
                                    {participant.name}
                                    {isContributor && <span className="ml-1 text-xs text-green-600">✓</span>}
                                  </span>
                                </label>
                              )
                            })}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            ✓ = Sudah terdaftar dalam iuran ini
                          </p>
                        </div>

                        {selectedParticipants.length > 0 && (
                          <>
                            {/* Auto-distribute toggle */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={autoDistribute}
                                  onChange={(e) => setAutoDistribute(e.target.checked)}
                                  className="w-4 h-4 rounded text-primary-600"
                                />
                                <div className="flex-1">
                                  <span className="text-sm font-medium text-gray-900">
                                    🔄 Distribusi Otomatis
                                  </span>
                                  <p className="text-xs text-gray-600 mt-0.5">
                                    {autoDistribute 
                                      ? `Iuran akan dibagi merata ke semua peserta (${expense.contributors?.length || 0} existing + ${selectedParticipants.length} baru = ${(expense.contributors?.length || 0) + selectedParticipants.length} total)`
                                      : 'Gunakan nominal manual tanpa mengubah iuran peserta lain'}
                                  </p>
                                </div>
                              </label>
                            </div>

                            {/* Nominal input - show calculation based on auto-distribute */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {autoDistribute ? (
                                  <>Nominal per Orang <span className="text-green-600">(Otomatis)</span></>
                                ) : (
                                  <>Nominal Iuran per Orang <span className="text-red-500">*</span></>
                                )}
                              </label>
                              {autoDistribute ? (
                                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-xs text-green-700">Total Expense</p>
                                      <p className="font-bold text-lg text-green-900">{formatCurrency(expense.total)}</p>
                                    </div>
                                    <div className="text-2xl text-green-600">÷</div>
                                    <div>
                                      <p className="text-xs text-green-700">Total Peserta</p>
                                      <p className="font-bold text-lg text-green-900">
                                        {(expense.contributors?.length || 0) + selectedParticipants.length}
                                      </p>
                                    </div>
                                    <div className="text-2xl text-green-600">=</div>
                                    <div>
                                      <p className="text-xs text-green-700">Per Orang</p>
                                      <p className="font-bold text-lg text-green-900">
                                        {formatCurrency(
                                          Math.round((expense.total / ((expense.contributors?.length || 0) + selectedParticipants.length)) / 100) * 100
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  <p className="text-xs text-green-700 mt-2">
                                    ✅ Semua peserta (lama & baru) akan diupdate dengan nominal yang sama
                                  </p>
                                </div>
                              ) : (
                                <>
                                  <div className="relative">
                                    <span className="absolute left-4 top-3 text-gray-500 font-medium">
                                      Rp
                                    </span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={splitAmount}
                                      onChange={(e) => setSplitAmount(Number(e.target.value))}
                                      className="w-full pl-14 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                      placeholder="0"
                                    />
                                  </div>
                                  {selectedParticipants.length > 0 && splitAmount > 0 && (
                                    <p className="text-sm text-gray-600 mt-2">
                                      Total untuk {selectedParticipants.length} peserta baru: {formatCurrency(splitAmount * selectedParticipants.length)}
                                    </p>
                                  )}
                                </>
                              )}
                            </div>

                            <div className="flex justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedExpenseId('')
                                  setSelectedParticipants([])
                                  setSplitAmount(0)
                                }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                onClick={() => addParticipantsToExpense(expense._id)}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                              >
                                Tambah Peserta Baru
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Contributors List - Read Only Display */}
                      {expense.contributors && expense.contributors.length > 0 && (
                        <div className="bg-white rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-3">
                            Detail Iuran Per Peserta ({expense.contributors.length})
                          </h4>
                          <div className="space-y-2">
                            {expense.contributors.map((contributor, idx) => {
                              const contributionKey = `${expense._id}-${contributor.participantId}`
                              const isEditing = editingContributionId === contributionKey

                              return (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      {contributor.participantName}
                                    </p>
                                    {isEditing ? (
                                      <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs text-gray-600">Rp</span>
                                        <input
                                          type="number"
                                          min="0"
                                          value={editingContributionAmount}
                                          onChange={(e) => setEditingContributionAmount(Number(e.target.value))}
                                          className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                                          autoFocus
                                        />
                                        <button
                                          onClick={() => updateContributionAmount(expense._id!, contributor.participantId, editingContributionAmount)}
                                          className="px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700"
                                        >
                                          <Check className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            setEditingContributionId(null)
                                            setEditingContributionAmount(0)
                                          }}
                                          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-600">
                                        {formatCurrency(contributor.amount)}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {!isEditing && (
                                      <button
                                        onClick={() => {
                                          setEditingContributionId(contributionKey)
                                          setEditingContributionAmount(contributor.amount)
                                        }}
                                        className="p-1.5 text-primary-600 hover:bg-primary-50 rounded"
                                        title="Edit nominal"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() =>
                                        deleteContribution(
                                          expense._id!,
                                          contributor.participantId
                                        )
                                      }
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                      title="Hapus peserta"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Inline Edit Form for Desktop */}
                  {editingExpenseId === expense._id && (
                    <div className="border-t border-gray-200 bg-white p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">Nama Item</label>
                          <input
                            type="text"
                            value={editingExpenseData.itemName ?? expense.itemName}
                            onChange={(e) => setEditingExpenseData({ ...editingExpenseData, itemName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                          <label className="block text-sm font-medium text-gray-700 mt-2">Pengumpul</label>
                          <select
                            value={editingExpenseData.collectorId ?? expense.collectorId ?? ''}
                            onChange={(e) => setEditingExpenseData({ ...editingExpenseData, collectorId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            <option value="">-- Pilih Pengumpul --</option>
                            {participants.map(p => (
                              <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Total (Rp)</label>
                          <input
                            type="number"
                            value={(editingExpenseData.total ?? expense.total) as any}
                            onChange={(e) => setEditingExpenseData({ ...editingExpenseData, total: Number(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 mt-4">
                        <button
                          onClick={() => { setEditingExpenseId(null); setEditingExpenseData({}) }}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
                        >
                          Batal
                        </button>
                        <button
                          onClick={() => updateExpense(expense._id!)}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg"
                        >
                          Simpan
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile View */}
                <div className="md:hidden p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded inline-block mb-2">
                        #{index + 1}
                      </span>
                      <h3 className="font-semibold text-gray-900">{expense.itemName}</h3>
                      {expense.detail && (
                        <p className="text-sm text-gray-600">{expense.detail}</p>
                      )}
                      {expense.collectorName && (
                        <p className="text-xs text-primary-600 font-medium mt-1">
                          💰 Diumpulkan oleh: {expense.collectorName}
                        </p>
                      )}
                      {expense.downPayment && expense.downPayment > 0 && (
                        <p className="text-xs text-yellow-700 font-semibold mt-1 bg-yellow-50 inline-block px-2 py-0.5 rounded">
                          💳 DP {expense.downPayment}% = {formatCurrency(expense.total * expense.downPayment / 100)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingExpenseId(editingExpenseId === expense._id ? null : (expense._id ?? null))}
                        className="p-2 text-primary-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => deleteExpense(expense._id!)}
                        className="p-2 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded">
                    <div className="px-2">
                      <span className="text-gray-500 text-xs">Harga</span>
                      <p className="font-medium">{formatCurrency(expense.price)}</p>
                    </div>
                    <div className="px-2 text-center">
                      <span className="text-gray-500 text-xs">QTY</span>
                      <p className="font-medium">{expense.quantity}</p>
                    </div>
                  </div>

                  {/* Mobile Inline Edit */}
                  {editingExpenseId === expense._id && (
                    <div className="bg-white border-2 border-primary-300 rounded-lg p-4 space-y-4 mt-4">
                      <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                        <Edit2 className="w-5 h-5 text-primary-600" />
                        <span>Edit Pengeluaran</span>
                      </h4>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nama Item</label>
                        <input
                          type="text"
                          value={editingExpenseData.itemName ?? expense.itemName}
                          onChange={(e) => setEditingExpenseData({ ...editingExpenseData, itemName: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Detail</label>
                        <input
                          type="text"
                          value={editingExpenseData.detail ?? expense.detail ?? ''}
                          onChange={(e) => setEditingExpenseData({ ...editingExpenseData, detail: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                          placeholder="Contoh: Villa Patria Padma, +1 orang"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Harga</label>
                          <input
                            type="number"
                            min="0"
                            value={editingExpenseData.price ?? expense.price}
                            onChange={(e) => setEditingExpenseData({ ...editingExpenseData, price: Number(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={editingExpenseData.quantity ?? expense.quantity}
                            onChange={(e) => setEditingExpenseData({ ...editingExpenseData, quantity: Number(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                          />
                        </div>
                      </div>

                      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                        <p className="text-sm text-gray-700">
                          Total Pengeluaran: <span className="font-bold text-primary-600 text-lg">
                            {formatCurrency((editingExpenseData.price ?? expense.price) * (editingExpenseData.quantity ?? expense.quantity))}
                          </span>
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pengumpul</label>
                        <select
                          value={editingExpenseData.collectorId ?? expense.collectorId ?? ''}
                          onChange={(e) => setEditingExpenseData({ ...editingExpenseData, collectorId: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        >
                          <option value="">-- Pilih Pengumpul --</option>
                          {participants.map(p => (
                            <option key={p._id} value={p._id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          💳 Down Payment (DP) - Opsional
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editingExpenseData.downPayment ?? expense.downPayment ?? 0}
                            onChange={(e) => setEditingExpenseData({ ...editingExpenseData, downPayment: Number(e.target.value) })}
                            className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                            placeholder="0"
                          />
                          <span className="text-gray-700">%</span>
                          {(editingExpenseData.downPayment ?? expense.downPayment ?? 0) > 0 && (
                            <div className="flex-1 bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-2">
                              <p className="text-sm text-yellow-800">
                                DP: <span className="font-bold">{formatCurrency(((editingExpenseData.price ?? expense.price) * (editingExpenseData.quantity ?? expense.quantity)) * (editingExpenseData.downPayment ?? expense.downPayment ?? 0) / 100)}</span>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3 pt-2">
                        <button
                          type="button"
                          onClick={() => { setEditingExpenseId(null); setEditingExpenseData({}) }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => updateExpense(expense._id!)}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                          Simpan
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() =>
                      setExpandedExpense(expandedExpense === expense._id ? null : (expense._id || ''))
                    }
                    className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Users className="w-4 h-4" />
                    <span>{expense.contributorCount || 0} peserta</span>
                    {expandedExpense === expense._id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {expandedExpense === expense._id && (
                    <div className="border-t border-gray-200 pt-4 space-y-3">
                      {expense.contributors && expense.contributors.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <h4 className="font-semibold text-sm text-gray-900 mb-2">
                            Peserta Iuran ({expense.contributors.length})
                          </h4>
                          <div className="space-y-2">
                            {expense.contributors.map((contributor, idx) => {
                              const contributionKey = `${expense._id}-${contributor.participantId}`
                              const isEditing = editingContributionId === contributionKey

                              return (
                                <div key={idx} className="bg-white rounded p-2 space-y-2">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900">{contributor.participantName}</p>
                                      {isEditing ? (
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-xs text-gray-600">Rp</span>
                                          <input
                                            type="number"
                                            min="0"
                                            value={editingContributionAmount}
                                            onChange={(e) => setEditingContributionAmount(Number(e.target.value))}
                                            className="w-28 px-2 py-1 text-xs border border-gray-300 rounded"
                                            autoFocus
                                          />
                                        </div>
                                      ) : (
                                        <p className="text-xs text-gray-600 mt-1">
                                          {formatCurrency(contributor.amount)}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {isEditing ? (
                                        <>
                                          <button
                                            onClick={() => updateContributionAmount(expense._id!, contributor.participantId, editingContributionAmount)}
                                            className="p-1 text-xs bg-primary-600 text-white rounded"
                                          >
                                            <Check className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={() => {
                                              setEditingContributionId(null)
                                              setEditingContributionAmount(0)
                                            }}
                                            className="p-1 text-xs border border-gray-300 rounded"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button
                                            onClick={() => {
                                              setEditingContributionId(contributionKey)
                                              setEditingContributionAmount(contributor.amount)
                                            }}
                                            className="p-1 text-primary-600"
                                          >
                                            <Edit2 className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={() =>
                                              deleteContribution(
                                                expense._id!,
                                                contributor.participantId
                                              )
                                            }
                                            className="p-1 text-red-600"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Grand Total */}
            <div className="bg-primary-50 border-2 border-primary-200 rounded-lg p-4 font-bold">
              <div className="flex justify-between items-center">
                <span className="text-gray-900">TOTAL PENGELUARAN</span>
                <span className="text-lg text-primary-600">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
