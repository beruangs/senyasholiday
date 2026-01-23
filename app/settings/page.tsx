'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Settings, User, AtSign, Shield, ArrowLeft, Eye, EyeOff, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [userProfile, setUserProfile] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [profileLoading, setProfileLoading] = useState(true)
    const [formData, setFormData] = useState({
        name: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        } else if (session?.user) {
            setFormData(prev => ({
                ...prev,
                name: session.user.name || '',
            }))
            fetchUserProfile()
        }
    }, [status, session, router])

    const fetchUserProfile = async () => {
        try {
            const res = await fetch('/api/user/profile')
            if (res.ok) {
                const data = await res.json()
                setUserProfile(data)
            }
        } catch (error) {
            console.error('Error fetching profile:', error)
        } finally {
            setProfileLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            toast.error('Password baru tidak cocok')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    currentPassword: formData.currentPassword || undefined,
                    newPassword: formData.newPassword || undefined,
                }),
            })

            if (res.ok) {
                toast.success('Pengaturan berhasil disimpan')
                setFormData(prev => ({
                    ...prev,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                }))
            } else {
                const data = await res.json()
                toast.error(data.error || 'Gagal menyimpan pengaturan')
            }
        } catch (error) {
            toast.error('Terjadi kesalahan')
        } finally {
            setLoading(false)
        }
    }

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto" />
                    <p className="mt-4 text-gray-600">Memuat...</p>
                </div>
            </div>
        )
    }

    const username = userProfile?.username || (session?.user as any)?.username || session?.user?.email?.split('@')[0]
    const userRole = userProfile?.role || (session?.user as any)?.role || 'user'
    const isEnvAdmin = userProfile?.isEnvAdmin ?? session?.user?.id?.startsWith('env-')

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
            <div className="max-w-2xl mx-auto px-4 py-8">
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
                        <Settings className="w-8 h-8 text-primary-600" />
                        Pengaturan Akun
                    </h1>
                </div>

                {/* Account Info Card */}
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-gray-500" />
                        Informasi Akun
                    </h2>

                    <div className="space-y-4">
                        {/* Username */}
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <AtSign className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-600">Username</span>
                            </div>
                            <span className="font-medium text-gray-900">@{username}</span>
                        </div>

                        {/* Role */}
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-600">Role</span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${userRole === 'superadmin'
                                ? 'bg-amber-100 text-amber-700'
                                : userRole === 'sen_user'
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                {userRole === 'superadmin' ? 'Superadmin' :
                                    userRole === 'sen_user' ? 'SEN User' : 'User'}
                            </span>
                        </div>

                        {/* Account Type */}
                        <div className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-3">
                                <User className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-600">Tipe Akun</span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${isEnvAdmin
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-green-100 text-green-700'
                                }`}>
                                {isEnvAdmin ? 'Environment Admin' : 'Database User'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Edit Profile Form - Only for database users */}
                {!isEnvAdmin && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Edit Profil
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nama
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="Nama kamu"
                                />
                            </div>

                            {/* Password Change Section */}
                            <div className="pt-4 border-t border-gray-200">
                                <h3 className="text-sm font-medium text-gray-700 mb-4">
                                    Ubah Password (opsional)
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-2">
                                            Password Saat Ini
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.currentPassword}
                                                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-600 mb-2">
                                            Password Baru
                                        </label>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.newPassword}
                                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            placeholder="••••••••"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-600 mb-2">
                                            Konfirmasi Password Baru
                                        </label>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Save className="w-5 h-5" />
                                )}
                                Simpan Perubahan
                            </button>
                        </form>
                    </div>
                )}

                {/* Env Admin Note */}
                {isEnvAdmin && (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-800">
                        <strong>Catatan:</strong> Akun Environment Admin tidak dapat diubah dari halaman ini.
                        Pengaturan dikelola melalui environment variables di server.
                    </div>
                )}
            </div>
        </div>
    )
}
