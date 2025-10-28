# SEN YAS DADDY - Holiday Planner & Expense Manager

Aplikasi web modern untuk mengelola rencana liburan, keuangan, dan iuran dengan fitur lengkap dan privasi terjaga.

![SEN YAS DADDY Logo](public/logo.png)

## 🌟 Fitur Utama

### 📅 Rencana Liburan
- Buat dan kelola rencana liburan dengan detail lengkap
- Rundown/jadwal acara per hari dengan waktu dan lokasi
- Password protection untuk privasi
- Share link ke peserta

### 💰 Manajemen Keuangan
- Catat semua pengeluaran dengan kategori
- Detail: nama item, harga, quantity, total
- Otomatis kalkulasi total biaya
- Export data keuangan

### 👥 Manajemen Iuran
- Daftar peserta liburan
- Split payment per item (villa, makanan, dll)
- Checklist status pembayaran
- Tracking iuran nominal dan bakaran

### 🔒 Privasi & Keamanan
- Login admin dengan credentials dari environment variables
- Password protection untuk sharing plan
- Public view dengan autentikasi terpisah

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Database**: MongoDB (via Vercel/MongoDB Atlas)
- **Authentication**: NextAuth.js
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Date Handling**: date-fns

## 📦 Instalasi

1. **Clone repository**
```bash
git clone <repository-url>
cd senyasholiday
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**

Buat file `.env.local` di root folder:

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/senyasholiday?retryWrites=true&w=majority

# NextAuth
NEXTAUTH_SECRET=generate-random-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Admin Credentials (comma separated for multiple admins)
ADMIN_EMAILS=admin1@example.com,admin2@example.com
ADMIN_PASSWORDS=password1,password2
ADMIN_NAMES=Admin 1,Admin 2
```

4. **Generate NextAuth Secret**
```bash
openssl rand -base64 32
```

5. **Run development server**
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## 🗂️ Struktur Project

```
senyasholiday/
├── app/
│   ├── api/                    # API Routes
│   │   ├── auth/              # NextAuth configuration
│   │   ├── plans/             # Holiday plans CRUD
│   │   ├── rundowns/          # Rundown/schedule
│   │   ├── expenses/          # Expense management
│   │   ├── participants/      # Participants management
│   │   └── contributions/     # Contributions/iuran
│   ├── dashboard/             # Admin dashboard
│   │   └── plans/            # Plan management pages
│   ├── login/                 # Login page
│   ├── plans/                 # Public plans list
│   ├── plan/[id]/            # Public plan view (password protected)
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Homepage
│   └── globals.css            # Global styles
├── components/                 # React components
│   ├── Navbar.tsx
│   └── Providers.tsx
├── lib/                        # Utility functions
│   └── mongodb.ts             # MongoDB connection
├── models/                     # MongoDB models
│   └── index.ts               # All database schemas
├── types/                      # TypeScript types
│   ├── global.d.ts
│   └── next-auth.d.ts
├── public/                     # Static assets
│   └── logo.png               # SYD Logo
├── .env.local.example         # Environment variables example
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## 📱 Fitur Detail

### 1. Authentication
- Admin login dengan credentials dari `.env.local`
- Support multiple admin accounts
- Secure session management dengan NextAuth.js

### 2. Holiday Plan Management
- Buat plan baru dengan informasi:
  - Judul liburan
  - Destinasi
  - Tanggal mulai & selesai
  - Deskripsi
  - Password (optional)

### 3. Rundown/Schedule
- Tambah jadwal acara per hari
- Informasi: tanggal, waktu, aktivitas, lokasi, catatan
- Sorting otomatis berdasarkan tanggal dan urutan

### 4. Financial Management
- Kategori pengeluaran (Villa, Makanan, Transport, dll)
- Item pengeluaran dengan detail:
  - Nama item
  - Detail/deskripsi
  - Harga satuan
  - Quantity
  - Total otomatis
- Kalkulasi total per kategori dan grand total

### 5. Participants & Contributions
- Daftar peserta liburan
- Iuran nominal (contribution)
- Iuran bakaran (food expenses)
- Checklist status pembayaran
- Split payment per item expense

### 6. Sharing & Privacy
- Generate shareable link
- Password protection per plan
- Public view (hanya read-only)
- Admin view (full CRUD access)

## 🎨 Design System

### Color Palette
- **Primary**: Red (#FF3838)
- **Secondary**: White (#FFFFFF)
- **Accent Colors**: Shades of red dan gray

### Responsive Design
- **Mobile**: Simple & minimalist UI
- **Desktop**: Feature-rich dengan multiple columns
- **Tablet**: Adaptive layout

### Typography
- Clean and readable fonts
- Optimal line height dan spacing
- Mobile-friendly text sizes

## 📊 Database Schema

### HolidayPlan
```typescript
{
  title: String,
  destination: String,
  startDate: Date,
  endDate: Date,
  description: String,
  password: String,
  createdBy: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Rundown
```typescript
{
  holidayPlanId: ObjectId,
  date: Date,
  time: String,
  activity: String,
  location: String,
  notes: String,
  order: Number
}
```

### ExpenseItem
```typescript
{
  holidayPlanId: ObjectId,
  categoryId: ObjectId,
  itemName: String,
  detail: String,
  price: Number,
  quantity: Number,
  total: Number
}
```

### Participant
```typescript
{
  holidayPlanId: ObjectId,
  name: String,
  order: Number
}
```

### Contribution
```typescript
{
  holidayPlanId: ObjectId,
  participantId: ObjectId,
  amount: Number,
  isPaid: Boolean,
  paidAt: Date,
  type: 'nominal' | 'bakaran'
}
```

## 🚢 Deployment

### Deploy to Vercel

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Deploy di Vercel**
- Import repository di [vercel.com](https://vercel.com)
- Configure environment variables (sama seperti `.env.local`)
- Deploy!

3. **Setup MongoDB**
- Buat cluster di [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Whitelist Vercel IP addresses
- Copy connection string ke `MONGODB_URI`

### Environment Variables di Vercel

Tambahkan semua environment variables dari `.env.local`:
- `MONGODB_URI`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `ADMIN_EMAILS`
- `ADMIN_PASSWORDS`
- `ADMIN_NAMES`

## 📝 Usage Guide

### Untuk Admin

1. **Login**: Buka `/login` dan masukkan credentials dari `.env.local`
2. **Dashboard**: Lihat semua rencana liburan
3. **Buat Plan Baru**: Klik tombol "Buat Rencana Liburan Baru"
4. **Kelola Plan**:
   - Tab Info: Edit informasi dasar
   - Tab Rundown: Tambah/edit jadwal acara
   - Tab Peserta: Kelola daftar peserta
   - Tab Keuangan: Catat pengeluaran
   - Tab Iuran: Kelola pembayaran peserta
5. **Share**: Klik tombol "Share Link" untuk copy link

### Untuk Peserta

1. **Akses Link**: Buka link yang dibagikan admin
2. **Password**: Masukkan password plan (jika ada)
3. **View Plan**: Lihat rundown, keuangan, dan iuran
4. **Read Only**: Tidak bisa edit data

## 🛠️ Development

### Run Development
```bash
npm run dev
```

### Build Production
```bash
npm run build
npm start
```

### Lint Code
```bash
npm run lint
```

## 📄 License

Private - SEN YAS DADDY © 2025

## 🤝 Contributing

Project ini private untuk SEN YAS DADDY team.

## 📧 Contact

Untuk pertanyaan atau support, hubungi admin SEN YAS DADDY.

---

**Built with ❤️ for SEN YAS DADDY**
