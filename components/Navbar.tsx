'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import { Menu, X as XIcon, LogOut, LayoutDashboard, Home, UserPlus, LogIn, Settings, Trash2, Shield, ChevronDown, Bell, Check, XCircle, Loader2, Calendar, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/context/LanguageContext'

interface Notification { _id: string; type: string; title: string; message: string; read: boolean; responded: boolean; createdAt: string; }

export default function Navbar() {
  const pathname = usePathname(); const { data: session } = useSession(); const { language, t } = useLanguage()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); const [userMenuOpen, setUserMenuOpen] = useState(false); const [notifMenuOpen, setNotifMenuOpen] = useState(false); const [notifications, setNotifications] = useState<Notification[]>([]); const [respondingId, setRespondingId] = useState<string | null>(null); const [userProfile, setUserProfile] = useState<any>(null); const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null)
  const userMenuRef = useRef<HTMLDivElement>(null); const notifMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (session) { fetchNotifications(); fetchUserProfile(); const i = setInterval(fetchNotifications, 30000); return () => clearInterval(i); }
  }, [session])

  const fetchUserProfile = async () => { try { const res = await fetch('/api/user/profile'); if (res.ok) setUserProfile(await res.json()); } catch { } }
  const fetchNotifications = async () => { try { const res = await fetch('/api/notifications'); if (res.ok) setNotifications(await res.json()); } catch { } }

  const handleInviteResponse = async (notificationId: string, action: 'accept' | 'reject') => {
    setRespondingId(notificationId)
    try {
      const res = await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notificationId, action }), })
      if (res.ok) { toast.success(action === 'accept' ? 'ACCEPTED' : 'REJECTED'); fetchNotifications(); if (action === 'accept') window.dispatchEvent(new Event('plans-updated')); }
    } catch { toast.error(t.common.failed) } finally { setRespondingId(null) }
  }

  const unreadCount = notifications.filter(n => !n.read).length
  const userRole = userProfile?.role || (session?.user as any)?.role

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-[1000] font-bold">
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3"><Image src="/logo.png" alt="LOGO" width={40} height={40} className="rounded-xl shadow-inner" /><span className="text-xl font-black text-gray-900 hidden sm:block uppercase tracking-tight">SEN Yas Holiday</span></Link>

        <div className="hidden lg:flex items-center gap-2">
          <NavLink href="/" active={pathname === '/'} icon={<Home className="w-4 h-4" />}>{t.common.home}</NavLink>
          {session && <NavLink href="/dashboard" active={pathname.startsWith('/dashboard')} icon={<LayoutDashboard className="w-4 h-4" />}>{t.common.dashboard}</NavLink>}
          {session && userRole === 'superadmin' && <NavLink href="/superadmin" active={pathname.startsWith('/superadmin')} icon={<Shield className="w-4 h-4" />}>ADMIN</NavLink>}

          {session ? (
            <div className="flex items-center gap-4 ml-6 border-l border-gray-100 pl-6">
              <div className="relative">
                <button onClick={() => { setNotifMenuOpen(!notifMenuOpen); setUserMenuOpen(false); }} className={`p-3 rounded-xl transition-all relative ${notifMenuOpen ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' : 'text-gray-400 hover:bg-gray-50'}`}><Bell className="w-5 h-5" />{unreadCount > 0 && <span className="absolute top-0 right-0 w-5 h-5 bg-rose-500 text-white text-[9px] rounded-full flex items-center justify-center font-black border-2 border-white">{unreadCount}</span>}</button>
                {notifMenuOpen && (<div className="absolute right-0 mt-4 w-96 bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-top-2 duration-300 font-bold"><div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center"><h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Notifications</h3><button onClick={async () => { await fetch('/api/notifications', { method: 'PUT', body: JSON.stringify({}) }); fetchNotifications(); }} className="text-[9px] font-black uppercase text-primary-600">Read All</button></div>
                  <div className="max-h-[400px] overflow-y-auto no-scrollbar">{notifications.length === 0 ? <div className="p-20 text-center text-[10px] font-black uppercase text-gray-300">Clean Box</div> : notifications.map(n => (<div key={n._id} onClick={() => { setSelectedNotif(n); setNotifMenuOpen(false); }} className={`p-6 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-all ${!n.read ? 'bg-primary-50/20' : ''}`}><p className="text-[11px] font-black uppercase mb-1">{n.title}</p><p className="text-[10px] text-gray-400 uppercase leading-none truncate">{n.message}</p></div>))}</div></div>)}
              </div>
              <div className="relative">
                <button onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifMenuOpen(false); }} className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all ${userMenuOpen ? 'bg-gray-900 border-gray-900 text-white shadow-xl shadow-gray-200' : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'}`}><Menu className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-widest">{session.user?.name?.split(' ')[0]}</span><ChevronDown className={`w-3 h-3 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} /></button>
                {userMenuOpen && (<div className="absolute right-0 mt-4 w-60 bg-white rounded-[2rem] shadow-2xl border border-gray-100 py-4 animate-in slide-in-from-top-2 duration-300 font-bold"><div className="px-8 py-4 border-b border-gray-50 mb-2"><p className="text-[10px] font-black uppercase text-gray-900">{session.user?.name}</p><p className="text-[8px] font-bold text-gray-400">MANAGED ACCOUNT</p></div><MenuLink href="/settings" icon={<Settings className="w-4 h-4" />} onClick={() => setUserMenuOpen(false)}>{t.common.settings}</MenuLink><MenuLink href="/trash" icon={<Trash2 className="w-4 h-4" />} onClick={() => setUserMenuOpen(false)}>TRASH</MenuLink><div className="mt-4 pt-4 border-t border-gray-50"><button onClick={() => signOut({ callbackUrl: '/' })} className="w-full text-left px-8 py-4 text-[10px] font-black text-rose-500 uppercase flex items-center gap-3 hover:bg-rose-50 transition-all"><LogOut className="w-4 h-4" /> {t.common.logout}</button></div></div>)}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 ml-6"><Link href="/login" className="px-6 py-2 text-[10px] font-black text-gray-400 hover:text-gray-900 uppercase tracking-widest">LOGIN</Link><Link href="/signup" className="px-8 py-3 bg-primary-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary-200">SIGN UP</Link></div>
          )}
        </div>

        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-3 bg-gray-50 rounded-xl text-gray-600">{mobileMenuOpen ? <XIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
      </div>

      {mobileMenuOpen && (<div className="lg:hidden bg-white border-t border-gray-50 p-6 space-y-2 animate-in slide-in-from-top-4 duration-300 font-bold"><NavLink href="/" active={pathname === '/'} wide>{t.common.home}</NavLink>{session && <NavLink href="/dashboard" active={pathname.startsWith('/dashboard')} wide>{t.common.dashboard}</NavLink>}{!session ? (<div className="pt-6 grid grid-cols-2 gap-4"><Link href="/login" className="py-4 text-center border-2 border-gray-100 rounded-2xl text-[10px] font-black uppercase">LOGIN</Link><Link href="/signup" className="py-4 text-center bg-primary-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl shadow-primary-100">SIGN UP</Link></div>) : (<div className="pt-6 space-y-2 border-t border-gray-50 mt-6"><NavLink href="/settings" wide>{t.common.settings}</NavLink><NavLink href="/trash" wide>TRASH</NavLink><button onClick={() => signOut({ callbackUrl: '/' })} className="w-full py-5 text-center text-rose-500 font-black text-[10px] uppercase bg-rose-50 rounded-2xl mt-4">LOGOUT</button></div>)}</div>)}

      {selectedNotif && (<div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in" onClick={() => setSelectedNotif(null)}><div className="bg-white rounded-[3.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 font-bold" onClick={e => e.stopPropagation()}><div className="bg-primary-600 p-12 text-white"><div className="flex items-center gap-3 mb-4 opacity-60"><Bell className="w-5 h-5" /><span className="text-[10px] font-black uppercase tracking-widest">System Broadcast</span></div><h2 className="text-3xl font-black uppercase tracking-tight leading-tight">{selectedNotif.title}</h2></div><div className="p-12"><div className="bg-gray-50 p-10 rounded-[2.5rem] border border-gray-100 mb-10"><p className="text-lg font-black text-gray-600 uppercase leading-relaxed">{selectedNotif.message}</p></div>{selectedNotif.type === 'admin_invite' && !selectedNotif.responded && (<div className="grid grid-cols-2 gap-4"><button onClick={() => handleInviteResponse(selectedNotif._id, 'accept')} disabled={respondingId === selectedNotif._id} className="py-5 bg-primary-600 text-white rounded-[2rem] font-black uppercase text-[10px] shadow-xl shadow-primary-200">ACCEPT</button><button onClick={() => handleInviteResponse(selectedNotif._id, 'reject')} disabled={respondingId === selectedNotif._id} className="py-5 bg-gray-100 text-gray-500 rounded-[2rem] font-black uppercase text-[10px]">REJECT</button></div>)}<div className="flex justify-between items-center text-[9px] font-black uppercase text-gray-300 mt-10 pt-10 border-t border-gray-50"><div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(selectedNotif.createdAt).toLocaleDateString()}</div><button onClick={() => setSelectedNotif(null)} className="text-gray-900 border-b-2 border-gray-900">DISMISS</button></div></div></div></div>)}
    </nav>
  )
}

function NavLink({ href, active, children, icon, wide }: any) {
  return (<Link href={href} className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${wide ? 'w-full' : ''} ${active ? 'bg-primary-50 text-primary-600 shadow-sm' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}>{icon}{children}</Link>)
}
function MenuLink({ href, icon, children, onClick }: any) {
  return (<Link href={href} onClick={onClick} className="flex items-center gap-4 px-8 py-4 text-[10px] font-black text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-all uppercase tracking-widest">{icon}{children}</Link>)
}
