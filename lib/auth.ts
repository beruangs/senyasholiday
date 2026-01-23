import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import dbConnect from './mongodb'
import { User } from '@/models'

// Parse admin credentials from environment variables (legacy/fallback)
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
        console.log('[Auth] Authorize called with credentials:', {
          username: credentials?.username,
          passwordProvided: !!credentials?.password
        })

        if (!credentials?.username || !credentials?.password) {
          console.log('[Auth] Missing username or password')
          return null
        }

        // Clean username (remove @ if present)
        const username = credentials.username.trim().toLowerCase().replace(/^@/, '')
        console.log('[Auth] Cleaned username:', username)

        // Check environment variable admins FIRST (higher priority)
        console.log('[Auth] Checking env admins first. Available usernames:', adminUsernames)
        const adminIndex = adminUsernames.findIndex(
          (u) => u.trim().toLowerCase() === username
        )
        console.log('[Auth] Admin index found:', adminIndex)

        if (adminIndex !== -1) {
          // Verify password
          const expectedPassword = adminPasswords[adminIndex]?.trim()
          const providedPassword = credentials.password
          console.log('[Auth] Expected password length:', expectedPassword?.length)
          console.log('[Auth] Provided password length:', providedPassword?.length)
          console.log('[Auth] Password match:', expectedPassword === providedPassword)

          const validPassword = providedPassword === expectedPassword

          if (validPassword) {
            const result = {
              id: `env-admin-${adminIndex}`,
              email: `${username}@senyasdaddy.app`,
              name: adminNames[adminIndex]?.trim() || username,
              username: username,
              role: 'superadmin',
            }
            console.log('[Auth] Returning env admin:', result)
            return result
          }
          // If env admin password doesn't match, still try database
          console.log('[Auth] Env admin password did not match, checking database...')
        }

        // Try database user
        try {
          await dbConnect()

          // Try to find user in database
          const user = await User.findOne({ username })
          console.log('[Auth] Database user found:', !!user)

          if (user) {
            // Verify password with database user
            const isValidPassword = await user.comparePassword(credentials.password)
            console.log('[Auth] Database password valid:', isValidPassword)

            if (!isValidPassword) {
              console.log('[Auth] Database password invalid, returning null')
              return null
            }

            // Update last login
            user.lastLoginAt = new Date()
            await user.save()

            // Return user object
            const result = {
              id: user._id.toString(),
              email: `${user.username}@senyasdaddy.app`,
              name: user.name,
              username: user.username,
              role: user.role,
            }
            console.log('[Auth] Returning database user:', result)
            return result
          }
        } catch (error) {
          console.error('[Auth] Database auth error:', error)
        }

        console.log('[Auth] No valid credentials found, returning null')
        return null
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
