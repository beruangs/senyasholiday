'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import { LanguageProvider } from '@/context/LanguageContext'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </SessionProvider>
  )
}
