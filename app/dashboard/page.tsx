import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import DashboardClient from './DashboardClient'

export const metadata: Metadata = {
  title: 'Dashboard | SEN YAS DADDY',
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <DashboardClient session={session} />
    </div>
  )
}
