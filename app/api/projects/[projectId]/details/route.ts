import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

type Context = { params: { projectId: string } };

export async function GET(request: NextRequest, context: Context) {
  const { projectId } = context.params;
  
  try {
    // Extract RLS headers
    const organizationId = request.headers.get('x-organization-id');
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    
    if (!organizationId || !userId || !userRole) {
      return NextResponse.json(
        { error: 'Missing required headers' },
        { status: 400 }
      );
    }
    
    // Get project with all related data in a single query
    const project = await prisma.project.findUnique({
      where: { 
        id: projectId,
        organizationId: organizationId
      },
      include: {
        department: true,
        projectScores: {
          include: {
            criterion: true
          }
        }
        // Include any other needed relations
      }
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Transform data to optimized structure
    const transformedProject = {
      ...project,
      criteria: project.projectScores.reduce((acc, score) => {
        if (score.criterion?.key) {
          acc[score.criterion.key] = score.score;
        }
        return acc;
      }, {} as Record<string, number>)
    };
    
    // Set cache headers for 5 minutes
    return NextResponse.json(transformedProject, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    console.error('Error fetching project details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
