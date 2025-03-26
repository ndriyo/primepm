import { NextRequest, NextResponse } from 'next/server';
import { CommitteeRepository } from '@/app/_repositories/CommitteeRepository';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

/**
 * GET /api/committee/progress
 * 
 * Get scoring progress for a committee member
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) { 
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole') || 'USER';
    const departmentId = searchParams.get('departmentId');
   const sessionId = searchParams.get('sessionId');
    
    // Validate required parameters
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing required parameter: sessionId' },
        { status: 400 }
      );
    }
    
    const repository = new CommitteeRepository();
    
    // Get scoring progress
    const progress = await repository.getScoringProgress(
      userId,
      sessionId,
      userId,
      userRole,
      departmentId,
      organizationId
    );
    
    return NextResponse.json(progress);
  } catch (error: any) {
    console.error('Error fetching committee progress:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch committee progress' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/committee/progress/submit
 * 
 * Submit all draft scores for a session
 */
export async function POST(request: NextRequest) {
  try {
    // Get the current user from the session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // For now, we'll use hardcoded values for these fields
    // In a production environment, you would update the session type to include these fields
    const userId = 'current-user-id';
    const userRole = 'ADMIN';
    const departmentId = undefined;
    const organizationId = 'current-org-id';
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.sessionId) {
      return NextResponse.json(
        { error: 'Missing required field: sessionId' },
        { status: 400 }
      );
    }
    
    const repository = new CommitteeRepository();
    
    // Submit all draft scores
    const count = await repository.submitScores(
      userId,
      body.sessionId,
      userId,
      userRole,
      departmentId,
      organizationId
    );
    
    return NextResponse.json({
      success: true,
      message: `Successfully submitted ${count} scores`,
      count
    });
  } catch (error: any) {
    console.error('Error submitting committee scores:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit committee scores' },
      { status: 500 }
    );
  }
}
