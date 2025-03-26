import prisma, { getPrismaWithRLS } from '../_lib/prisma';
import { BaseRepository } from './BaseRepository';

// Portfolio Simulation type definition
export interface PortfolioSimulation {
  id: string;
  portfolioId: string;
  name: string;
  description?: string | null;
  constraints?: any;
  isSelected: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
  createdById: string;
  updatedById?: string | null;
}

// Portfolio Simulation input types
export interface PortfolioSimulationCreateInput {
  portfolioId: string;
  name: string;
  description?: string;
  constraints?: any;
  isSelected?: boolean;
  createdById: string;
}

export interface PortfolioSimulationUpdateInput {
  name?: string;
  description?: string;
  constraints?: any;
  isSelected?: boolean;
  updatedById: string;
}

// Portfolio Simulation Project type definition
export interface PortfolioSimulationProject {
  id: string;
  simulationId: string;
  projectId: string;
  isSelected: boolean;
  createdAt: Date | null;
}

// Portfolio Simulation Project input types
export interface PortfolioSimulationProjectCreateInput {
  simulationId: string;
  projectId: string;
  isSelected?: boolean;
}

export class PortfolioSimulationRepository {
  private readonly simulationModel = prisma.portfolioSimulation;
  private readonly simulationProjectModel = prisma.portfolioSimulationProject;

  /**
   * Gets a RLS-enabled Prisma client for the current context
   */
  protected getPrismaWithContext(organizationId?: string, userId?: string, userRole?: string, departmentId?: string) {
    return getPrismaWithRLS(organizationId, userId, userRole, departmentId);
  }

  /**
   * Find simulations by portfolio ID
   */
  async findByPortfolio(portfolioId: string, userId?: string, userRole?: string, departmentId?: string): Promise<PortfolioSimulation[]> {
    // First get the portfolio to get its organizationId
    const portfolio = await prisma.portfolioSelection.findUnique({
      where: { id: portfolioId },
      select: { organizationId: true }
    });
    
    if (!portfolio) {
      throw new Error(`Portfolio with ID ${portfolioId} not found`);
    }
    
    const prismaWithRLS = this.getPrismaWithContext(portfolio.organizationId, userId, userRole, departmentId);
    
    const simulations = await prismaWithRLS.portfolioSimulation.findMany({
      where: { portfolioId },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return simulations as unknown as PortfolioSimulation[];
  }

  /**
   * Find a simulation by ID
   */
  async findById(id: string, userId?: string, userRole?: string, departmentId?: string): Promise<PortfolioSimulation | null> {
    // First get the simulation to get its portfolio's organizationId
    const simulation = await prisma.portfolioSimulation.findUnique({
      where: { id },
      include: {
        portfolio: {
          select: {
            organizationId: true
          }
        }
      }
    });
    
    if (!simulation) {
      return null;
    }
    
    const prismaWithRLS = this.getPrismaWithContext(simulation.portfolio.organizationId, userId, userRole, departmentId);
    
    const result = await prismaWithRLS.portfolioSimulation.findUnique({
      where: { id }
    });
    
    return result as unknown as PortfolioSimulation;
  }

  /**
   * Find the selected simulation for a portfolio
   */
  async findSelectedSimulation(portfolioId: string, userId?: string, userRole?: string, departmentId?: string): Promise<PortfolioSimulation | null> {
    // First get the portfolio to get its organizationId
    const portfolio = await prisma.portfolioSelection.findUnique({
      where: { id: portfolioId },
      select: { organizationId: true }
    });
    
    if (!portfolio) {
      throw new Error(`Portfolio with ID ${portfolioId} not found`);
    }
    
    const prismaWithRLS = this.getPrismaWithContext(portfolio.organizationId, userId, userRole, departmentId);
    
    const simulation = await prismaWithRLS.portfolioSimulation.findFirst({
      where: {
        portfolioId,
        isSelected: true
      }
    });
    
    return simulation as unknown as PortfolioSimulation;
  }

  /**
   * Create a portfolio simulation
   */
  async create(data: PortfolioSimulationCreateInput, userId: string, userRole?: string, departmentId?: string): Promise<PortfolioSimulation> {
    // Get the portfolio to get its organizationId
    const portfolio = await prisma.portfolioSelection.findUnique({
      where: { id: data.portfolioId },
      select: { organizationId: true }
    });
    
    if (!portfolio) {
      throw new Error(`Portfolio with ID ${data.portfolioId} not found`);
    }
    
    const prismaWithRLS = this.getPrismaWithContext(portfolio.organizationId, userId, userRole, departmentId);
    
    // If this simulation is selected, unselect any other selected simulations
    if (data.isSelected) {
      await prismaWithRLS.portfolioSimulation.updateMany({
        where: {
          portfolioId: data.portfolioId,
          isSelected: true
        },
        data: {
          isSelected: false
        }
      });
    }
    
    // Prepare the data for Prisma
    const createData: any = {
      name: data.name,
      description: data.description,
      constraints: data.constraints,
      isSelected: data.isSelected || false,
      portfolio: {
        connect: { id: data.portfolioId }
      },
      createdBy: {
        connect: { id: data.createdById }
      }
    };
    
    // Create the simulation
    const result = await prismaWithRLS.portfolioSimulation.create({
      data: createData
    });
    
    // Create audit log entry
    await prismaWithRLS.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entityType: 'portfolio_simulation',
        entityId: result.id
      },
    });
    
    return result as unknown as PortfolioSimulation;
  }

  /**
   * Update a portfolio simulation
   */
  async update(id: string, data: PortfolioSimulationUpdateInput, userId: string, userRole?: string, departmentId?: string): Promise<PortfolioSimulation> {
    // Get the existing simulation to get its portfolio's organizationId
    const simulation = await prisma.portfolioSimulation.findUnique({
      where: { id },
      include: {
        portfolio: {
          select: {
            organizationId: true,
            id: true
          }
        }
      }
    });
    
    if (!simulation) {
      throw new Error(`Portfolio simulation with ID ${id} not found`);
    }
    
    const prismaWithRLS = this.getPrismaWithContext(simulation.portfolio.organizationId, userId, userRole, departmentId);
    
    // If this simulation is being selected, unselect any other selected simulations
    if (data.isSelected) {
      await prismaWithRLS.portfolioSimulation.updateMany({
        where: {
          portfolioId: simulation.portfolio.id,
          isSelected: true,
          id: {
            not: id
          }
        },
        data: {
          isSelected: false
        }
      });
    }
    
    // Prepare the data for Prisma
    const updateData: any = {
      ...data,
      updatedBy: {
        connect: { id: data.updatedById }
      }
    };
    
    // Remove unnecessary fields that would cause TS errors
    delete updateData.updatedById;
    
    // Update the simulation
    const result = await prismaWithRLS.portfolioSimulation.update({
      where: { id },
      data: updateData
    });
    
    // Create audit log entry
    await prismaWithRLS.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entityType: 'portfolio_simulation',
        entityId: result.id
      },
    });
    
    return result as unknown as PortfolioSimulation;
  }

  /**
   * Delete a portfolio simulation
   */
  async delete(id: string, userId: string, userRole?: string, departmentId?: string): Promise<boolean> {
    // Get the existing simulation to get its portfolio's organizationId
    const simulation = await prisma.portfolioSimulation.findUnique({
      where: { id },
      include: {
        portfolio: {
          select: {
            organizationId: true
          }
        }
      }
    });
    
    if (!simulation) {
      return false;
    }
    
    const prismaWithRLS = this.getPrismaWithContext(simulation.portfolio.organizationId, userId, userRole, departmentId);
    
    // Delete the simulation
    await prismaWithRLS.portfolioSimulation.delete({
      where: { id }
    });
    
    // Create audit log entry
    await prismaWithRLS.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        entityType: 'portfolio_simulation',
        entityId: id
      },
    });
    
    return true;
  }

  /**
   * Add a project to a simulation
   */
  async addProject(data: PortfolioSimulationProjectCreateInput, userId: string, userRole?: string, departmentId?: string): Promise<PortfolioSimulationProject> {
    // Get the simulation to get its portfolio's organizationId
    const simulation = await prisma.portfolioSimulation.findUnique({
      where: { id: data.simulationId },
      include: {
        portfolio: {
          select: {
            organizationId: true
          }
        }
      }
    });
    
    if (!simulation) {
      throw new Error(`Portfolio simulation with ID ${data.simulationId} not found`);
    }
    
    const prismaWithRLS = this.getPrismaWithContext(simulation.portfolio.organizationId, userId, userRole, departmentId);
    
    // Check if the project is already in the simulation
    const existingProject = await prismaWithRLS.portfolioSimulationProject.findFirst({
      where: {
        simulationId: data.simulationId,
        projectId: data.projectId
      }
    });
    
    if (existingProject) {
      // Update the existing project
      const result = await prismaWithRLS.portfolioSimulationProject.update({
        where: {
          id: existingProject.id
        },
        data: {
          isSelected: data.isSelected !== undefined ? data.isSelected : existingProject.isSelected
        }
      });
      
      return result as unknown as PortfolioSimulationProject;
    }
    
    // For now, we'll use a workaround to avoid TypeScript errors
    // In a production environment, you would update the Prisma schema to match the implementation
    const rawResult = await prismaWithRLS.$queryRaw`
      INSERT INTO portfolio_simulation_projects (simulation_id, project_id, is_selected)
      VALUES (${data.simulationId}, ${data.projectId}, ${data.isSelected !== undefined ? data.isSelected : false})
      RETURNING id, simulation_id, project_id, is_selected, created_at
    `;
    
    // Type assertion for the raw result
    const resultArray = rawResult as any[];
    if (!resultArray || resultArray.length === 0) {
      throw new Error('Failed to create portfolio simulation project');
    }
    
    const resultItem = resultArray[0];
    
    // Create audit log entry
    await prismaWithRLS.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entityType: 'portfolio_simulation_project',
        entityId: resultItem.id
      },
    });
    
    return {
      id: resultItem.id,
      simulationId: resultItem.simulation_id,
      projectId: resultItem.project_id,
      isSelected: resultItem.is_selected === true,
      createdAt: resultItem.created_at
    };
  }

  /**
   * Remove a project from a simulation
   */
  async removeProject(simulationId: string, projectId: string, userId: string, userRole?: string, departmentId?: string): Promise<boolean> {
    // Get the simulation to get its portfolio's organizationId
    const simulation = await prisma.portfolioSimulation.findUnique({
      where: { id: simulationId },
      include: {
        portfolio: {
          select: {
            organizationId: true
          }
        }
      }
    });
    
    if (!simulation) {
      throw new Error(`Portfolio simulation with ID ${simulationId} not found`);
    }
    
    const prismaWithRLS = this.getPrismaWithContext(simulation.portfolio.organizationId, userId, userRole, departmentId);
    
    // Find the project in the simulation
    const simulationProject = await prismaWithRLS.portfolioSimulationProject.findFirst({
      where: {
        simulationId,
        projectId
      }
    });
    
    if (!simulationProject) {
      return false;
    }
    
    // Remove the project from the simulation
    await prismaWithRLS.portfolioSimulationProject.delete({
      where: {
        id: simulationProject.id
      }
    });
    
    // Create audit log entry
    await prismaWithRLS.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        entityType: 'portfolio_simulation_project',
        entityId: simulationProject.id
      },
    });
    
    return true;
  }

  /**
   * Apply a simulation to the portfolio
   * This will update the portfolioStatus of all projects in the portfolio
   * based on whether they are selected in the simulation
   */
  async applySimulation(simulationId: string, userId: string, userRole?: string, departmentId?: string): Promise<boolean> {
    // Get the simulation to get its portfolio's organizationId
    const simulation = await prisma.portfolioSimulation.findUnique({
      where: { id: simulationId },
      include: {
        portfolio: {
          select: {
            organizationId: true,
            id: true
          }
        }
      }
    });
    
    if (!simulation) {
      throw new Error(`Portfolio simulation with ID ${simulationId} not found`);
    }
    
    const prismaWithRLS = this.getPrismaWithContext(simulation.portfolio.organizationId, userId, userRole, departmentId);
    
    // Mark this simulation as selected
    await prismaWithRLS.portfolioSimulation.update({
      where: { id: simulationId },
      data: {
        isSelected: true
      }
    });
    
    // Unselect any other simulations for this portfolio
    await prismaWithRLS.portfolioSimulation.updateMany({
      where: {
        portfolioId: simulation.portfolio.id,
        id: {
          not: simulationId
        }
      },
      data: {
        isSelected: false
      }
    });
    
    // Get all projects in the portfolio
    const portfolioProjects = await prismaWithRLS.project.findMany({
      where: {
        portfolioSelectionId: simulation.portfolio.id
      },
      select: {
        id: true
      }
    });
    
    // Get all simulation projects
    const simulationProjects = await prismaWithRLS.portfolioSimulationProject.findMany({
      where: {
        simulationId
      }
    });
    
    // Create a map of selected projects
    const selectedProjects = new Map<string, boolean>();
    simulationProjects.forEach(sp => {
      selectedProjects.set(sp.projectId, sp.isSelected || false);
    });
    
    // Update the portfolioStatus of all projects in the portfolio
    for (const project of portfolioProjects) {
      const isSelected = selectedProjects.get(project.id) || false;
      await prismaWithRLS.project.update({
        where: { id: project.id },
        data: {
          portfolioStatus: isSelected ? 'SELECTED' : 'REJECTED'
        }
      });
    }
    
    // Create audit log entry
    await prismaWithRLS.auditLog.create({
      data: {
        userId,
        action: 'APPLY',
        entityType: 'portfolio_simulation',
        entityId: simulationId
      },
    });
    
    return true;
  }
}
