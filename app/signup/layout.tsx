import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Join SEN YAS DADDY',
    description: 'Create an account to start planning your perfect holiday and managing expenses with your friends.',
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
