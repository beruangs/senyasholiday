'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { User, Lock, AtSign, Check, X, Loader2, Globe } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

export default function SignupPage() {
    const router = useRouter(); const { language, t } = useLanguage()
    const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '', name: '', }); const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle'); const [usernameDebounce, setUsernameDebounce] = useState<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (usernameDebounce) clearTimeout(usernameDebounce)
        const clean = formData.username.trim().toLowerCase().replace(/^@/, '')
        if (clean.length < 3) { setUsernameStatus('idle'); return; }
        if (!/^[a-z0-9_]+$/.test(clean)) { setUsernameStatus('invalid'); return; }
        setUsernameStatus('checking')
        const t = setTimeout(async () => { try { const r = await fetch(`/api/users/check-username?username=${clean}`); const d = await r.json(); setUsernameStatus(d.available ? 'available' : 'taken'); } catch { setUsernameStatus('idle') } }, 500)
        setUsernameDebounce(t); return () => clearTimeout(t)
    }, [formData.username])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setError('')
        if (formData.password !== formData.confirmPassword) { setError(language === 'id' ? 'Password tidak sama' : 'Passwords mismatch'); return; }
        if (formData.password.length < 6) { setError(language === 'id' ? 'Password minimal 6 karakter' : 'Min 6 chars'); return; }
        if (usernameStatus !== 'available') { setError(language === 'id' ? 'Username tidak tersedia' : 'Unavailable'); return; }
        setLoading(true)
        try {
            const r = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: formData.username.trim().toLowerCase().replace(/^@/, ''), password: formData.password, name: formData.name, }), })
            if (!r.ok) { setError(await r.json().then(d => d.error) || t.auth.error_occurred); setLoading(false); return; }
            await signIn('credentials', { username: formData.username.trim(), password: formData.password, redirect: true, callbackUrl: '/dashboard' })
        } catch { setError(t.auth.error_occurred); setLoading(false); }
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6 font-bold relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"><Globe className="w-[100rem] h-[100rem] absolute -bottom-40 -right-40" /></div>
            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-12 animate-in slide-in-from-top-4 duration-700">
                    <div className="flex justify-center mb-8"><Image src="/logo.png" alt="LOGO" width={100} height={100} className="rounded-[2rem] shadow-2xl p-1 bg-white border border-gray-100 transition-all hover:scale-105" /></div>
                    <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none mb-4">{t.auth.signup_title}</h1>
                    <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.4em]">{t.auth.signup_subtitle}</p>
                </div>

                <div className="bg-white rounded-[3.5rem] p-12 border border-gray-100 shadow-2xl animate-in zoom-in-95 duration-500">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <InputBox label={t.auth.full_name} val={formData.name} setVal={v => setFormData({ ...formData, name: v })} icon={<User className="w-4 h-4" />} placeholder="FULL NAME" />
                        <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.auth.username}</label><div className="relative group"><AtSign className="absolute left-6 h-4 w-4 text-gray-300 top-1/2 -translate-y-1/2 group-focus-within:text-primary-600 transition-all" /><input type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className={`w-full pl-14 pr-12 py-5 bg-gray-50 border rounded-3xl outline-none font-black text-gray-900 focus:bg-white transition-all uppercase tracking-tight ${usernameStatus === 'available' ? 'border-emerald-500 bg-emerald-50/20' : usernameStatus === 'taken' ? 'border-rose-500 bg-rose-50/20' : 'border-gray-100'}`} placeholder="USERNAME" required /><div className="absolute right-6 top-1/2 -translate-y-1/2">{usernameStatus === 'checking' ? <Loader2 className="w-4 h-4 text-primary-400 animate-spin" /> : usernameStatus === 'available' ? <Check className="w-4 h-4 text-emerald-500" /> : usernameStatus === 'taken' ? <X className="w-4 h-4 text-rose-500" /> : null}</div></div></div>
                        <InputBox label={t.auth.password} val={formData.password} setVal={v => setFormData({ ...formData, password: v })} icon={<Lock className="w-4 h-4" />} placeholder="••••••••" type="password" />
                        <InputBox label={t.auth.confirm_password} val={formData.confirmPassword} setVal={v => setFormData({ ...formData, confirmPassword: v })} icon={<Lock className="w-4 h-4" />} placeholder="••••••••" type="password" error={formData.confirmPassword && formData.password !== formData.confirmPassword} />
                        {error && <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl text-[10px] font-black uppercase text-rose-600 tracking-widest">{error}</div>}
                        <button type="submit" disabled={loading || usernameStatus !== 'available'} className="w-full py-6 bg-primary-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-primary-100 hover:bg-primary-700 transition-all flex items-center justify-center gap-4 disabled:opacity-50">{loading ? <Loader2 className="animate-spin h-5 w-5" /> : null} {t.common.signup}</button>
                    </form>
                    <div className="mt-10 text-center border-t border-gray-50 pt-8"><Link href="/login" className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary-600 transition-all">{t.auth.have_account}</Link></div>
                </div>
                <div className="text-center mt-12 font-bold"><Link href="/" className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em] hover:text-gray-900 transition-all">← {t.auth.back_to_home}</Link></div>
            </div>
        </div>
    )
}

function InputBox({ label, val, setVal, icon, placeholder, type = 'text', error }: any) {
    return (
        <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label><div className="relative group">{icon && <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-600 transition-all">{icon}</div>}<input type={type} value={val} onChange={e => setVal(e.target.value)} className={`w-full ${icon ? 'pl-14' : 'px-8'} pr-8 py-5 bg-gray-50 border rounded-3xl outline-none font-black text-gray-900 focus:bg-white focus:border-primary-500 transition-all uppercase tracking-tight ${error ? 'border-rose-500' : 'border-gray-100'}`} placeholder={placeholder} required /></div></div>
    )
}
