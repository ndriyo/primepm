import { NextRequest, NextResponse } from 'next/server';
import { ProjectRepository } from '@/app/_repositories/ProjectRepository';

const projectRepo = new ProjectRepository();

/**
 * GET /api/committee/projects/[projectId]
 * 
 * Get project details with self-assessment for committee review
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const organizationId = searchParams.get('organizationId');
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole') || 'USER';
    const departmentId = searchParams.get('departmentId');
    
    // Validate required parameters
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
    
    // Get project ID from params
    const { projectId } = await params;
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing required parameter: projectId' },
        { status: 400 }
      );
    }
    
    // Get project details
    const prisma = projectRepo['getPrismaWithContext'](organizationId, userId, userRole, departmentId || undefined);
    const project = await prisma.project.findUnique({
      where: { id: projectId },
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
            ...(sessionId ? { sessionId } : {})
          },
          include: {
            criterion: true
          }
        }
      }
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Enhance project with scoring progress
    const criteria = project.projectScores.map(score => score.criterion);
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
    const enhancedProject = {
      ...project,
      scoringProgress: {
        totalCriteria,
        scoredCriteria,
        progress,
        status
      }
    };
    
    return NextResponse.json(enhancedProject);
  } catch (error: any) {
    console.error('Error fetching project details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch project details' },
      { status: 500 }
    );
  }
}
