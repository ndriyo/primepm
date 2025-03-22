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

export async function GET(request: NextRequest) {
  try {
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
    
    console.log(`[MOCK] Fetching projects for: org=${organizationId}, user=${userId}, role=${userRole}, dept=${departmentId}`);
    
    // Filter projects based on role-based access control
    let filteredProjects;
    
    if (userRole === 'projectManager' && departmentId) {
      // Project Managers can only see projects in their department
      console.log(`[MOCK] Project Manager access: filtering by department ${departmentId}`);
      filteredProjects = projectsWithDepartments.filter(
        p => p.departmentId === departmentId && p.organizationId === organizationId
      );
    } else {
      // PMO, Management, Committee, Admin see all projects in organization
      console.log(`[MOCK] ${userRole} access: all organizational projects`);
      filteredProjects = projectsWithDepartments.filter(
        p => p.organizationId === organizationId
      );
    }
    
    // Simulate a delay to show loading state (500ms)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return NextResponse.json(filteredProjects);
  } catch (error) {
    console.error("[MOCK] Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get auth information from headers
    const userId = request.headers.get("x-user-id");
    const organizationId = request.headers.get("x-organization-id");
    
    if (!userId || !organizationId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Create a new project with a fake ID
    const newProject = {
      ...data,
      id: `p${projectsWithDepartments.length + 1}`,
      organizationId,
      createdById: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Simulate a delay (500ms)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("[MOCK] Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
