import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Users, DollarSign, Lock } from 'lucide-react'
import Navbar from '@/components/Navbar'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />

        {/* Hero Section */}
        <section className="py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <Image
                  src="/logo.png"
                  alt="SEN YAS DADDY"
                  width={120}
                  height={120}
                  className="rounded-2xl shadow-lg"
                />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
                SEN YAS DADDY
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8">
                Holiday Planner & Expense Manager
              </p>
              <p className="text-base md:text-lg text-gray-500 max-w-2xl mx-auto mb-8">
                Kelola liburan dengan mudah - dari perencanaan hingga pembagian biaya.
                Transparan, terorganisir, dan menyenangkan!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/plans"
                  className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-lg"
                >
                  Lihat Rencana Liburan
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-3 bg-white text-primary-600 border-2 border-primary-600 rounded-lg hover:bg-primary-50 transition-colors font-medium text-lg"
                >
                  Login Admin
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
              Fitur Unggulan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Rencana Lengkap
                </h3>
                <p className="text-gray-600">
                  Buat rundown detail dengan jadwal, lokasi, dan aktivitas setiap hari
                </p>
              </div>

              {/* Feature 2 */}
              <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Kelola Keuangan
                </h3>
                <p className="text-gray-600">
                  Catat semua pengeluaran dengan detail dan otomatis hitung total biaya
                </p>
              </div>

              {/* Feature 3 */}
              <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Split Iuran
                </h3>
                <p className="text-gray-600">
                  Bagi biaya per peserta atau per item dengan sistem yang fleksibel
                </p>
              </div>

              {/* Feature 4 */}
              <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Privasi Terjaga
                </h3>
                <p className="text-gray-600">
                  Share link dengan password protection untuk akses terbatas
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-400">
              &copy; {new Date().getFullYear()} SEN YAS DADDY. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
  )
}
