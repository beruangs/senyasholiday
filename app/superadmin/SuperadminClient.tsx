'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Shield, Crown, User as UserIcon, Trash2, ChevronDown, Search, AtSign, Loader2, Calendar, CheckCircle, MapPin, Edit, Megaphone, Bell, X as XIcon, Star } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import ConfirmModal from '@/components/ConfirmModal'

interface User {
    _id: string
    username: string
    name: string
    role: 'user' | 'sen_user' | 'superadmin'
    createdAt: string
    lastLoginAt?: string
}

interface Notification {
    _id: string
    type: string
    title: string
    message: string
    read: boolean
    responded: boolean
    plan?: {
        _id: string
        title: string
        destination: string
    }
    fromUser?: {
        _id: string
        username: string
        name: string
    }
    createdAt: string
}

const roleLabels = {
    user: 'User',
    sen_user: 'SEN User',
    superadmin: 'Superadmin',
}

const roleColors = {
    user: 'bg-gray-100 text-gray-700',
    sen_user: 'bg-primary-100 text-primary-700',
    superadmin: 'bg-amber-100 text-amber-700',
}

const roleIcons = {
    user: UserIcon,
    sen_user: Users,
    superadmin: Crown,
}

export default function SuperadminClient({ session }: any) {
    const [activeTab, setActiveTab] = useState<'users' | 'plans' | 'notifications' | 'broadcast'>('users')
    const [users, setUsers] = useState<User[]>([])
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [notifLoading, setNotifLoading] = useState(true)
    const [plans, setPlans] = useState<any[]>([])
    const [plansLoading, setPlansLoading] = useState(true)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [editingRole, setEditingRole] = useState<string | null>(null)
    const [updatingRole, setUpdatingRole] = useState(false)
    const [deleteUserConfirm, setDeleteUserConfirm] = useState({
        isOpen: false,
        userId: '',
        username: ''
    })
    const [deletingUser, setDeletingUser] = useState(false)

    // Broadcast State
    const [broadcastData, setBroadcastData] = useState({
        title: '',
        message: '',
        targetRoles: ['user'] as string[]
    })
    const [sendingBroadcast, setSendingBroadcast] = useState(false)

    useEffect(() => {
        fetchUsers()
        fetchNotifications()
        fetchPlans()
    }, [])

    const fetchPlans = async () => {
        try {
            const res = await fetch('/api/plans')
            if (res.ok) {
                const data = await res.json()
                setPlans(data)
            }
        } catch {
            console.error('Failed to fetch plans')
        } finally {
            setPlansLoading(false)
        }
    }

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users')
            if (res.ok) {
                const data = await res.json()
                setUsers(data)
            } else {
                toast.error('Gagal memuat data users')
            }
        } catch {
            toast.error('Terjadi kesalahan')
        } finally {
            setLoading(false)
        }
    }

    const fetchNotifications = async () => {
        setNotifLoading(true)
        try {
            const res = await fetch('/api/notifications')
            if (res.ok) {
                const data = await res.json()
                setNotifications(data)
            }
        } catch {
            console.error('Failed to fetch notifications')
        } finally {
            setNotifLoading(false)
        }
    }

    const updateRole = async (userId: string, newRole: string) => {
        setUpdatingRole(true)
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            })

            if (res.ok) {
                toast.success('Role berhasil diupdate')
                fetchUsers()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Gagal update role')
            }
        } catch {
            toast.error('Terjadi kesalahan')
        } finally {
            setUpdatingRole(false)
            setEditingRole(null)
        }
    }

    const openDeleteUserConfirm = (userId: string, username: string) => {
        setDeleteUserConfirm({
            isOpen: true,
            userId,
            username,
        })
    }

    const closeDeleteUserConfirm = () => {
        if (deletingUser) return
        setDeleteUserConfirm({
            isOpen: false,
            userId: '',
            username: '',
        })
    }

    const handleDeleteUser = async () => {
        const { userId, username } = deleteUserConfirm
        setDeletingUser(true)
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
            })

            if (res.ok) {
                toast.success(`User @${username} berhasil dihapus`)
                fetchUsers()
                closeDeleteUserConfirm()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Gagal menghapus user')
            }
        } catch {
            toast.error('Terjadi kesalahan')
        } finally {
            setDeletingUser(false)
        }
    }

    const handleNotificationResponse = async (notificationId: string, action: 'accept' | 'reject') => {
        try {
            const res = await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId, action }),
            })

            if (res.ok) {
                toast.success(action === 'accept' ? 'Undangan diterima' : 'Undangan ditolak')
                fetchNotifications()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Gagal merespons undangan')
            }
        } catch {
            toast.error('Terjadi kesalahan')
        }
    }

    const dismissNotification = async (notificationId: string) => {
        try {
            const res = await fetch(`/api/notifications?id=${notificationId}`, {
                method: 'DELETE',
            })

            if (res.ok) {
                fetchNotifications()
            }
        } catch {
            console.error('Failed to dismiss notification')
        }
    }

    const handleBroadcastSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (broadcastData.targetRoles.length === 0) {
            toast.error('Pilih minimal satu role target')
            return
        }

        setSendingBroadcast(true)
        try {
            const res = await fetch('/api/admin/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(broadcastData),
            })

            if (res.ok) {
                const data = await res.json()
                toast.success(data.message)
                setBroadcastData({ title: '', message: '', targetRoles: ['user'] })
            } else {
                const data = await res.json()
                toast.error(data.error || 'Gagal mengirim broadcast')
            }
        } catch {
            toast.error('Terjadi kesalahan')
        } finally {
            setSendingBroadcast(false)
        }
    }

    const toggleRole = (role: string) => {
        if (broadcastData.targetRoles.includes(role)) {
            setBroadcastData(prev => ({
                ...prev,
                targetRoles: prev.targetRoles.filter(r => r !== role)
            }))
        } else {
            setBroadcastData(prev => ({
                ...prev,
                targetRoles: [...prev.targetRoles, role]
            }))
        }
    }

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const stats = {
        total: users.length,
        users: users.filter(u => u.role === 'user').length,
        senUsers: users.filter(u => u.role === 'sen_user').length,
        superadmins: users.filter(u => u.role === 'superadmin').length,
    }

    const tabs = [
        { id: 'users', label: 'Users', icon: Users },
        { id: 'plans', label: 'Semua Plan', icon: Calendar },
        { id: 'notifications', label: 'Notifikasi', icon: Bell, count: notifications.length },
        { id: 'broadcast', label: 'Broadcast', icon: Megaphone },
    ]

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ConfirmModal
                isOpen={deleteUserConfirm.isOpen}
                onClose={closeDeleteUserConfirm}
                onConfirm={handleDeleteUser}
                title="Hapus Akun User?"
                message={`Yakin ingin menghapus akun @${deleteUserConfirm.username}?\n\nSemua data terkait user ini akan hilang dari sistem. Aksi ini tidak dapat dibatalkan.`}
                confirmText="Ya, Hapus Akun"
                cancelText="Batal"
                variant="danger"
                loading={deletingUser}
            />

            {/* Header section... */}
            <div className="mb-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <Shield className="w-6 h-6 text-amber-600" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900">Admin Central</h1>
                        </div>
                        <p className="text-gray-600">Pusat kendali dan manajemen sistem SEN YAS DADDY</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: 'Total', value: stats.total, color: 'bg-blue-50 text-blue-600', icon: Users },
                            { label: 'Users', value: stats.users, color: 'bg-gray-50 text-gray-600', icon: UserIcon },
                            { label: 'SEN', value: stats.senUsers, color: 'bg-primary-50 text-primary-600', icon: Star },
                            { label: 'Admins', value: stats.superadmins, color: 'bg-amber-50 text-amber-600', icon: Crown },
                        ].map((s) => (
                            <div key={s.label} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${s.color}`}>
                                    <s.icon className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider leading-none mb-1">{s.label}</p>
                                    <p className="text-lg font-bold text-gray-900 leading-none">{s.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl mb-8 w-fit overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${isActive
                                    ? 'bg-white text-primary-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                                {tab.count !== undefined && tab.count > 0 && (
                                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-primary-100 text-primary-600' : 'bg-gray-200 text-gray-600'
                                        }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Tab Contents */}
            {activeTab === 'users' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari username atau nama..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="py-20 text-center">
                                <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-500">Tidak ada user ditemukan</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4">User</th>
                                            <th className="px-6 py-4">Role</th>
                                            <th className="px-6 py-4">Bergabung</th>
                                            <th className="px-6 py-4">Login Terakhir</th>
                                            <th className="px-6 py-4 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredUsers.map((user) => {
                                            const RoleIcon = roleIcons[user.role]
                                            const isCurrentUser = String(user._id) === String(session?.user?.id)
                                            return (
                                                <tr key={user._id} className={`hover:bg-gray-50 transition-colors ${isCurrentUser ? 'bg-amber-50/30' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                                                                {user.name[0].toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                                                                    {user.name}
                                                                    {isCurrentUser && <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded-full uppercase">Anda</span>}
                                                                </p>
                                                                <p className="text-gray-500 flex items-center gap-1">
                                                                    <AtSign className="w-3 h-3" />{user.username}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {editingRole === user._id ? (
                                                            <select
                                                                autoFocus
                                                                defaultValue={user.role}
                                                                onBlur={() => setEditingRole(null)}
                                                                onChange={(e) => updateRole(user._id, e.target.value)}
                                                                className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs"
                                                            >
                                                                <option value="user">User</option>
                                                                <option value="sen_user">SEN User</option>
                                                                <option value="superadmin">Superadmin</option>
                                                            </select>
                                                        ) : (
                                                            <button
                                                                onClick={() => !isCurrentUser && setEditingRole(user._id)}
                                                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${roleColors[user.role]}`}
                                                            >
                                                                <RoleIcon className="w-3 h-3" />
                                                                {roleLabels[user.role]}
                                                                {!isCurrentUser && <ChevronDown className="w-3 h-3 opacity-50" />}
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600">
                                                        {format(new Date(user.createdAt), 'd MMM yyyy', { locale: id })}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600">
                                                        {user.lastLoginAt ? format(new Date(user.lastLoginAt), 'd MMM, HH:mm', { locale: id }) : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            disabled={isCurrentUser}
                                                            onClick={() => openDeleteUserConfirm(user._id, user.username)}
                                                            className={`p-2 rounded-lg transition-colors ${isCurrentUser ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:bg-red-50 hover:text-red-500'}`}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Role Explanation */}
                    <div className="mt-8 bg-blue-50/50 border border-blue-100 rounded-3xl p-6">
                        <h3 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
                            <Shield className="w-4 h-4" /> Detail Role & Hak Akses
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: 'User', desc: 'Hanya bisa melihat dan mengelola rencana liburan miliknya sendiri.', icon: UserIcon, color: 'text-gray-600' },
                                { label: 'SEN User', desc: 'Dapat melihat dan membantu mengelola semua rencana liburan SEN Yas Daddy.', icon: Star, color: 'text-primary-600' },
                                { label: 'Superadmin', desc: 'Akses penuh ke seluruh sistem, termasuk manajemen user dan semua rencana liburan.', icon: Crown, color: 'text-amber-600' },
                            ].map((role) => (
                                <div key={role.label} className="flex gap-3">
                                    <div className={`p-2 bg-white rounded-xl shadow-sm h-fit ${role.color}`}>
                                        <role.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm mb-1">{role.label}</p>
                                        <p className="text-xs text-gray-600 leading-relaxed">{role.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'plans' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {plansLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                            </div>
                        ) : plans.length === 0 ? (
                            <div className="py-20 text-center">
                                <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-500">Belum ada rencana liburan</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4">Holiday Plan</th>
                                            <th className="px-6 py-4">Kategori</th>
                                            <th className="px-6 py-4">Durasi</th>
                                            <th className="px-6 py-4">Owner</th>
                                            <th className="px-6 py-4 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {plans.map((p) => (
                                            <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-gray-900">{p.title}</p>
                                                    <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{p.destination}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${p.isSenPlan ? 'bg-primary-100 text-primary-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {p.isSenPlan ? 'SEN' : 'Individu'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {format(new Date(p.startDate), 'd MMM', { locale: id })} - {format(new Date(p.endDate), 'd MMM yyyy', { locale: id })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {p.ownerId ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold">
                                                                {p.ownerId.name[0].toUpperCase()}
                                                            </div>
                                                            <span className="text-gray-700">@{p.ownerId.username}</span>
                                                        </div>
                                                    ) : <span className="text-gray-400 italic">No Owner</span>}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <Link href={`/dashboard/plans/${p._id}`} className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-primary-600 hover:text-white transition-all">
                                                        <Edit className="w-3 h-3" /> Kelola
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'notifications' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Push Notifications</h2>
                        <button onClick={fetchNotifications} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <Loader2 className={`w-5 h-5 text-gray-500 ${notifLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {notifLoading ? (
                            <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary-600" /></div>
                        ) : notifications.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
                                <Bell className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-500">Log notifikasi kosong</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div key={n._id} className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-primary-200 transition-all">
                                    <button
                                        onClick={() => dismissNotification(n._id)}
                                        className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm bg-white"
                                    >
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                    <div className="flex gap-4">
                                        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${n.type === 'admin_invite' ? 'bg-amber-100 text-amber-600' : 'bg-primary-100 text-primary-600'}`}>
                                            <Bell className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-gray-900">{n.title}</h3>
                                                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider">{n.type.replace(/_/g, ' ')}</span>
                                            </div>
                                            <p className="text-gray-600 text-sm mb-3">{n.message}</p>

                                            {n.plan && (
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg text-xs text-gray-500 mb-4">
                                                    <MapPin className="w-3 h-3" /> {n.plan.title} • {n.plan.destination}
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between">
                                                <p className="text-xs text-gray-400">{format(new Date(n.createdAt), 'd MMMM yyyy, HH:mm', { locale: id })}</p>

                                                {n.type === 'admin_invite' && !n.responded && (
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => handleNotificationResponse(n._id, 'accept')} className="px-6 py-2 bg-primary-600 text-white text-xs font-bold rounded-xl hover:bg-primary-700 shadow-sm transition-all">Terima</button>
                                                        <button onClick={() => handleNotificationResponse(n._id, 'reject')} className="px-6 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 shadow-sm transition-all">Tolak</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'broadcast' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-2xl mx-auto">
                    <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-primary-100 rounded-2xl text-primary-600">
                                <Megaphone className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Broadcast Message</h2>
                                <p className="text-sm text-gray-500">Kirim pesan massal ke grup user tertentu</p>
                            </div>
                        </div>

                        <form onSubmit={handleBroadcastSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 ml-1">Kirim Ke Role:</label>
                                <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    {['user', 'sen_user', 'superadmin'].map((role) => (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => toggleRole(role)}
                                            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${broadcastData.targetRoles.includes(role)
                                                ? 'bg-primary-600 text-white shadow-md'
                                                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'
                                                }`}
                                        >
                                            {broadcastData.targetRoles.includes(role) && <CheckCircle className="w-4 h-4" />}
                                            {roleLabels[role as keyof typeof roleLabels]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-gray-700 ml-1">Judul Notifikasi</label>
                                    <input
                                        required
                                        type="text"
                                        value={broadcastData.title}
                                        onChange={(e) => setBroadcastData(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all mt-1"
                                        placeholder="Contoh: Update Sistem Terbaru"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-700 ml-1">Isi Pesan</label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={broadcastData.message}
                                        onChange={(e) => setBroadcastData(prev => ({ ...prev, message: e.target.value }))}
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all mt-1 resize-none"
                                        placeholder="Tuliskan pesan broadcast kamu di sini..."
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={sendingBroadcast}
                                className="w-full flex items-center justify-center gap-3 py-4 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                            >
                                {sendingBroadcast ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        <Megaphone className="w-6 h-6" />
                                        <span>Kirim Broadcast Sekarang</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

