import { Hammer, Wrench, Clock, ShieldAlert } from 'lucide-react'

interface MaintenancePageProps {
    estimate?: string;
    status?: string;
}

export default function MaintenancePage({
    estimate = 'Segera',
    status = 'Terjadwal'
}: MaintenancePageProps) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="relative">
                    <div className="w-24 h-24 bg-primary-100 rounded-3xl flex items-center justify-center mx-auto text-primary-600 shadow-xl shadow-primary-100">
                        <Hammer className="w-12 h-12" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 border-4 border-white shadow-lg">
                        <Wrench className="w-5 h-5" />
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Sistem Sedang Diperbarui</h1>
                    <p className="text-gray-500 font-medium leading-relaxed">
                        Kami sedang melakukan pemeliharaan rutin untuk meningkatkan pengalaman liburan Anda. Kami akan segera kembali!
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <Clock className="w-6 h-6 text-primary-500 mx-auto mb-2" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estimasi Selesai</p>
                        <p className="font-bold text-gray-900">{estimate}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <ShieldAlert className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</p>
                        <p className="font-bold text-amber-600">{status}</p>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">SEN YAS DADDY • Holiday Planner</p>
                </div>
            </div>
        </div>
    )
}
