import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Login',
    description: 'Log in to your SEN Yas Holiday account to access your holiday plans and expense reports.',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
