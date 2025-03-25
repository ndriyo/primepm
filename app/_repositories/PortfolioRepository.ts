import prisma from '../_lib/prisma';
import { BaseRepository } from './BaseRepository';
import { Project } from './ProjectRepository';

// Temporary type definitions until Prisma client is generated
export interface PortfolioSelection {
  id: string;
  name: string;
  description?: string | null;
  version: string;
  status: 'draft' | 'final';
  selectionDate: Date;
  constraints?: Record<string, any> | null;
  isActive: boolean | null;
  organizationId: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  createdById: string;
  updatedById?: string | null;
  portfolioProjects?: PortfolioProject[];
}

export interface PortfolioProject {
  id: string;
  portfolioId: string;
  projectId: string;
  isSelected: boolean;
  score: number;
  createdAt: Date | null;
  project?: Project;
}

// Input types
export interface PortfolioSelectionCreateInput {
  name: string;
  description?: string;
  version: string;
  status: 'draft' | 'final';
  selectionDate: Date | string;
  constraints?: Record<string, any>;
  isActive?: boolean;
  organizationId: string;
  createdById: string;
}

export interface PortfolioSelectionUpdateInput {
  name?: string;
  description?: string;
  version?: string;
  status?: 'draft' | 'final';
  selectionDate?: Date | string;
  constraints?: Record<string, any>;
  isActive?: boolean;
  updatedById: string;
}

export interface PortfolioProjectCreateInput {
  portfolioId: string;
  projectId: string;
  isSelected: boolean;
  score: number;
}

export class PortfolioRepository {
  /**
   * Find all portfolio selections for an organization
   */
  async findSelectionsByOrganization(organizationId: string): Promise<PortfolioSelection[]> {
    const selections = await prisma.portfolioSelection.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return selections as unknown as PortfolioSelection[];
  }

  /**
   * Find active portfolio selection
   */
  async findActiveSelection(organizationId: string): Promise<PortfolioSelection | null> {
    const selection = await prisma.portfolioSelection.findFirst({
      where: {
        organizationId,
        isActive: true
      },
      include: {
        portfolioProjects: {
          include: {
            project: true
          }
        }
      }
    });
    return selection as unknown as PortfolioSelection | null;
  }

  /**
   * Find portfolio selection by ID
   */
  async findSelectionById(id: string): Promise<PortfolioSelection | null> {
    const selection = await prisma.portfolioSelection.findUnique({
      where: { id },
      include: {
        portfolioProjects: {
          include: {
            project: true
          }
        }
      }
    });
    return selection as unknown as PortfolioSelection | null;
  }

  /**
   * Create a portfolio selection
   */
  async createSelection(data: PortfolioSelectionCreateInput, userId: string): Promise<PortfolioSelection> {
    let result: any;
    
    await prisma.$transaction(async (tx: any) => {
      // If making this version active, deactivate all others
      if (data.isActive) {
        await tx.portfolioSelection.updateMany({
          where: {
            organizationId: data.organizationId,
            isActive: true
          },
          data: {
            isActive: false,
            updatedBy: {
              connect: { id: data.createdById }
            }
          }
        });
      }

      // Create the new portfolio selection
      const createData: any = {
        name: data.name,
        description: data.description,
        version: data.version,
        status: data.status,
        selectionDate: data.selectionDate,
        constraints: data.constraints,
        isActive: data.isActive ?? false,
        organization: {
          connect: { id: data.organizationId }
        },
        createdBy: {
          connect: { id: data.createdById }
        }
      };

      result = await tx.portfolioSelection.create({
        data: createData
      });

      // Log the action
      await tx.auditLog.create({
        data: {
          userId,
          action: 'CREATE',
          entityType: 'portfolio_selection',
          entityId: result.id,
        },
      });
    });
    
    return result as unknown as PortfolioSelection;
  }

  /**
   * Update a portfolio selection
   */
  async updateSelection(id: string, data: PortfolioSelectionUpdateInput, userId: string): Promise<PortfolioSelection> {
    let result: any;
    
    await prisma.$transaction(async (tx: any) => {
      const selection = await tx.portfolioSelection.findUnique({
        where: { id },
        select: { organizationId: true }
      });

      if (!selection) {
        throw new Error(`Portfolio selection with ID ${id} not found`);
      }

      // If making this selection active, deactivate all others
      if (data.isActive) {
        await tx.portfolioSelection.updateMany({
          where: {
            organizationId: selection.organizationId,
            isActive: true,
            id: { not: id }
          },
          data: {
            isActive: false,
            updatedBy: {
              connect: { id: data.updatedById }
            }
          }
        });
      }

      // Update the portfolio selection
      const updateData: any = {
        ...data,
        updatedBy: {
          connect: { id: data.updatedById }
        }
      };

      // Remove the updatedById field to avoid TS errors
      delete updateData.updatedById;

      result = await tx.portfolioSelection.update({
        where: { id },
        data: updateData
      });

      // Log the action
      await tx.auditLog.create({
        data: {
          userId,
          action: 'UPDATE',
          entityType: 'portfolio_selection',
          entityId: id,
        },
      });
    });
    
    return result as unknown as PortfolioSelection;
  }

  /**
   * Delete a portfolio selection
   */
  async deleteSelection(id: string, userId: string): Promise<PortfolioSelection> {
    let result: any;
    
    await prisma.$transaction(async (tx: any) => {
      // First delete all portfolio projects
      await tx.portfolioProject.deleteMany({
        where: { portfolioId: id }
      });

      // Then delete the selection
      result = await tx.portfolioSelection.delete({
        where: { id }
      });

      // Log the action
      await tx.auditLog.create({
        data: {
          userId,
          action: 'DELETE',
          entityType: 'portfolio_selection',
          entityId: id,
        },
      });
    });
    
    return result as unknown as PortfolioSelection;
  }

  /**
   * Add a project to a portfolio
   */
  async addProjectToPortfolio(data: PortfolioProjectCreateInput, userId: string): Promise<PortfolioProject> {
    let result: any;
    
    await prisma.$transaction(async (tx: any) => {
      // Check if project already exists in this portfolio
      const existingProject = await tx.portfolioProject.findFirst({
        where: {
          portfolioId: data.portfolioId,
          projectId: data.projectId
        }
      });

      if (existingProject) {
        // Update existing
        result = await tx.portfolioProject.update({
          where: { id: existingProject.id },
          data: {
            isSelected: data.isSelected,
            score: data.score
          }
        });

        // Log the action
        await tx.auditLog.create({
          data: {
            userId,
            action: 'UPDATE',
            entityType: 'portfolio_project',
            entityId: result.id,
          },
        });
      } else {
        // Create new
        result = await tx.portfolioProject.create({
          data: {
            portfolio: {
              connect: { id: data.portfolioId }
            },
            project: {
              connect: { id: data.projectId }
            },
            isSelected: data.isSelected,
            score: data.score
          }
        });

        // Log the action
        await tx.auditLog.create({
          data: {
            userId,
            action: 'CREATE',
            entityType: 'portfolio_project',
            entityId: result.id,
          },
        });
      }
    });
    
    return result as unknown as PortfolioProject;
  }

  /**
   * Remove a project from a portfolio
   */
  async removeProjectFromPortfolio(portfolioId: string, projectId: string, userId: string): Promise<void> {
    return prisma.$transaction(async (tx: any) => {
      const portfolioProject = await tx.portfolioProject.findFirst({
        where: {
          portfolioId,
          projectId
        }
      });

      if (!portfolioProject) {
        throw new Error(`Project ${projectId} not found in portfolio ${portfolioId}`);
      }

      // Delete the portfolio project
      await tx.portfolioProject.delete({
        where: { id: portfolioProject.id }
      });

      // Log the action
      await tx.auditLog.create({
        data: {
          userId,
          action: 'DELETE',
          entityType: 'portfolio_project',
          entityId: portfolioProject.id,
        },
      });
    });
  }

  /**
   * Update portfolio project selection status
   */
  async updateProjectSelection(
    portfolioId: string, 
    projectId: string, 
    isSelected: boolean,
    userId: string
  ): Promise<PortfolioProject> {
    let result: any;
    
    await prisma.$transaction(async (tx: any) => {
      const portfolioProject = await tx.portfolioProject.findFirst({
        where: {
          portfolioId,
          projectId
        }
      });

      if (!portfolioProject) {
        throw new Error(`Project ${projectId} not found in portfolio ${portfolioId}`);
      }

      // Update the portfolio project
      result = await tx.portfolioProject.update({
        where: { id: portfolioProject.id },
        data: { isSelected }
      });

      // Log the action
      await tx.auditLog.create({
        data: {
          userId,
          action: 'UPDATE',
          entityType: 'portfolio_project',
          entityId: portfolioProject.id,
        },
      });
    });
    
    return result as unknown as PortfolioProject;
  }

  /**
   * Optimize portfolio based on constraints
   */
  async optimizePortfolio(
    portfolioId: string,
    constraints: {
      budgetLimit?: number;
      resourceLimit?: number;
      requiredProjectIds?: string[];
    },
    userId: string
  ): Promise<void> {
    return prisma.$transaction(async (tx: any) => {
      // Get the portfolio with projects
      const portfolio = await tx.portfolioSelection.findUnique({
        where: { id: portfolioId },
        include: {
          portfolioProjects: {
            include: {
              project: true
            }
          }
        }
      });

      if (!portfolio) {
        throw new Error(`Portfolio ${portfolioId} not found`);
      }

      // Sort projects by score (descending)
      const sortedProjects = [...portfolio.portfolioProjects].sort((a, b) => b.score - a.score);

      // Set required projects to selected first
      if (constraints.requiredProjectIds?.length) {
        for (const portfolioProject of sortedProjects) {
          if (constraints.requiredProjectIds.includes(portfolioProject.projectId)) {
            if (!portfolioProject.isSelected) {
              await tx.portfolioProject.update({
                where: { id: portfolioProject.id },
                data: { isSelected: true }
              });
            }
          }
        }
      }

      // Calculate initial selected resources/budget
      let totalBudget = 0;
      let totalResources = 0;
      
      // First pass - handle required projects
      for (const portfolioProject of sortedProjects) {
        const project = portfolioProject.project;
        
        if (portfolioProject.isSelected) {
          totalBudget += project.budget || 0;
          totalResources += project.resources || 0;
        }
      }

      // Second pass - select/deselect based on constraints
      for (const portfolioProject of sortedProjects) {
        const project = portfolioProject.project;
        
        // Skip projects that are required
        if (constraints.requiredProjectIds?.includes(portfolioProject.projectId)) {
          continue;
        }
        
        const projectBudget = project.budget || 0;
        const projectResources = project.resources || 0;

        // If already selected, check if it should be deselected due to constraints
        if (portfolioProject.isSelected) {
          let shouldDeselect = false;
          
          if (constraints.budgetLimit && totalBudget > constraints.budgetLimit) {
            shouldDeselect = true;
          }
          
          if (constraints.resourceLimit && totalResources > constraints.resourceLimit) {
            shouldDeselect = true;
          }
          
          if (shouldDeselect) {
            await tx.portfolioProject.update({
              where: { id: portfolioProject.id },
              data: { isSelected: false }
            });
            
            totalBudget -= projectBudget;
            totalResources -= projectResources;
          }
        } 
        // If not selected, check if it should be selected
        else {
          let canSelect = true;
          
          if (constraints.budgetLimit && totalBudget + projectBudget > constraints.budgetLimit) {
            canSelect = false;
          }
          
          if (constraints.resourceLimit && totalResources + projectResources > constraints.resourceLimit) {
            canSelect = false;
          }
          
          if (canSelect) {
            await tx.portfolioProject.update({
              where: { id: portfolioProject.id },
              data: { isSelected: true }
            });
            
            totalBudget += projectBudget;
            totalResources += projectResources;
          }
        }
      }

      // Update portfolio with the latest constraints
      await tx.portfolioSelection.update({
        where: { id: portfolioId },
        data: {
          constraints,
          updatedBy: {
            connect: { id: userId }
          }
        }
      });

      // Log the action
      await tx.auditLog.create({
        data: {
          userId,
          action: 'UPDATE',
          entityType: 'portfolio_optimization',
          entityId: portfolioId,
        },
      });
    });
  }
}
