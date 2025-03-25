import { NextRequest, NextResponse } from "next/server";
import { ProjectRepository } from "@/app/_repositories/ProjectRepository";
import { CriteriaRepository } from "@/app/_repositories/CriteriaRepository";

const projectRepo = new ProjectRepository();
const criteriaRepo = new CriteriaRepository();

/**
 * Helper function to get the active criteria version ID for an organization
 */
async function getActiveCriteriaVersionId(organizationId: string): Promise<string> {
  const activeVersion = await criteriaRepo.findActiveVersion(organizationId);
  
  if (!activeVersion) {
    throw new Error(`No active criteria version found for organization ${organizationId}`);
  }
  
  return activeVersion.id;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // Await the params object before accessing properties
    const { projectId } = await params;
    
    // Get auth information from headers
    const organizationId = request.headers.get("x-organization-id");
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");
    const departmentId = request.headers.get("x-department-id");
    
    if (!organizationId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const includeScores = request.nextUrl.searchParams.get("includeScores");
    const includeCommitteeScores = request.nextUrl.searchParams.get("includeCommitteeScores");
    
    let project;
    
    if (includeScores === "true") {
      project = await projectRepo.findWithScores(
        projectId, 
        userId || undefined, 
        userRole || undefined, 
        departmentId || undefined
      );
    } else if (includeCommitteeScores === "true") {
      project = await projectRepo.findWithCommitteeScores(
        projectId, 
        userId || undefined, 
        userRole || undefined, 
        departmentId || undefined
      );
    } else {
      project = await projectRepo.findById(projectId);
    }
    
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
    
    return NextResponse.json(project);
  } catch (error) {
    console.error(`Error fetching project:`, error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    
    if (!userId || !organizationId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    
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
    
    // Extract criteriaScores to handle separately
    const { criteriaScores, ...projectFields } = data;
    
    // Add the updatedById from auth if not provided
    const projectData = {
      ...projectFields,
      updatedById: projectFields.updatedById || userId
    };
    
    // Update the project basic info
    const updatedProject = await projectRepo.update(
      projectId,
      projectData,
      projectData.updatedById,
      userRole || undefined,
      departmentId || undefined
    );
    
    // If there are criteria scores to update, handle them separately
    if (criteriaScores && Array.isArray(criteriaScores)) {
      try {
        // Get active criteria version id
        const activeVersionId = await getActiveCriteriaVersionId(organizationId);
        
        // Update each criteria score
        for (const scoreData of criteriaScores) {
          await projectRepo.updateCriteriaScore(
            projectId,
            scoreData.criterionKey,
            activeVersionId,
            scoreData.score,
            scoreData.comment || null, // Use comment from the form if available
            userId,
            userRole || undefined,
            departmentId || undefined
          );
        }
        
        console.log(`Updated ${criteriaScores.length} criteria scores for project ${projectId}`);
        
        // Recalculate and update the overall score
        const overallScore = await projectRepo.calculateOverallScore(
          projectId, 
          activeVersionId,
          userId || undefined,
          userRole || undefined,
          departmentId || undefined
        );
        console.log(`Recalculated project score: ${overallScore}`);
        
        // Get the updated project with the new score
        const refreshedProject = await projectRepo.findById(projectId);
        if (refreshedProject) {
          updatedProject.score = refreshedProject.score;
        }
      } catch (scoreError) {
        console.error(`Error updating criteria scores:`, scoreError);
        // Continue with the response rather than failing the entire request
        // The main project data was already updated successfully
      }
    }
    
    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error(`Error updating project:`, error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    
    if (!userId || !organizationId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
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
    
    // Delete the project
    await projectRepo.delete(projectId, userId);
    
    return NextResponse.json(
      { message: "Project deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting project:`, error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
