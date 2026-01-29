import React from 'react'
import Navbar from '@/components/Navbar'

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 pt-32 pb-20 prose prose-slate">
                <h1 className="text-4xl font-extrabold mb-8 text-slate-900 border-b pb-4">Privacy Policy</h1>
                <p className="text-slate-500 mb-8 italic">Terakhir diperbarui: 28 Januari 2026</p>

                <section className="mt-12">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Informasi yang Kami Kumpulkan</h2>
                    <p>Kami mengumpulkan informasi yang Anda berikan saat mendaftar, seperti nama, username, dan detail rencana liburan yang Anda buat di dalam aplikasi.</p>
                </section>

                <section className="mt-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Keamanan Data</h2>
                    <p>Data rencana liburan Anda disimpan di database MongoDB dengan keamanan standar industri. Password plan Anda dienkripsi sehingga hanya Anda (dan mereka yang Anda beri password) yang dapat melihat detail rencana tersebut.</p>
                </section>



                <section className="mt-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Penggunaan Midtrans</h2>
                    <p>Untuk pembayaran Premium, kami menggunakan layanan Midtrans. Kami tidak menyimpan informasi kartu kredit, rekening bank, atau pintu gerbang pembayaran Anda di server kami. Semua data transaksi diproses secara aman oleh Midtrans.</p>
                </section>

                <section className="mt-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Cookie</h2>
                    <p>Kami menggunakan cookie dan teknologi serupa untuk menyimpan sesi login Anda (NextAuth) agar Anda tetap masuk ke akun Anda selama waktu tertentu.</p>
                </section>

                <section className="mt-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Kontak Kami</h2>
                    <p>Jika Anda memiliki pertanyaan tentang privasi data Anda atau ingin menghapus akun Anda, hubungi kami di: <a href="mailto:senyasholiday@outlook.com" className="text-red-600 font-bold">senyasholiday@outlook.com</a></p>
                </section>

                <div className="mt-20 pt-10 border-t border-slate-100 flex justify-between items-center text-sm text-slate-400">
                    <p>© 2026 Sen Yas Holiday</p>
                    <div className="flex gap-4">
                        <a href="/terms" className="hover:text-red-600 transition-colors">Terms of Service</a>
                        <a href="/pricing" className="hover:text-red-600 transition-colors">Pricing</a>
                    </div>
                </div>
            </main>
        </div>
    )
}
