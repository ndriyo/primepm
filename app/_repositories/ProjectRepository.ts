import prisma, { getPrismaWithRLS } from '../_lib/prisma';
import { Prisma } from '@prisma/client';
import { BaseRepository } from './BaseRepository';
import { CriteriaRepository } from './CriteriaRepository';
import { calculateOverallScore as calculateScore, CriteriaScore } from '../_lib/scoreCalculator';

// Temporary Project type definition until Prisma client is generated
export interface Project {
  id: string;
  name: string;
  description?: string | null;
  organizationId: string;
  departmentId?: string | null;
  status: string;
  startDate: Date;
  endDate: Date;
  budget?: number | null;
  resources: number;
  tags: string[];
  score?: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  createdById: string;
  updatedById?: string | null;
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
  score?: number | null;
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
   * Gets a RLS-enabled Prisma client for the current context
   */
  protected getPrismaWithContext(organizationId?: string, userId?: string, userRole?: string, departmentId?: string) {
    return getPrismaWithRLS(organizationId, userId, userRole, departmentId);
  }

  /**
   * Find projects by organization ID
   */
  async findByOrganization(organizationId: string, userId?: string, userRole?: string, departmentId?: string): Promise<Project[]> {
    const prismaWithRLS = this.getPrismaWithContext(organizationId, userId, userRole, departmentId);
    
    // The where clause will be automatically modified by RLS based on role
    const projects = await prismaWithRLS.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        projectScores: {
          include: {
            criterion: true
          }
        }
      }
    });
    
    return projects as unknown as Project[];
  }

  /**
   * Find projects by department ID
   */
  async findByDepartment(departmentId: string, userId?: string, userRole?: string): Promise<Project[]> {
    // For departmentId queries, we need to first find a project with this department
    // to get its organizationId for proper RLS context
    const sampleProject = await prisma.project.findFirst({
      where: { departmentId },
      select: { organizationId: true }
    });
    
    if (!sampleProject) {
      return [];
    }
    
    const prismaWithRLS = this.getPrismaWithContext(
      sampleProject.organizationId, 
      userId, 
      userRole, 
      departmentId
    );
    
    const projects = await prismaWithRLS.project.findMany({
      where: { departmentId },
      orderBy: { createdAt: 'desc' },
      include: {
        projectScores: {
          include: {
            criterion: true
          }
        }
      }
    });
    
    return projects as unknown as Project[];
  }

  /**
   * Find projects by status
   */
  async findByStatus(organizationId: string, status: string, userId?: string, userRole?: string, departmentId?: string): Promise<Project[]> {
    const prismaWithRLS = this.getPrismaWithContext(organizationId, userId, userRole, departmentId);
    
    const projects = await prismaWithRLS.project.findMany({
      where: { 
        status
      },
      orderBy: { createdAt: 'desc' },
      include: {
        projectScores: {
          include: {
            criterion: true
          }
        }
      }
    });
    
    return projects as unknown as Project[];
  }

  /**
   * Find projects with their criteria scores
   */
  async findWithScores(projectId: string, userId?: string, userRole?: string, departmentId?: string): Promise<Project & { scores: any[] }> {
    // First get the basic project to get its organizationId
    const project = await this.findById(projectId);
    
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    
    const prismaWithRLS = this.getPrismaWithContext(project.organizationId, userId, userRole, departmentId);
    
    const projectWithScores = await prismaWithRLS.project.findUnique({
      where: { id: projectId },
      include: {
        projectScores: {
          include: {
            criterion: true
          }
        }
      }
    });

    if (!projectWithScores) {
      throw new Error(`Project with ID ${projectId} not found during score lookup`);
    }

    return {
      ...projectWithScores,
      scores: projectWithScores.projectScores
    };
  }

  /**
   * Find projects with committee scores
   */
  async findWithCommitteeScores(projectId: string, userId?: string, userRole?: string, departmentId?: string): Promise<Project & { committeeScores: any[] }> {
    // First get the basic project to get its organizationId
    const project = await this.findById(projectId);
    
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    
    const prismaWithRLS = this.getPrismaWithContext(project.organizationId, userId, userRole, departmentId);
    
    const projectWithScores = await prismaWithRLS.project.findUnique({
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

    if (!projectWithScores) {
      throw new Error(`Project with ID ${projectId} not found during committee score lookup`);
    }

    return projectWithScores;
  }

  /**
   * Create a project with proper relations
   * Note: We override the base create method to handle relations
   */
  async create(data: ProjectCreateInput, userId: string, userRole?: string, departmentId?: string): Promise<Project> {
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

    // Get RLS-enabled client
    const prismaWithRLS = this.getPrismaWithContext(data.organizationId, userId, userRole, departmentId);

    // Create the project
    const result = await prismaWithRLS.project.create({
      data: createData
    });

    // Create audit log entry
    await prismaWithRLS.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entityType: 'project',
        entityId: result.id
      },
    });
    
    return result as unknown as Project;
  }

  /**
   * Update a project with proper relations
   * Note: We override the base update method to handle relations
   */
  async update(id: string, data: ProjectUpdateInput, userId: string, userRole?: string, departmentId?: string): Promise<Project> {
    // Get the existing project to get its organization
    const existingProject = await this.findById(id);
    
    if (!existingProject) {
      throw new Error(`Project with ID ${id} not found`);
    }
    
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

    // Use organization from existing project if not changing it
    const organizationId = data.organizationId || existingProject.organizationId;
    const prismaWithRLS = this.getPrismaWithContext(organizationId, userId, userRole, departmentId);

    // Update the project
    const result = await prismaWithRLS.project.update({
      where: { id },
      data: updateData
    });

    // Create audit log entry
    await prismaWithRLS.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entityType: 'project',
        entityId: result.id
      },
    });
    
    return result as unknown as Project;
  }

  /**
   * Add or update a project's criteria score
   * @param projectId - ID of the project
   * @param criterionKeyOrId - Can be either a criterion key (e.g., "revenue") or a criterion ID (UUID)
   * @param versionId - ID of the criteria version
   * @param score - Numeric score
   * @param comment - Optional comment
   * @param userId - ID of the user making the change
   */
  async updateCriteriaScore(
    projectId: string, 
    criterionKeyOrId: string, 
    versionId: string,
    score: number, 
    comment: string | null,
    userId: string,
    userRole?: string,
    departmentId?: string
  ): Promise<any> {
    // Get the project to get its organization
    const project = await this.findById(projectId);
    
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    
    const prismaWithRLS = this.getPrismaWithContext(project.organizationId, userId, userRole, departmentId);
    
    // First check if we're dealing with a key or an ID
    let criterionId = criterionKeyOrId;
    
    // If it doesn't look like a UUID, assume it's a key and look up the ID
    if (!criterionKeyOrId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.log(`Looking up criterion ID for key: ${criterionKeyOrId}`);
      
      // Find the criterion by key within the specified version
      const criterion = await prismaWithRLS.criterion.findFirst({
        where: {
          key: criterionKeyOrId,
          versionId: versionId
        },
        select: {
          id: true
        }
      });
      
      if (!criterion) {
        throw new Error(`Criterion with key ${criterionKeyOrId} not found in version ${versionId}`);
      }
      
      criterionId = criterion.id;
      console.log(`Found criterion ID: ${criterionId} for key: ${criterionKeyOrId}`);
    }
    
    // Check if score exists using the resolved criterionId
    const existingScore = await prismaWithRLS.projectCriteriaScore.findFirst({
      where: {
        projectId,
        criterionId,
        versionId
      }
    });

    let result;
    
    if (existingScore) {
      // Update existing score
      result = await prismaWithRLS.projectCriteriaScore.update({
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
      result = await prismaWithRLS.projectCriteriaScore.create({
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
    await prismaWithRLS.auditLog.create({
      data: {
        userId,
        action: existingScore ? 'UPDATE' : 'CREATE',
        entityType: 'project_criteria_score',
        entityId: result.id
      },
    });

    return result;
  }

  /**
   * Calculate project's overall score using the centralized score calculator
   */
  async calculateOverallScore(projectId: string, versionId?: string, userId?: string, userRole?: string, departmentId?: string): Promise<number> {
    // Get the project to get its organization
    const project = await this.findById(projectId);
    
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    
    const prismaWithRLS = this.getPrismaWithContext(project.organizationId, userId, userRole, departmentId);
    
    // If versionId is not provided, find the active version
    if (!versionId) {
      const criteriaRepo = new CriteriaRepository();
      const activeVersion = await criteriaRepo.findActiveVersion(project.organizationId);
      
      if (!activeVersion) {
        throw new Error(`No active criteria version found for organization ${project.organizationId}`);
      }
      
      versionId = activeVersion.id;
    }
    
    // Get project scores and criteria with RLS context
    const scores = await prismaWithRLS.projectCriteriaScore.findMany({
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

    // Convert scores to the format expected by the score calculator
    const criteriaScores: CriteriaScore[] = scores.map(score => {
      const { criterion } = score;
      
      // Get scale information
      const scaleMin = criterion.scale && typeof criterion.scale === 'object' && 'min' in criterion.scale 
        ? Number(criterion.scale.min) 
        : 0;
      
      const scaleMax = criterion.scale && typeof criterion.scale === 'object' && 'max' in criterion.scale 
        ? Number(criterion.scale.max) 
        : 10;
      
      return {
        criterionId: criterion.id,
        criterionKey: criterion.key,
        score: score.score,
        weight: criterion.weight || 1,
        isInverse: criterion.isInverse || false,
        scaleMax,
        scaleMin
      };
    });

    // Use the centralized score calculator
    const calculatedScore = calculateScore(criteriaScores, {
      normalizeOutput: true,
      outputScaleMax: 5,
      outputScaleMin: 0,
      decimalPlaces: 2
    });
    
    // Update the project with the calculated score
    try {
      // Use the raw SQL query to update the score
      await prismaWithRLS.$executeRaw`UPDATE projects SET score = ${calculatedScore} WHERE id = ${projectId}::uuid`;
      
      console.log(`Updated project ${projectId} score to ${calculatedScore}`);
    } catch (error) {
      console.error(`Error updating project score:`, error);
      // Continue with the return value even if the update fails
    }

    return calculatedScore;
  }
}
