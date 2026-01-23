'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import { Menu, X, LogOut, LayoutDashboard, Home, UserPlus, LogIn, Settings, Trash2, Shield, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const username = (session?.user as any)?.username
  const userRole = (session?.user as any)?.role

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
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
              /* User Menu Dropdown */
              <div className="relative ml-3" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
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
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${pathname === '/settings'
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <Settings className="w-5 h-5" />
                  Settings
                </Link>

                <Link
                  href="/trash"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${pathname === '/trash'
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:bg-gray-50'
                    }`}
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
  )
}
