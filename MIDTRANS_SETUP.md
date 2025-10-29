# 💳 Panduan Integrasi Midtrans Payment Gateway

## 📋 Daftar Isi
1. [Pendaftaran Midtrans](#pendaftaran-midtrans)
2. [Konfigurasi](#konfigurasi)
3. [Cara Kerja](#cara-kerja)
4. [Testing](#testing)
5. [Production Deployment](#production-deployment)

---

## 1. Pendaftaran Midtrans

### Sandbox (Development)
1. Daftar di https://dashboard.sandbox.midtrans.com/register
2. Verifikasi email Anda
3. Login ke dashboard sandbox

### Production
1. Daftar di https://dashboard.midtrans.com/register
2. Lengkapi data perusahaan dan dokumen
3. Tunggu approval dari Midtrans

---

## 2. Konfigurasi

### A. Dapatkan API Keys

**Sandbox:**
1. Login ke https://dashboard.sandbox.midtrans.com
2. Klik **Settings** → **Access Keys**
3. Copy:
   - **Server Key** (SB-Mid-server-...)
   - **Client Key** (SB-Mid-client-...)

**Production:**
1. Login ke https://dashboard.midtrans.com
2. Klik **Settings** → **Access Keys**
3. Copy:
   - **Server Key** (Mid-server-...)
   - **Client Key** (Mid-client-...)

### B. Setup Environment Variables

Edit file `.env.local`:

```bash
# Untuk Sandbox/Development
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxx
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Untuk Production
MIDTRANS_IS_PRODUCTION=true
MIDTRANS_SERVER_KEY=Mid-server-xxxxx
MIDTRANS_CLIENT_KEY=Mid-client-xxxxx
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### C. Setup Webhook Notification URL

1. Login ke dashboard Midtrans
2. Klik **Settings** → **Configuration**
3. Isi **Payment Notification URL**:
   ```
   https://yourdomain.com/api/payment/notification
   ```
4. Klik **Update**

---

## 3. Cara Kerja

### Flow Pembayaran:

```
1. Peserta klik tombol "Bayar" di shared link
   ↓
2. System calculate:
   - Nominal iuran yang belum dibayar
   - Service fee (2% + Rp 2.000)
   - Gross amount = Nominal + Service Fee
   ↓
3. Create Midtrans transaction via API
   ↓
4. Redirect peserta ke Midtrans payment page
   ↓
5. Peserta pilih metode pembayaran (QRIS, VA, E-wallet, dll)
   ↓
6. Peserta bayar
   ↓
7. Midtrans kirim webhook notification ke server
   ↓
8. Server update status pembayaran di database
   ↓
9. Peserta redirect kembali ke shared link
   ↓
10. Tombol "Bayar" otomatis hilang jika sudah lunas
```

### Perhitungan Biaya:

**Contoh:**
- Iuran yang harus dibayar: **Rp 100.000**
- Service fee: **Rp 4.000** (2% + Rp 2.000 = Rp 2.000 + Rp 2.000)
- Total yang dibayar peserta: **Rp 104.000**
- Uang yang diterima admin: **Rp 100.000** (bersih)

**Formula:**
```javascript
serviceFee = Math.ceil((amount * 0.02 + 2000) / 100) * 100
grossAmount = netAmount + serviceFee
```

---

## 4. Testing

### A. Test Cards (Sandbox)

Gunakan kartu kredit test berikut di sandbox:

| Card Number         | CVV | Exp Date | Result  |
|---------------------|-----|----------|---------|
| 4811 1111 1111 1114 | 123 | 01/25    | Success |
| 4911 1111 1111 1113 | 123 | 01/25    | Denied  |

### B. Test Payment Methods

**QRIS:**
- Scan QR code yang muncul
- Akan otomatis approve di sandbox

**Virtual Account:**
- BCA: 12345678901
- BNI: 1234567890123456
- Mandiri: 12345678901234
- Auto approve setelah beberapa detik di sandbox

**E-wallet (GoPay/ShopeePay):**
- Akan muncul deeplink
- Auto approve di sandbox

### C. Test Flow

1. Buat plan baru di dashboard
2. Tambah peserta dan expense
3. Buka shared link di incognito/private mode
4. Klik tombol "Bayar" di tab Iuran
5. Pilih metode pembayaran
6. Lakukan pembayaran test
7. Verifikasi:
   - Status berubah menjadi "Lunas" atau "Sebagian"
   - Tombol "Bayar" hilang jika lunas
   - Jumlah terbayar update
   - Dashboard admin juga update

---

## 5. Production Deployment

### Checklist Sebelum Go Live:

- [ ] Ganti `MIDTRANS_IS_PRODUCTION=true`
- [ ] Ganti ke production Server Key & Client Key
- [ ] Update `NEXT_PUBLIC_BASE_URL` ke domain production
- [ ] Setup notification URL di dashboard production
- [ ] Test payment dengan nominal kecil (Rp 10.000)
- [ ] Monitor payment log di dashboard Midtrans
- [ ] Setup email notification untuk failed payments

### Webhook Security:

Webhook sudah di-verify menggunakan signature key untuk memastikan request benar dari Midtrans.

### Payment Methods yang Aktif:

- ✅ Credit Card (Visa, Mastercard, JCB)
- ✅ Bank Transfer (BCA, BNI, BRI, Mandiri, Permata, Other VA)
- ✅ E-wallet (GoPay, ShopeePay)
- ✅ QRIS

### Monitoring:

1. Dashboard Midtrans: https://dashboard.midtrans.com/transactions
2. Database: Check `contributions` collection untuk `paymentMethod: 'midtrans'`
3. Logs: Check server logs untuk errors

---

## 🆘 Troubleshooting

### Webhook Tidak Terkirim:
- Pastikan notification URL sudah di-set di dashboard
- Pastikan server accessible dari internet (tidak localhost)
- Check logs di **Settings** → **Notification** di dashboard

### Payment Gagal Update:
- Check signature verification di logs
- Pastikan server key benar
- Check database connection

### Redirect Error:
- Pastikan `NEXT_PUBLIC_BASE_URL` benar
- Check CORS settings

---

## 📞 Support

- Midtrans Docs: https://docs.midtrans.com
- Midtrans Support: support@midtrans.com
- Telegram: https://t.me/midtransindonesia

---

## 💡 Tips

1. **Test di Sandbox dulu** sebelum production
2. **Monitor dashboard** regularly untuk failed payments
3. **Backup database** sebelum deployment
4. **Simpan transaction logs** untuk reconciliation
5. **Inform peserta** bahwa ada biaya payment gateway

---

Happy Coding! 🚀
