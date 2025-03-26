import { NextRequest, NextResponse } from 'next/server';
import { CommitteeRepository } from '@/app/_repositories/CommitteeRepository';

const committeeRepo = new CommitteeRepository();

/**
 * GET /api/committee/scores
 * 
 * Get committee scores for a project
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const sessionId = searchParams.get('sessionId');
    const organizationId = searchParams.get('organizationId');
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole') || 'USER';
    const departmentId = searchParams.get('departmentId');
    
    // Validate required parameters
    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing required parameter: projectId' },
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
    
    // Get committee scores
    const prisma = committeeRepo['getPrismaWithContext'](organizationId, userId, userRole, departmentId || undefined);
    const scores = await prisma.committeeScore.findMany({
      where: {
        projectId,
        userId,
        ...(sessionId ? { sessionId } : {})
      },
      include: {
        criterion: true
      }
    });
    
    // Sort scores by criterion key as a fallback
    const sortedScores = scores.sort((a, b) => {
      // Use key as a fallback for sorting
      return a.criterion.key.localeCompare(b.criterion.key);
    });
    
    return NextResponse.json(sortedScores);
  } catch (error: any) {
    console.error('Error fetching committee scores:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch committee scores' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/committee/scores
 * 
 * Submit a score for a project criterion
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Extract required fields
    const { 
      projectId, 
      criterionId, 
      score, 
      comment, 
      status, 
      sessionId,
      organizationId,
      userId,
      userRole,
      departmentId
    } = body;
    
    // Validate required fields
    if (!projectId || !criterionId || score === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, criterionId, score' },
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
    
    // Validate score range
    if (score < 1 || score > 5) {
      return NextResponse.json(
        { error: 'Score must be between 1 and 5' },
        { status: 400 }
      );
    }
    
    // Create or update score
    const savedScore = await committeeRepo.saveScore(
      {
        projectId,
        criterionId,
        score,
        comment,
        status: status || 'DRAFT',
        sessionId
      },
      userId,
      organizationId,
      userRole || 'USER',
      departmentId
    );
    
    return NextResponse.json(savedScore, { status: 201 });
  } catch (error: any) {
    console.error('Error saving committee score:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save committee score' },
      { status: 500 }
    );
  }
}
