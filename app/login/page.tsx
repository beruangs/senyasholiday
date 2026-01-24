'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { LogIn, AtSign, Lock, Loader2, Globe } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

export default function LoginPage() {
  const router = useRouter(); const { t } = useLanguage(); const [username, setUsername] = useState(''); const [password, setPassword] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const result = await signIn('credentials', { username: username.trim().toLowerCase().replace(/^@/, ''), password, redirect: false })
      if (result?.error) setError(t.auth.auth_failed)
      else { toast.success(t.auth.login_success); router.push('/dashboard') }
    } catch { setError(t.auth.error_occurred) } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 font-bold relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none transition-opacity duration-1000"><Globe className="w-[100rem] h-[100rem] absolute -bottom-40 -right-40" /></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-12 animate-in slide-in-from-top-4 duration-700">
          <div className="flex justify-center mb-10"><Image src="/logo.png" alt="LOGO" width={100} height={100} className="rounded-[2rem] shadow-2xl p-1 bg-white border border-gray-100 transition-all hover:scale-105" /></div>
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none mb-4">{t.auth.login_title}</h1>
          <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.4em]">{t.auth.login_subtitle}</p>
        </div>

        <div className="bg-white rounded-[3.5rem] p-12 border border-gray-100 shadow-2xl animate-in zoom-in-95 duration-500">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.auth.username}</label><div className="relative group"><AtSign className="absolute left-6 h-4 w-4 text-gray-300 top-1/2 -translate-y-1/2 group-focus-within:text-primary-600 transition-all" /><input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full pl-14 pr-8 py-5 bg-gray-50 border border-gray-100 rounded-3xl outline-none font-black text-gray-900 focus:bg-white focus:border-primary-500 transition-all uppercase tracking-tight" placeholder="USERNAME" required /></div></div>
            <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.auth.password}</label><div className="relative group"><Lock className="absolute left-6 h-4 w-4 text-gray-300 top-1/2 -translate-y-1/2 group-focus-within:text-primary-600 transition-all" /><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-14 pr-8 py-5 bg-gray-50 border border-gray-100 rounded-3xl outline-none font-black text-gray-900 focus:bg-white focus:border-primary-500 transition-all uppercase tracking-tight" placeholder="••••••••" required /></div></div>
            {error && <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl text-[10px] font-black uppercase text-rose-600 tracking-widest">{error}</div>}
            <button type="submit" disabled={loading} className="w-full py-6 bg-primary-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-primary-100 hover:bg-primary-700 transition-all flex items-center justify-center gap-4">{loading ? <Loader2 className="animate-spin h-5 w-5" /> : <LogIn className="h-5 w-5" />} {t.common.login}</button>
          </form>
          <div className="mt-12 text-center border-t border-gray-50 pt-8"><Link href="/signup" className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary-600 transition-all">{t.auth.no_account}</Link></div>
        </div>

        <div className="text-center mt-12"><Link href="/" className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em] hover:text-gray-900 transition-all">← {t.auth.back_to_home}</Link></div>
      </div>
    </div>
  )
}
