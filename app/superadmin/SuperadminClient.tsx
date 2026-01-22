'use client'

import { useState, useEffect } from 'react'
import { Users, Shield, Crown, User as UserIcon, Trash2, ChevronDown, Search, AtSign, Loader2, Calendar, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface User {
    _id: string
    username: string
    name: string
    role: 'user' | 'sen_user' | 'superadmin'
    createdAt: string
    lastLoginAt?: string
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
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [editingRole, setEditingRole] = useState<string | null>(null)
    const [updatingRole, setUpdatingRole] = useState(false)

    useEffect(() => {
        fetchUsers()
    }, [])

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

    const deleteUser = async (userId: string, username: string) => {
        if (!confirm(`Yakin ingin menghapus user @${username}?`)) return

        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
            })

            if (res.ok) {
                toast.success('User berhasil dihapus')
                fetchUsers()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Gagal menghapus user')
            }
        } catch {
            toast.error('Terjadi kesalahan')
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

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-amber-100 rounded-lg">
                        <Shield className="w-6 h-6 text-amber-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Superadmin Dashboard</h1>
                </div>
                <p className="text-gray-600">Kelola semua user dan role akses</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <Users className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            <p className="text-sm text-gray-500">Total Users</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <UserIcon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.users}</p>
                            <p className="text-sm text-gray-500">User</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 rounded-lg">
                            <Users className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.senUsers}</p>
                            <p className="text-sm text-gray-500">SEN User</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Crown className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.superadmins}</p>
                            <p className="text-sm text-gray-500">Superadmin</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Role Explanation */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8">
                <h3 className="font-semibold text-blue-900 mb-3">Penjelasan Role</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                        <UserIcon className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-medium text-gray-900">User</p>
                            <p className="text-gray-600">Hanya bisa melihat plan miliknya sendiri</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <Users className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-medium text-gray-900">SEN User</p>
                            <p className="text-gray-600">Bisa melihat dan edit plan SEN Yas Daddy</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <Crown className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-medium text-gray-900">Superadmin</p>
                            <p className="text-gray-600">Akses penuh ke semua plan dan dapat manage users</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari username atau nama..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                        <span className="ml-3 text-gray-600">Memuat data users...</span>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">
                            {searchQuery ? 'Tidak ada user yang cocok' : 'Belum ada user terdaftar'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left font-medium text-gray-600">User</th>
                                    <th className="px-6 py-4 text-left font-medium text-gray-600">Role</th>
                                    <th className="px-6 py-4 text-left font-medium text-gray-600">Terdaftar</th>
                                    <th className="px-6 py-4 text-left font-medium text-gray-600">Login Terakhir</th>
                                    <th className="px-6 py-4 text-center font-medium text-gray-600">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredUsers.map((user) => {
                                    const RoleIcon = roleIcons[user.role]
                                    const isCurrentUser = user._id === session.user.id

                                    return (
                                        <tr key={user._id} className={`hover:bg-gray-50 ${isCurrentUser ? 'bg-amber-50' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                                                        {user.name[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 flex items-center gap-1">
                                                            {user.name}
                                                            {isCurrentUser && (
                                                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Anda</span>
                                                            )}
                                                        </p>
                                                        <p className="text-gray-500 flex items-center gap-1">
                                                            <AtSign className="w-3 h-3" />
                                                            {user.username}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {editingRole === user._id ? (
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            defaultValue={user.role}
                                                            onChange={(e) => updateRole(user._id, e.target.value)}
                                                            disabled={updatingRole}
                                                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                                                        >
                                                            <option value="user">User</option>
                                                            <option value="sen_user">SEN User</option>
                                                            <option value="superadmin">Superadmin</option>
                                                        </select>
                                                        {updatingRole && <Loader2 className="w-4 h-4 animate-spin text-primary-600" />}
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => !isCurrentUser && setEditingRole(user._id)}
                                                        disabled={isCurrentUser}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${roleColors[user.role]} ${!isCurrentUser ? 'hover:opacity-80 cursor-pointer' : 'cursor-not-allowed'}`}
                                                    >
                                                        <RoleIcon className="w-3.5 h-3.5" />
                                                        {roleLabels[user.role]}
                                                        {!isCurrentUser && <ChevronDown className="w-3 h-3" />}
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    {format(new Date(user.createdAt), 'd MMM yyyy', { locale: id })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {user.lastLoginAt ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                        {format(new Date(user.lastLoginAt), 'd MMM yyyy, HH:mm', { locale: id })}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">Belum pernah</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {!isCurrentUser && (
                                                    <button
                                                        onClick={() => deleteUser(user._id, user.username)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Hapus user"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
