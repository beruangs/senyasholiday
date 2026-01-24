'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Settings, User, AtSign, Shield, ArrowLeft, Eye, EyeOff, Save, Loader2, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/context/LanguageContext'

export default function SettingsPage() {
    const { data: session, status } = useSession(); const router = useRouter(); const { language, setLanguage, t } = useLanguage()
    const [showPassword, setShowPassword] = useState(false); const [userProfile, setUserProfile] = useState<any>(null); const [loading, setLoading] = useState(false); const [profileLoading, setProfileLoading] = useState(true)
    const [formData, setFormData] = useState({ name: '', currentPassword: '', newPassword: '', confirmPassword: '', })

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login'); else if (session?.user) { setFormData(prev => ({ ...prev, name: session.user.name || '', })); fetchUserProfile(); }
    }, [status, session])

    const fetchUserProfile = async () => { try { const res = await fetch('/api/user/profile'); if (res.ok) { const d = await res.json(); setUserProfile(d); if (d.language) setLanguage(d.language); } } catch { } finally { setProfileLoading(false) } }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) { toast.error(language === 'id' ? 'Password baru tidak cocok' : 'Passwords mismatch'); return; }
        setLoading(true)
        try {
            const res = await fetch('/api/user/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: formData.name, currentPassword: formData.currentPassword || undefined, newPassword: formData.newPassword || undefined, }), })
            if (res.ok) { toast.success(t.common.success); setFormData(p => ({ ...p, currentPassword: '', newPassword: '', confirmPassword: '' })); } else { toast.error(t.common.failed) }
        } catch { toast.error(t.common.failed) } finally { setLoading(false) }
    }

    if (status === 'loading' || profileLoading) return <div className="min-h-screen bg-white flex items-center justify-center font-bold"><Loader2 className="w-10 h-10 animate-spin text-primary-600" /></div>

    const username = userProfile?.username || (session?.user as any)?.username; const userRole = userProfile?.role || 'user'
    const isEnvAdmin = userProfile?.isEnvAdmin ?? false

    return (
        <div className="min-h-screen bg-white font-bold">
            <div className="max-w-3xl mx-auto px-6 py-12">
                <div className="mb-12">
                    <Link href="/dashboard" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-8 font-black uppercase text-[10px] tracking-widest group transition-all"><ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> {t.common.back}</Link>
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-primary-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-primary-100"><Settings className="w-7 h-7" /></div>
                        <div><h1 className="text-4xl font-black uppercase tracking-tight">{t.settings.title}</h1><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{language === 'id' ? 'MANAJEMEN AKUN' : 'ACCOUNT MANAGEMENT'}</p></div>
                    </div>
                </div>

                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-10 mb-8 font-bold">
                    <h2 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-3"><User className="w-6 h-6 text-primary-600" /> {t.settings.account_info}</h2>
                    <div className="space-y-6">
                        <InfoRow icon={<AtSign />} label={t.settings.username} val={`@${username}`} />
                        <InfoRow icon={<Shield />} label={t.settings.role} val={userRole.toUpperCase()} color={userRole === 'superadmin' ? 'text-amber-500 bg-amber-50' : 'text-primary-600 bg-primary-50'} />
                        <div className="flex items-center justify-between py-2"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-gray-50 rounded-[1.2rem] flex items-center justify-center text-gray-400"><Globe className="w-5 h-5" /></div><span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t.settings.language_setting}</span></div><div className="flex p-1 bg-gray-50 rounded-2xl"><button onClick={() => setLanguage('id')} className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${language === 'id' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-400'}`}>ID</button><button onClick={() => setLanguage('en')} className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${language === 'en' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-400'}`}>EN</button></div></div>
                    </div>
                </div>

                {!isEnvAdmin && (
                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-10 font-bold">
                        <h2 className="text-xl font-black uppercase mb-10">{t.settings.edit_profile}</h2>
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <FormInput label={t.settings.name} val={formData.name} setVal={(v: any) => setFormData({ ...formData, name: v })} />
                            <div className="pt-8 border-t border-gray-50 space-y-6"><h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">{t.settings.change_password}</h3>
                                <div className="space-y-4">
                                    <div className="relative"><FormInput label={t.settings.current_password} val={formData.currentPassword} setVal={(v: any) => setFormData({ ...formData, currentPassword: v })} type={showPassword ? 'text' : 'password'} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-[55%] text-gray-300 hover:text-primary-600 transition-all">{showPassword ? <EyeOff /> : <Eye />}</button></div>
                                    <FormInput label={t.settings.new_password} val={formData.newPassword} setVal={(v: any) => setFormData({ ...formData, newPassword: v })} type={showPassword ? 'text' : 'password'} />
                                    <FormInput label={t.settings.confirm_password} val={formData.confirmPassword} setVal={(v: any) => setFormData({ ...formData, confirmPassword: v })} type={showPassword ? 'text' : 'password'} />
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-6 bg-primary-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary-100 hover:bg-primary-700 transition-all flex items-center justify-center gap-4">{loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />} {t.settings.save_changes}</button>
                        </form>
                    </div>
                )}

                {isEnvAdmin && (<div className="mt-8 p-8 bg-indigo-50 border border-indigo-100 rounded-[2.5rem] flex items-start gap-5"><Shield className="w-6 h-6 text-indigo-500 shrink-0" /><div className="space-y-2"><p className="text-[10px] font-black text-indigo-800 uppercase tracking-widest">SYSTEM ACCOUNT</p><p className="text-[11px] font-bold text-indigo-900/60 uppercase leading-relaxed">{language === 'id' ? 'Akun admin lingkungan tidak dapat diubah di sini.' : 'Environment admin account cannot be modified here.'}</p></div></div>)}
            </div>
        </div>
    )
}

function InfoRow({ icon, label, val, color = 'text-gray-900' }: any) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-gray-50 rounded-[1.2rem] flex items-center justify-center text-gray-400">{icon}</div><span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</span></div><span className={`px-4 py-1.5 rounded-xl font-black text-xs ${color}`}>{val}</span></div>
    )
}

function FormInput({ label, val, setVal, type = 'text' }: any) {
    return (
        <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label><input type={type} value={val} onChange={e => setVal(e.target.value)} className="w-full px-8 py-5 bg-gray-50 border border-gray-100 rounded-[1.8rem] outline-none font-black text-gray-900 focus:bg-white focus:border-primary-500 transition-all uppercase tracking-tight" /></div>
    )
}
