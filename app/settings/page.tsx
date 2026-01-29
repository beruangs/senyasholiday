'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Settings, User, AtSign, Shield, ArrowLeft, Eye, EyeOff, Save, Loader2, Globe, Crown, Calendar, Zap, Sparkles, Coins, Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/context/LanguageContext'
import { useTheme } from '@/context/ThemeContext'
import { Palette } from 'lucide-react'

export default function SettingsPage() {
    const { data: session, status, update } = useSession(); const router = useRouter(); const { language, setLanguage, t } = useLanguage(); const { theme, setTheme } = useTheme()
    const [showPassword, setShowPassword] = useState(false); const [userProfile, setUserProfile] = useState<any>(null); const [loading, setLoading] = useState(false); const [profileLoading, setProfileLoading] = useState(true)
    const [formData, setFormData] = useState({ name: '', newPassword: '', confirmPassword: '', profileImage: '', defaultCurrency: 'IDR' })
    const [profileUploading, setProfileUploading] = useState(false)

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
        else if (session?.user) {
            fetchUserProfile();
        }
    }, [status, session])

    const fetchUserProfile = async () => {
        try {
            const res = await fetch('/api/user/profile');
            if (res.ok) {
                const d = await res.json();
                setUserProfile(d);
                setFormData(prev => ({
                    ...prev,
                    name: d.name || '',
                    profileImage: d.profileImage || '',
                    defaultCurrency: d.defaultCurrency || 'IDR'
                }));
                if (d.language) setLanguage(d.language);
                if (d.theme) setTheme(d.theme);
            }
        } catch { } finally { setProfileLoading(false) }
    }

    const handleImageUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) return;
        setProfileUploading(true)
        const toastId = toast.loading(language === 'id' ? 'Mengunggah foto...' : 'Uploading photo...');
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;

                // 1. Upload to Cloudinary
                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        file: base64,
                        folder: 'profiles',
                        filename: `profile_${session?.user?.id}`
                    }),
                })

                if (!uploadRes.ok) throw new Error('Upload failed');
                const { url } = await uploadRes.json();

                // 2. Update User Settings
                const res = await fetch('/api/user/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ profileImage: url }),
                })

                if (res.ok) {
                    toast.success(t.common.success, { id: toastId });
                    setFormData(prev => ({ ...prev, profileImage: url }));
                    fetchUserProfile();
                } else {
                    throw new Error('Update failed');
                }
            };
            reader.readAsDataURL(file)
        } catch (error) {
            toast.error(t.common.failed, { id: toastId });
        } finally {
            setProfileUploading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) { toast.error(language === 'id' ? 'Password baru tidak cocok' : 'Passwords mismatch'); return; }
        setLoading(true)
        try {
            const res = await fetch('/api/user/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: formData.name, newPassword: formData.newPassword || undefined, defaultCurrency: formData.defaultCurrency }), })
            if (res.ok) {
                toast.success(t.common.success);
                setFormData(p => ({ ...p, newPassword: '', confirmPassword: '' }));
                // Update session
                update({ defaultCurrency: formData.defaultCurrency })
            } else { toast.error(t.common.failed) }
        } catch { toast.error(t.common.failed) } finally { setLoading(false) }
    }

    const handleDeleteAccount = async () => {
        if (!confirm(t.settings.confirm_delete_account)) return
        setLoading(true)
        try {
            const res = await fetch('/api/user/settings', { method: 'DELETE' })
            if (res.ok) {
                toast.success(t.common.success)
                import('next-auth/react').then(({ signOut }) => signOut({ callbackUrl: '/' }))
            } else {
                toast.error(t.common.failed)
            }
        } catch {
            toast.error(t.common.failed)
        } finally {
            setLoading(false)
        }
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

                <div className="flex flex-col items-center mb-12">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-gray-50 border-4 border-white shadow-2xl overflow-hidden flex items-center justify-center relative">
                            {formData.profileImage ? (
                                <img src={formData.profileImage} className="w-full h-full object-cover" alt="Profile" />
                            ) : (
                                <User className="w-12 h-12 text-gray-200" />
                            )}
                            {profileUploading && (
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                                </div>
                            )}
                        </div>
                        {!isEnvAdmin && (
                            <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary-600 text-white rounded-xl shadow-xl flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-all hover:scale-110">
                                <Save className="w-5 h-5" />
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    disabled={profileUploading}
                                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                                />
                            </label>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-10 mb-8 font-bold">
                    <h2 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-3"><User className="w-6 h-6 text-primary-600" /> {t.settings.account_info}</h2>
                    <div className="space-y-6">
                        <InfoRow icon={<AtSign />} label={t.settings.username} val={`@${username}`} />
                        <InfoRow icon={<Shield />} label={t.settings.role} val={userRole.toUpperCase()} color={userRole === 'superadmin' ? 'text-amber-500 bg-amber-50' : 'text-primary-600 bg-primary-50'} />
                        <div className="flex items-center justify-between py-2 border-b border-gray-50">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-50 rounded-[1.2rem] flex items-center justify-center text-gray-400">
                                    <Coins className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t.settings.default_currency}</span>
                            </div>
                            <select
                                value={formData.defaultCurrency}
                                onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
                                className="bg-gray-50 border-none outline-none font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl text-primary-600 cursor-pointer hover:bg-gray-100 transition-all"
                            >
                                <option value="IDR">IDR (Rp)</option>
                                <option value="USD">USD ($)</option>
                                <option value="JPY">JPY (¥)</option>
                                <option value="KRW">KRW (₩)</option>
                                <option value="SGD">SGD (S$)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="MYR">MYR (RM)</option>
                            </select>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-50"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-gray-50 rounded-[1.2rem] flex items-center justify-center text-gray-400"><Globe className="w-5 h-5" /></div><span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t.settings.language_setting}</span></div><div className="flex px-1 py-1.5 bg-gray-50 rounded-2xl"><button onClick={() => setLanguage('id')} className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${language === 'id' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-400'}`}>ID</button><button onClick={() => setLanguage('en')} className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${language === 'en' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-400'}`}>EN</button></div></div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-50 rounded-[1.2rem] flex items-center justify-center text-gray-400">
                                    <Palette className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t.settings.theme_setting}</span>
                            </div>
                            <div className="flex px-1 py-1.5 bg-gray-50 rounded-2xl overflow-x-auto no-scrollbar">
                                {[
                                    { id: 'light', label: t.settings.light },
                                    { id: 'ash', label: t.settings.ash },
                                    { id: 'dark', label: t.settings.dark }
                                ].map((th) => (
                                    <button
                                        key={th.id}
                                        onClick={() => setTheme(th.id as any)}
                                        className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all whitespace-nowrap ${theme === th.id ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        {th.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-10 mb-8 font-bold relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12">
                        <Crown className="w-32 h-32" />
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-3"><Crown className="w-6 h-6 text-amber-500" /> {t.settings.plan_info}</h2>
                    <div className="space-y-6">
                        <InfoRow
                            icon={<Zap className="w-5 h-5 text-amber-500" />}
                            label={t.settings.account_type}
                            val={
                                userProfile?.planType === 'premium_ai' ? t.settings.premium_ai_plan :
                                    userProfile?.planType === 'premium' ? t.settings.premium_plan :
                                        t.settings.free_plan
                            }
                            color={userProfile?.isPremium ? 'text-amber-600 bg-amber-50' : 'text-gray-400 bg-gray-50'}
                        />
                        <InfoRow
                            icon={<Shield className="w-5 h-5 text-emerald-500" />}
                            label={t.settings.premium_status}
                            val={userProfile?.isPremium ? t.settings.active : t.settings.inactive}
                            color={userProfile?.isPremium ? 'text-emerald-600 bg-emerald-50' : 'text-rose-500 bg-rose-50'}
                        />
                        {userProfile?.isPremium && (
                            <InfoRow
                                icon={<Calendar className="w-5 h-5 text-indigo-500" />}
                                label={t.settings.expiry_date}
                                val={userProfile?.premiumExpiresAt ? new Date(userProfile.premiumExpiresAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : t.settings.never_expires}
                            />
                        )}
                        {!userProfile?.isPremium && !isEnvAdmin && (
                            <Link href="/pricing" className="mt-4 w-full py-4 bg-amber-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-amber-100 hover:bg-amber-600 transition-all flex items-center justify-center gap-2">
                                <Sparkles className="w-4 h-4 fill-white" />
                                {t.settings.upgrade_now}
                            </Link>
                        )}
                    </div>
                </div>

                {!isEnvAdmin && (
                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-10 font-bold">
                        <h2 className="text-xl font-black uppercase mb-10">{t.settings.edit_profile}</h2>
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <FormInput label={t.settings.name} val={formData.name} setVal={(v: any) => setFormData({ ...formData, name: v })} />
                            <div className="pt-8 border-t border-gray-50 space-y-6"><h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">{t.settings.change_password}</h3>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <FormInput label={t.settings.new_password} val={formData.newPassword} setVal={(v: any) => setFormData({ ...formData, newPassword: v })} type={showPassword ? 'text' : 'password'} />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-[55%] text-gray-300 hover:text-primary-600 transition-all">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                                    </div>
                                    <FormInput label={t.settings.confirm_password} val={formData.confirmPassword} setVal={(v: any) => setFormData({ ...formData, confirmPassword: v })} type={showPassword ? 'text' : 'password'} />
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-6 bg-primary-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary-100 hover:bg-primary-700 transition-all flex items-center justify-center gap-4">{loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />} {t.settings.save_changes}</button>
                        </form>
                    </div>
                )}

                {!isEnvAdmin && (
                    <div className="mt-16 pt-12 border-t border-gray-50">
                        <div className="bg-rose-50/50 rounded-[3rem] border border-rose-100 p-10 font-bold overflow-hidden relative">
                            <div className="absolute -top-10 -right-10 opacity-5">
                                <AlertTriangle className="w-40 h-40 text-rose-500" />
                            </div>
                            <div className="relative z-10">
                                <h2 className="text-xl font-black uppercase tracking-tight text-rose-600 mb-2 flex items-center gap-3">
                                    <Trash2 className="w-6 h-6" />
                                    {t.settings.danger_zone}
                                </h2>
                                <p className="text-[11px] font-bold text-rose-400 uppercase tracking-widest mb-8 leading-relaxed max-w-md">
                                    {t.settings.delete_account_desc}
                                </p>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={loading}
                                    className="px-8 py-4 bg-white text-rose-500 border-2 border-rose-100 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-sm flex items-center gap-3"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    {t.settings.delete_account}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
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
        <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label><input type={type} value={val} onChange={e => setVal(e.target.value)} className="w-full px-8 py-5 bg-gray-50 border border-gray-100 rounded-[1.8rem] outline-none font-black text-gray-900 focus:bg-white focus:border-primary-500 transition-all tracking-tight" /></div>
    )
}
