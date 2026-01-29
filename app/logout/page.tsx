'use client'

import { useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { Loader2, LogOut } from 'lucide-react'

export default function LogoutPage() {
    useEffect(() => {
        // Perform sign out immediately after a brief animation delay
        const timer = setTimeout(() => {
            signOut({ callbackUrl: '/' })
        }, 1200)
        return () => clearTimeout(timer)
    }, [])

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center font-bold p-6 relative overflow-hidden">
            {/* Background blobs for premium feel */}
            <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-primary-50 rounded-full blur-[10rem] -mr-80 -mt-80 opacity-50" />
            <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-indigo-50 rounded-full blur-[10rem] -ml-80 -mb-80 opacity-50" />

            <div className="max-w-md w-full text-center space-y-10 animate-in fade-in zoom-in-95 duration-700 relative z-10">
                <div className="relative inline-block">
                    <div className="w-28 h-28 bg-white border border-gray-100 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl">
                        <LogOut className="w-12 h-12 text-primary-600" />
                    </div>
                    <div className="absolute -top-2 -right-2">
                        <div className="w-10 h-10 bg-primary-600 border-4 border-white rounded-2xl flex items-center justify-center shadow-lg animate-spin">
                            <Loader2 className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-gray-900 leading-none">
                        Signing <span className="text-primary-600">Out</span>
                    </h1>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] leading-none">
                        Membersihkan sesi Anda...
                    </p>
                </div>

                <div className="bg-gray-50/50 backdrop-blur-sm p-8 rounded-[2.5rem] border border-gray-100">
                    <p className="text-[10px] text-gray-300 font-black uppercase tracking-widest leading-relaxed">
                        Terima kasih sudah menggunakan <br />
                        <span className="text-gray-900">Sen Yas Daddy Holiday Planner</span>
                    </p>
                </div>

                <div className="flex justify-center gap-1.5">
                    {[0, 1, 2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary-600/20 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                </div>
            </div>
        </div>
    )
}
