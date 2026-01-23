'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trash2, RotateCcw, AlertTriangle, Clock, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import ConfirmModal from '@/components/ConfirmModal'

interface TrashedPlan {
    _id: string
    title: string
    destination: string
    startDate: string
    endDate: string
    deletedAt: string
    trashExpiresAt: string
    remainingMs: number
    remainingFormatted: string
    ownerId?: { username: string; name: string }
}

interface ConfirmState {
    type: 'restore' | 'delete' | null
    planId: string
    planTitle: string
}

export default function TrashPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [trashedPlans, setTrashedPlans] = useState<TrashedPlan[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [confirmState, setConfirmState] = useState<ConfirmState>({
        type: null,
        planId: '',
        planTitle: '',
    })

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        } else if (status === 'authenticated') {
            fetchTrash()
        }
    }, [status, router])

    // Auto-refresh every 10 seconds to update countdown
    useEffect(() => {
        const interval = setInterval(() => {
            fetchTrash()
        }, 10000)
        return () => clearInterval(interval)
    }, [])

    const fetchTrash = async () => {
        try {
            const res = await fetch('/api/trash')
            if (res.ok) {
                const data = await res.json()
                setTrashedPlans(data)
            }
        } catch (error) {
            console.error('Error fetching trash:', error)
        } finally {
            setLoading(false)
        }
    }

    const openConfirm = (type: 'restore' | 'delete', planId: string, planTitle: string) => {
        setConfirmState({ type, planId, planTitle })
    }

    const closeConfirm = () => {
        setConfirmState({ type: null, planId: '', planTitle: '' })
    }

    const handleConfirm = async () => {
        if (confirmState.type === 'restore') {
            await restorePlan()
        } else if (confirmState.type === 'delete') {
            await permanentDelete()
        }
    }

    const restorePlan = async () => {
        const { planId, planTitle } = confirmState
        setActionLoading(planId)
        try {
            const res = await fetch('/api/trash', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId }),
            })

            if (res.ok) {
                toast.success(`"${planTitle}" berhasil di-restore!`)
                fetchTrash()
                closeConfirm()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Gagal me-restore plan')
            }
        } catch (error) {
            toast.error('Terjadi kesalahan')
        } finally {
            setActionLoading(null)
        }
    }

    const permanentDelete = async () => {
        const { planId, planTitle } = confirmState
        setActionLoading(planId)
        try {
            const res = await fetch(`/api/trash?planId=${planId}`, {
                method: 'DELETE',
            })

            if (res.ok) {
                toast.success(`"${planTitle}" berhasil dihapus permanen`)
                fetchTrash()
                closeConfirm()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Gagal menghapus plan')
            }
        } catch (error) {
            toast.error('Terjadi kesalahan')
        } finally {
            setActionLoading(null)
        }
    }

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto" />
                    <p className="mt-4 text-gray-600">Memuat trash...</p>
                </div>
            </div>
        )
    }

    return (
        <>
            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmState.type !== null}
                onClose={closeConfirm}
                onConfirm={handleConfirm}
                title={confirmState.type === 'restore' ? 'Restore Plan?' : 'Hapus Permanen?'}
                message={
                    confirmState.type === 'restore'
                        ? `"${confirmState.planTitle}" akan dikembalikan ke dashboard.`
                        : `"${confirmState.planTitle}" akan dihapus PERMANEN.\n\nSemua data termasuk peserta, pengeluaran, dan iuran akan dihapus. Aksi ini tidak dapat dibatalkan!`
                }
                confirmText={confirmState.type === 'restore' ? 'Ya, Restore' : 'Ya, Hapus Permanen'}
                cancelText="Batal"
                variant={confirmState.type === 'restore' ? 'info' : 'danger'}
                loading={actionLoading === confirmState.planId}
            />

            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Kembali ke Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Trash2 className="w-8 h-8 text-red-500" />
                            Trash
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Plan yang dihapus akan tersimpan di sini selama 1 menit sebelum dihapus permanen.
                        </p>
                    </div>

                    {/* Trash List */}
                    {trashedPlans.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                            <Trash2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Trash kosong
                            </h3>
                            <p className="text-gray-500">
                                Tidak ada plan yang dihapus saat ini.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {trashedPlans.map((plan) => (
                                <div
                                    key={plan._id}
                                    className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                {plan.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 mb-2">
                                                📍 {plan.destination}
                                            </p>
                                            <div className="flex items-center gap-4 text-sm flex-wrap">
                                                <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                                    <Clock className="w-4 h-4" />
                                                    {plan.remainingFormatted}
                                                </span>
                                                <span className="text-gray-400">
                                                    Dihapus: {new Date(plan.deletedAt).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Restore Button */}
                                            <button
                                                onClick={() => openConfirm('restore', plan._id, plan.title)}
                                                disabled={actionLoading === plan._id}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {actionLoading === plan._id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <RotateCcw className="w-4 h-4" />
                                                )}
                                                <span className="hidden sm:inline">Restore</span>
                                            </button>

                                            {/* Permanent Delete Button */}
                                            <button
                                                onClick={() => openConfirm('delete', plan._id, plan.title)}
                                                disabled={actionLoading === plan._id}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                <span className="hidden sm:inline">Hapus</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Warning */}
                    <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800">
                            <strong>Perhatian:</strong> Plan yang sudah melewati batas waktu akan dihapus secara otomatis
                            beserta semua data terkait (peserta, pengeluaran, iuran, dll).
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
