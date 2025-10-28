# Deployment Instructions

## Environment Variables Required

Sebelum deploy, pastikan Anda sudah setup environment variables berikut di Vercel:

### MongoDB
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/senyasholiday
```

### NextAuth
```
NEXTAUTH_SECRET=your-generated-secret-here
NEXTAUTH_URL=https://your-domain.vercel.app
```

### Admin Credentials
```
ADMIN_EMAILS=admin1@email.com,admin2@email.com
ADMIN_PASSWORDS=password1,password2
ADMIN_NAMES=Admin 1,Admin 2
```

## Generate NextAuth Secret

Jalankan command berikut untuk generate secret:

```bash
openssl rand -base64 32
```

## MongoDB Setup

1. Buat account di MongoDB Atlas: https://www.mongodb.com/cloud/atlas
2. Buat cluster baru
3. Whitelist all IP addresses (0.0.0.0/0) untuk Vercel
4. Buat database user dan password
5. Copy connection string

## Deploy Steps

1. Push code ke GitHub
2. Import repository di Vercel
3. Add environment variables di Project Settings
4. Deploy!

## Setelah Deploy

1. Test login dengan credentials yang sudah di set
2. Buat rencana liburan pertama
3. Share link ke tim!

## Troubleshooting

### Database Connection Error
- Pastikan IP whitelist sudah benar
- Check MongoDB connection string
- Pastikan database user punya akses read/write

### Login Error
- Verify environment variables sudah tersimpan
- Check format ADMIN_EMAILS, ADMIN_PASSWORDS, dan ADMIN_NAMES (comma separated)
- Regenerate NEXTAUTH_SECRET jika perlu

### Build Error
- Check Node version (gunakan versi 18+)
- Clear .next folder dan rebuild: `rm -rf .next && npm run build`
