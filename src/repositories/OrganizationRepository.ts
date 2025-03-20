import prisma from '../lib/prisma';
import { BaseRepository } from './BaseRepository';

// Temporary type definitions until Prisma client is generated
export interface Organization {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  createdById?: string;
  updatedById?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  createdById?: string;
  updatedById?: string;
}

// Input types
export interface OrganizationCreateInput {
  name: string;
  description?: string;
  createdById?: string;
}

export interface OrganizationUpdateInput {
  name?: string;
  description?: string;
  updatedById: string;
}

export interface DepartmentCreateInput {
  name: string;
  description?: string;
  organizationId: string;
  createdById: string;
}

export interface DepartmentUpdateInput {
  name?: string;
  description?: string;
  updatedById: string;
}

export class OrganizationRepository extends BaseRepository<
  Organization,
  OrganizationCreateInput,
  OrganizationUpdateInput
> {
  protected readonly model = prisma.organization;

  constructor() {
    super('organization');
  }

  /**
   * Find organization by ID with departments
   */
  async findWithDepartments(id: string): Promise<Organization & { departments: Department[] }> {
    const organization = await this.model.findUnique({
      where: { id },
      include: {
        departments: true
      }
    });

    if (!organization) {
      throw new Error(`Organization with ID ${id} not found`);
    }

    return organization;
  }

  /**
   * Create a department
   */
  async createDepartment(data: DepartmentCreateInput, userId: string): Promise<Department> {
    return prisma.$transaction(async (tx: any) => {
      // Create the department
      const createData: any = {
        name: data.name,
        description: data.description,
        organization: {
          connect: { id: data.organizationId }
        },
        createdBy: {
          connect: { id: data.createdById }
        }
      };

      const result = await tx.department.create({
        data: createData
      });

      // Log the action
      await tx.auditLog.create({
        data: {
          userId,
          action: 'CREATE',
          entityType: 'department',
          entityId: result.id,
        },
      });

      return result;
    });
  }

  /**
   * Find department by ID
   */
  async findDepartment(id: string): Promise<Department | null> {
    return prisma.department.findUnique({
      where: { id }
    });
  }

  /**
   * Find departments by organization
   */
  async findDepartmentsByOrganization(organizationId: string): Promise<Department[]> {
    return prisma.department.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Update department
   */
  async updateDepartment(id: string, data: DepartmentUpdateInput, userId: string): Promise<Department> {
    return prisma.$transaction(async (tx: any) => {
      // Update the department
      const updateData: any = {
        ...data,
        updatedBy: {
          connect: { id: data.updatedById }
        }
      };

      // Remove the updatedById field
      delete updateData.updatedById;

      const result = await tx.department.update({
        where: { id },
        data: updateData
      });

      // Log the action
      await tx.auditLog.create({
        data: {
          userId,
          action: 'UPDATE',
          entityType: 'department',
          entityId: id,
        },
      });

      return result;
    });
  }

  /**
   * Delete department
   */
  async deleteDepartment(id: string, userId: string): Promise<Department> {
    return prisma.$transaction(async (tx: any) => {
      // Delete the department
      const result = await tx.department.delete({
        where: { id }
      });

      // Log the action
      await tx.auditLog.create({
        data: {
          userId,
          action: 'DELETE',
          entityType: 'department',
          entityId: id,
        },
      });

      return result;
    });
  }
}
