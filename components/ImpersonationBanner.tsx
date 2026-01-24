'use client'

import { useSession, signOut, signIn } from 'next-auth/react'
import { ShieldAlert, LogOut, User } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

export default function ImpersonationBanner() {
    const { data: session } = useSession()
    const [isExiting, setIsExiting] = useState(false)

    if (!session?.user || !(session.user as any).impersonatedBy) return null

    const impersonatedBy = (session.user as any).impersonatedBy

    const handleStopImpersonating = async () => {
        setIsExiting(true)
        toast.loading('Mengakhiri sesi impersonate...')

        // Since we don't store the admin's password or a long-lived return token,
        // the safest way is to sign out. 
        // Improvement: We could use a "return token" similar to how we logged in.

        await signOut({ callbackUrl: '/login' })
    }

    return (
        <div className="bg-purple-600 text-white py-2 px-4 sticky top-0 z-[100] shadow-lg animate-in slide-in-from-top duration-300">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-xs sm:text-sm font-bold leading-tight">
                            Mode Impersonate: <span className="text-purple-200">@{session.user.username}</span>
                        </p>
                        <p className="text-[10px] text-purple-200 font-medium opacity-80 leading-tight">
                            Sesi asli: Admin @{impersonatedBy.username}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleStopImpersonating}
                    disabled={isExiting}
                    className="flex items-center gap-2 px-4 py-1.5 bg-white text-purple-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-purple-50 transition-all active:scale-95 shadow-sm disabled:opacity-50"
                >
                    <LogOut className="w-3 h-3" />
                    <span className="hidden sm:inline">Keluar Sesi</span>
                    <span className="sm:hidden">Keluar</span>
                </button>
            </div>
        </div>
    )
}
