'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
    Calendar, Users, DollarSign, FileText,
    ChevronDown, ChevronRight, Check,
    ArrowRight, Sparkles, Play, Info,
    MapPin, Clock, Wallet, UserPlus
} from 'lucide-react'

export default function DemoPage() {
    const [activeTab, setActiveTab] = useState<'rundown' | 'expenses' | 'contributions' | 'participants'>('rundown')
    const [openSection, setOpenSection] = useState<string | null>('intro')

    const demoData = {
        plan: {
            title: 'Liburan ke Bali 2024',
            destination: 'Bali, Indonesia',
            startDate: '15 Maret 2024',
            endDate: '18 Maret 2024',
            participants: ['Andi', 'Budi', 'Caca', 'Dedi'],
        },
        rundowns: [
            {
                day: 1, date: '15 Maret', activities: [
                    { time: '08:00', activity: 'Berangkat dari Jakarta', location: 'Bandara Soekarno-Hatta' },
                    { time: '10:30', activity: 'Tiba di Bali', location: 'Bandara Ngurah Rai' },
                    { time: '12:00', activity: 'Check-in Villa', location: 'Seminyak' },
                    { time: '19:00', activity: 'Dinner', location: 'La Plancha Beach Bar' },
                ]
            },
            {
                day: 2, date: '16 Maret', activities: [
                    { time: '06:00', activity: 'Sunrise Trip', location: 'Gunung Batur' },
                    { time: '14:00', activity: 'Tirta Empul', location: 'Tampaksiring' },
                    { time: '20:00', activity: 'BBQ Night', location: 'Villa' },
                ]
            },
        ],
        expenses: [
            { name: 'Villa 3 Malam', total: 3000000, perPerson: 750000, collector: 'Andi' },
            { name: 'Tiket Pesawat PP', total: 4000000, perPerson: 1000000, collector: 'Budi' },
            { name: 'Sewa Motor', total: 600000, perPerson: 150000, collector: 'Andi' },
            { name: 'Makan-makan', total: 1200000, perPerson: 300000, collector: 'Caca' },
        ],
        contributions: [
            { name: 'Andi', total: 2200000, paid: 2200000, status: 'Lunas' },
            { name: 'Budi', total: 2200000, paid: 1500000, status: 'Sebagian' },
            { name: 'Caca', total: 2200000, paid: 2200000, status: 'Lunas' },
            { name: 'Dedi', total: 2200000, paid: 0, status: 'Belum' },
        ],
    }

    const features = [
        {
            id: 'intro',
            icon: Sparkles,
            title: 'Apa itu Holiday Planner?',
            content: `Holiday Planner adalah aplikasi untuk merencanakan liburan bersama teman-teman dengan mudah. 
      Kamu bisa membuat jadwal perjalanan, mencatat semua pengeluaran, dan membagi biaya secara otomatis ke semua peserta.
      
      Tidak perlu lagi repot pakai spreadsheet atau hitung manual!`
        },
        {
            id: 'rundown',
            icon: Calendar,
            title: 'Tab Rundown - Jadwal Perjalanan',
            content: `Di sini kamu buat jadwal lengkap perjalanan per hari. Setiap aktivitas bisa diisi:
      • Waktu kegiatan
      • Nama aktivitas
      • Lokasi
      • Catatan tambahan
      
      Semua peserta bisa lihat jadwal ini kapan saja!`
        },
        {
            id: 'expenses',
            icon: DollarSign,
            title: 'Tab Keuangan - Catat Pengeluaran',
            content: `Catat semua pengeluaran liburan di sini:
      • Nama item (Villa, Tiket, dll)
      • Harga dan quantity
      • Siapa yang mengumpulkan uang (Collector)
      • Peserta mana saja yang ikut patungan
      
      Total otomatis dihitung dan dibagi rata ke peserta!`
        },
        {
            id: 'contributions',
            icon: Wallet,
            title: 'Tab Iuran - Kelola Pembayaran',
            content: `Fitur andalan! Di sini kamu bisa:
      • Lihat total iuran per peserta
      • Input pembayaran yang sudah masuk
      • Set "Batas Bayar" untuk peserta tertentu (misal: ada yang budget terbatas)
      • Otomatis redistribusi ke peserta lain jika ada yang bayar kurang
      
      Semua perubahan tercatat di History!`
        },
        {
            id: 'multiAdmin',
            icon: UserPlus,
            title: 'Fitur Multi-Admin',
            content: `Kamu bisa mengundang teman untuk jadi admin plan:
      • Cukup masukkan username mereka (@username)
      • Mereka bisa mengedit plan sama seperti kamu
      • Plan akan muncul di dashboard mereka juga
      
      Cocok untuk kerja sama mengatur liburan!`
        },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-2xl">🏖️</span>
                        <span className="font-bold text-gray-900">SEN YAS DADDY</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/login"
                            className="text-gray-600 hover:text-gray-900 font-medium"
                        >
                            Masuk
                        </Link>
                        <Link
                            href="/signup"
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                        >
                            Daftar
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Page Title */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-4">
                        <Play className="w-4 h-4" />
                        Mode Demo Interaktif
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        {demoData.plan.title}
                    </h1>
                    <p className="text-gray-600 flex items-center justify-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {demoData.plan.destination}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {demoData.plan.startDate} - {demoData.plan.endDate}
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {demoData.plan.participants.length} peserta
                        </span>
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Side - Feature Explanations */}
                    <div className="lg:col-span-1 space-y-3">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Info className="w-5 h-5 text-primary-600" />
                            Panduan Fitur
                        </h2>

                        {features.map((feature) => (
                            <div key={feature.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <button
                                    onClick={() => setOpenSection(openSection === feature.id ? null : feature.id)}
                                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${openSection === feature.id ? 'bg-primary-100' : 'bg-gray-100'}`}>
                                            <feature.icon className={`w-4 h-4 ${openSection === feature.id ? 'text-primary-600' : 'text-gray-600'}`} />
                                        </div>
                                        <span className="font-medium text-gray-900 text-sm">{feature.title}</span>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${openSection === feature.id ? 'rotate-180' : ''}`} />
                                </button>

                                <div className={`transition-all duration-300 ${openSection === feature.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                                    <div className="px-4 pb-4 text-sm text-gray-600 whitespace-pre-line">
                                        {feature.content}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* CTA */}
                        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-5 text-white mt-6">
                            <h3 className="font-semibold mb-2">Tertarik?</h3>
                            <p className="text-sm text-primary-100 mb-4">
                                Daftar gratis dan buat plan liburanmu sendiri!
                            </p>
                            <Link
                                href="/signup"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-primary-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                            >
                                Daftar Sekarang
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Right Side - Demo Content */}
                    <div className="lg:col-span-2">
                        {/* Tabs */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="flex border-b border-gray-200 overflow-x-auto">
                                {[
                                    { id: 'rundown', label: 'Rundown', icon: Calendar },
                                    { id: 'expenses', label: 'Keuangan', icon: DollarSign },
                                    { id: 'contributions', label: 'Iuran', icon: Wallet },
                                    { id: 'participants', label: 'Peserta', icon: Users },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex-1 min-w-0 px-4 py-3 flex items-center justify-center gap-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                    >
                                        <tab.icon className="w-4 h-4 flex-shrink-0" />
                                        <span className="hidden sm:inline">{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="p-6">
                                {/* Rundown Tab */}
                                {activeTab === 'rundown' && (
                                    <div className="space-y-6">
                                        {demoData.rundowns.map((day) => (
                                            <div key={day.day}>
                                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                    <span className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center text-sm font-bold">
                                                        {day.day}
                                                    </span>
                                                    Hari {day.day} - {day.date}
                                                </h3>
                                                <div className="space-y-2 pl-10">
                                                    {day.activities.map((activity, idx) => (
                                                        <div key={idx} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                                                            <span className="text-sm font-medium text-primary-600 w-12">{activity.time}</span>
                                                            <div>
                                                                <p className="font-medium text-gray-900">{activity.activity}</p>
                                                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                                                    <MapPin className="w-3 h-3" />
                                                                    {activity.location}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Expenses Tab */}
                                {activeTab === 'expenses' && (
                                    <div className="space-y-4">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left font-medium text-gray-600">Item</th>
                                                    <th className="px-4 py-2 text-right font-medium text-gray-600">Total</th>
                                                    <th className="px-4 py-2 text-right font-medium text-gray-600">Per Orang</th>
                                                    <th className="px-4 py-2 text-left font-medium text-gray-600">Pengumpul</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {demoData.expenses.map((expense, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-4 py-3 font-medium text-gray-900">{expense.name}</td>
                                                        <td className="px-4 py-3 text-right text-gray-600">
                                                            Rp {expense.total.toLocaleString('id-ID')}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-primary-600 font-medium">
                                                            Rp {expense.perPerson.toLocaleString('id-ID')}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600">{expense.collector}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-gray-100 font-semibold">
                                                <tr>
                                                    <td className="px-4 py-3">Total</td>
                                                    <td className="px-4 py-3 text-right">
                                                        Rp {demoData.expenses.reduce((sum, e) => sum + e.total, 0).toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-primary-600">
                                                        Rp {demoData.expenses.reduce((sum, e) => sum + e.perPerson, 0).toLocaleString('id-ID')}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )}

                                {/* Contributions Tab */}
                                {activeTab === 'contributions' && (
                                    <div className="space-y-3">
                                        {demoData.contributions.map((contrib, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center font-semibold text-primary-600">
                                                        {contrib.name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{contrib.name}</p>
                                                        <p className="text-sm text-gray-500">
                                                            Harus bayar: Rp {contrib.total.toLocaleString('id-ID')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-green-600">
                                                        Rp {contrib.paid.toLocaleString('id-ID')}
                                                    </p>
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${contrib.status === 'Lunas' ? 'bg-green-100 text-green-700' :
                                                            contrib.status === 'Sebagian' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-red-100 text-red-700'
                                                        }`}>
                                                        {contrib.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="mt-4 p-4 bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg text-white">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-primary-100 text-sm">Total Terkumpul</p>
                                                    <p className="text-2xl font-bold">
                                                        Rp {demoData.contributions.reduce((sum, c) => sum + c.paid, 0).toLocaleString('id-ID')}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-primary-100 text-sm">Kurang</p>
                                                    <p className="text-xl font-semibold">
                                                        Rp {(demoData.contributions.reduce((sum, c) => sum + c.total, 0) - demoData.contributions.reduce((sum, c) => sum + c.paid, 0)).toLocaleString('id-ID')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Participants Tab */}
                                {activeTab === 'participants' && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {demoData.plan.participants.map((name, idx) => (
                                            <div key={idx} className="text-center p-4 bg-gray-50 rounded-xl">
                                                <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-3 text-white text-2xl font-bold">
                                                    {name[0]}
                                                </div>
                                                <p className="font-medium text-gray-900">{name}</p>
                                                <p className="text-xs text-gray-500">Peserta</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
