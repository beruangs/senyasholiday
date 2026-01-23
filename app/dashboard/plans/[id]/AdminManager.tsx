'use client'

import { useState, useEffect } from 'react'
import { UserPlus, X, Crown, User, Check, Loader2, AtSign, Trash2, Clock, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import ConfirmModal from '@/components/ConfirmModal'

interface Admin {
    _id: string
    username: string
    name: string
    status?: 'confirmed' | 'pending'
}

interface AdminManagerProps {
    planId: string
    isOwner: boolean
    isSenPlan?: boolean
    userRole?: string
}

export default function AdminManager({ planId, isOwner, isSenPlan, userRole }: AdminManagerProps) {
    const [owner, setOwner] = useState<Admin | null>(null)
    const [admins, setAdmins] = useState<Admin[]>([])
    const [pendingAdmins, setPendingAdmins] = useState<Admin[]>([])
    const [loading, setLoading] = useState(true)

    // Add admin form
    const [showAddForm, setShowAddForm] = useState(false)
    const [usernameInput, setUsernameInput] = useState('')
    const [checking, setChecking] = useState(false)
    const [userFound, setUserFound] = useState<Admin | null>(null)
    const [checkError, setCheckError] = useState('')
    const [adding, setAdding] = useState(false)

    // Remove confirmation modal
    const [removeConfirm, setRemoveConfirm] = useState<{
        isOpen: boolean
        adminId: string
        adminName: string
        type: 'admin' | 'pending'
    }>({ isOpen: false, adminId: '', adminName: '', type: 'admin' })
    const [removing, setRemoving] = useState(false)

    const canManage = isOwner || (isSenPlan && userRole === 'superadmin')

    useEffect(() => {
        fetchAdmins()
    }, [planId])

    const fetchAdmins = async () => {
        try {
            const res = await fetch(`/api/plans/${planId}/admins`)
            if (res.ok) {
                const data = await res.json()
                setOwner(data.owner)
                setAdmins(data.admins || [])
                setPendingAdmins(data.pendingAdmins || [])
            }
        } catch {
            toast.error('Gagal memuat data admin')
        } finally {
            setLoading(false)
        }
    }

    // Check username with debounce
    useEffect(() => {
        const cleanUsername = usernameInput.trim().toLowerCase().replace(/^@/, '')

        if (cleanUsername.length < 3) {
            setUserFound(null)
            setCheckError('')
            return
        }

        setChecking(true)
        setCheckError('')
        setUserFound(null)

        const timeout = setTimeout(async () => {
            try {
                const res = await fetch(`/api/plans/admin-invite?username=${cleanUsername}`)
                const data = await res.json()

                if (data.exists) {
                    if (data.error) {
                        setCheckError(data.error)
                        setUserFound(null)
                    }
                    // Check if already owner
                    else if (owner && data.user.username === owner.username) {
                        setCheckError('Ini adalah owner plan ini')
                        setUserFound(null)
                    }
                    // Check if already admin
                    else if (admins.some(a => a.username === data.user.username)) {
                        setCheckError('User ini sudah menjadi editor')
                        setUserFound(null)
                    }
                    // Check if already pending
                    else if (pendingAdmins.some(a => a.username === data.user.username)) {
                        setCheckError('Undangan sudah dikirim, menunggu konfirmasi')
                        setUserFound(null)
                    }
                    else {
                        setUserFound(data.user)
                    }
                } else {
                    setCheckError('User tidak ditemukan')
                }
            } catch {
                setCheckError('Gagal memeriksa username')
            } finally {
                setChecking(false)
            }
        }, 500)

        return () => clearTimeout(timeout)
    }, [usernameInput, owner, admins, pendingAdmins])

    const handleAddAdmin = async () => {
        if (!userFound) return

        setAdding(true)
        try {
            const res = await fetch('/api/plans/admin-invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId, username: userFound.username }),
            })

            const data = await res.json()

            if (res.ok) {
                toast.success(`Undangan dikirim ke ${userFound.name}!`)
                setUsernameInput('')
                setUserFound(null)
                setShowAddForm(false)
                fetchAdmins()
            } else {
                toast.error(data.error || 'Gagal mengirim undangan')
            }
        } catch {
            toast.error('Terjadi kesalahan')
        } finally {
            setAdding(false)
        }
    }

    const openRemoveConfirm = (adminId: string, adminName: string, type: 'admin' | 'pending') => {
        setRemoveConfirm({ isOpen: true, adminId, adminName, type })
    }

    const handleRemoveAdmin = async () => {
        const { adminId, adminName, type } = removeConfirm
        setRemoving(true)

        try {
            const res = await fetch(
                `/api/plans/admin-invite?planId=${planId}&userId=${adminId}&type=${type}`,
                { method: 'DELETE' }
            )

            if (res.ok) {
                toast.success(type === 'pending'
                    ? `Undangan ke ${adminName} dibatalkan`
                    : `${adminName} dihapus dari editor`
                )
                fetchAdmins()
                setRemoveConfirm({ isOpen: false, adminId: '', adminName: '', type: 'admin' })
            } else {
                toast.error('Gagal menghapus')
            }
        } catch {
            toast.error('Terjadi kesalahan')
        } finally {
            setRemoving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            </div>
        )
    }

    return (
        <>
            <ConfirmModal
                isOpen={removeConfirm.isOpen}
                onClose={() => setRemoveConfirm({ isOpen: false, adminId: '', adminName: '', type: 'admin' })}
                onConfirm={handleRemoveAdmin}
                title={removeConfirm.type === 'pending' ? 'Batalkan Undangan?' : 'Hapus Editor?'}
                message={removeConfirm.type === 'pending'
                    ? `Batalkan undangan untuk "${removeConfirm.adminName}"?`
                    : `Hapus "${removeConfirm.adminName}" dari daftar editor?\n\nMereka tidak akan bisa lagi mengedit plan ini.`
                }
                confirmText={removeConfirm.type === 'pending' ? 'Ya, Batalkan' : 'Ya, Hapus'}
                cancelText="Batal"
                variant="danger"
                loading={removing}
            />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Pengelola Plan</h3>
                    {canManage && !showAddForm && (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                        >
                            <UserPlus className="w-4 h-4" />
                            Undang Editor
                        </button>
                    )}
                </div>

                {/* Add Admin Form */}
                {showAddForm && canManage && (
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">Undang Editor Baru</h4>
                            <button
                                onClick={() => {
                                    setShowAddForm(false)
                                    setUsernameInput('')
                                    setUserFound(null)
                                    setCheckError('')
                                }}
                                className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Username
                                </label>
                                <div className="relative">
                                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={usernameInput}
                                        onChange={(e) => setUsernameInput(e.target.value.toLowerCase())}
                                        placeholder="username_teman"
                                        className={`w-full pl-10 pr-12 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 transition-colors ${userFound ? 'border-green-500' :
                                                checkError ? 'border-red-500' :
                                                    'border-gray-300'
                                            }`}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {checking && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                                        {!checking && userFound && <Check className="w-4 h-4 text-green-500" />}
                                        {!checking && checkError && <X className="w-4 h-4 text-red-500" />}
                                    </div>
                                </div>
                            </div>

                            {/* User Found Preview */}
                            {userFound && (
                                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold">
                                            {userFound.name[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{userFound.name}</p>
                                            <p className="text-sm text-gray-500">@{userFound.username}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleAddAdmin}
                                        disabled={adding}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                                    >
                                        {adding ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <UserPlus className="w-4 h-4" />
                                        )}
                                        Kirim Undangan
                                    </button>
                                </div>
                            )}

                            {/* Error */}
                            {checkError && !checking && (
                                <p className="text-sm text-red-600">{checkError}</p>
                            )}

                            <p className="text-xs text-gray-500">
                                User yang diundang akan mendapat notifikasi dan bisa menerima atau menolak undangan.
                            </p>
                        </div>
                    </div>
                )}

                {/* Owner Card */}
                {owner && (
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {owner.name[0].toUpperCase()}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{owner.name}</p>
                                <p className="text-sm text-gray-500">@{owner.username}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                            <Crown className="w-4 h-4" />
                            Owner
                        </div>
                    </div>
                )}

                {/* SEN Plan Info */}
                {isSenPlan && !owner && (
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-50 to-pink-50 border border-primary-200 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                S
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">SEN Yas Daddy</p>
                                <p className="text-sm text-gray-500">Plan Komunitas</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                            <Crown className="w-4 h-4" />
                            Superadmin
                        </div>
                    </div>
                )}

                {/* Pending Invitations */}
                {pendingAdmins.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-500" />
                            Menunggu Konfirmasi ({pendingAdmins.length})
                        </h4>
                        {pendingAdmins.map((admin) => (
                            <div
                                key={admin._id}
                                className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-amber-300 to-amber-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                        {admin.name[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{admin.name}</p>
                                        <p className="text-sm text-gray-500">@{admin.username}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                                        <Clock className="w-4 h-4" />
                                        Pending
                                    </div>
                                    {canManage && (
                                        <button
                                            onClick={() => openRemoveConfirm(admin._id, admin.name, 'pending')}
                                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                            title="Batalkan undangan"
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Confirmed Admins List */}
                {admins.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-700">Editor ({admins.length})</h4>
                        {admins.map((admin) => (
                            <div
                                key={admin._id}
                                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                        {admin.name[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{admin.name}</p>
                                        <p className="text-sm text-gray-500">@{admin.username}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                        <Check className="w-4 h-4" />
                                        Editor
                                    </div>
                                    {canManage && (
                                        <button
                                            onClick={() => openRemoveConfirm(admin._id, admin.name, 'admin')}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Hapus editor"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {admins.length === 0 && pendingAdmins.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Belum ada editor lain</p>
                        {canManage && (
                            <p className="text-sm mt-1">Undang teman untuk mengelola plan bersama</p>
                        )}
                    </div>
                )}
            </div>
        </>
    )
}
