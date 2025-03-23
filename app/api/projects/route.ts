import { NextRequest, NextResponse } from "next/server";
import { ProjectRepository } from "@/src/repositories/ProjectRepository";
import { CriteriaRepository } from "@/src/repositories/CriteriaRepository";

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

export async function GET(request: NextRequest) {
  try {
    // Get authentication and role information from headers
    const organizationId = request.headers.get("x-organization-id");
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");
    const departmentId = request.headers.get("x-department-id");
    
    // Get query parameters for additional filtering
    const searchParams = request.nextUrl.searchParams;
    
    // Parse search and filter parameters
    const search = searchParams.get('search') || '';
    const departments = searchParams.getAll('department');
    const budgetMin = searchParams.get('budgetMin') ? parseInt(searchParams.get('budgetMin')!) : null;
    const budgetMax = searchParams.get('budgetMax') ? parseInt(searchParams.get('budgetMax')!) : null;
    const resourcesMin = searchParams.get('resourcesMin') ? parseInt(searchParams.get('resourcesMin')!) : null;
    const resourcesMax = searchParams.get('resourcesMax') ? parseInt(searchParams.get('resourcesMax')!) : null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const tags = searchParams.getAll('tag');
    const statuses = searchParams.getAll('status');
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    
    if (!organizationId || !userId) {
      return NextResponse.json(
        { error: "Organization ID and User ID are required" },
        { status: 400 }
      );
    }
    
    console.log(`Fetching projects for organization: ${organizationId}, user: ${userId}, role: ${userRole}`);
    
    let projects;
    
    // Apply role-based access control
    if (userRole === 'projectManager' && departmentId) {
      // Project Managers can only see projects in their department
      console.log(`Project Manager access: filtering by department ${departmentId}`);
      projects = await projectRepo.findByDepartment(departmentId);
      
    } else {
      // PMO, Management, Committee, Admin see all projects in organization
      console.log(`${userRole} access: all organizational projects`);
      
      projects = await projectRepo.findByOrganization(organizationId);
    }
    
    // Apply filters to the projects
    if (projects && projects.length > 0) {
      // Apply search filter (name, description, or tags)
      if (search) {
        const searchLower = search.toLowerCase();
        projects = projects.filter(project => 
          project.name?.toLowerCase().includes(searchLower) || 
          project.description?.toLowerCase().includes(searchLower) ||
          project.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower))
        );
      }
      
      // Filter by departments
      if (departments.length > 0) {
        projects = projects.filter(project => 
          project.departmentId && departments.includes(project.departmentId)
        );
      }
      
      // Filter by budget range
      if (budgetMin !== null) {
        projects = projects.filter(project => typeof project.budget === 'number' && project.budget >= budgetMin);
      }
      if (budgetMax !== null) {
        projects = projects.filter(project => typeof project.budget === 'number' && project.budget <= budgetMax);
      }
      
      // Filter by resources range
      if (resourcesMin !== null) {
        projects = projects.filter(project => project.resources >= resourcesMin);
      }
      if (resourcesMax !== null) {
        projects = projects.filter(project => project.resources <= resourcesMax);
      }
      
      // Filter by date range
      if (startDate) {
        const startDateObj = new Date(startDate);
        projects = projects.filter(project => new Date(project.startDate) >= startDateObj);
      }
      if (endDate) {
        const endDateObj = new Date(endDate);
        projects = projects.filter(project => new Date(project.endDate) <= endDateObj);
      }
      
      // Filter by tags
      if (tags.length > 0) {
        projects = projects.filter(project => 
          project.tags?.some((tag: string) => tags.includes(tag))
        );
      }
      
      // Filter by status
      if (statuses.length > 0) {
        projects = projects.filter(project => 
          statuses.includes(project.status)
        );
      }
    }
    
    // Calculate total before pagination
    const total = projects.length;
    
    // Apply pagination
    const paginatedProjects = projects.slice((page - 1) * pageSize, page * pageSize);
    
    return NextResponse.json({
      projects: paginatedProjects,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
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
    
    // Use the auth headers to set organizationId and createdById
    const projectData = {
      ...data,
      organizationId: data.organizationId || organizationId,
      createdById: data.createdById || userId
    };

    // Create the project
    const project = await projectRepo.create(projectData, projectData.createdById);
    
    // If there are criteria scores to add, handle them separately
    if (data.criteriaScores && Array.isArray(data.criteriaScores)) {
      try {
        // Get active criteria version id
        const activeVersionId = await getActiveCriteriaVersionId(organizationId);
        
        // Add each criteria score
        for (const scoreData of data.criteriaScores) {
          await projectRepo.updateCriteriaScore(
            project.id,
            scoreData.criterionKey,
            activeVersionId,
            scoreData.score,
            scoreData.comment || null,
            userId
          );
        }
        
        console.log(`Added ${data.criteriaScores.length} criteria scores for new project ${project.id}`);
      } catch (scoreError) {
        console.error(`Error adding criteria scores:`, scoreError);
        // Continue with the response rather than failing the entire request
        // The main project data was already created successfully
      }
    }
    
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
