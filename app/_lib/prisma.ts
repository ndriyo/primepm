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
    log: process.env.NODE_ENV === 'development' ? ['info', 'warn', 'error'] : [],
//    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : [],
  });

// Function to create a prisma client with RLS context
export function getPrismaWithRLS(organizationId?: string, userId?: string, userRole?: string, departmentId?: string) {
  // If no organization ID is provided, return the base client
  if (!organizationId) {
    return prisma;
  }
  
  // Create an extended client that implements RLS filtering
  return prisma.$extends({
    query: {
      $allOperations(params: { 
        args: any; 
        query: (args: any) => Promise<any>; 
        model?: string | undefined; 
        operation: string;
      }) {
        const { args, query, model, operation } = params;
        
        // Only apply RLS to specific models and operations
        if (model && ['project', 'Project'].includes(model)) {
          // Clone the args to avoid mutating the original
          const newArgs = { ...args };
          
          // If where clause doesn't exist, create it
          if (!newArgs.where) {
            newArgs.where = {};
          }
          
          // Always filter by organization
          if (organizationId) {
            newArgs.where.organizationId = organizationId;
          }
          
          // For Project Managers, filter by department
          if (userRole === 'projectManager' && departmentId && operation.includes('find')) {
            newArgs.where.departmentId = departmentId;
          }
          
          // Execute the query with the modified args
          return query(newArgs);
        }
        
        // For other models, just ensure organization filtering
        if (model && args && args.where && organizationId) {
          const newArgs = { ...args };
          if (!newArgs.where) {
            newArgs.where = {};
          }
          
          // Only add organizationId if the model has this field
          const hasOrgField = ['organization', 'department', 'user', 'project', 'criteriaVersion', 'portfolioSelection']
            .some(name => model.toLowerCase().includes(name.toLowerCase()));
            
          if (hasOrgField && !newArgs.where.organizationId) {
            newArgs.where.organizationId = organizationId;
          }
          
          return query(newArgs);
        }
        
        // Default case - pass through
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
