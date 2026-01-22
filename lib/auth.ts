import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import dbConnect from './mongodb'
import { User } from '@/models'

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

        try {
          await dbConnect()

          // Clean username (remove @ if present)
          const username = credentials.username.trim().toLowerCase().replace(/^@/, '')

          // Find user by username
          const user = await User.findOne({ username })

          if (!user) {
            return null
          }

          // Verify password
          const isValidPassword = await user.comparePassword(credentials.password)

          if (!isValidPassword) {
            return null
          }

          // Update last login
          user.lastLoginAt = new Date()
          await user.save()

          // Return user object
          return {
            id: user._id.toString(),
            email: `${user.username}@senyasdaddy.app`,
            name: user.name,
            username: user.username,
            role: user.role,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
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
        token.username = (user as any).username
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
          ; (session.user as any).username = token.username as string
          ; (session.user as any).role = token.role as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}
