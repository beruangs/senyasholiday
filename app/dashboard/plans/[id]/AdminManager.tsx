'use client'

import { useState, useEffect } from 'react'
import { UserPlus, X, Crown, User, Check, Loader2, AtSign, Trash2, Clock, XCircle, Shield, Sparkles } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { useLanguage } from '@/context/LanguageContext'

interface Admin { _id: string; username: string; name: string; status?: 'confirmed' | 'pending'; }
interface AdminManagerProps { planId: string; isOwner: boolean; isSenPlan?: boolean; userRole?: string; }

export default function AdminManager({ planId, isOwner, isSenPlan, userRole }: AdminManagerProps) {
    const { language, t } = useLanguage(); const { data: session } = useSession()
    const [owner, setOwner] = useState<Admin | null>(null); const [admins, setAdmins] = useState<Admin[]>([]); const [pendingAdmins, setPendingAdmins] = useState<Admin[]>([]); const [loading, setLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false); const [usernameInput, setUsernameInput] = useState(''); const [checking, setChecking] = useState(false); const [userFound, setUserFound] = useState<Admin | null>(null); const [checkError, setCheckError] = useState('')
    const [adding, setAdding] = useState(false); const [removingId, setRemovingId] = useState<string | null>(null)

    const canManage = isOwner || (isSenPlan && userRole === 'superadmin')
    const isPremium = (session?.user as any)?.isPremium || userRole === 'superadmin'
    const adminCount = admins.length + pendingAdmins.length
    const reachedLimit = !isPremium && adminCount >= 1

    useEffect(() => { fetchAdmins() }, [planId])

    const fetchAdmins = async () => {
        try {
            const res = await fetch(`/api/plans/${planId}/admins`)
            if (res.ok) { const d = await res.json(); setOwner(d.owner); setAdmins(d.admins || []); setPendingAdmins(d.pendingAdmins || []); }
        } catch { toast.error(t.common.failed) } finally { setLoading(false) }
    }

    useEffect(() => {
        const clean = usernameInput.trim().toLowerCase().replace(/^@/, '')
        if (clean.length < 3) { setUserFound(null); setCheckError(''); return; }
        setChecking(true); setCheckError(''); setUserFound(null);
        const timeout = setTimeout(async () => {
            try {
                const res = await fetch(`/api/plans/admin-invite?username=${clean}`)
                const data = await res.json()
                if (data.exists) {
                    if (data.error) setCheckError(data.error);
                    else if (owner && data.user.username === owner.username) setCheckError(language === 'id' ? 'Ini Owner' : 'Owner');
                    else if (admins.some(a => a.username === data.user.username) || pendingAdmins.some(a => a.username === data.user.username)) setCheckError(language === 'id' ? 'Sudah Ada' : 'Exists');
                    else setUserFound(data.user);
                } else setCheckError(language === 'id' ? 'Tidak Ada' : 'Not Found');
            } catch { setCheckError('Error') } finally { setChecking(false) }
        }, 500)
        return () => clearTimeout(timeout)
    }, [usernameInput])

    const handleAdd = async () => {
        if (!userFound) return; setAdding(true);
        try {
            const res = await fetch('/api/plans/admin-invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId, username: userFound.username }), })
            if (res.ok) { toast.success(t.common.success); setUsernameInput(''); setUserFound(null); setShowAddForm(false); fetchAdmins(); }
        } catch { toast.error(t.common.failed) } finally { setAdding(false) }
    }

    const handleRemove = async (adminId: string, type: 'admin' | 'pending') => {
        if (!confirm(t.common.confirm_delete)) return; setRemovingId(adminId)
        try {
            const res = await fetch(`/api/plans/admin-invite?planId=${planId}&userId=${adminId}&type=${type}`, { method: 'DELETE' })
            if (res.ok) { toast.success(t.common.success); fetchAdmins(); }
        } catch { toast.error(t.common.failed) } finally { setRemovingId(null) }
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6 text-primary-600" /></div>

    return (
        <div className="space-y-8 font-bold">
            <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <h3 className="text-lg font-black uppercase tracking-tight font-bold">{language === 'id' ? 'TIM EDITOR' : 'EDITOR TEAM'}</h3>
                {canManage && !showAddForm && (
                    <button
                        onClick={() => {
                            if (reachedLimit) {
                                toast.error('Limit Editor Tercapai', { description: 'Upgrade ke Premium untuk mengundang lebih banyak teman.' });
                                return;
                            }
                            setShowAddForm(true);
                        }}
                        className={`px-5 py-2 rounded-xl font-black text-[9px] uppercase shadow-lg transition-all flex items-center gap-2 ${reachedLimit ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary-600 text-white shadow-primary-50 active:scale-95'}`}
                    >
                        {reachedLimit && <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />}
                        INVITE
                    </button>
                )}
            </div>

            {showAddForm && (
                <div className="bg-white rounded-[1.5rem] p-6 border border-primary-100 shadow-xl space-y-5 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex justify-between items-center"><span className="text-[9px] font-black uppercase text-gray-400">Invite by Username</span><button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-gray-50 rounded-lg transition-all"><X className="w-4 h-4 text-gray-300" /></button></div>
                    <div className="relative group"><AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 group-focus-within:text-primary-600 transition-all font-bold" /><input type="text" value={usernameInput} autoFocus onChange={e => setUsernameInput(e.target.value)} placeholder="USERNAME" className="w-full pl-10 pr-5 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-black text-sm focus:bg-white focus:border-primary-500 transition-all" /></div>
                    {userFound && (<div className="flex justify-between items-center p-4 bg-primary-50/50 rounded-xl border border-primary-100"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center text-white text-[10px] font-black">{userFound.name[0]}</div><div><p className="text-xs font-black text-gray-900">{userFound.name}</p><p className="text-[9px] text-primary-400 font-bold">@{userFound.username}</p></div></div><button onClick={handleAdd} disabled={adding} className="px-4 py-2 bg-primary-600 text-white rounded-lg font-black text-[9px] uppercase shadow-md transition-all active:scale-90">{adding ? '...' : 'SEND'}</button></div>)}
                    {checkError && <p className="text-[9px] text-rose-500 uppercase font-black tracking-widest">{checkError}</p>}
                    {checking && <p className="text-[9px] text-primary-400 uppercase font-black tracking-widest animate-pulse">Checking...</p>}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-5 bg-white border border-gray-100 rounded-[1.2rem] flex items-center gap-4 shadow-sm relative overflow-hidden group hover:border-amber-100 hover:shadow-md transition-all">
                    <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:scale-110 transition-all"><Crown className="w-8 h-8 text-amber-600" /></div>
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 font-black text-lg uppercase shadow-sm">O</div>
                    <div><p className="text-xs font-black text-gray-900 leading-none mb-1">{owner?.name}</p><p className="text-[8px] text-gray-400 font-bold">@{owner?.username}</p></div>
                    <span className="ml-auto px-2.5 py-1 bg-amber-600 text-white rounded-full text-[6px] font-black uppercase shadow-sm">OWNER</span>
                </div>
                {admins.map(a => (<div key={a._id} className="p-5 bg-white border border-gray-100 rounded-[1.2rem] flex items-center gap-4 shadow-sm hover:border-primary-100 hover:shadow-md transition-all"><div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 font-black text-lg uppercase">{a.name[0]}</div><div><p className="text-xs font-black text-gray-900 leading-none mb-1">{a.name}</p><p className="text-[8px] text-gray-400 font-bold">@{a.username}</p></div><div className="ml-auto flex items-center gap-1.5"><span className="px-2.5 py-1 bg-gray-50 text-gray-400 rounded-full text-[6px] font-black uppercase">EDITOR</span>{canManage && <button onClick={() => handleRemove(a._id, 'admin')} className="p-2 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>}</div></div>))}
                {pendingAdmins.map(a => (<div key={a._id} className="p-5 bg-gray-50/50 border border-gray-100 rounded-[1.2rem] flex items-center gap-4 relative opacity-70 group hover:opacity-100 transition-all"><div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-300 font-black text-lg uppercase">{a.name[0]}</div><div><p className="text-xs font-black text-gray-900 leading-none mb-1">{a.name}</p><p className="text-[7px] text-primary-400 font-black tracking-widest mt-0.5">PENDING</p></div><div className="ml-auto">{canManage && <button onClick={() => handleRemove(a._id, 'pending')} className="p-2 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><XCircle className="w-3.5 h-3.5" /></button>}</div></div>))}
            </div>
            {admins.length === 0 && pendingAdmins.length === 0 && <div className="text-center py-10 bg-gray-50/30 rounded-[1.5rem] border border-dashed border-gray-200 font-black uppercase text-gray-300 text-[9px] tracking-[0.3em]">No collaborators yet</div>}
        </div>
    )
}
