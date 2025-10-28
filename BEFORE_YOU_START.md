# ⚠️ PENTING - SETUP SEBELUM MENJALANKAN APLIKASI

## 🚨 Langkah Wajib (CRITICAL)

Sebelum menjalankan `npm run dev`, Anda HARUS melakukan 2 hal ini:

### 1. 📸 Tambahkan Logo SYD

**File logo yang Anda sematkan (logo SYD merah) harus diletakkan di:**

```
/Users/just-jeje/Documents/GitHub/senyasholiday/public/logo.png
```

**Instruksi:**
1. Simpan gambar logo SYD yang Anda sematkan
2. Rename menjadi `logo.png`
3. Letakkan di folder `public/`
4. Pastikan format PNG dengan background transparan

**Jika logo tidak ada, aplikasi akan error!**

---

### 2. 🔑 Buat File .env.local

**Buat file baru bernama `.env.local` di root folder:**

```bash
/Users/just-jeje/Documents/GitHub/senyasholiday/.env.local
```

**Copy paste konfigurasi ini ke dalam file `.env.local`:**

```env
# MongoDB - Ganti dengan connection string Anda
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/senyasholiday?retryWrites=true&w=majority

# NextAuth - Generate dengan: openssl rand -base64 32
NEXTAUTH_SECRET=LzE7bnEI5JtXqXKz9a2yN8vW0mH4pR6sT3uF1gD5kL8=
NEXTAUTH_URL=http://localhost:3000

# Admin Credentials (Ganti dengan credentials Anda)
ADMIN_EMAILS=admin@senyasdaddy.com,admin2@senyasdaddy.com
ADMIN_PASSWORDS=admin123,admin456
ADMIN_NAMES=Admin Utama,Admin Kedua
```

**⚠️ PENTING:**
- Ganti `MONGODB_URI` dengan connection string dari MongoDB Atlas Anda
- Ganti credentials admin sesuai keinginan
- Jangan commit file `.env.local` ke Git (sudah ada di .gitignore)

---

## 🗄️ Setup MongoDB Atlas (GRATIS)

### Langkah 1: Buat Account
1. Buka https://www.mongodb.com/cloud/atlas
2. Klik "Try Free"
3. Daftar dengan email/Google

### Langkah 2: Buat Cluster
1. Pilih "Create a Free Cluster" (M0)
2. Pilih region terdekat (Singapore/Jakarta)
3. Klik "Create Cluster" (tunggu 3-5 menit)

### Langkah 3: Setup Security
1. **Database Access**:
   - Klik "Database Access" di menu kiri
   - Klik "Add New Database User"
   - Username: `senyasdaddy`
   - Password: buat password kuat (catat!)
   - Role: "Read and write to any database"
   - Klik "Add User"

2. **Network Access**:
   - Klik "Network Access" di menu kiri
   - Klik "Add IP Address"
   - Pilih "Allow Access from Anywhere" (0.0.0.0/0)
   - Klik "Confirm"

### Langkah 4: Get Connection String
1. Klik "Database" di menu kiri
2. Klik tombol "Connect" pada cluster Anda
3. Pilih "Connect your application"
4. Copy connection string
5. Replace `<password>` dengan password user yang Anda buat
6. Replace `<dbname>` dengan `senyasholiday`
7. Paste ke `.env.local` sebagai `MONGODB_URI`

**Contoh:**
```
mongodb+srv://senyasdaddy:PASSWORD123@cluster0.xxxxx.mongodb.net/senyasholiday?retryWrites=true&w=majority
```

---

## ✅ Verifikasi Setup

Setelah setup logo dan .env.local:

```bash
# 1. Check logo ada
ls public/logo.png
# Harus muncul: public/logo.png

# 2. Check .env.local ada
ls .env.local
# Harus muncul: .env.local

# 3. Run development server
npm run dev
```

Jika semua OK, aplikasi akan jalan di http://localhost:3000

---

## 🔐 Test Login

Setelah aplikasi jalan:

1. Buka http://localhost:3000/login
2. Login dengan credentials dari .env.local
   - Email: admin@senyasdaddy.com
   - Password: admin123
3. Jika berhasil, Anda akan masuk ke Dashboard

---

## ❌ Troubleshooting

### Error: Cannot find module 'public/logo.png'
**Solusi**: Logo belum ditambahkan. Letakkan logo.png di folder public/

### Error: Missing environment variables
**Solusi**: File .env.local belum dibuat atau isinya salah

### Error: Cannot connect to database
**Solusi**: 
- Check MONGODB_URI di .env.local
- Pastikan password benar (no special characters yang perlu di-encode)
- Verify IP 0.0.0.0/0 sudah di-whitelist di MongoDB Atlas

### Error: Invalid credentials
**Solusi**: 
- Check ADMIN_EMAILS dan ADMIN_PASSWORDS di .env.local
- Pastikan format benar (comma separated, no spaces)
- Pastikan Anda login dengan credentials yang tepat

---

## 📞 Need Help?

Jika masih error setelah mengikuti langkah di atas:

1. Check console browser (F12) untuk error details
2. Check terminal untuk error messages
3. Pastikan semua dependencies terinstall: `npm install --legacy-peer-deps`
4. Restart development server

---

**SETELAH KEDUA LANGKAH DI ATAS SELESAI, APLIKASI SIAP DIGUNAKAN!** 🎉
