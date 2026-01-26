'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import { LanguageProvider } from '@/context/LanguageContext'
import { ThemeProvider } from '@/context/ThemeContext'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </LanguageProvider>
    </SessionProvider>
  )
}
