import { NextRequest, NextResponse } from "next/server";
import { ProjectRepository } from "@/src/repositories/ProjectRepository";

const projectRepo = new ProjectRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // Await the params object before accessing properties
    const { projectId } = await params;
    
    // Get auth information from headers
    const userId = request.headers.get("x-user-id");
    const organizationId = request.headers.get("x-organization-id");
    const userRole = request.headers.get("x-user-role");
    const departmentId = request.headers.get("x-department-id");
    
    if (!organizationId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Get the project with scores
    const project = await projectRepo.findWithScores(
      projectId, 
      userId || undefined, 
      userRole || undefined, 
      departmentId || undefined
    );
    
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    
    // Validate if project belongs to user's organization
    if (project.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Unauthorized to access this project" },
        { status: 403 }
      );
    }
    
    // Additional check for PM role - can only access projects from their department
    if (userRole === 'projectManager' && departmentId && project.departmentId !== departmentId) {
      return NextResponse.json(
        { error: "Project Managers can only access projects from their department" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(project.scores);
  } catch (error) {
    console.error(`Error fetching project scores:`, error);
    return NextResponse.json(
      { error: "Failed to fetch project scores" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // Await the params object before accessing properties
    const { projectId } = await params;
    const data = await request.json();
    
    // Get auth information from headers
    const userId = request.headers.get("x-user-id");
    const organizationId = request.headers.get("x-organization-id");
    const userRole = request.headers.get("x-user-role");
    const departmentId = request.headers.get("x-department-id");
    
    // Validate required fields
    if (!data.criterionId || !data.versionId || data.score === undefined || !data.userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Validate if project exists
    const existingProject = await projectRepo.findById(projectId);
    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    
    // Validate if project belongs to user's organization
    if (existingProject.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Unauthorized to access this project" },
        { status: 403 }
      );
    }
    
    // Additional check for PM role - can only access projects from their department
    if (userRole === 'projectManager' && departmentId && existingProject.departmentId !== departmentId) {
      return NextResponse.json(
        { error: "Project Managers can only access projects from their department" },
        { status: 403 }
      );
    }
    
    // Update the criterion score
    const result = await projectRepo.updateCriteriaScore(
      projectId,
      data.criterionId,
      data.versionId,
      data.score,
      data.comment || null,
      data.userId,
      userRole || undefined,
      departmentId || undefined
    );
    
    // Calculate overall score after update and update the project record
    const overallScore = await projectRepo.calculateOverallScore(
      projectId, 
      data.versionId,
      userId || undefined,
      userRole || undefined,
      departmentId || undefined
    );
    
    // Get the updated project with the new score
    const updatedProject = await projectRepo.findById(projectId);
    
    return NextResponse.json({
      score: result,
      overallScore: overallScore,
      projectScore: updatedProject ? updatedProject.score : overallScore
    }, { status: 201 });
  } catch (error) {
    console.error(`Error updating project score:`, error);
    return NextResponse.json(
      { error: "Failed to update project score" },
      { status: 500 }
    );
  }
}
