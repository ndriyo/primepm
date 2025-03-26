import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/app/_lib/prisma';
import { NextAuthOptions } from 'next-auth';

// Define auth options
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // In a real application, you would verify credentials against your database
        // For this implementation, we'll use a simplified approach
        if (!credentials?.email) {
          return null;
        }

        // Find the user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            organization: true,
            department: true
          }
        });

        if (!user) {
          return null;
        }

        // In a real application, you would verify the password here
        // For this implementation, we'll skip password verification

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          organizationId: user.organizationId,
          departmentId: user.departmentId,
          roles: user.roles
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.organizationId = user.organizationId;
        token.departmentId = user.departmentId;
        token.roles = user.roles;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.organizationId = token.organizationId;
        session.user.departmentId = token.departmentId;
        session.user.roles = token.roles;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  session: {
    strategy: 'jwt'
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key'
};
