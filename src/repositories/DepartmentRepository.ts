import prisma from '../lib/prisma';
import { BaseRepository } from './BaseRepository';

export interface Department {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  createdById?: string | null;
  updatedById?: string | null;
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

export class DepartmentRepository extends BaseRepository<
  Department,
  DepartmentCreateInput,
  DepartmentUpdateInput
> {
  protected readonly model = prisma.department;

  constructor() {
    super('department');
  }

  /**
   * Find departments by organization ID
   */
  async findByOrganization(organizationId: string): Promise<Department[]> {
    const prismaWithRLS = this.getPrismaWithContext(organizationId);
    
    const departments = await prismaWithRLS.department.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' }
    });
    
    // Cast the Prisma result to our interface
    return departments as unknown as Department[];
  }
}
