import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// Parse admin credentials from environment variables
const adminUsernames = process.env.ADMIN_USERNAMES?.split(',') || []
const adminPasswords = process.env.ADMIN_PASSWORDS?.split(',') || []
const adminNames = process.env.ADMIN_NAMES?.split(',') || []

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        // Find matching admin
        const adminIndex = adminUsernames.findIndex(
          (username) => username.trim().toLowerCase() === credentials.username.trim().toLowerCase()
        )

        if (adminIndex === -1) {
          return null
        }

        // Verify password
        const validPassword = credentials.password === adminPasswords[adminIndex]?.trim()

        if (!validPassword) {
          return null
        }

        // Return user object
        return {
          id: `admin-${adminIndex}`,
          email: `${adminUsernames[adminIndex]}@senyasdaddy.local`,
          name: adminNames[adminIndex] || adminUsernames[adminIndex],
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  useSecureCookies: process.env.NODE_ENV === 'production',
}
