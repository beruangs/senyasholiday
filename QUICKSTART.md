# Quick Start Guide - SEN YAS DADDY

## 🚀 Setup Cepat (5 Menit)

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Buat file `.env.local` di root folder:

```env
# MongoDB - Dapatkan dari MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/senyasholiday?retryWrites=true&w=majority

# NextAuth - Generate secret dengan: openssl rand -base64 32
NEXTAUTH_SECRET=your-random-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Admin Credentials (comma separated)
ADMIN_EMAILS=admin@senyasdaddy.com
ADMIN_PASSWORDS=admin123
ADMIN_NAMES=Admin SYD
```

### 3. Setup Logo

Letakkan file logo SYD di folder `public/` dengan nama `logo.png`

### 4. Jalankan Development Server

```bash
npm run dev
```

Buka http://localhost:3000

## 📝 Panduan Penggunaan

### Login Admin

1. Buka http://localhost:3000/login
2. Masukkan credentials dari `.env.local`
3. Klik Login

### Membuat Rencana Liburan

1. Setelah login, klik "Buat Rencana Liburan Baru"
2. Isi form:
   - Judul: Contoh "SEN YAS DADDY GOES TO JOGJA"
   - Destinasi: "Yogyakarta"
   - Tanggal Mulai & Selesai
   - Password (optional): untuk proteksi link sharing
3. Klik "Buat Rencana"

### Mengelola Rencana

#### Tab Rundown
1. Klik "Tambah Rundown"
2. Isi tanggal, waktu, aktivitas, lokasi
3. Simpan

#### Tab Peserta
1. Klik "Tambah Peserta"
2. Masukkan nama peserta
3. Ulangi untuk semua peserta

#### Tab Keuangan
1. Klik "Tambah Pengeluaran"
2. Isi nama item, detail, harga, quantity
3. Sistem akan auto-calculate total

#### Tab Iuran
1. Pastikan sudah ada peserta
2. Set nominal iuran dan iuran bakaran
3. Klik "Inisialisasi Iuran"
4. Klik status BELUM/SUDAH untuk update pembayaran

### Share dengan Peserta

1. Di halaman detail plan, klik "Share Link"
2. Link otomatis tercopy
3. Bagikan ke peserta
4. Peserta masukkan password (jika ada) untuk akses

## 🛠️ Troubleshooting

### Error: Cannot connect to database
- Pastikan MongoDB URI benar
- Check koneksi internet
- Whitelist IP di MongoDB Atlas

### Error: NextAuth error
- Regenerate NEXTAUTH_SECRET
- Pastikan NEXTAUTH_URL sesuai (http://localhost:3000 untuk dev)

### Error: Image not found
- Pastikan logo.png ada di folder public/
- Check nama file (case-sensitive)

### Cannot login
- Verify ADMIN_EMAILS dan ADMIN_PASSWORDS di .env.local
- Pastikan tidak ada spasi di awal/akhir
- Format: email1,email2 (tanpa spasi)

## 📱 Testing

### Test Login
```
Email: admin@senyasdaddy.com
Password: admin123
```

### Test Public Access
1. Buat plan dengan password
2. Copy link
3. Buka di browser incognito/private
4. Test password protection

## 🎯 Next Steps

1. ✅ Setup MongoDB production database
2. ✅ Deploy ke Vercel
3. ✅ Configure custom domain
4. ✅ Invite tim untuk testing
5. ✅ Buat plan liburan pertama!

## 📞 Support

Untuk bantuan, hubungi admin SEN YAS DADDY.

---

**Happy Planning! 🎉**
