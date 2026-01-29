'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Wallet, Search, DollarSign, LayoutGrid, List, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import ExpenseCard from './ExpenseCard'
import ExpenseModal from './ExpenseModal'
import ContributionsTab from './ContributionsTab'
import { useLanguage } from '@/context/LanguageContext'

interface ExpensesTabProps {
  planId: string
  isCompleted?: boolean
}

export default function ExpensesTab({ planId, isCompleted }: ExpensesTabProps) {
  const { t, language } = useLanguage() // Changed destructuring order
  const { data: session } = useSession() // Added useSession hook
  const [expenses, setExpenses] = useState<any[]>([])
  const [participants, setParticipants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false) // Kept original state name
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isCategorizing, setIsCategorizing] = useState(false)

  useEffect(() => {
    fetchData()
  }, [planId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [expensesRes, participantsRes, contributionsRes] = await Promise.all([
        fetch(`/api/expenses?planId=${planId}`),
        fetch(`/api/participants?planId=${planId}`),
        fetch(`/api/contributions?planId=${planId}`)
      ])

      if (expensesRes.ok && participantsRes.ok && contributionsRes.ok) {
        const expensesData = await expensesRes.json()
        const participantsData = await participantsRes.json()
        const contributionsData = await contributionsRes.json()

        const enrichedExpenses = expensesData.map((exp: any) => {
          const collector = participantsData.find((p: any) => p._id === (exp.collectorId?._id || exp.collectorId))
          const expContribs = contributionsData.filter((c: any) => {
            const cExpId = c.expenseItemId?._id || c.expenseItemId
            return cExpId === exp._id
          }).map((c: any) => {
            const pId = c.participantId?._id || c.participantId
            const pName = participantsData.find((p: any) => p._id === pId)?.name || 'Unknown'
            return { ...c, participantName: pName }
          })

          return {
            ...exp,
            collectorName: collector?.name || 'Unknown',
            contributors: expContribs,
            contributorCount: expContribs.length
          }
        })
        setExpenses(enrichedExpenses)
        setParticipants(participantsData)
      } else {
        toast.error(t.dashboard.loading_data)
      }
    } catch (error) { toast.error(t.common.loading); } finally { setLoading(false); }
  }

  const handleCreateNew = () => { setEditingExpense(null); setShowModal(true); }
  const handleEdit = (expense: any) => { setEditingExpense(expense); setShowModal(true); }

  const handleDelete = async (id: string) => {
    if (!confirm(t.common.confirm_delete)) return
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(`${t.plan.finance} ${t.plan.delete_success}`)
        fetchData()
      } else { toast.error('Failed to delete expense'); }
    } catch (error) { toast.error(t.common.loading); }
  }

  const handleAutoCategorize = async () => {
    setIsCategorizing(true)
    try {
      const res = await fetch('/api/ai/expenses/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, lang: language })
      })
      if (res.ok) {
        toast.success(t.common.success)
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || 'AI Failed')
      }
    } catch {
      toast.error(t.common.failed)
    } finally {
      setIsCategorizing(false)
    }
  }

  const filteredExpenses = expenses.filter(exp =>
    exp.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.detail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.collectorName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const grandTotal = expenses.reduce((sum, exp) => sum + exp.total, 0)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }

  if (loading) {
    return <div className="flex justify-center items-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
  }

  return (
    <div className="space-y-8 pb-16 font-bold">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary-50">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{t.plan.finance}</h2>
            <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">{language === 'id' ? 'MANAJEMEN KEUANGAN' : 'FINANCIAL MANAGEMENT'}</p>
          </div>
        </div>

        <div className="flex items-stretch gap-3">
          <div className="px-4 py-2 bg-primary-50 rounded-xl border border-primary-100 flex flex-col justify-center items-end">
            <span className="text-[7px] font-black uppercase text-primary-400 mb-0.5 tracking-widest leading-none">{language === 'id' ? 'TOTAL EST.' : 'TOTAL EST.'}</span>
            <span className="text-base font-black text-primary-600 leading-none">{formatCurrency(grandTotal)}</span>
          </div>
          {!isCompleted && (
            <div className="flex gap-2">
              <button
                disabled={isCategorizing}
                onClick={handleAutoCategorize}
                className="px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 group disabled:opacity-50"
              >
                {isCategorizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{t.plan.auto_categorize}</span>
              </button>
              <button onClick={handleCreateNew} className="px-5 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-50 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 group">
                <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
                <span>{t.common.add}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-primary-600 transition-colors" />
          <input type="text" placeholder={language === 'id' ? 'Cari pengeluaran...' : 'Search expenses...'} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-11 pr-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-primary-50 focus:border-primary-500 outline-none transition-all font-bold placeholder:text-gray-300 text-sm" />
        </div>
        <div className="hidden sm:flex p-1 bg-gray-50 rounded-xl border border-gray-100">
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid className="w-4 h-4" /></button>
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><List className="w-4 h-4" /></button>
        </div>
      </div>

      {filteredExpenses.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
          <DollarSign className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-black uppercase text-[9px] tracking-widest">{language === 'id' ? 'Belum ada catatan biaya' : 'No expenses recorded'}</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-3"}>
          {filteredExpenses.map((exp) => (
            <ExpenseCard key={exp._id} expense={exp} onEdit={handleEdit} onDelete={handleDelete} readOnly={isCompleted} t={t} language={language} />
          ))}
        </div>
      )}

      <div className="relative py-8">
        <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t-2 border-dashed border-gray-100"></div></div>
        <div className="relative flex justify-center"><span className="bg-white px-6"><div className="w-12 h-1 bg-primary-600 rounded-full shadow-lg shadow-primary-50"></div></span></div>
      </div>

      <ContributionsTab planId={planId} readOnly={isCompleted} />

      {showModal && (
        <ExpenseModal isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); fetchData(); }} planId={planId} participants={participants} editData={editingExpense} />
      )}
    </div>
  )
}
