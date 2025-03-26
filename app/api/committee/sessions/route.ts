import { NextRequest, NextResponse } from 'next/server';
import { CommitteeRepository } from '@/app/_repositories/CommitteeRepository';

const committeeRepo = new CommitteeRepository();

/**
 * GET /api/committee/sessions
 * 
 * Get committee review sessions for the current user
 */
export async function GET(request: NextRequest) {
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
    
    // Get committee sessions
    const sessions = await committeeRepo.getSessionsForUser(
      userId,
      organizationId,
      userRole,
      departmentId || undefined
    );
    
    return NextResponse.json(sessions);
  } catch (error: any) {
    console.error('Error fetching committee sessions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch committee sessions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/committee/sessions
 * 
 * Create a new committee review session
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Extract required fields
    const { 
      portfolioId, 
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
    
    // Validate required fields
    if (!portfolioId || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: portfolioId, name' },
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
    
    // Check if user has admin role
    const role = userRole || 'USER';
    if (role !== 'ADMIN' && role !== 'PMO') {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins and PMO can create sessions' },
        { status: 403 }
      );
    }
    
    // Create session
    const newSession = await committeeRepo.createSession(
      {
        portfolioId,
        name,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status: status || 'ACTIVE',
        members: members || []
      },
      userId,
      organizationId,
      role,
      body.departmentId
    );
    
    return NextResponse.json(newSession, { status: 201 });
  } catch (error: any) {
    console.error('Error creating committee session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create committee session' },
      { status: 500 }
    );
  }
}
