import { NextRequest, NextResponse } from 'next/server';
import { CommitteeRepository } from '@/app/_repositories/CommitteeRepository';

const committeeRepo = new CommitteeRepository();

/**
 * GET /api/committee/sessions/[sessionId]
 * 
 * Get details of a specific committee review session
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
    
    // Get session ID from params
    const { sessionId } = await params;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing required parameter: sessionId' },
        { status: 400 }
      );
    }
    
    // Get committee session
    const prisma = committeeRepo['getPrismaWithContext'](organizationId, userId, userRole, departmentId || undefined);
    const committeeSession = await prisma.committeeReviewSession.findUnique({
      where: { id: sessionId },
      include: {
        portfolio: true,
        sessionMembers: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                department: true
              }
            }
          }
        }
      }
    });
    
    if (!committeeSession) {
      return NextResponse.json(
        { error: 'Committee review session not found' },
        { status: 404 }
      );
    }
    
    // Check if user is a member of the session or has admin role
    let isMember = false;
    if (committeeSession.sessionMembers && Array.isArray(committeeSession.sessionMembers)) {
      const members = committeeSession.sessionMembers as Array<{ userId: string }>;
      isMember = members.some((member) => member.userId === userId);
    }
    
    if (!isMember && userRole !== 'ADMIN' && userRole !== 'PMO') {
      return NextResponse.json(
        { error: 'Unauthorized to access this session' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(committeeSession);
  } catch (error: any) {
    console.error('Error fetching committee session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch committee session' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/committee/sessions/[sessionId]
 * 
 * Update a committee review session
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Extract required fields
    const { 
      name, 
      description, 
      startDate, 
      endDate, 
      status, 
      members,
      organizationId,
      userId,
      userRole
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
    
    // Check if user has admin role
    const role = userRole || 'USER';
    if (role !== 'ADMIN' && role !== 'PMO') {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins and PMO can update sessions' },
        { status: 403 }
      );
    }
    
    // Get session ID from params
    const { sessionId } = await params;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing required parameter: sessionId' },
        { status: 400 }
      );
    }
    
    // Check if the session exists
    const prisma = committeeRepo['getPrismaWithContext'](organizationId, userId, role, body.departmentId);
    const existingSession = await prisma.committeeReviewSession.findUnique({
      where: { id: sessionId }
    });
    
    if (!existingSession) {
      return NextResponse.json(
        { error: 'Committee review session not found' },
        { status: 404 }
      );
    }
    
    // Update session
    const updatedSession = await prisma.committeeReviewSession.update({
      where: { id: sessionId },
      data: {
        name,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status,
        updatedById: userId
      },
      include: {
        portfolio: true
      }
    });
    
    // Update session members if provided
    if (members && Array.isArray(members)) {
      // For now, we'll skip the member update part as it requires more complex handling
      // In a production environment, you would implement this properly
      
      // Fetch updated session with members
      const sessionWithMembers = await prisma.committeeReviewSession.findUnique({
        where: { id: sessionId },
        include: {
          portfolio: true,
          sessionMembers: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  department: true
                }
              }
            }
          }
        }
      });
      
      return NextResponse.json(sessionWithMembers);
    }
    
    return NextResponse.json(updatedSession);
  } catch (error: any) {
    console.error('Error updating committee session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update committee session' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/committee/sessions/[sessionId]
 * 
 * Delete a committee review session
 */
export async function DELETE(
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
    
    // Check if user has admin role
    if (userRole !== 'ADMIN' && userRole !== 'PMO') {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins and PMO can delete sessions' },
        { status: 403 }
      );
    }
    
    // Get session ID from params
    const { sessionId } = await params;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing required parameter: sessionId' },
        { status: 400 }
      );
    }
    
    // Check if the session exists
    const prisma = committeeRepo['getPrismaWithContext'](organizationId, userId, userRole, departmentId || undefined);
    const existingSession = await prisma.committeeReviewSession.findUnique({
      where: { id: sessionId }
    });
    
    if (!existingSession) {
      return NextResponse.json(
        { error: 'Committee review session not found' },
        { status: 404 }
      );
    }
    
    // Delete session
    await prisma.committeeReviewSession.delete({
      where: { id: sessionId }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Committee review session deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting committee session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete committee session' },
      { status: 500 }
    );
  }
}
