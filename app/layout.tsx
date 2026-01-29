import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'
import Providers from '@/components/Providers'
import { getSystemSetting } from '@/lib/settings'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import MaintenancePage from '@/components/MaintenancePage'
import ImpersonationBanner from '@/components/ImpersonationBanner'

export const metadata: Metadata = {
  title: {
    default: 'SEN Yas Holiday - The Ultimate Holiday Orchestrator',
    template: '%s | SEN Yas Holiday'
  },
  description: 'The all-in-one holiday planner and expense manager. Plan your trips, coordinate budgets with friends, and use AI to generate itineraries and scan receipts.',
  keywords: ['holiday planner', 'trip coordinator', 'expense manager', 'travel budget', 'itinerary generator', 'AI travel consultant', 'receipt scanner', 'sen yas holiday', 'liburan', 'rencana perjalanan'],
  authors: [{ name: 'SEN Yas Holiday Team' }],
  creator: 'SEN Yas Holiday',
  publisher: 'SEN Yas Holiday',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://senyasdaddy.app'),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en',
      'id-ID': '/id',
    },
  },
  openGraph: {
    title: 'SEN Yas Holiday - The Ultimate Holiday Orchestrator',
    description: 'Plan your dream holiday with ease. Manage rundowns, split bills, and use AI features to make your travel hassle-free.',
    url: 'https://senyasdaddy.app',
    siteName: 'SEN Yas Holiday',
    images: [
      {
        url: '/logo.png',
        width: 800,
        height: 600,
        alt: 'SEN Yas Holiday Logo',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SEN Yas Holiday - Holiday Planner',
    description: 'Plan, share, and manage your trips with friends. All-in-one travel tool.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const isMaintenance = await getSystemSetting('maintenance_mode', false)
  const maintenanceEstimate = await getSystemSetting('maintenance_estimate', 'Segera')
  const maintenanceStatus = await getSystemSetting('maintenance_status', 'Terjadwal')
  const session = await getServerSession(authOptions)

  const isSuperadmin = (session?.user as any)?.role === 'superadmin'
  const shouldShowMaintenance = isMaintenance && !isSuperadmin

  return (
    <html lang="id">
      <body className="antialiased">
        <Providers>
          <ImpersonationBanner />
          {shouldShowMaintenance ? <MaintenancePage estimate={maintenanceEstimate} status={maintenanceStatus} /> : children}
          <Toaster
            position="top-center"
            richColors
            toastOptions={{
              style: {
                borderRadius: '1.5rem',
                padding: '1.25rem',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontSize: '10px',
                border: 'none',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
