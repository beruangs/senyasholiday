'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { User, Lock, AtSign, Check, X, Loader2 } from 'lucide-react'

export default function SignupPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
    const [usernameDebounce, setUsernameDebounce] = useState<NodeJS.Timeout | null>(null)

    // Check username availability with debounce
    useEffect(() => {
        if (usernameDebounce) {
            clearTimeout(usernameDebounce)
        }

        const cleanUsername = formData.username.trim().toLowerCase().replace(/^@/, '')

        if (cleanUsername.length < 3) {
            setUsernameStatus('idle')
            return
        }

        if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
            setUsernameStatus('invalid')
            return
        }

        setUsernameStatus('checking')

        const timeout = setTimeout(async () => {
            try {
                const res = await fetch(`/api/users/check-username?username=${cleanUsername}`)
                const data = await res.json()

                if (data.available) {
                    setUsernameStatus('available')
                } else {
                    setUsernameStatus('taken')
                }
            } catch {
                setUsernameStatus('idle')
            }
        }, 500)

        setUsernameDebounce(timeout)

        return () => {
            if (timeout) clearTimeout(timeout)
        }
    }, [formData.username])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Password tidak sama')
            return
        }

        if (formData.password.length < 6) {
            setError('Password minimal 6 karakter')
            return
        }

        if (usernameStatus !== 'available') {
            setError('Username tidak tersedia')
            return
        }

        setLoading(true)

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username.trim().toLowerCase().replace(/^@/, ''),
                    password: formData.password,
                    name: formData.name,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Gagal mendaftar')
                setLoading(false)
                return
            }

            // Auto login after signup
            const loginResult = await signIn('credentials', {
                username: formData.username.trim().toLowerCase().replace(/^@/, ''),
                password: formData.password,
                redirect: false,
            })

            if (loginResult?.ok) {
                router.push('/dashboard')
            } else {
                router.push('/login')
            }
        } catch {
            setError('Terjadi kesalahan. Coba lagi.')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="relative inline-block mb-4">
                        <div className="absolute inset-0 bg-primary-200 rounded-2xl blur-xl opacity-50"></div>
                        <Image
                            src="/logo.png"
                            alt="SEN YAS DADDY"
                            width={80}
                            height={80}
                            className="rounded-2xl relative shadow-lg"
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Buat Akun Baru</h1>
                    <p className="text-gray-600 mt-1">Daftar untuk mulai merencanakan liburan</p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nama Lengkap
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                    placeholder="Nama kamu"
                                    required
                                />
                            </div>
                        </div>

                        {/* Username */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Username
                            </label>
                            <div className="relative">
                                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                                    className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 transition-colors ${usernameStatus === 'available' ? 'border-green-500 focus:border-green-500' :
                                        usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'border-red-500 focus:border-red-500' :
                                            'border-gray-300 focus:border-primary-500'
                                        }`}
                                    placeholder="username_kamu"
                                    required
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {usernameStatus === 'checking' && (
                                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                                    )}
                                    {usernameStatus === 'available' && (
                                        <Check className="w-5 h-5 text-green-500" />
                                    )}
                                    {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                                        <X className="w-5 h-5 text-red-500" />
                                    )}
                                </div>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Huruf kecil, angka, dan underscore saja
                            </p>
                            {usernameStatus === 'taken' && (
                                <p className="mt-1 text-xs text-red-600">Username sudah digunakan</p>
                            )}
                            {usernameStatus === 'invalid' && (
                                <p className="mt-1 text-xs text-red-600">Username tidak valid</p>
                            )}
                            {usernameStatus === 'available' && (
                                <p className="mt-1 text-xs text-green-600">Username tersedia! ✓</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                    placeholder="Minimal 6 karakter"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Konfirmasi Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 transition-colors ${formData.confirmPassword && formData.password !== formData.confirmPassword
                                        ? 'border-red-500'
                                        : 'border-gray-300 focus:border-primary-500'
                                        }`}
                                    placeholder="Ulangi password"
                                    required
                                />
                            </div>
                            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                <p className="mt-1 text-xs text-red-600">Password tidak sama</p>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || usernameStatus !== 'available'}
                            className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Mendaftar...
                                </>
                            ) : (
                                'Daftar Sekarang'
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 text-center text-sm text-gray-600">
                        Sudah punya akun?{' '}
                        <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                            Masuk di sini
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-gray-500 mt-6">
                    Dengan mendaftar, kamu setuju dengan ketentuan layanan kami
                </p>
            </div>
        </div>
    )
}
