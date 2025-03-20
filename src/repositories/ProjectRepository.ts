import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { BaseRepository } from './BaseRepository';

// Temporary Project type definition until Prisma client is generated
export interface Project {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  departmentId?: string;
  status: string;
  startDate: Date;
  endDate: Date;
  budget?: number;
  resources: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  updatedById?: string;
  projectScores?: any[];
  committeeScores?: any[];
}

// Define specialized input types for project creation and updates
export interface ProjectCreateInput {
  name: string;
  description?: string;
  organizationId: string;
  departmentId?: string;
  status: string;
  startDate: Date | string;
  endDate: Date | string;
  budget?: number;
  resources: number;
  tags?: string[];
  createdById: string;
  updatedById?: string;
}

export interface ProjectUpdateInput {
  name?: string;
  description?: string;
  organizationId?: string;
  departmentId?: string;
  status?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  budget?: number;
  resources?: number;
  tags?: string[];
  updatedById: string;
}

export class ProjectRepository extends BaseRepository<
  Project,
  ProjectCreateInput,
  ProjectUpdateInput
> {
  protected readonly model = prisma.project;

  constructor() {
    super('project');
  }

  /**
   * Find projects by organization ID
   */
  async findByOrganization(organizationId: string): Promise<Project[]> {
    return this.model.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find projects by department ID
   */
  async findByDepartment(departmentId: string): Promise<Project[]> {
    return this.model.findMany({
      where: { departmentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find projects by status
   */
  async findByStatus(organizationId: string, status: string): Promise<Project[]> {
    return this.model.findMany({
      where: { 
        organizationId,
        status
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find projects with their criteria scores
   */
  async findWithScores(projectId: string): Promise<Project & { scores: any[] }> {
    const project = await this.model.findUnique({
      where: { id: projectId },
      include: {
        projectScores: {
          include: {
            criterion: true
          }
        }
      }
    });

    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    return {
      ...project,
      scores: project.projectScores
    };
  }

  /**
   * Find projects with committee scores
   */
  async findWithCommitteeScores(projectId: string): Promise<Project & { committeeScores: any[] }> {
    const project = await this.model.findUnique({
      where: { id: projectId },
      include: {
        committeeScores: {
          include: {
            criterion: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    return project;
  }

  /**
   * Create a project with proper relations
   */
  async create(data: ProjectCreateInput, userId: string): Promise<Project> {
    // Prepare the data for Prisma
    const createData: any = {
      name: data.name,
      description: data.description,
      status: data.status,
      startDate: data.startDate,
      endDate: data.endDate,
      budget: data.budget,
      resources: data.resources,
      tags: data.tags,
      organization: {
        connect: { id: data.organizationId }
      },
      createdBy: {
        connect: { id: data.createdById }
      },
      ...(data.departmentId && {
        department: {
          connect: { id: data.departmentId }
        }
      }),
      ...(data.updatedById && {
        updatedBy: {
          connect: { id: data.updatedById }
        }
      })
    };

    return prisma.$transaction(async (tx: any) => {
      const result = await tx.project.create({
        data: createData
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'CREATE',
          entityType: 'project',
          entityId: result.id,
        },
      });

      return result;
    });
  }

  /**
   * Update a project with proper relations
   */
  async update(id: string, data: ProjectUpdateInput, userId: string): Promise<Project> {
    // Prepare the data for Prisma
    const updateData: any = {
      ...data,
      ...(data.organizationId && {
        organization: {
          connect: { id: data.organizationId as string }
        }
      }),
      ...(data.departmentId && {
        department: {
          connect: { id: data.departmentId as string }
        }
      }),
      updatedBy: {
        connect: { id: data.updatedById }
      }
    };

    // Remove unnecessary fields that would cause TS errors
    delete updateData.organizationId;
    delete updateData.departmentId;
    delete updateData.updatedById;

    return prisma.$transaction(async (tx: any) => {
      const result = await tx.project.update({
        where: { id },
        data: updateData
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'UPDATE',
          entityType: 'project',
          entityId: result.id,
        },
      });

      return result;
    });
  }

  /**
   * Add or update a project's criteria score
   */
  async updateCriteriaScore(
    projectId: string, 
    criterionId: string, 
    versionId: string,
    score: number, 
    comment: string | null,
    userId: string
  ): Promise<any> {
    return prisma.$transaction(async (tx: any) => {
      // Check if score exists
      const existingScore = await tx.projectCriteriaScore.findFirst({
        where: {
          projectId,
          criterionId,
          versionId
        }
      });

      let result;
      
      if (existingScore) {
        // Update existing score
        result = await tx.projectCriteriaScore.update({
          where: {
            id: existingScore.id
          },
          data: {
            score,
            comment,
            updatedBy: {
              connect: { id: userId }
            }
          }
        });
      } else {
        // Create new score
        result = await tx.projectCriteriaScore.create({
          data: {
            score,
            comment,
            project: {
              connect: { id: projectId }
            },
            criterion: {
              connect: { id: criterionId }
            },
            version: {
              connect: { id: versionId }
            },
            createdBy: {
              connect: { id: userId }
            }
          }
        });
      }

      // Log the action
      await tx.auditLog.create({
        data: {
          userId,
          action: existingScore ? 'UPDATE' : 'CREATE',
          entityType: 'project_criteria_score',
          entityId: result.id,
        },
      });

      return result;
    });
  }

  /**
   * Calculate project's overall score
   */
  async calculateOverallScore(projectId: string, versionId: string): Promise<number> {
    // Get project scores and criteria
    const scores = await prisma.projectCriteriaScore.findMany({
      where: {
        projectId,
        versionId
      },
      include: {
        criterion: true
      }
    });

    if (!scores.length) {
      return 0;
    }

    // Calculate weighted sum
    let weightedSum = 0;
    let totalWeight = 0;

    for (const score of scores) {
      const { criterion } = score;
      const weight = criterion.weight || 1;
      let value = score.score;

      // For inverse criteria, invert the scale (10 - value + 1)
      if (criterion.isInverse) {
        value = 11 - value;
      }

      weightedSum += value * weight;
      totalWeight += weight;
    }

    // Return the normalized score
    return totalWeight > 0 ? parseFloat((weightedSum / totalWeight).toFixed(2)) : 0;
  }
}
