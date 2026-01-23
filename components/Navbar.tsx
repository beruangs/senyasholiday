'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import { Menu, X as XIcon, LogOut, LayoutDashboard, Home, UserPlus, LogIn, Settings, Trash2, Shield, ChevronDown, Bell, Check, XCircle, Loader2, Calendar } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'

interface Notification {
  _id: string
  type: 'admin_invite' | 'admin_invite_accepted' | 'admin_invite_rejected' | 'admin_removed' | 'general'
  title: string
  message: string
  read: boolean
  responded: boolean
  plan?: { _id: string; title: string; destination: string }
  fromUser?: { _id: string; username: string; name: string }
  createdAt: string
}

export default function Navbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifMenuOpen, setNotifMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [respondingId, setRespondingId] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null)

  const userMenuRef = useRef<HTMLDivElement>(null)
  const notifMenuRef = useRef<HTMLDivElement>(null)
  const mobileNotifMenuRef = useRef<HTMLDivElement>(null)

  const username = userProfile?.username || (session?.user as any)?.username
  const userRole = userProfile?.role || (session?.user as any)?.role
  const userId = session?.user?.id
  const isEnvAdmin = userProfile?.isEnvAdmin ?? userId?.startsWith('env-')

  // Debug session
  useEffect(() => {
    if (session) {
      console.log('Navbar Session:', {
        user: session.user,
        userId,
        userRole,
        isEnvAdmin
      })
    }
  }, [session, userId, userRole, isEnvAdmin])

  // Fetch notifications and live profile
  useEffect(() => {
    if (session) {
      fetchNotifications()
      fetchUserProfile()
      // Refresh notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [session])

  const fetchUserProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        setUserProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()

        // Detect if there are new 'admin_removed' or 'admin_invite_accepted' notifications
        // that require a dashboard refresh
        const newSpecialNotifs = data.filter((n: any) =>
          (n.type === 'admin_removed' || n.type === 'admin_invite_accepted') && !n.read
        )
        const oldSpecialNotifs = notifications.filter(n =>
          (n.type === 'admin_removed' || n.type === 'admin_invite_accepted') && !n.read
        )

        if (newSpecialNotifs.length > oldSpecialNotifs.length) {
          window.dispatchEvent(new Event('plans-updated'))
        }

        setNotifications(data)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false)
      }

      const isInsideDesktop = notifMenuRef.current?.contains(target)
      const isInsideMobile = mobileNotifMenuRef.current?.contains(target)

      if (!isInsideDesktop && !isInsideMobile) {
        setNotifMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInviteResponse = async (notificationId: string, action: 'accept' | 'reject') => {
    setRespondingId(notificationId)
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, action }),
      })

      if (res.ok) {
        toast.success(action === 'accept' ? 'Undangan diterima!' : 'Undangan ditolak')
        fetchNotifications()
        // Notify other components to refresh plans
        if (action === 'accept') {
          window.dispatchEvent(new Event('plans-updated'))
        }
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal merespon undangan')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    } finally {
      setRespondingId(null)
    }
  }

  const dismissNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications?id=${notificationId}`, { method: 'DELETE' })
      fetchNotifications()
    } catch (error) {
      console.error('Error dismissing notification:', error)
    }
  }

  const openNotification = async (notif: Notification) => {
    setSelectedNotif(notif)
    if (!notif.read) {
      try {
        await fetch('/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationIds: [notif._id] })
        })
        fetchNotifications()
      } catch (error) {
        console.error('Error marking as read:', error)
      }
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/logo.png"
                alt="SEN YAS DADDY"
                width={36}
                height={36}
                className="rounded-lg"
              />
              <span className="text-lg font-bold text-primary-600 hidden sm:block">
                SEN YAS DADDY
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <Link
                href="/"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === '/'
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                  }`}
              >
                <Home className="w-4 h-4 inline-block mr-1.5" />
                Beranda
              </Link>

              {session && (
                <Link
                  href="/dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.startsWith('/dashboard')
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                    }`}
                >
                  <LayoutDashboard className="w-4 h-4 inline-block mr-1.5" />
                  Dashboard
                </Link>
              )}

              {session && userRole === 'superadmin' && (
                <Link
                  href="/superadmin"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.startsWith('/superadmin')
                    ? 'text-amber-600 bg-amber-50'
                    : 'text-gray-600 hover:text-amber-600 hover:bg-amber-50'
                    }`}
                >
                  <Shield className="w-4 h-4 inline-block mr-1.5" />
                  Admin
                </Link>
              )}

              {session ? (
                <div className="flex items-center gap-2 ml-3">
                  {/* Notification Bell */}
                  <div className="relative" ref={notifMenuRef}>
                    <button
                      onClick={() => {
                        setNotifMenuOpen(!notifMenuOpen)
                        setUserMenuOpen(false)
                      }}
                      className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notification Dropdown */}
                    {notifMenuOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900">Notifikasi</h3>
                          {notifications.length > 0 && (
                            <span className="text-xs text-gray-500">{notifications.length}</span>
                          )}
                        </div>

                        <div className="max-h-80 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-500">
                              <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                              <p className="text-sm">Tidak ada notifikasi</p>
                            </div>
                          ) : (
                            notifications.map((notif) => (
                              <div
                                key={notif._id}
                                onClick={() => openNotification(notif)}
                                className={`group relative px-4 py-3 border-b border-gray-50 hover:bg-gray-50/80 transition-all cursor-pointer ${!notif.read ? 'bg-primary-50/30' : ''}`}
                              >
                                {/* Dismiss Button X */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    dismissNotification(notif._id)
                                  }}
                                  className="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all z-10"
                                  title="Hapus"
                                >
                                  <XIcon className="w-3.5 h-3.5" />
                                </button>

                                <p className="font-semibold text-sm text-gray-900 mb-0.5 pr-6">
                                  {notif.title}
                                </p>
                                <p className="text-xs text-gray-600 mb-2 leading-relaxed line-clamp-2">
                                  {notif.message}
                                </p>

                                {/* Action buttons for admin_invite */}
                                {notif.type === 'admin_invite' && (
                                  <div className="flex gap-2 mb-2">
                                    <button
                                      onClick={() => handleInviteResponse(notif._id, 'accept')}
                                      disabled={respondingId === notif._id}
                                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-[11px] font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
                                    >
                                      {respondingId === notif._id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Check className="w-3 h-3" />
                                      )}
                                      Terima
                                    </button>
                                    <button
                                      onClick={() => handleInviteResponse(notif._id, 'reject')}
                                      disabled={respondingId === notif._id}
                                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-[11px] font-bold rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                                    >
                                      <XCircle className="w-3 h-3" />
                                      Tolak
                                    </button>
                                  </div>
                                )}

                                <p className="text-[10px] text-gray-400 font-medium">
                                  {new Date(notif.createdAt).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User Menu Dropdown */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => {
                        setUserMenuOpen(!userMenuOpen)
                        setNotifMenuOpen(false)
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors border border-gray-200"
                    >
                      <Menu className="w-4 h-4" />
                      <span className="max-w-[100px] truncate">{session.user?.name}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
                          {username && (
                            <p className="text-xs text-gray-500">@{username}</p>
                          )}
                          {userRole && userRole !== 'user' && (
                            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${userRole === 'superadmin' ? 'bg-amber-100 text-amber-700' : 'bg-primary-100 text-primary-700'
                              }`}>
                              {userRole === 'superadmin' ? 'Superadmin' : 'SEN User'}
                            </span>
                          )}
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                          <Link
                            href="/settings"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Settings className="w-4 h-4 text-gray-400" />
                            Settings
                          </Link>
                          <Link
                            href="/trash"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-gray-400" />
                            Trash
                          </Link>
                        </div>

                        {/* Logout */}
                        <div className="border-t border-gray-100 pt-1">
                          <button
                            onClick={() => {
                              setUserMenuOpen(false)
                              signOut({ callbackUrl: '/' })
                            }}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Log Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2 ml-3">
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 rounded-lg transition-colors"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Daftar
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center gap-2 md:hidden">
              {/* Mobile Notification Bell */}
              {session && (
                <button
                  onClick={() => setNotifMenuOpen(!notifMenuOpen)}
                  className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                {mobileMenuOpen ? <XIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>



          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-1 border-t border-gray-100">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${pathname === '/'
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Home className="w-5 h-5" />
                Beranda
              </Link>

              {session && (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${pathname.startsWith('/dashboard')
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    Dashboard
                  </Link>

                  {userRole === 'superadmin' && (
                    <Link
                      href="/superadmin"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${pathname.startsWith('/superadmin')
                        ? 'text-amber-600 bg-amber-50'
                        : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      <Shield className="w-5 h-5" />
                      Admin
                    </Link>
                  )}

                  <Link
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Settings className="w-5 h-5" />
                    Settings
                  </Link>

                  <Link
                    href="/trash"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Trash2 className="w-5 h-5" />
                    Trash
                  </Link>
                </>
              )}

              {session ? (
                <div className="pt-3 mt-3 border-t border-gray-100">
                  <div className="px-3 py-2 mb-2">
                    <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
                    {username && (
                      <p className="text-xs text-gray-500">@{username}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      signOut({ callbackUrl: '/' })
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <LogOut className="w-5 h-5" />
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pt-3 mt-3 border-t border-gray-100">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    <LogIn className="w-5 h-5" />
                    Masuk
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    <UserPlus className="w-5 h-5" />
                    Daftar
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Notification Fullscreen Overlay */}
      {notifMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-[1000] flex flex-col animate-in slide-in-from-right duration-300" ref={mobileNotifMenuRef}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary-600" />
              <h3 className="font-black text-gray-900">Notifikasi</h3>
            </div>
            <button
              onClick={() => setNotifMenuOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XIcon className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 bg-gray-50">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Bell className="w-16 h-16 text-gray-200 mb-4" />
                <p className="text-gray-500 font-bold">Tidak ada notifikasi</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div
                    key={notif._id}
                    onClick={() => {
                      setNotifMenuOpen(false)
                      openNotification(notif)
                    }}
                    className={`relative bg-white border border-gray-100 rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-all ${!notif.read ? 'border-primary-100 bg-primary-50/20' : ''}`}
                  >
                    {!notif.read && (
                      <div className="absolute top-4 right-4 w-2 h-2 bg-primary-600 rounded-full" />
                    )}
                    <p className="font-black text-gray-900 mb-1 pr-4">{notif.title}</p>
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 mb-3">{notif.message}</p>

                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-gray-400 font-bold">
                        {new Date(notif.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>

                      {notif.type === 'admin_invite' && !notif.responded && (
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleInviteResponse(notif._id, 'accept')
                            }}
                            disabled={respondingId === notif._id}
                            className="px-3 py-1 bg-green-600 text-white text-[10px] font-black rounded-lg"
                          >
                            Terima
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleInviteResponse(notif._id, 'reject')
                            }}
                            disabled={respondingId === notif._id}
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-[10px] font-black rounded-lg"
                          >
                            Tolak
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer / Mark all as read */}
          {notifications.some(n => !n.read) && (
            <div className="p-4 border-t border-gray-100 bg-white sticky bottom-0">
              <button
                onClick={async () => {
                  try {
                    await fetch('/api/notifications', { method: 'PUT', body: JSON.stringify({}) })
                    fetchNotifications()
                  } catch (e) { }
                }}
                className="w-full py-3 bg-gray-50 text-gray-600 text-sm font-black rounded-xl hover:bg-gray-100 transition-colors shadow-sm"
              >
                Tandai semua sudah dibaca
              </button>
            </div>
          )}
        </div>
      )}

      {/* Notification Detail Modal */}
      {selectedNotif && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-primary-600 px-6 py-6 text-white relative">
              <button
                onClick={() => setSelectedNotif(null)}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 mb-2">
                <Bell className="w-6 h-6 text-primary-200" />
                <span className="text-xs font-black uppercase tracking-widest text-primary-200">Notifikasi</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black leading-tight">
                {selectedNotif.title}
              </h2>
            </div>

            {/* Modal Content */}
            <div className="p-6 sm:p-8">
              <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                <p className="text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">
                  {selectedNotif.message}
                </p>
              </div>

              {selectedNotif.type === 'admin_invite' && !selectedNotif.responded && (
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <button
                    onClick={() => {
                      handleInviteResponse(selectedNotif._id, 'accept')
                      setSelectedNotif(null)
                    }}
                    disabled={respondingId === selectedNotif._id}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-100 disabled:opacity-50"
                  >
                    <Check className="w-5 h-5" />
                    Terima Undangan
                  </button>
                  <button
                    onClick={() => {
                      handleInviteResponse(selectedNotif._id, 'reject')
                      setSelectedNotif(null)
                    }}
                    disabled={respondingId === selectedNotif._id}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-black rounded-xl hover:bg-gray-200 transition-all"
                  >
                    <XCircle className="w-5 h-5" />
                    Tolak
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-400 font-bold border-t border-gray-100 pt-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {new Date(selectedNotif.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <span>
                  {new Date(selectedNotif.createdAt).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setSelectedNotif(null)}
                className="px-6 py-2.5 bg-white border-2 border-gray-200 text-gray-600 font-black text-sm rounded-xl hover:bg-gray-50 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
