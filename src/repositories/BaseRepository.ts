import prisma from '../lib/prisma';
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
   * Finds all entities
   */
  async findAll(organizationId?: string): Promise<T[]> {
    const where: any = {};
    if (organizationId) {
      where.organizationId = organizationId;
    }
    return this.model.findMany({ where });
  }

  /**
   * Finds an entity by ID
   */
  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({
      where: { id },
    });
  }

  /**
   * Creates a new entity with audit logging
   */
  async create(data: C, userId: string): Promise<T> {
    return prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => {
      const result = await this.model.create({
        data,
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'CREATE',
          entityType: this.entityType,
          entityId: result.id,
        },
      });

      return result;
    });
  }

  /**
   * Updates an entity with audit logging
   */
  async update(id: string, data: U, userId: string): Promise<T> {
    return prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => {
      const result = await this.model.update({
        where: { id },
        data,
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'UPDATE',
          entityType: this.entityType,
          entityId: id,
        },
      });

      return result;
    });
  }

  /**
   * Deletes an entity with audit logging
   */
  async delete(id: string, userId: string): Promise<T> {
    return prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => {
      const result = await this.model.delete({
        where: { id },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'DELETE',
          entityType: this.entityType,
          entityId: id,
        },
      });

      return result;
    });
  }
}
