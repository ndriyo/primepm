import prisma from '../lib/prisma';
import { BaseRepository } from './BaseRepository';

// Temporary type definitions until Prisma client is generated
export interface Organization {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  createdById?: string | null;
  updatedById?: string | null;
}

export interface Department {
  id: string;
  name: string;
  description?: string | null;
  organizationId: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  createdById?: string | null;
  updatedById?: string | null;
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

    return organization as unknown as Organization & { departments: Department[] };
  }

  /**
   * Create a department
   */
  async createDepartment(data: DepartmentCreateInput, userId: string): Promise<Department> {
    let result: any;
    
    await prisma.$transaction(async (tx: any) => {
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

      result = await tx.department.create({
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
    });
    
    return result as unknown as Department;
  }

  /**
   * Find department by ID
   */
  async findDepartment(id: string): Promise<Department | null> {
    const department = await prisma.department.findUnique({
      where: { id }
    });
    return department as unknown as Department | null;
  }

  /**
   * Find departments by organization
   */
  async findDepartmentsByOrganization(organizationId: string): Promise<Department[]> {
    const departments = await prisma.department.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' }
    });
    return departments as unknown as Department[];
  }

  /**
   * Update department
   */
  async updateDepartment(id: string, data: DepartmentUpdateInput, userId: string): Promise<Department> {
    let result: any;
    
    await prisma.$transaction(async (tx: any) => {
      // Update the department
      const updateData: any = {
        ...data,
        updatedBy: {
          connect: { id: data.updatedById }
        }
      };

      // Remove the updatedById field
      delete updateData.updatedById;

      result = await tx.department.update({
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
    });
    
    return result as unknown as Department;
  }

  /**
   * Delete department
   */
  async deleteDepartment(id: string, userId: string): Promise<Department> {
    let result: any;
    
    await prisma.$transaction(async (tx: any) => {
      // Delete the department
      result = await tx.department.delete({
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
    });
    
    return result as unknown as Department;
  }
}
