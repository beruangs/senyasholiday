import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Users, DollarSign, Lock, Sparkles, ArrowRight, UserPlus } from 'lucide-react'
import Navbar from '@/components/Navbar'
import SuggestionButton from '@/components/SuggestionButton'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SEN YAS DADDY - Holiday Planner',
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      <SuggestionButton page="Homepage" />

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
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all font-medium text-lg shadow-lg hover:shadow-xl"
              >
                <UserPlus className="w-5 h-5" />
                Daftar Gratis
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-primary-600 border-2 border-primary-600 rounded-lg hover:bg-primary-50 transition-colors font-medium text-lg"
              >
                <Sparkles className="w-5 h-5" />
                Lihat Contoh Plan
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Sudah punya akun?{' '}
              <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                Masuk di sini
              </Link>
            </p>
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
                Multi-Admin
              </h3>
              <p className="text-gray-600">
                Undang teman untuk jadi admin dan kelola plan bersama-sama
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Siap Mengatur Liburan Impian?
          </h2>
          <p className="text-lg text-primary-100 mb-8">
            Daftar sekarang dan nikmati kemudahan merencanakan liburan bersama teman-teman!
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 rounded-xl hover:bg-gray-100 transition-colors font-semibold text-lg shadow-lg"
          >
            Mulai Sekarang
            <ArrowRight className="w-5 h-5" />
          </Link>
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
