'use client'

import { useEffect } from 'react'

interface OfflineSyncProps {
    planId: string
    isPremium: boolean
    data: any
}

export default function OfflineSync({ planId, isPremium, data }: OfflineSyncProps) {
    useEffect(() => {
        // Hanya berjalan jika user Premium dan data tersedia
        if (isPremium && data && planId) {
            try {
                const offlineData = {
                    ...data,
                    lastSynced: new Date().toISOString()
                }
                localStorage.setItem(`offline_plan_${planId}`, JSON.stringify(offlineData))
                console.log(`Plan ${planId} synced for offline access (Premium Only)`)
            } catch (e) {
                console.error('Failed to sync for offline:', e)
            }
        }
    }, [planId, isPremium, data])

    return null // Komponen ini bekerja di background
}
