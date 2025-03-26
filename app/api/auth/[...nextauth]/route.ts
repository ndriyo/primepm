import NextAuth from 'next-auth';
import { authOptions } from './authOptions';

// Create handler
const handler = NextAuth(authOptions);

// Export handler
export { handler as GET, handler as POST };
