import prisma from '../lib/prisma';
import { BaseRepository } from './BaseRepository';

// Temporary type definitions until Prisma client is generated
export interface User {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  organizationId: string;
  departmentId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdById?: string;
  updatedById?: string;
}

// Input types
export interface UserCreateInput {
  email: string;
  fullName: string;
  roles: string[];
  organizationId: string;
  departmentId?: string;
  createdById?: string;
}

export interface UserUpdateInput {
  email?: string;
  fullName?: string;
  roles?: string[];
  departmentId?: string | null;
  updatedById: string;
}

export class UserRepository extends BaseRepository<
  User,
  UserCreateInput,
  UserUpdateInput
> {
  protected readonly model = prisma.user;

  constructor() {
    super('user');
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.model.findUnique({
      where: { email }
    });
  }

  /**
   * Find users by organization
   */
  async findByOrganization(organizationId: string): Promise<User[]> {
    return this.model.findMany({
      where: { organizationId },
      orderBy: { fullName: 'asc' }
    });
  }

  /**
   * Find users by department
   */
  async findByDepartment(departmentId: string): Promise<User[]> {
    return this.model.findMany({
      where: { departmentId },
      orderBy: { fullName: 'asc' }
    });
  }

  /**
   * Find users by role
   */
  async findByRole(organizationId: string, role: string): Promise<User[]> {
    return this.model.findMany({
      where: {
        organizationId,
        roles: {
          has: role
        }
      },
      orderBy: { fullName: 'asc' }
    });
  }

  /**
   * Create a user
   */
  async create(data: UserCreateInput, userId: string): Promise<User> {
    // Prepare the data for Prisma
    const createData: any = {
      email: data.email,
      fullName: data.fullName,
      roles: data.roles,
      organization: {
        connect: { id: data.organizationId }
      },
      ...(data.departmentId && {
        department: {
          connect: { id: data.departmentId }
        }
      }),
      ...(data.createdById && {
        createdBy: {
          connect: { id: data.createdById }
        }
      })
    };

    return prisma.$transaction(async (tx: any) => {
      const result = await tx.user.create({
        data: createData
      });

      // Log the action
      await tx.auditLog.create({
        data: {
          userId,
          action: 'CREATE',
          entityType: 'user',
          entityId: result.id,
        },
      });

      return result;
    });
  }

  /**
   * Update a user
   */
  async update(id: string, data: UserUpdateInput, userId: string): Promise<User> {
    // Prepare the data for Prisma
    const updateData: any = {
      ...data,
      ...(data.departmentId === null ? {
        department: {
          disconnect: true
        }
      } : data.departmentId ? {
        department: {
          connect: { id: data.departmentId }
        }
      } : {}),
      updatedBy: {
        connect: { id: data.updatedById }
      }
    };

    // Remove fields that are handled by connect/disconnect
    delete updateData.departmentId;
    delete updateData.updatedById;

    return prisma.$transaction(async (tx: any) => {
      const result = await tx.user.update({
        where: { id },
        data: updateData
      });

      // Log the action
      await tx.auditLog.create({
        data: {
          userId,
          action: 'UPDATE',
          entityType: 'user',
          entityId: id,
        },
      });

      return result;
    });
  }

  /**
   * Add role to user
   */
  async addRole(id: string, role: string, userId: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }

    // Check if role already exists
    if (user.roles.includes(role)) {
      return user;
    }

    return this.update(id, {
      roles: [...user.roles, role],
      updatedById: userId
    }, userId);
  }

  /**
   * Remove role from user
   */
  async removeRole(id: string, role: string, userId: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }

    // Check if role exists
    if (!user.roles.includes(role)) {
      return user;
    }

    return this.update(id, {
      roles: user.roles.filter(r => r !== role),
      updatedById: userId
    }, userId);
  }

  /**
   * Change user's department
   */
  async changeDepartment(id: string, departmentId: string | null, userId: string): Promise<User> {
    return this.update(id, {
      departmentId,
      updatedById: userId
    }, userId);
  }

  /**
   * Find user details with department
   */
  async findWithDepartment(id: string): Promise<User & { department?: any }> {
    const user = await this.model.findUnique({
      where: { id },
      include: {
        department: true
      }
    });

    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }

    return user;
  }
}
