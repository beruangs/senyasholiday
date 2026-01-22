import Link from 'next/link'
import Image from 'next/image'
import { Calendar, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Metadata } from 'next'
import dbConnect from '@/lib/mongodb'
import { HolidayPlan } from '@/models'

export const metadata: Metadata = {
  title: 'Plans | SEN YAS DADDY',
}

export const dynamic = 'force-dynamic'

export default async function PlansPage() {
  await dbConnect()
  const plans = await HolidayPlan.find().sort({ startDate: -1 }).lean()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center mb-4">
            <Image src="/logo.png" alt="SEN YAS DADDY" width={60} height={60} className="rounded-lg" />
          </div>
          <h1 className="text-4xl font-bold text-center mb-2">Rencana Liburan</h1>
          <p className="text-center text-primary-100">
            Lihat semua rencana liburan SEN YAS DADDY
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {plans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Belum ada rencana liburan yang tersedia.</p>
            <Link
              href="/"
              className="mt-6 inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Kembali ke Beranda
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan: any) => (
              <Link
                key={plan._id.toString()}
                href={`/plan/${plan._id.toString()}`}
                className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow overflow-hidden group"
              >
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {plan.title}
                  </h2>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-primary-600" />
                      {plan.destination}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 text-primary-600" />
                      {format(new Date(plan.startDate), 'd MMM', { locale: id })} -{' '}
                      {format(new Date(plan.endDate), 'd MMM yyyy', { locale: id })}
                    </div>
                  </div>
                  {plan.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">{plan.description}</p>
                  )}
                  <div className="pt-4 border-t border-gray-100">
                    <span className="text-primary-600 font-medium text-sm group-hover:underline">
                      Lihat Detail →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="text-center pb-12">
        <Link
          href="/"
          className="inline-block px-6 py-3 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
        >
          ← Kembali ke Beranda
        </Link>
      </div>
    </div>
  )
}
