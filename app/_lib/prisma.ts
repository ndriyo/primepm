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
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : []
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
        
        // Determine if the operation supports a 'where' clause.
        const isFilterableOperation = 
          operation.startsWith('find') || 
          operation === 'update' || 
          operation === 'delete' || 
          operation === 'count';
        
        // Only apply RLS to the 'project' model
        if (model && ['project', 'Project'].includes(model)) {
          if (isFilterableOperation) {
            // Clone the args to avoid mutating the original
            const newArgs = { ...args };
            
            // If where clause doesn't exist, create it
            if (!newArgs.where) {
              newArgs.where = {};
            }
            
            // Always filter by organization for filterable operations
            if (organizationId) {
              newArgs.where.organizationId = organizationId;
            }
            
            // For Project Managers, filter by department (for find operations)
            if (userRole === 'projectManager' && departmentId && operation.includes('find')) {
              newArgs.where.departmentId = departmentId;
            }
            
            return query(newArgs);
          } else {
            // For non-filterable operations (like create), pass through the original args
            return query(args);
          }
        }
        
        // For other models, apply organization filtering only for filterable operations
        if (model && args && isFilterableOperation && organizationId) {
          const newArgs = { ...args };
          if (!newArgs.where) {
            newArgs.where = {};
          }
          
          // Check if the model should have organizationId filtering
          // Exclude projectCriteriaScore which doesn't have an organizationId field
          const hasOrgField = 
            model.toLowerCase() !== 'projectcriteriascore' && 
            ['organization', 'department', 'user', 'project', 'criteriaVersion', 'portfolioSelection']
              .some(name => model.toLowerCase().includes(name.toLowerCase()));
          
          if (hasOrgField && !newArgs.where.organizationId) {
            newArgs.where.organizationId = organizationId;
          }
          
          return query(newArgs);
        }
        
        // Default case - pass through original args
        return query(args);
      }
    }
  });
}

// Attach prisma to global in non-production environments to prevent connection pool exhaustion
if ((process.env.NODE_ENV as string) !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Default export for backwards compatibility
export default prisma;

// Set types for global scope augmentation
declare global {
  var prisma: PrismaClient | undefined;
}
