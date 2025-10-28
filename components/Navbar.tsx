'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import { Menu, X, LogOut, LayoutDashboard, Home } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="/logo.png"
              alt="SEN YAS DADDY"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-xl font-bold text-primary-600 hidden sm:block">
              SEN YAS DADDY
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/'
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Beranda</span>
            </Link>

            {session && (
              <Link
                href="/dashboard"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                  pathname.startsWith('/dashboard')
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
            )}

            {session ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">{session.user.name}</span>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-primary-50"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/'
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Beranda</span>
            </Link>

            {session && (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                  pathname.startsWith('/dashboard')
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
            )}

            {session ? (
              <div className="space-y-2">
                <div className="px-3 py-2 text-sm text-gray-700">{session.user.name}</div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    signOut({ callbackUrl: '/' })
                  }}
                  className="flex items-center space-x-2 w-full px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-center"
              >
                Login
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
