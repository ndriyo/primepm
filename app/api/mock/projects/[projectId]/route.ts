import { NextRequest, NextResponse } from "next/server";
import { projects } from "@/src/data/projects"; // Import the static data

// Assign department IDs to projects for testing
const projectsWithDepartments = projects.map((project, index) => {
  // Assign IT department to even indexed projects, Marketing to odd
  const departmentId = index % 2 === 0 ? 'dept-it-1' : 'dept-mkt-1';
  return {
    ...project,
    departmentId,
    // Add organizationId for testing
    organizationId: '11111111-1111-1111-1111-111111111111'
  };
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // Get authentication and role information from headers
    const organizationId = request.headers.get("x-organization-id");
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");
    const departmentId = request.headers.get("x-department-id");
    
    if (!organizationId || !userId) {
      return NextResponse.json(
        { error: "Organization ID and User ID are required" },
        { status: 400 }
      );
    }
    
    console.log(`[MOCK] Fetching project ${projectId} for: org=${organizationId}, user=${userId}, role=${userRole}, dept=${departmentId}`);
    
    // Find the requested project
    const project = projectsWithDepartments.find(p => p.id === projectId);
    
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    
    // Apply role-based access control
    if (userRole === 'projectManager' && departmentId) {
      // Project Managers can only access projects in their department
      if (project.departmentId !== departmentId) {
        return NextResponse.json(
          { error: "Access denied: Project not in your department" },
          { status: 403 }
        );
      }
    }
    
    // Check organization access
    if (project.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Access denied: Project not in your organization" },
        { status: 403 }
      );
    }
    
    // Simulate a delay to show loading state (300ms)
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return NextResponse.json(project);
  } catch (error) {
    console.error("[MOCK] Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}
