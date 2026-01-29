import React from 'react'
import Navbar from '@/components/Navbar'

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 pt-32 pb-20 prose prose-slate">
                <h1 className="text-4xl font-extrabold mb-8 text-slate-900 border-b pb-4">Terms of Service</h1>
                <p className="text-slate-500 mb-8 italic">Terakhir diperbarui: 28 Januari 2026</p>

                <section className="mt-12">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Penerimaan Ketentuan</h2>
                    <p>Dengan mengakses atau menggunakan aplikasi Sen Yas Holiday, Anda menyetujui untuk terikat oleh Ketentuan Layanan ini dan semua hukum serta peraturan yang berlaku.</p>
                </section>

                <section className="mt-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Layanan Freemium</h2>
                    <p>Sen Yas Holiday menawarkan layanan gratis ("Free Plan") dan layanan berbayar ("Premium Plan").</p>
                    <ul>
                        <li><strong>Free Plan:</strong> Memiliki batasan penggunaan tertentu (jumlah rencana, peserta, dll).</li>
                        <li><strong>Premium Plan:</strong> Memberikan akses fitur tambahan setelah pembayaran yang dikonfirmasi.</li>
                    </ul>
                </section>

                <section className="mt-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Pembayaran & Pengembalian Dana</h2>
                    <p>Pembayaran dilakukan melalui gerbang pembayaran pihak ketiga (Midtrans). Kami tidak menyimpan detail kartu kredit/debit Anda. Semua pembelian bersifat final dan tidak dapat diuangkan kembali kecuali diwajibkan oleh hukum.</p>
                </section>

                <section className="mt-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Akun Pengguna</h2>
                    <p>Anda bertanggung jawab untuk menjaga kerahasiaan informasi akun dan password Anda. Anda setuju untuk bertanggung jawab atas semua aktivitas yang terjadi di bawah akun Anda.</p>
                </section>

                <section className="mt-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Pembatasan Penggunaan</h2>
                    <p>Anda dilarang menggunakan aplikasi ini untuk tujuan ilegal atau melanggar hak kekayaan intelektual orang lain.</p>
                </section>

                <section className="mt-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Kontak</h2>
                    <p>Jika ada pertanyaan mengenai Ketentuan Layanan ini, silakan hubungi kami melalui email: <a href="mailto:senyasholiday@outlook.com" className="text-red-600 font-bold">senyasholiday@outlook.com</a></p>
                </section>

                <div className="mt-20 pt-10 border-t border-slate-100 flex justify-between items-center text-sm text-slate-400">
                    <p>© 2026 Sen Yas Holiday</p>
                    <div className="flex gap-4">
                        <a href="/privacy" className="hover:text-red-600 transition-colors">Privacy Policy</a>
                        <a href="/pricing" className="hover:text-red-600 transition-colors">Pricing</a>
                    </div>
                </div>
            </main>
        </div>
    )
}
