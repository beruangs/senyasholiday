import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import { User } from '@/models'
import Navbar from '@/components/Navbar'
import SuperadminClient from './SuperadminClient'

export const metadata: Metadata = {
    title: 'Superadmin Dashboard | SEN YAS DADDY',
}

export default async function SuperadminPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect('/login')
    }

    const userId = session.user.id
    const sessionRole = (session.user as any)?.role
    const isEnvAdmin = userId.startsWith('env-')

    // Check if user is superadmin
    // For env-admin users, they're already superadmin from session
    if (isEnvAdmin && sessionRole === 'superadmin') {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <SuperadminClient session={session} />
            </div>
        )
    }

    // For database users, check role from database
    await dbConnect()
    const user = await User.findById(userId)

    if (user?.role !== 'superadmin') {
        redirect('/dashboard')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <SuperadminClient session={session} />
        </div>
    )
}
