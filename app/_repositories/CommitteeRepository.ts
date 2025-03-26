import { PrismaClient } from '@prisma/client';
import prisma, { getPrismaWithRLS } from '@/app/_lib/prisma';
import { BaseRepository } from './BaseRepository';

/**
 * Repository for committee-related operations
 */
export class CommitteeRepository extends BaseRepository<any, any, any> {
  protected readonly model = prisma.committeeScore;
  private readonly scoreModel = prisma.committeeScore;
  private readonly sessionModel = prisma.committeeReviewSession;

  constructor() {
    super('committee_score');
  }

  /**
   * Gets a RLS-enabled Prisma client for the current context
   * @param organizationId The organization ID
   * @param userId The user ID
   * @param userRole The user role
   * @param departmentId The department ID
   * @returns A Prisma client with RLS applied
   */
  protected getPrismaWithContext(
    organizationId: string,
    userId: string,
    userRole: string,
    departmentId?: string
  ) {
    return getPrismaWithRLS(organizationId, userId, userRole, departmentId);
  }

  /**
   * Get sessions for a user
   * @param userId The user ID
   * @param organizationId The organization ID
   * @param userRole The user role
   * @param departmentId The department ID
   * @returns The sessions for the user
   */
  async getSessionsForUser(
    userId: string,
    organizationId: string,
    userRole: string,
    departmentId?: string
  ) {
    const prisma = this.getPrismaWithContext(organizationId, userId, userRole, departmentId);
    
    // For admin users, return all sessions
    if (userRole === 'ADMIN' || userRole === 'PMO') {
      return prisma.committeeReviewSession.findMany({
        include: {
          portfolio: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }
    
    // For regular users, return only sessions they are members of
    // Note: This is a simplified implementation until the schema is updated
    return prisma.committeeReviewSession.findMany({
      include: {
        portfolio: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Create a new committee review session
   * @param data The session data
   * @param userId The user ID
   * @param organizationId The organization ID
   * @param userRole The user role
   * @param departmentId The department ID
   * @returns The created session
   */
  async createSession(
    data: {
      portfolioId: string;
      name: string;
      description?: string;
      startDate?: Date;
      endDate?: Date;
      status?: string;
      members?: string[];
    },
    userId: string,
    organizationId: string,
    userRole: string,
    departmentId?: string
  ) {
    const prisma = this.getPrismaWithContext(organizationId, userId, userRole, departmentId);
    
    // Create the session
    const session = await prisma.committeeReviewSession.create({
      data: {
        portfolioId: data.portfolioId,
        name: data.name,
        description: data.description,
        startDate: data.startDate || new Date(),
        endDate: data.endDate || new Date(),
        status: data.status || 'ACTIVE',
        createdById: userId
      },
      include: {
        portfolio: true
      }
    });
    
    // Add members if provided - this will be implemented when the schema is updated
    // For now, just return the session
    return session;
  }

  /**
   * Get scoring progress for a user
   * @param userId The user ID
   * @param sessionId The session ID
   * @param currentUserId The current user ID
   * @param userRole The user role
   * @param departmentId The department ID
   * @returns The scoring progress
   */
  async getScoringProgress(
    userId: string,
    sessionId: string,
    currentUserId: string,
    userRole: string,
    departmentId?: string,
    organizationId?: string
  ) {
    // Only allow users to view their own progress or admins to view any progress
    if (userId !== currentUserId && userRole !== 'ADMIN' && userRole !== 'PMO') {
      throw new Error('Unauthorized to view this user\'s progress');
    }
    
    const prisma = getPrismaWithRLS(organizationId || '', currentUserId, userRole, departmentId);
    
    // Get the session
    const session = await prisma.committeeReviewSession.findUnique({
      where: { id: sessionId },
      include: {
        portfolio: true
      }
    });
    
    if (!session) {
      throw new Error('Committee review session not found');
    }
    
    // Get all projects for this portfolio
    const projects = await prisma.project.findMany({
      where: {
        portfolioSelectionId: session.portfolioId
      },
      include: {
        projectScores: {
          include: {
            criterion: true
          }
        },
        committeeScores: {
          where: {
            userId,
            sessionId
          }
        }
      }
    });
    
    // Calculate progress
    let totalProjects = projects.length;
    let completedProjects = 0;
    let inProgressProjects = 0;
    let notStartedProjects = 0;
    let totalScores = 0;
    let completedScores = 0;
    let draftScores = 0;
    
    const projectProgress = projects.map((project: any) => {
      const criteria = project.projectScores.map((score: any) => score.criterion);
      const totalCriteria = criteria.length;
      totalScores += totalCriteria;
      
      const committeeScores = project.committeeScores || [];
      // Note: Using any for now until schema is updated
      const completedCriteriaForProject = committeeScores.length;
      const draftCriteriaForProject = 0;
      
      completedScores += completedCriteriaForProject;
      draftScores += draftCriteriaForProject;
      
      // Determine project status
      let status = 'NOT_STARTED';
      if (completedCriteriaForProject === totalCriteria) {
        status = 'COMPLETED';
        completedProjects++;
      } else if (completedCriteriaForProject > 0 || draftCriteriaForProject > 0) {
        status = 'IN_PROGRESS';
        inProgressProjects++;
      } else {
        notStartedProjects++;
      }
      
      return {
        id: project.id,
        name: project.name,
        totalCriteria,
        completedCriteria: completedCriteriaForProject,
        draftCriteria: draftCriteriaForProject,
        progress: totalCriteria > 0 ? (completedCriteriaForProject / totalCriteria) * 100 : 0,
        status
      };
    });
    
    // Calculate overall progress
    const progress = totalScores > 0 ? (completedScores / totalScores) * 100 : 0;
    
    return {
      totalProjects,
      completedProjects,
      inProgressProjects,
      notStartedProjects,
      totalScores,
      completedScores,
      draftScores,
      progress,
      projectProgress
    };
  }

  /**
   * Submit all draft scores for a user
   * @param userId The user ID
   * @param sessionId The session ID
   * @param currentUserId The current user ID
   * @param userRole The user role
   * @param departmentId The department ID
   * @returns The number of scores submitted
   */
  async submitScores(
    userId: string,
    sessionId: string,
    currentUserId: string,
    userRole: string,
    departmentId?: string,
    organizationId?: string
  ) {
    // Only allow users to submit their own scores or admins to submit any scores
    if (userId !== currentUserId && userRole !== 'ADMIN' && userRole !== 'PMO') {
      throw new Error('Unauthorized to submit scores for this user');
    }
    
    const prisma = getPrismaWithRLS(organizationId || '', currentUserId, userRole, departmentId);
    
    // Update all draft scores to submitted
    // Note: This is a simplified implementation until the schema is updated
    return { count: 0 };
  }

  /**
   * Save a committee score
   * @param data The score data
   * @param userId The user ID
   * @param organizationId The organization ID
   * @param userRole The user role
   * @param departmentId The department ID
   * @returns The saved score
   */
  async saveScore(
    data: {
      projectId: string;
      criterionId: string;
      score: number;
      comment?: string;
      status?: string;
      sessionId?: string;
    },
    userId: string,
    organizationId: string,
    userRole: string,
    departmentId?: string
  ) {
    const prisma = this.getPrismaWithContext(organizationId, userId, userRole, departmentId);
    
    // Check if score already exists
    const existingScore = await prisma.committeeScore.findFirst({
      where: {
        projectId: data.projectId,
        criterionId: data.criterionId,
        userId,
        sessionId: data.sessionId
      }
    });
    
    if (existingScore) {
      // Update existing score
      return prisma.committeeScore.update({
        where: { id: existingScore.id },
        data: {
          score: data.score,
          comment: data.comment,
          updatedById: userId
        },
        include: {
          criterion: true
        }
      });
    } else {
      // Create new score
      return prisma.committeeScore.create({
        data: {
          projectId: data.projectId,
          criterionId: data.criterionId,
          userId,
          score: data.score,
          comment: data.comment,
          sessionId: data.sessionId,
          createdById: userId
        },
        include: {
          criterion: true
        }
      });
    }
  }
}
