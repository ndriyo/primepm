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
  console.log("PATCH request started");
  const startTime = Date.now();
  
  try {
    // Await the params object before accessing properties
    const { projectId } = await params;
    console.log(`Processing PATCH for project: ${projectId}`);
    
    // Get auth information from headers
    const userId = request.headers.get("x-user-id");
    const organizationId = request.headers.get("x-organization-id");
    const userRole = request.headers.get("x-user-role");
    const departmentId = request.headers.get("x-department-id");
    
    if (!userId || !organizationId) {
      console.log("Authentication failed: missing userId or organizationId");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    console.log("Parsing request body");
    const data = await request.json();
    console.log(`Request data parsed, contains criteriaScores: ${!!data.criteriaScores}`);
    
    // Validate if project exists
    console.log("Finding existing project");
    const existingProject = await projectRepo.findById(projectId);
    if (!existingProject) {
      console.log(`Project not found: ${projectId}`);
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    console.log("Project found");
    
    // Validate if project belongs to user's organization
    if (existingProject.organizationId !== organizationId) {
      console.log(`Organization mismatch: ${existingProject.organizationId} vs ${organizationId}`);
      return NextResponse.json(
        { error: "Unauthorized to access this project" },
        { status: 403 }
      );
    }
    
    // Check for active criteria version before proceeding
    console.log("Checking for active criteria version");
    try {
      await getActiveCriteriaVersionId(organizationId);
      console.log("Active criteria version found");
    } catch (error) {
      console.log(`No active criteria version found for org: ${organizationId}`);
      return NextResponse.json(
        { 
          error: "No active criteria version found", 
          code: "NO_ACTIVE_CRITERIA",
          message: "Your organization doesn't have an active criteria version. Please set one up before updating a project."
        }, 
        { status: 400 }
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
    console.log("Updating project basic info");
    const updateStartTime = Date.now();
    const updatedProject = await projectRepo.update(
      projectId,
      projectData,
      projectData.updatedById,
      userRole || undefined,
      departmentId || undefined
    );
    console.log(`Project basic info updated in ${Date.now() - updateStartTime}ms`);
    
    // If there are criteria scores to update, handle them separately
    if (criteriaScores && Array.isArray(criteriaScores)) {
      console.log(`Processing ${criteriaScores.length} criteria scores`);
      try {
        // Get active criteria version id
        console.log("Getting active criteria version ID");
        const activeVersionId = await getActiveCriteriaVersionId(organizationId);
        console.log(`Active version ID: ${activeVersionId}`);
        
        // Update each criteria score
        console.log("Updating criteria scores");
        const scoresStartTime = Date.now();
        for (const scoreData of criteriaScores) {
          console.log(`Updating score for criterion: ${scoreData.criterionKey}`);
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
        console.log(`Updated all criteria scores in ${Date.now() - scoresStartTime}ms`);
        
        // Recalculate and update the overall score
        console.log("Recalculating overall score");
        const scoreCalcStartTime = Date.now();
        const overallScore = await projectRepo.calculateOverallScore(
          projectId, 
          activeVersionId,
          userId || undefined,
          userRole || undefined,
          departmentId || undefined
        );
        console.log(`Recalculated project score: ${overallScore} in ${Date.now() - scoreCalcStartTime}ms`);
        
        // Get the updated project with the new score
        console.log("Refreshing project to get updated score");
        const refreshedProject = await projectRepo.findById(projectId);
        if (refreshedProject) {
          updatedProject.score = refreshedProject.score;
          console.log(`Updated score in response: ${updatedProject.score}`);
        }
      } catch (scoreError) {
        console.error(`Error updating criteria scores:`, scoreError);
        // Continue with the response rather than failing the entire request
        // The main project data was already updated successfully
      }
    }
    
    console.log(`PATCH request completed in ${Date.now() - startTime}ms`);
    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error(`Error updating project:`, error);
    console.log(`PATCH request failed after ${Date.now() - startTime}ms`);
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
