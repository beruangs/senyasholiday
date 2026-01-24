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
  title: 'SEN YAS DADDY - Holiday Planner',
  description: 'Manage your holiday plans, expenses, and contributions with SEN YAS DADDY',
  icons: { icon: '/logo.png' },
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
