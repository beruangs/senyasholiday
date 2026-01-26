'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type Theme = 'light' | 'ash' | 'dark'

type ThemeContextType = {
    theme: Theme
    setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('light')

    useEffect(() => {
        // Load preference from localStorage
        const savedTheme = localStorage.getItem('theme') as Theme
        if (savedTheme && ['light', 'ash', 'dark'].includes(savedTheme)) {
            setThemeState(savedTheme)
            document.documentElement.setAttribute('data-theme', savedTheme)
        }
    }, [])

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme)
        localStorage.setItem('theme', newTheme)
        document.documentElement.setAttribute('data-theme', newTheme)

        // Synchronize with API if logged in (optional, but good for persistence)
        fetch('/api/user/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ theme: newTheme }),
        }).catch(console.error)
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}
