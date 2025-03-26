import { NextRequest, NextResponse } from 'next/server';
import { CommitteeRepository } from '@/app/_repositories/CommitteeRepository';

const committeeRepo = new CommitteeRepository();

/**
 * GET /api/committee/scores/[scoreId]
 * 
 * Get a specific committee score
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scoreId: string }> }
) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
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
    
    // Get score ID from params
    const { scoreId } = await params;
    
    if (!scoreId) {
      return NextResponse.json(
        { error: 'Missing required parameter: scoreId' },
        { status: 400 }
      );
    }
    
    // Get committee score
    const prisma = committeeRepo['getPrismaWithContext'](organizationId, userId, userRole, departmentId || undefined);
    const score = await prisma.committeeScore.findUnique({
      where: { id: scoreId },
      include: {
        criterion: true,
        project: true
      }
    });
    
    if (!score) {
      return NextResponse.json(
        { error: 'Score not found' },
        { status: 404 }
      );
    }
    
    // Check if the score belongs to the current user
    if (score.userId !== userId && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized to access this score' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(score);
  } catch (error: any) {
    console.error('Error fetching committee score:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch committee score' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/committee/scores/[scoreId]
 * 
 * Update a committee score
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ scoreId: string }> }
) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Extract required fields
    const { 
      score, 
      comment,
      organizationId,
      userId,
      userRole,
      departmentId
    } = body;
    
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
    
    // Validate required fields
    if (score === undefined) {
      return NextResponse.json(
        { error: 'Missing required field: score' },
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
    
    // Get score ID from params
    const { scoreId } = await params;
    
    if (!scoreId) {
      return NextResponse.json(
        { error: 'Missing required parameter: scoreId' },
        { status: 400 }
      );
    }
    
    // Check if the score exists and belongs to the current user
    const role = userRole || 'USER';
    const prisma = committeeRepo['getPrismaWithContext'](organizationId, userId, role, departmentId);
    const existingScore = await prisma.committeeScore.findUnique({
      where: { id: scoreId }
    });
    
    if (!existingScore) {
      return NextResponse.json(
        { error: 'Score not found' },
        { status: 404 }
      );
    }
    
    if (existingScore.userId !== userId && role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized to update this score' },
        { status: 403 }
      );
    }
    
    // Update score
    const updatedScore = await prisma.committeeScore.update({
      where: { id: scoreId },
      data: {
        score,
        comment,
        updatedById: userId
      },
      include: {
        criterion: true
      }
    });
    
    return NextResponse.json(updatedScore);
  } catch (error: any) {
    console.error('Error updating committee score:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update committee score' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/committee/scores/[scoreId]
 * 
 * Delete a committee score
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ scoreId: string }> }
) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
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
    
    // Get score ID from params
    const { scoreId } = await params;
    
    if (!scoreId) {
      return NextResponse.json(
        { error: 'Missing required parameter: scoreId' },
        { status: 400 }
      );
    }
    
    // Check if the score exists and belongs to the current user
    const prisma = committeeRepo['getPrismaWithContext'](organizationId, userId, userRole, departmentId || undefined);
    const existingScore = await prisma.committeeScore.findUnique({
      where: { id: scoreId }
    });
    
    if (!existingScore) {
      return NextResponse.json(
        { error: 'Score not found' },
        { status: 404 }
      );
    }
    
    if (existingScore.userId !== userId && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized to delete this score' },
        { status: 403 }
      );
    }
    
    // Delete score
    await prisma.committeeScore.delete({
      where: { id: scoreId }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Score deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting committee score:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete committee score' },
      { status: 500 }
    );
  }
}
