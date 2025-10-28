import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'
import Providers from '@/components/Providers'

export const metadata: Metadata = {
  title: 'SEN YAS DADDY - Holiday Planner',
  description: 'Manage your holiday plans, expenses, and contributions with SEN YAS DADDY',
  icons: {
    icon: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body>
        <Providers>
          {children}
          <Toaster position="top-center" richColors />
        </Providers>
      </body>
    </html>
  )
}
