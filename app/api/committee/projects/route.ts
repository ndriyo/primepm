import { NextRequest, NextResponse } from 'next/server';
import { ProjectRepository } from '@/app/_repositories/ProjectRepository';
import { CommitteeRepository } from '@/app/_repositories/CommitteeRepository';

// Define project type
interface Project {
  id: string;
  name: string;
  portfolioSelectionId: string;
  department: any;
  projectScores: Array<{
    criterion: {
      id: string;
      key: string;
      name: string;
      description: string;
      weight: number;
    }
  }>;
  committeeScores: Array<{
    id: string;
    score: number;
    comment?: string;
    criterion: any;
  }>;
  [key: string]: any;
}

const projectRepo = new ProjectRepository();
const committeeRepo = new CommitteeRepository();

/**
 * GET /api/committee/projects
 * 
 * Get projects for committee review
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const portfolioId = searchParams.get('portfolioId');
    const organizationId = searchParams.get('organizationId');
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole') || 'USER';
    const departmentId = searchParams.get('departmentId');
    
    // Validate required parameters
    if (!sessionId && !portfolioId) {
      return NextResponse.json(
        { error: 'Missing required parameter: sessionId or portfolioId' },
        { status: 400 }
      );
    }
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }
    
    let projects: Project[] = [];
    
    if (sessionId) {
      // Get the session to find its portfolio
      const prisma = committeeRepo['getPrismaWithContext'](organizationId, userId, userRole, departmentId || undefined);
      const sessionData = await prisma.committeeReviewSession.findUnique({
        where: { id: sessionId },
        select: { portfolioId: true }
      });
      
      if (!sessionData) {
        return NextResponse.json(
          { error: 'Committee review session not found' },
          { status: 404 }
        );
      }
      
      // Get projects for this portfolio
      projects = await prisma.project.findMany({
        where: {
          portfolioSelectionId: sessionData.portfolioId
        },
        include: {
          department: true,
          projectScores: {
            include: {
              criterion: true
            }
          },
          committeeScores: {
            where: {
              userId,
              sessionId
            },
            include: {
              criterion: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      }) as unknown as Project[];
    } else if (portfolioId) {
      // Get projects for this portfolio directly
      const prisma = projectRepo['getPrismaWithContext'](organizationId, userId, userRole, departmentId || undefined);
      projects = await prisma.project.findMany({
        where: {
          portfolioSelectionId: portfolioId
        },
        include: {
          department: true,
          projectScores: {
            include: {
              criterion: true
            }
          },
          committeeScores: {
            where: {
              userId
            },
            include: {
              criterion: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      }) as unknown as Project[];
    }
    
    // Enhance projects with scoring progress
    const enhancedProjects = projects.map(project => {
      // Get all criteria from project scores
      const criteria = project.projectScores.map((score: any) => score.criterion);
      const totalCriteria = criteria.length;
      
      // Count committee scores
      const committeeScores = project.committeeScores || [];
      const scoredCriteria = committeeScores.length;
      
      // Calculate progress
      const progress = totalCriteria > 0 ? (scoredCriteria / totalCriteria) * 100 : 0;
      
      // Determine status
      let status = 'NOT_STARTED';
      if (progress === 100) {
        status = 'COMPLETED';
      } else if (progress > 0) {
        status = 'IN_PROGRESS';
      }
      
      // Return enhanced project
      return {
        ...project,
        scoringProgress: {
          totalCriteria,
          scoredCriteria,
          progress,
          status
        }
      };
    });
    
    return NextResponse.json(enhancedProjects);
  } catch (error: any) {
    console.error('Error fetching committee projects:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch committee projects' },
      { status: 500 }
    );
  }
}
