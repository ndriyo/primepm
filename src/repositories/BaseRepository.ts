import prisma, { getPrismaWithRLS } from '../lib/prisma';
import { Prisma, PrismaClient } from '@prisma/client';

// Define AuditLog type until Prisma client is generated
type AuditLog = {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: Date;
};

/**
 * BaseRepository provides common database operations with audit logging
 * T: The entity type
 * C: The create input type for the entity
 * U: The update input type for the entity
 */
export abstract class BaseRepository<T, C, U> {
  protected abstract readonly model: any;
  protected readonly entityType: string;

  constructor(entityType: string) {
    this.entityType = entityType;
  }

  /**
   * Logs an action to the audit log
   */
  protected async logAction(
    userId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    entityId: string
  ): Promise<AuditLog> {
    return prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType: this.entityType,
        entityId,
      },
    });
  }

  /**
   * Gets a RLS-enabled Prisma client for the current organization
   */
  protected getPrismaWithContext(organizationId?: string, userId?: string) {
    return getPrismaWithRLS(organizationId, userId);
  }

  /**
   * Finds all entities
   */
  async findAll(filters: { organizationId?: string } = {}): Promise<T[]> {
    const { organizationId } = filters;
    
    if (!organizationId) {
      throw new Error("Organization ID is required for findAll operations");
    }

    // Use RLS-enabled Prisma client
    const prismaWithRLS = this.getPrismaWithContext(organizationId);
    
    // We don't need to specify organizationId in the where clause
    // as RLS will handle the filtering, but we keep it for compatibility
    // with direct DB access scenarios where RLS might be bypassed
    const where: any = { organizationId };
    
    return prismaWithRLS[this.model.name].findMany({ where });
  }

  /**
   * Finds an entity by ID
   */
  async findById(id: string, organizationId?: string): Promise<T | null> {
    if (organizationId) {
      // If we have organization context, use RLS
      const prismaWithRLS = this.getPrismaWithContext(organizationId);
      return prismaWithRLS[this.model.name].findUnique({
        where: { id },
      });
    }
    
    // Fallback to non-RLS if no organization context
    return this.model.findUnique({
      where: { id },
    });
  }

  /**
   * Creates a new entity with audit logging
   */
  async create(data: C, userId: string): Promise<T> {
    // Extract organizationId from data if available
    const organizationId = (data as any).organizationId;
    
    if (!organizationId) {
      throw new Error("Organization ID is required to create entities");
    }
    
    const prismaWithRLS = this.getPrismaWithContext(organizationId, userId);
    
    return prismaWithRLS.$transaction(async (tx: any) => {
      const result = await tx[this.model.name].create({
        data,
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'CREATE',
          entityType: this.entityType,
          entityId: result.id,
          organizationId, // Add organization to audit log
        },
      });

      return result;
    });
  }

  /**
   * Updates an entity with audit logging
   */
  async update(id: string, data: U, userId: string): Promise<T> {
    // First get the entity to get its organization
    const existing: any = await this.findById(id);
    
    if (!existing) {
      throw new Error(`Entity with ID ${id} not found`);
    }
    
    const organizationId = existing.organizationId;
    
    if (!organizationId) {
      throw new Error("Organization ID is required to update entities");
    }
    
    const prismaWithRLS = this.getPrismaWithContext(organizationId, userId);
    
    return prismaWithRLS.$transaction(async (tx: any) => {
      const result = await tx[this.model.name].update({
        where: { id },
        data,
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'UPDATE',
          entityType: this.entityType,
          entityId: id,
          organizationId, // Add organization to audit log
        },
      });

      return result;
    });
  }

  /**
   * Deletes an entity with audit logging
   */
  async delete(id: string, userId: string): Promise<T> {
    // First get the entity to get its organization
    const existing: any = await this.findById(id);
    
    if (!existing) {
      throw new Error(`Entity with ID ${id} not found`);
    }
    
    const organizationId = existing.organizationId;
    
    if (!organizationId) {
      throw new Error("Organization ID is required to delete entities");
    }
    
    const prismaWithRLS = this.getPrismaWithContext(organizationId, userId);
    
    return prismaWithRLS.$transaction(async (tx: any) => {
      const result = await tx[this.model.name].delete({
        where: { id },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'DELETE',
          entityType: this.entityType,
          entityId: id,
          organizationId, // Add organization to audit log
        },
      });

      return result;
    });
  }
}
