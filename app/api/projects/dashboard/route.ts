import { NextRequest, NextResponse } from 'next/server';
import { ProjectRepository } from '@/src/repositories/ProjectRepository';
import { DepartmentRepository } from '@/src/repositories/DepartmentRepository';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{}> }
) {
  try {
    // Get organization ID and user info from headers (set by auth context)
    const organizationId = request.headers.get('x-organization-id');
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    const departmentId = request.headers.get('x-department-id');
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Initialize repositories
    const projectRepo = new ProjectRepository();
    const departmentRepo = new DepartmentRepository();
    
    // Fetch projects based on user role
    let projects;
    if (userRole === 'projectManager' && departmentId) {
      // Project Manager sees only their department's projects
      projects = await projectRepo.findByDepartment(departmentId);
    } else {
      // PMO/Executive sees all projects in the organization
      projects = await projectRepo.findByOrganization(organizationId);
    }
    
    // Fetch departments to add department names to projects
    const departments = await departmentRepo.findByOrganization(organizationId);
    
    // Create a map of department IDs to department names for quick lookup
    const departmentMap = departments.reduce((map, dept) => {
      map[dept.id] = dept.name;
      return map;
    }, {} as Record<string, string>);
    
    // Add department names to projects
    const projectsWithDepartments = projects.map(project => ({
      ...project,
      department: project.departmentId ? departmentMap[project.departmentId] : 'Unassigned'
    }));
    
    return NextResponse.json(projectsWithDepartments);
  } catch (error) {
    console.error('Error fetching dashboard projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
