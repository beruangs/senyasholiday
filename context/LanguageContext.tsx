'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Language, dictionaries } from '@/lib/dictionary'

type LanguageContextType = {
    language: Language
    setLanguage: (lang: Language) => void
    t: any
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>('id')

    useEffect(() => {
        // Load preference from localStorage or user settings if available
        const savedLang = localStorage.getItem('language') as Language
        if (savedLang && ['id', 'en'].includes(savedLang)) {
            setLanguageState(savedLang)
        }
    }, [])

    const setLanguage = (lang: Language) => {
        setLanguageState(lang)
        localStorage.setItem('language', lang)
        // Synchronize with API if logged in
        fetch('/api/user/language', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: lang }),
        }).catch(console.error)
    }

    const t = dictionaries[language]

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}
