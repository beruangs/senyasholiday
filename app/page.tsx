import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import SuggestionButton from '@/components/SuggestionButton'
import UserHomePage from '@/components/UserHomePage'
import GuestHomePage from '@/components/GuestHomePage'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The All-in-One Holiday Orchestrator',
}

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <Navbar />
        <SuggestionButton page="UserHome" />
        <UserHomePage session={session} />

        {/* Simple Footer for logged in */}
        <footer className="py-12 text-center border-t border-gray-100 mt-20">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
            SEN YAS DADDY &copy; {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    )
  }

  return <GuestHomePage />
}
