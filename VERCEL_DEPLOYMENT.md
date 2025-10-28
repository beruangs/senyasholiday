# Deployment Guide - Vercel

## Perbaikan Error NextAuth

### ❌ Masalah yang Diperbaiki:
- **Error 405**: `[next-auth][error][CLIENT_FETCH_ERROR]` 
- **Penyebab**: File `vercel.json` yang salah meng-rewrite semua routes ke `/`
- **Solusi**: File `vercel.json` telah dihapus

---

## Langkah Deploy ke Vercel

### 1. Push ke GitHub
```bash
git add .
git commit -m "Fix NextAuth configuration and remove vercel.json rewrite"
git push origin main
```

### 2. Deploy ke Vercel
1. Buka [vercel.com](https://vercel.com) dan login dengan GitHub
2. Klik **"Add New Project"**
3. Pilih repository `senyasholiday`
4. Vercel akan auto-detect Next.js configuration
5. **JANGAN klik Deploy dulu**, setup Environment Variables terlebih dahulu

### 3. Environment Variables di Vercel
Di Vercel Dashboard → **Environment Variables**, tambahkan:

#### Production & Preview & Development:
```
MONGODB_URI
mongodb+srv://senyasholiday:SenYas2025!@testcluster.8124lwc.mongodb.net/senyasholiday?retryWrites=true&w=majority

NEXTAUTH_SECRET
x3Ggqa+a3miaqeL6X79n8ZAhFoG3FtSCoR/5jvzVjL4=

NEXTAUTH_URL
https://your-app-name.vercel.app

ADMIN_USERNAMES
jeje,admin2

ADMIN_PASSWORDS
jeje111,password2

ADMIN_NAMES
Jeje,Admin 2
```

**⚠️ PENTING**: 
- Ganti `NEXTAUTH_URL` dengan URL Vercel yang sebenarnya setelah first deployment
- Atau gunakan: `https://${VERCEL_URL}` (Vercel akan auto-replace)

### 4. MongoDB Atlas Configuration
1. Buka [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Pilih cluster **TestCluster**
3. Go to **Network Access**
4. Klik **"Add IP Address"**
5. Pilih **"Allow Access from Anywhere"** → `0.0.0.0/0`
6. Save

### 5. Verifikasi Database User
1. Di MongoDB Atlas → **Database Access**
2. Pastikan user `senyasholiday` ada dengan:
   - Password: `SenYas2025!`
   - Role: **Atlas admin** atau **readWriteAnyDatabase**
3. Jika belum ada, create user baru

### 6. Deploy!
1. Klik **Deploy** di Vercel
2. Tunggu build selesai (±2-3 menit)
3. Setelah deploy, copy URL production
4. Update environment variable `NEXTAUTH_URL` dengan URL tersebut
5. Redeploy jika perlu

---

## Verifikasi Deploy Berhasil

### Test Login:
1. Buka `https://your-app.vercel.app/login`
2. Username: `jeje`
3. Password: `jeje111`
4. Klik Login

### Test Dashboard:
- Jika redirect ke `/dashboard` → ✅ Sukses
- Jika error atau redirect ke `/login` → ❌ Cek environment variables

### Test Database Connection:
1. Create holiday plan baru
2. Jika berhasil tersimpan → ✅ MongoDB connection OK
3. Jika error → ❌ Cek:
   - MongoDB URI di environment variables
   - IP whitelist di MongoDB Atlas
   - Database user credentials

---

## Troubleshooting

### Error: CLIENT_FETCH_ERROR
- **Penyebab**: `NEXTAUTH_URL` tidak match dengan actual URL
- **Solusi**: Update `NEXTAUTH_URL` di Vercel env vars dengan URL production yang benar

### Error: MongoServerError bad auth
- **Penyebab**: Credentials MongoDB salah atau user belum dibuat
- **Solusi**: Cek Database Access di MongoDB Atlas

### Error: IP not whitelisted
- **Penyebab**: IP Vercel belum di-whitelist
- **Solusi**: Set Network Access ke `0.0.0.0/0` di MongoDB Atlas

### Pages Not Loading
- **Penyebab**: Build cache atau environment variables belum ter-apply
- **Solusi**: Di Vercel → Deployments → **Redeploy**

---

## Update Environment Variables
Jika Anda update env vars di Vercel:
1. Go to Settings → Environment Variables
2. Edit variable yang diperlukan
3. **WAJIB Redeploy** agar perubahan ter-apply
4. Klik Deployments → Latest → **Redeploy**

---

## Custom Domain (Optional)
1. Di Vercel → Settings → Domains
2. Add domain Anda
3. Update DNS records sesuai instruksi Vercel
4. Update `NEXTAUTH_URL` dengan custom domain
5. Redeploy

---

## Monitoring
- **Logs**: Vercel Dashboard → Deployments → View Function Logs
- **Analytics**: Vercel Dashboard → Analytics tab
- **Errors**: Check Runtime Logs untuk error production

---

**✅ Checklist Deploy:**
- [ ] Push code ke GitHub
- [ ] Create Vercel project
- [ ] Set semua environment variables
- [ ] Whitelist IP di MongoDB Atlas  
- [ ] Verify database user exists
- [ ] Deploy
- [ ] Update NEXTAUTH_URL (jika perlu)
- [ ] Test login
- [ ] Test create plan
- [ ] Test public sharing

**Deploy selesai!** 🚀
