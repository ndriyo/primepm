import { NextRequest, NextResponse } from 'next/server';
import { ProjectRepository } from '@/src/repositories/ProjectRepository';
import { DepartmentRepository } from '@/src/repositories/DepartmentRepository';
import { CriteriaRepository } from '@/src/repositories/CriteriaRepository';

// Initialize repositories
const projectRepo = new ProjectRepository();
const departmentRepo = new DepartmentRepository();
const criteriaRepo = new CriteriaRepository();

// Helper function to safely handle repository calls
async function safeRepositoryCall<T>(
  repoCall: () => Promise<T>,
  errorMessage: string,
  fallbackValue: T
): Promise<T> {
  try {
    return await repoCall();
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    return fallbackValue;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authentication information from headers
    const userId = request.headers.get("x-user-id");
    const organizationId = request.headers.get("x-organization-id");
    const userRole = request.headers.get("x-user-role");
    const departmentId = request.headers.get("x-department-id");
    
    if (!userId || !organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // In a real implementation, this would parse the uploaded Excel file
    // For now, we'll expect a JSON payload that represents the parsed Excel data
    const data = await request.json();
    
    if (!data || !Array.isArray(data.projects)) {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      );
    }
    
    // Fetch departments for validation with error handling
    const departments = await safeRepositoryCall(
      () => departmentRepo.findByOrganization(organizationId),
      'Error fetching departments',
      []
    );
    
    // Fetch active criteria version with its criteria
    const activeVersion = await safeRepositoryCall(
      () => criteriaRepo.findActiveVersion(organizationId),
      'Error fetching active criteria version',
      null
    );
    
    if (!activeVersion) {
      return NextResponse.json(
        { 
          error: 'No active criteria version found',
          validationResults: [],
          summary: { total: 0, valid: 0, invalid: 0 }
        },
        { status: 400 }
      );
    }
    
    // Get criteria from the active version
    const criteria = activeVersion.criteria || [];
    
    // Log the criteria for debugging
    console.log('Active criteria for validation:', criteria.map((c: any) => ({ id: c.id, key: c.key, name: c.name })));
    
    // For role-based validation (if the user is a project manager, they can only import projects for their department)
    const departmentRestriction = userRole === 'projectManager' && departmentId 
      ? departmentId 
      : null;
    
    // Track existing project IDs to avoid duplicates within the import
    const processedIds = new Set<string>();
    
    // Validate each project with improved error handling
    const validationPromises = data.projects.map(async (project: any, index: number) => {
      try {
        const rowNumber = index + 2; // +2 because Excel usually has a header row and 1-based indexing
        const errors: Record<string, string> = {};
        
        // Check if this is an update (has ID) or a new project
        const isUpdate = !!project.id;
        
        // For updates, check if the project exists and belongs to this organization
        if (isUpdate) {
          // Check for duplicate IDs within the import file
          if (processedIds.has(project.id)) {
            errors['id'] = 'Duplicate project ID in import file. Only the first occurrence will be processed.';
          } else {
            processedIds.add(project.id);
            
            try {
              const existingProject = await projectRepo.findById(project.id);
              
              if (!existingProject) {
                errors['id'] = 'Project ID not found';
              } else if (existingProject.organizationId !== organizationId) {
                errors['id'] = 'Project does not belong to your organization';
              }
              
              // For project managers, validate department access
              if (departmentRestriction && existingProject && existingProject.departmentId !== departmentRestriction) {
                errors['department'] = 'You can only update projects in your department';
              }
            } catch (error) {
              console.error(`Error validating existing project:`, error);
              errors['id'] = 'Error validating project ID';
            }
          }
        }
        
        // Validate required fields
        if (!project.name || project.name.trim() === '') {
          errors['name'] = 'Project name is required';
        }
        
        if (!project.description || project.description.trim() === '') {
          errors['description'] = 'Description is required';
        }
        
        // Validate department
        let departmentValid = false;
        if (!project.department || project.department.trim() === '') {
          errors['department'] = 'Department is required';
        } else {
          // Check if department exists in this organization
          const departmentExists = departments.some(
            (dept: any) => dept.name.toLowerCase() === project.department.toLowerCase()
          );
          
          if (!departmentExists) {
            errors['department'] = `Department does not exist ${project.department}`;
          } else {
            departmentValid = true;
          }
          
          // For project managers, validate they can only create/update projects in their department
          if (departmentValid && departmentRestriction) {
            const matchingDept = departments.find(
              (dept: any) => dept.name.toLowerCase() === project.department.toLowerCase()
            );
            
            if (matchingDept && matchingDept.id !== departmentRestriction) {
              errors['department'] = 'You can only create projects in your department';
            }
          }
        }
        
        // Validate numeric fields
        if (!project.budget || isNaN(Number(project.budget))) {
          errors['budget'] = 'Budget must be a number';
        } else if (Number(project.budget) <= 0) {
          errors['budget'] = 'Budget must be greater than 0';
        }
        
        if (!project.resources || isNaN(Number(project.resources))) {
          errors['resources'] = 'Resources must be a number';
        } else if (Number(project.resources) <= 0) {
          errors['resources'] = 'Resources must be greater than 0';
        }
        
        // Validate dates
        if (!project.startDate || !/^\d{4}-\d{2}-\d{2}$/.test(project.startDate)) {
          errors['startDate'] = 'Start date is required in YYYY-MM-DD format';
        } else {
          const startDate = new Date(project.startDate);
          if (isNaN(startDate.getTime())) {
            errors['startDate'] = 'Invalid start date';
          }
        }
        
        if (!project.endDate || !/^\d{4}-\d{2}-\d{2}$/.test(project.endDate)) {
          errors['endDate'] = 'End date is required in YYYY-MM-DD format';
        } else {
          const endDate = new Date(project.endDate);
          if (isNaN(endDate.getTime())) {
            errors['endDate'] = 'Invalid end date';
          }
        }
        
        // Validate end date is after start date
        if (project.startDate && project.endDate) {
          const startDate = new Date(project.startDate);
          const endDate = new Date(project.endDate);
          
          if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate < startDate) {
            errors['endDate'] = 'End date must be after start date';
          }
        }
        
        // Validate status
        if (project.status && !['initiation', 'planning', 'in-progress', 'completed', 'on-hold'].includes(project.status)) {
          errors['status'] = 'Invalid status value';
        }
        
        // Log project keys for debugging
        if (index === 0) {
          console.log('First project properties:', Object.keys(project));
        }
        
        // Validate criteria scores
        criteria.forEach((criterion: any) => {
          const criterionKey = criterion.key; // Use key directly to match Excel column headers
          const score = project[criterionKey];
          
          // Log for debugging criteria validation
          if (index === 0) {
            console.log(`Validating criterion: ${criterion.label} (key: ${criterionKey}), value: ${score}`);
          }
          
          if (score === undefined || score === null) {
            errors[criterionKey] = `Score for ${criterion.label} is required`;
          } else {
            const numericScore = Number(score);
            if (isNaN(numericScore) || numericScore < 1 || numericScore > 5 || !Number.isInteger(numericScore)) {
              errors[criterionKey] = `Score for ${criterion.label} must be an integer between 1 and 5`;
            }
          }
        });
        
        return {
          rowNumber,
          projectName: project.name || `Row ${rowNumber}`,
          isValid: Object.keys(errors).length === 0,
          errors
        };
      } catch (rowError) {
        // Handle any errors that occur during validation of a specific row
        console.error(`Error validating row ${index + 2}:`, rowError);
        return {
          rowNumber: index + 2,
          projectName: project?.name || `Row ${index + 2}`,
          isValid: false,
          errors: { 
            '_global': `Failed to validate this row: ${rowError instanceof Error ? rowError.message : 'Unknown error'}`
          }
        };
      }
    });
    
    // Use Promise.allSettled to ensure all validations are processed even if some fail
    const validationSettledResults = await Promise.allSettled(validationPromises);
    
    // Extract values from settled promises, handling any rejected promises
    const validationResults = validationSettledResults.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Validation promise rejected for row ${index + 2}:`, result.reason);
        return {
          rowNumber: index + 2,
          projectName: `Row ${index + 2}`,
          isValid: false,
          errors: { '_global': 'Validation failed for this row' }
        };
      }
    });
    
    // Calculate summary statistics
    const validCount = validationResults.filter(result => result.isValid).length;
    const invalidCount = validationResults.length - validCount;
    
    return NextResponse.json({
      validationResults,
      summary: {
        total: validationResults.length,
        valid: validCount,
        invalid: invalidCount
      }
    });
    
  } catch (error) {
    console.error('Error validating projects:', error);
    return NextResponse.json(
      { 
        error: 'Failed to validate projects', 
        message: error instanceof Error ? error.message : String(error),
        validationResults: [], // Return empty array instead of nothing
        summary: { total: 0, valid: 0, invalid: 0 }
      },
      { status: 500 }
    );
  }
}
