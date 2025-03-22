import { PrismaClient } from '@prisma/client';

// This approach is recommended by Prisma for Next.js API routes
// Prevents multiple instances in development and on serverless functions
// See: https://pris.ly/d/help/next-js-best-practices

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Create a singleton instance of PrismaClient
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : [],
  });

// Function to create a prisma client with RLS context
export function getPrismaWithRLS(organizationId?: string, userId?: string) {
  // If no organization ID is provided, return the base client
  if (!organizationId) {
    return prisma;
  }
  
  // Create an extended client that sets RLS via PG session variables
  return prisma.$extends({
    query: {
      $allOperations(params: { 
        args: any; 
        query: (args: any) => Promise<any>; 
        model?: string | undefined; 
        operation: string;
      }) {
        const { args, query } = params;
        // Don't attempt to add RLS headers to the query directly
        // Instead, we'll need to set up proper PostgreSQL RLS policies
        // and have the database enforce security
        
        // For now, we're just going to do a standard query without RLS until the
        // proper PostgreSQL policies are set up
        return query(args);
      },
    },
  });
}

// Attach prisma to global in non-production environments to prevent connection pool exhaustion
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Default export for backwards compatibility
export default prisma;

// Set types for global scope augmentation
declare global {
  var prisma: PrismaClient | undefined;
}
