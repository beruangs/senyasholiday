'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Shield, Crown, User as UserIcon, Trash2, ChevronDown, Search, AtSign, Loader2, Calendar, Lock, Key, Settings, Megaphone, Bell, X as XIcon, Star, Filter, ExternalLink, RefreshCw, AlertTriangle, CheckCircle, Activity, Database, Zap, Cpu } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id, enUS } from 'date-fns/locale'
import ConfirmModal from '@/components/ConfirmModal'
import { signIn } from 'next-auth/react'
import { useLanguage } from '@/context/LanguageContext'

interface User { _id: string; username: string; name: string; role: 'user' | 'sen_user' | 'superadmin'; createdAt: string; lastLoginAt?: string; }
interface Notification { _id: string; type: string; title: string; message: string; read: boolean; responded: boolean; createdAt: string; fromUserId?: { name: string }; }
interface Plan { _id: string; title: string; destination: string; planCategory: string; ownerId?: { name: string; username: string }; createdAt: string; status: string; }

export default function SuperadminClient({ session }: any) {
    const { language, t } = useLanguage(); const dateLocale = language === 'id' ? id : enUS
    const [activeTab, setActiveTab] = useState<'users' | 'plans' | 'notifications' | 'broadcast' | 'settings' | 'health'>('users')
    const [healthData, setHealthData] = useState<any>(null); const [fetchingHealth, setFetchingHealth] = useState(false)
    const [users, setUsers] = useState<User[]>([]); const [notifications, setNotifications] = useState<Notification[]>([]); const [plans, setPlans] = useState<Plan[]>([]); const [loading, setLoading] = useState(true); const [searchQuery, setSearchQuery] = useState('')
    const [editingRole, setEditingRole] = useState<string | null>(null); const [updatingRole, setUpdatingRole] = useState(false)
    const [deleteUserConfirm, setDeleteUserConfirm] = useState({ isOpen: false, userId: '', username: '' }); const [deletePlanConfirm, setDeletePlanConfirm] = useState({ isOpen: false, planId: '', title: '' })
    const [resetPassModal, setResetPassModal] = useState<{ isOpen: boolean, user: User | null }>({ isOpen: false, user: null })
    const [newPassword, setNewPassword] = useState(''); const [isUpdatingPassword, setIsUpdatingPassword] = useState(false); const [isMaintenance, setIsMaintenance] = useState(false); const [allowRegistration, setAllowRegistration] = useState(true)
    const [broadcastData, setBroadcastData] = useState({ title: '', message: '', targetRoles: ['user', 'sen_user'] }); const [sendingBroadcast, setSendingBroadcast] = useState(false); const [impersonatingId, setImpersonatingId] = useState<string | null>(null)

    useEffect(() => {
        fetchAll();
    }, [])

    const fetchAll = async () => {
        setLoading(true);
        await Promise.all([fetchUsers(), fetchNotifications(), fetchPlans(), fetchSettings(), fetchHealth()]);
        setLoading(false);
    }

    const fetchHealth = async () => {
        setFetchingHealth(true);
        try {
            const res = await fetch('/api/admin/health');
            if (res.ok) setHealthData(await res.json());
        } catch { } finally { setFetchingHealth(false); }
    }

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            if (res.ok) {
                const d = await res.json();
                setIsMaintenance(d.find((s: any) => s.key === 'maintenance_mode')?.value === true);
                setAllowRegistration(d.find((s: any) => s.key === 'allow_registration')?.value !== false);
            }
        } catch { }
    }
    const fetchUsers = async () => { try { const res = await fetch('/api/admin/users'); if (res.ok) setUsers(await res.json()); } catch { toast.error(t.common.failed) } }
    const fetchNotifications = async () => { try { const res = await fetch('/api/notifications?admin=true'); if (res.ok) setNotifications(await res.json()); } catch { } }
    const fetchPlans = async () => { try { const res = await fetch('/api/plans'); if (res.ok) setPlans(await res.json()); } catch { } }

    const updateRole = async (userId: string, newRole: string) => {
        setUpdatingRole(true)
        try { const res = await fetch(`/api/admin/users/${userId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: newRole }), }); if (res.ok) { toast.success(t.common.success); fetchUsers(); } } catch { toast.error(t.common.failed) } finally { setUpdatingRole(false); setEditingRole(null); }
    }

    const handleResetPassword = async () => {
        if (!resetPassModal.user || !newPassword.trim()) return;
        setIsUpdatingPassword(true);
        try {
            const res = await fetch(`/api/admin/users/${resetPassModal.user._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPassword.trim() }),
            });
            if (res.ok) {
                toast.success(t.common.success);
                setResetPassModal({ isOpen: false, user: null });
                setNewPassword('');
            } else {
                const data = await res.json();
                toast.error(data.error || t.common.failed);
            }
        } catch { toast.error(t.common.failed) } finally { setIsUpdatingPassword(false); }
    }

    const handleDeleteUser = async () => {
        try {
            const res = await fetch(`/api/admin/users/${deleteUserConfirm.userId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success(t.common.success);
                setDeleteUserConfirm({ isOpen: false, userId: '', username: '' });
                fetchUsers();
            }
        } catch { toast.error(t.common.failed) }
    }

    const handleDeletePlan = async () => {
        try {
            const res = await fetch(`/api/plans/${deletePlanConfirm.planId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success(t.common.success);
                setDeletePlanConfirm({ isOpen: false, planId: '', title: '' });
                fetchPlans();
            }
        } catch { toast.error(t.common.failed) }
    }

    const handleBroadcast = async () => {
        if (!broadcastData.title || !broadcastData.message || broadcastData.targetRoles.length === 0) {
            toast.error('Lengkapi data broadcast');
            return;
        }
        setSendingBroadcast(true);
        try {
            const res = await fetch('/api/admin/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(broadcastData),
            });
            if (res.ok) {
                toast.success('Broadcast terkirim!');
                setBroadcastData({ title: '', message: '', targetRoles: ['user', 'sen_user'] });
                fetchNotifications();
            }
        } catch { toast.error(t.common.failed) } finally { setSendingBroadcast(false); }
    }

    const toggleMaintenance = async (val: boolean) => {
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'maintenance_mode', value: val, description: 'Prevent non-admin users from accessing the app' }),
            });
            if (res.ok) {
                setIsMaintenance(val);
                toast.success(`Maintenance mode ${val ? 'ON' : 'OFF'}`);
            }
        } catch { toast.error(t.common.failed) }
    }

    const toggleRegistration = async (val: boolean) => {
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'allow_registration', value: val, description: 'Toggle user session sign up availability' }),
            });
            if (res.ok) {
                setAllowRegistration(val);
                toast.success(`Registration system ${val ? 'OPEN' : 'CLOSED'}`);
            }
        } catch { toast.error(t.common.failed) }
    }

    const handleImpersonate = async (userId: string) => {
        setImpersonatingId(userId)
        try {
            const res = await fetch('/api/admin/impersonate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetUserId: userId }), })
            if (res.ok) { const { token } = await res.json(); await signIn('credentials', { impersonateToken: token, redirect: true, callbackUrl: '/dashboard' }); }
        } catch { toast.error(t.common.failed) } finally { setImpersonatingId(null) }
    }

    const filteredUsers = users.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()) || u.name.toLowerCase().includes(searchQuery.toLowerCase()))
    const filteredPlans = plans.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.destination.toLowerCase().includes(searchQuery.toLowerCase()) || p.ownerId?.name?.toLowerCase().includes(searchQuery.toLowerCase()))

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 font-bold mb-20 space-y-12">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                <div className="animate-in slide-in-from-left duration-700">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-50 rounded-xl sm:rounded-[1.5rem] flex items-center justify-center text-amber-500 shadow-2xl shadow-amber-100">
                            <Shield className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter leading-none">Admin Central</h1>
                            <p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] leading-none mt-1">SYSTEM CONTROL CENTER</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap gap-4 animate-in slide-in-from-right duration-700 w-full lg:w-auto">
                    {[
                        { label: 'USERS', val: users.length, icon: UserIcon, color: 'text-primary-600', bg: 'bg-primary-50' },
                        { label: 'PLANS', val: plans.length, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'ALERTS', val: notifications.filter(n => !n.read).length, icon: Bell, color: 'text-rose-600', bg: 'bg-rose-50' }
                    ].map(s => (
                        <div key={s.label} className="bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 flex items-center gap-4 sm:gap-5 shadow-sm hover:shadow-xl transition-all cursor-default group flex-1 min-w-[120px]">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 ${s.bg} rounded-xl sm:rounded-2xl flex items-center justify-center ${s.color} group-hover:scale-110 transition-transform`}><s.icon className="w-5 h-5 sm:w-6 sm:h-6" /></div>
                            <div>
                                <p className="text-[8px] font-black text-gray-400 tracking-[0.2em] mb-1 leading-none uppercase">{s.label}</p>
                                <p className="text-lg sm:text-2xl font-black text-gray-900 leading-none">{s.val}</p>
                            </div>
                        </div>
                    ))}
                    <button onClick={fetchAll} className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-primary-600 hover:rotate-180 transition-all duration-500 shadow-sm hidden sm:flex"><RefreshCw className="w-5 h-5" /></button>
                </div>
            </div>

            <div className="flex gap-2 p-1.5 sm:p-2 bg-gray-50/50 backdrop-blur-sm rounded-2xl sm:rounded-[2.5rem] w-full sm:w-fit border border-gray-100 animate-in fade-in duration-1000 overflow-x-auto no-scrollbar py-2">
                {[
                    { id: 'users', label: 'USERS', icon: Users },
                    { id: 'plans', label: 'ALL PLANS', icon: Calendar },
                    { id: 'notifications', label: 'LOGS', icon: Bell, count: notifications.filter(n => !n.read).length },
                    { id: 'broadcast', label: 'BROADCAST', icon: Megaphone },
                    { id: 'health', label: 'HEALTH', icon: Activity },
                    { id: 'settings', label: 'SYSTEM', icon: Settings }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id as any); setSearchQuery(''); }}
                        className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-[2rem] text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-primary-600 shadow-lg scale-105 border border-primary-50' : 'text-gray-400 hover:text-gray-900'}`}
                    >
                        <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">{tab.label}</span>
                        {tab.count ? <span className="ml-1 sm:ml-2 bg-rose-500 text-white px-1.5 py-0.5 rounded-full text-[7px] sm:text-[8px] animate-pulse">{tab.count}</span> : null}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-[2rem] sm:rounded-[4rem] border border-gray-100 shadow-2xl p-5 sm:p-12 min-h-[600px] animate-in slide-in-from-bottom-8 duration-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-gray-50/30 rounded-full blur-[10rem] -mr-80 -mt-80 -z-10" />

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-4">
                        <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em]">Synchronizing Data...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'users' && (
                            <div className="space-y-10">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                                    <div className="relative w-full max-w-md group">
                                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-primary-600 transition-all font-bold" />
                                        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-14 pr-8 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] outline-none font-black text-gray-900 focus:bg-white focus:border-primary-500 transition-all uppercase placeholder:text-gray-200" placeholder="SEARCH USERS OR ROLES..." />
                                    </div>
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{filteredUsers.length} MEMBERS FOUND</p>
                                </div>

                                <div className="overflow-x-auto bg-white rounded-[2.5rem] border border-gray-50 shadow-sm">
                                    <table className="w-full text-left uppercase text-[10px] border-collapse min-w-[800px]">
                                        <thead>
                                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                                <th className="px-8 py-6 font-black tracking-widest text-gray-400">User Identity</th>
                                                <th className="px-8 py-6 font-black tracking-widest text-gray-400">Permissions</th>
                                                <th className="px-8 py-6 font-black tracking-widest text-gray-400">Registration</th>
                                                <th className="px-8 py-6 font-black tracking-widest text-gray-400 text-right">Management</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {filteredUsers.map(u => (
                                                <tr key={u._id} className="group hover:bg-primary-50/30 transition-all">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-white border-2 border-primary-50 rounded-[1.2rem] flex items-center justify-center text-primary-600 font-black text-lg group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-600 transition-all shadow-sm">{u.name[0]}</div>
                                                            <div>
                                                                <p className="text-gray-900 font-black text-xs leading-none mb-1">{u.name}</p>
                                                                <p className="text-primary-400 font-bold text-[8px] tracking-tight flex items-center gap-1"><AtSign className="w-3 h-3" />{u.username}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        {editingRole === u._id ? (
                                                            <select
                                                                autoFocus
                                                                onBlur={() => setEditingRole(null)}
                                                                onChange={e => updateRole(u._id, e.target.value)}
                                                                className="bg-white border-2 border-primary-500 rounded-xl px-4 py-2 font-black text-[9px] outline-none text-primary-600 shadow-lg"
                                                            >
                                                                <option value="user">USER</option>
                                                                <option value="sen_user">SEN USER</option>
                                                                <option value="superadmin">ADMIN</option>
                                                            </select>
                                                        ) : (
                                                            <button
                                                                onClick={() => setEditingRole(u._id)}
                                                                className={`px-5 py-2 rounded-full text-[7px] font-black tracking-widest border transition-all ${u.role === 'superadmin' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                                    u.role === 'sen_user' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                                                                        'bg-gray-50 text-gray-400 border-gray-100'
                                                                    }`}
                                                            >
                                                                {u.role.replace('_', ' ')}
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="space-y-1">
                                                            <p className="text-gray-400 font-bold">{format(new Date(u.createdAt), 'd MMM yyyy', { locale: dateLocale })}</p>
                                                            <p className="text-gray-300 text-[8px]">LOGGED: {u.lastLoginAt ? format(new Date(u.lastLoginAt), 'HH:mm') : 'NEVER'}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                            <button
                                                                onClick={() => handleImpersonate(u._id)}
                                                                className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                                title="Impersonate User"
                                                            >
                                                                {impersonatingId === u._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                                                            </button>
                                                            <button
                                                                onClick={() => setResetPassModal({ isOpen: true, user: u })}
                                                                className="p-3 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                                                                title="Reset Security"
                                                            >
                                                                <Key className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteUserConfirm({ isOpen: true, userId: u._id, username: u.username })}
                                                                className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                                title="Terminate Account"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'plans' && (
                            <div className="space-y-10">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                                    <div className="relative w-full max-w-md group">
                                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-emerald-600 transition-all" />
                                        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-14 pr-8 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] outline-none font-black text-gray-900 focus:bg-white focus:border-emerald-500 transition-all uppercase placeholder:text-gray-200" placeholder="SEARCH PLANS OR DESTINATIONS..." />
                                    </div>
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{filteredPlans.length} PLANNED TRIPS</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredPlans.map(p => (
                                        <div key={p._id} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
                                            <div className={`absolute top-0 left-0 w-full h-2 ${p.planCategory === 'sen_yas_daddy' ? 'bg-primary-600' : 'bg-emerald-500'}`} />
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-gray-900 group-hover:text-white transition-all"><Calendar className="w-6 h-6" /></div>
                                                <button onClick={() => setDeletePlanConfirm({ isOpen: true, planId: p._id, title: p.title })} className="p-3 text-gray-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                                            </div>
                                            <div className="space-y-2 mb-8">
                                                <h3 className="text-xl font-black uppercase tracking-tight text-gray-900 group-hover:text-primary-600 transition-colors truncate">{p.title}</h3>
                                                <div className="flex items-center gap-2">
                                                    <MapPinIcon className="w-3.5 h-3.5 text-gray-300" />
                                                    <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">{p.destination}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between pt-6 border-t border-dashed border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 text-[10px] font-black border border-primary-100">{p.ownerId?.name?.[0] || 'S'}</div>
                                                    <div>
                                                        <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">OWNER</p>
                                                        <p className="text-[10px] text-gray-900 font-black truncate max-w-[100px]">{p.ownerId?.name || 'SEN SYSTEM'}</p>
                                                    </div>
                                                </div>
                                                <Link href={`/dashboard/plans/${p._id}`} className="p-3 bg-gray-50 text-gray-400 hover:bg-primary-600 hover:text-white rounded-xl transition-all shadow-sm"><ExternalLink className="w-4 h-4" /></Link>
                                            </div>
                                            {p.planCategory === 'sen_yas_daddy' && <span className="absolute top-6 right-6 px-3 py-1 bg-primary-600 text-white rounded-full text-[6px] font-black tracking-widest uppercase shadow-lg">OFFICIAL</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-10">
                                <div className="flex justify-between items-center bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center shadow-lg"><Bell className="w-6 h-6" /></div>
                                        <div><h2 className="text-2xl font-black uppercase tracking-tight">Activity Logs</h2><p className="text-[9px] font-black text-gray-400 tracking-widest uppercase">RECENT SYSTEM NOTIFICATIONS</p></div>
                                    </div>
                                    <button disabled className="px-8 py-3 bg-gray-200 text-gray-400 rounded-xl text-[9px] font-black uppercase tracking-widest">CLEAR ALL</button>
                                </div>
                                <div className="space-y-4">
                                    {notifications.length === 0 ? (
                                        <div className="text-center py-40 text-gray-200 font-black uppercase tracking-[0.5em]">No activity detected</div>
                                    ) : (
                                        notifications.map(n => (
                                            <div key={n._id} className={`flex items-start gap-6 p-8 rounded-[2.5rem] border transition-all ${n.read ? 'bg-white border-gray-50 opacity-60' : 'bg-primary-50/20 border-primary-100 shadow-xl'}`}>
                                                <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center ${n.read ? 'bg-gray-100 text-gray-300' : 'bg-white text-primary-600 shadow-sm border border-primary-50'}`}><Megaphone className="w-5 h-5" /></div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-black text-gray-900 uppercase tracking-tight">{n.title}</h4>
                                                        <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">{format(new Date(n.createdAt), 'd MMM, HH:mm')}</span>
                                                    </div>
                                                    <p className="text-gray-500 text-xs font-bold leading-relaxed">{n.message}</p>
                                                    {n.fromUserId && <p className="text-[8px] font-black text-primary-300 uppercase tracking-[0.3em] mt-3">TARGETED BY: {n.fromUserId.name}</p>}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'broadcast' && (
                            <div className="max-w-2xl mx-auto space-y-12 py-10">
                                <div className="text-center space-y-4 mb-16">
                                    <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-primary-50 mb-8"><Megaphone className="w-10 h-10 rotate-12" /></div>
                                    <h2 className="text-3xl font-black uppercase tracking-tight text-gray-900">Push Alert</h2>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-12 leading-loose">SEN YAS DADDY BROADCAST SYSTEM WILL SEND IN-APP NOTIFICATIONS TO ALL SELECTED USER ROLES INSTANTLY.</p>
                                </div>

                                <div className="space-y-8 bg-gray-50/50 p-12 rounded-[3.5rem] border border-gray-100">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Target Groups</label>
                                        <div className="flex flex-wrap gap-4">
                                            {[
                                                { id: 'user', label: 'REGULAR USERS' }, { id: 'sen_user', label: 'SEN USERS' }, { id: 'superadmin', label: 'ADMINISTRATORS' }
                                            ].map(role => (
                                                <button
                                                    key={role.id}
                                                    onClick={() => {
                                                        const roles = [...broadcastData.targetRoles];
                                                        if (roles.includes(role.id)) setBroadcastData({ ...broadcastData, targetRoles: roles.filter(r => r !== role.id) });
                                                        else setBroadcastData({ ...broadcastData, targetRoles: [...roles, role.id] });
                                                    }}
                                                    className={`px-8 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${broadcastData.targetRoles.includes(role.id) ? 'bg-primary-600 text-white shadow-xl shadow-primary-100' : 'bg-white text-gray-400 border border-gray-100'}`}
                                                >
                                                    {broadcastData.targetRoles.includes(role.id) && '✓ '} {role.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Alert Title</label>
                                        <input
                                            type="text"
                                            value={broadcastData.title}
                                            onChange={e => setBroadcastData({ ...broadcastData, title: e.target.value })}
                                            className="w-full px-8 py-5 bg-white border border-gray-100 rounded-[1.8rem] outline-none font-black text-gray-900 focus:border-primary-500 transition-all uppercase placeholder:text-gray-200 shadow-sm"
                                            placeholder="BROADCAST HEADING"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Message Content</label>
                                        <textarea
                                            rows={6}
                                            value={broadcastData.message}
                                            onChange={e => setBroadcastData({ ...broadcastData, message: e.target.value })}
                                            className="w-full px-8 py-6 bg-white border border-gray-100 rounded-[2.5rem] outline-none font-black text-gray-900 focus:border-primary-500 transition-all uppercase placeholder:text-gray-200 shadow-sm resize-none"
                                            placeholder="WRITE YOUR MESSAGE HERE..."
                                        />
                                    </div>

                                    <button
                                        onClick={handleBroadcast}
                                        disabled={sendingBroadcast}
                                        className="w-full py-6 bg-primary-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-primary-100 hover:bg-primary-700 transition-all disabled:opacity-50 flex items-center justify-center gap-4"
                                    >
                                        {sendingBroadcast ? <Loader2 className="w-5 h-5 animate-spin" /> : <Megaphone className="w-5 h-5" />}
                                        {sendingBroadcast ? 'TRANSMITTING...' : 'INITIATE BROADCAST'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'health' && (
                            <div className="space-y-12 animate-in fade-in zoom-in duration-500">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                                    <div>
                                        <h2 className="text-3xl font-black uppercase tracking-tight text-gray-900">System Vitality</h2>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Real-time performance & infrastructure metrics</p>
                                    </div>
                                    <button onClick={fetchHealth} disabled={fetchingHealth} className="px-6 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-xl flex items-center gap-2">
                                        {fetchingHealth ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                        Refresh Metrics
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 shadow-sm space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center"><Database className="w-6 h-6" /></div>
                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${healthData?.database.status === 'Healthy' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>{healthData?.database.status || '...'}</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">MDB LATENCY</p>
                                            <p className="text-3xl font-black text-gray-900 tracking-tighter">{healthData?.database.latency || '0ms'}</p>
                                        </div>
                                    </div>

                                    <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 shadow-sm space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="w-12 h-12 bg-primary-50 text-primary-500 rounded-2xl flex items-center justify-center"><Zap className="w-6 h-6" /></div>
                                            <span className="px-3 py-1 bg-primary-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest">OPERATIONAL</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">SERVER UPTIME</p>
                                            <p className="text-3xl font-black text-gray-900 tracking-tighter">{healthData?.system.uptime || '...'}</p>
                                        </div>
                                    </div>

                                    <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 shadow-sm space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center"><Cpu className="w-6 h-6" /></div>
                                            <span className="px-3 py-1 bg-indigo-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest">NODE.JS</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">MEMORY (RSS)</p>
                                            <p className="text-3xl font-black text-gray-900 tracking-tighter">{healthData?.system.memoryUsage || '...'}</p>
                                        </div>
                                    </div>

                                    <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 shadow-sm space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center"><Shield className="w-6 h-6" /></div>
                                            <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest">SECURITY</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">OS PLATFORM</p>
                                            <p className="text-3xl font-black text-gray-900 tracking-tighter uppercase">{healthData?.system.platform || '...'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 bg-gray-900 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 border-4 border-gray-800 shadow-2xl">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-emerald-500 text-white rounded-3xl flex items-center justify-center shadow-xl animate-pulse"><Activity className="w-8 h-8" /></div>
                                        <div>
                                            <h4 className="text-xl font-black uppercase tracking-tight">System Status: All Green</h4>
                                            <p className="text-xs font-bold text-gray-400 leading-relaxed mt-1 uppercase tracking-tight">No critical issues reported across all server clusters. Core API and database nodes are fully operational.</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.3em] mb-1">LAST HEARTBEAT</p>
                                        <p className="text-sm font-black text-emerald-400">{healthData ? format(new Date(healthData.timestamp), 'HH:mm:ss') : '--:--:--'}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="max-w-2xl mx-auto space-y-12 py-10">
                                <div className="text-center space-y-4 mb-20">
                                    <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-amber-50 mb-8"><Settings className="w-10 h-10 animate-spin-slow" /></div>
                                    <h2 className="text-3xl font-black uppercase tracking-tight text-gray-900">System Overrides</h2>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-12">CRITICAL GLOBAL CONFIGURATIONS. MODIFY WITH EXTREME CAUTION.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className={`p-10 rounded-[3rem] border-2 transition-all flex items-center justify-between ${isMaintenance ? 'bg-rose-50 border-rose-100 animate-pulse' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className="flex items-center gap-6">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${isMaintenance ? 'bg-rose-600 text-white' : 'bg-white text-gray-300'}`}><AlertTriangle className="w-7 h-7" /></div>
                                            <div>
                                                <h4 className={`text-lg font-black uppercase tracking-tight ${isMaintenance ? 'text-rose-600' : 'text-gray-600'}`}>Maintenance Mode</h4>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Blocks all non-superadmin access</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleMaintenance(!isMaintenance)}
                                            className={`w-20 h-10 rounded-full p-1 transition-all flex items-center ${isMaintenance ? 'bg-rose-600 justify-end' : 'bg-gray-200 justify-start'}`}
                                        >
                                            <div className="w-8 h-8 bg-white rounded-full shadow-lg" />
                                        </button>
                                    </div>

                                    <div className={`p-10 rounded-[3rem] border-2 transition-all flex items-center justify-between ${allowRegistration ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className="flex items-center gap-6">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${allowRegistration ? 'bg-emerald-500 text-white' : 'bg-white text-gray-300'}`}><UserIcon className="w-7 h-7" /></div>
                                            <div>
                                                <h4 className={`text-lg font-black uppercase tracking-tight ${allowRegistration ? 'text-emerald-600' : 'text-gray-600'}`}>New Registration</h4>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Toggle user sign up system</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleRegistration(!allowRegistration)}
                                            className={`w-20 h-10 rounded-full p-1 transition-all flex items-center ${allowRegistration ? 'bg-emerald-500 justify-end' : 'bg-gray-200 justify-start'}`}
                                        >
                                            <div className="w-8 h-8 bg-white rounded-full shadow-lg" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-10 bg-indigo-50 border border-indigo-100 rounded-[3rem] flex items-center gap-8">
                                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-indigo-600 shadow-xl shrink-0"><RefreshCw className="w-8 h-8" /></div>
                                    <div>
                                        <h4 className="text-xl font-black uppercase tracking-tight text-indigo-900">Force Rehash</h4>
                                        <p className="text-xs font-bold text-indigo-600/60 leading-relaxed mt-1 uppercase tracking-tighter">Emergency command to reconnect all system modules and clear server-side cache. Only use if UI is desynced.</p>
                                        <button disabled className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl text-[8px] font-black uppercase tracking-widest opacity-50">EXECUTE REHASH</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modals Overhaul */}
            {resetPassModal.isOpen && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/70 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-white rounded-[4rem] w-full max-w-md p-12 text-center shadow-2xl animate-in zoom-in-95 font-bold">
                        <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-amber-50">
                            <Key className="w-10 h-10" />
                        </div>
                        <h3 className="text-3xl font-black uppercase mb-3 tracking-tighter text-gray-900">Security Reset</h3>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-10">FORCING NEW ACCESS CREDENTIALS FOR<br /><span className="text-amber-500">@{resetPassModal.user?.username}</span></p>

                        <div className="flex flex-col gap-4">
                            <input
                                autoFocus
                                type="text"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full px-8 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] outline-none text-center font-black text-xl tracking-widest text-gray-900 focus:bg-white focus:border-amber-500 transition-all uppercase"
                                placeholder="TYPE NEW PASSCODE"
                            />
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={handleResetPassword}
                                    disabled={isUpdatingPassword || !newPassword.trim()}
                                    className="flex-1 py-5 bg-amber-500 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl shadow-amber-100 hover:bg-amber-600 transition-all disabled:opacity-50"
                                >
                                    {isUpdatingPassword ? 'UPDATING...' : 'CONFIRM RESET'}
                                </button>
                                <button
                                    onClick={() => { setResetPassModal({ isOpen: false, user: null }); setNewPassword(''); }}
                                    className="px-8 py-5 text-gray-300 font-black uppercase text-xs tracking-widest hover:text-gray-900 transition-all"
                                >
                                    CANCEL
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={deleteUserConfirm.isOpen}
                onClose={() => setDeleteUserConfirm({ ...deleteUserConfirm, isOpen: false })}
                onConfirm={handleDeleteUser}
                title="Account Termination"
                message={`CRITICAL: This will permanently erase user @${deleteUserConfirm.username} and all associated metadata. This action is IRREVERSIBLE.`}
                confirmText="TERMINATE ACCOUNT"
                variant="danger"
            />

            <ConfirmModal
                isOpen={deletePlanConfirm.isOpen}
                onClose={() => setDeletePlanConfirm({ ...deletePlanConfirm, isOpen: false })}
                onConfirm={handleDeletePlan}
                title="Schedules Eradication"
                message={`This will permanently remove trip "${deletePlanConfirm.title}". All rundown items, expenses, and split bills will be lost forever.`}
                confirmText="ERADICATE PLAN"
                variant="danger"
            />

            <style jsx global>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    )
}

function MapPinIcon(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" ><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
}
