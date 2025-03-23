import { NextRequest, NextResponse } from 'next/server';
import { ProjectRepository } from '@/src/repositories/ProjectRepository';
import { DepartmentRepository } from '@/src/repositories/DepartmentRepository';
import { CriteriaRepository } from '@/src/repositories/CriteriaRepository';

// Initialize repositories
const projectRepo = new ProjectRepository();
const departmentRepo = new DepartmentRepository();
const criteriaRepo = new CriteriaRepository();

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
    
    // In a real implementation, this would have already been validated
    // Now we're submitting only the valid projects for import
    const data = await request.json();
    
    if (!data || !Array.isArray(data.projects)) {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      );
    }
    
    // Fetch departments to map names to IDs
    const departments = await departmentRepo.findByOrganization(organizationId);
    
    // Create a map of department names to IDs
    const departmentNameToIdMap = new Map<string, string>();
    departments.forEach((dept: any) => {
      departmentNameToIdMap.set(dept.name.toLowerCase(), dept.id);
    });
    
    // Fetch active criteria version with its criteria
    const activeVersion = await criteriaRepo.findActiveVersion(organizationId);
    
    if (!activeVersion) {
      return NextResponse.json(
        { error: 'No active criteria version found' },
        { status: 400 }
      );
    }
    
    // Get criteria from the active version
    const criteria = activeVersion.criteria || [];
    
    // Create a map of criterion keys to criterion IDs for easy lookup
    const criterionKeyToIdMap = new Map<string, string>();
    criteria.forEach((criterion: any) => {
      criterionKeyToIdMap.set(criterion.key, criterion.id);
    });
    
    // Log for debugging
    console.log('Criteria key to ID mapping:', 
      Array.from(criterionKeyToIdMap.entries()).map(([key, id]) => ({ key, id }))
    );
    
    // Track existing project IDs to avoid duplicates within the import
    const processedIds = new Set<string>();
    
    // Process each project
    const results = await Promise.all(
      data.projects.map(async (project: any, index: number) => {
        try {
          // Check if this is an update (has ID) or a new project
          const isUpdate = !!project.id;
          
          // Skip duplicate IDs (only process the first occurrence)
          if (isUpdate && processedIds.has(project.id)) {
            return {
              rowNumber: index + 2,
              projectName: project.name,
              success: false,
              error: 'Duplicate project ID in import file. Only the first occurrence is processed.'
            };
          }
          
          if (isUpdate) {
            processedIds.add(project.id);
          }
          
          // Get department ID from name
          const departmentId = departmentNameToIdMap.get(project.department.toLowerCase());
          
          if (!departmentId) {
            return {
              rowNumber: index + 2,
              projectName: project.name,
              success: false,
              error: 'Department not found'
            };
          }
          
          // Extract criteria scores from project data
          const criteriaScores: { criterionKey: string; score: number; comment?: string }[] = [];
          
          // Log project properties for debugging
          if (index === 0) {
            console.log('First project properties:', Object.keys(project));
          }
          
          // Process each property to find criteria by key
          for (const [key, value] of Object.entries(project)) {
            // Skip null or undefined values
            if (value === null || value === undefined) continue;
            
            // Skip standard project properties - only process criteria
            if ([
              'name', 'description', 'department', 'budget', 'resources',
              'startDate', 'endDate', 'status', 'tags', 'id'
            ].includes(key)) continue;
            
            // Use the criteria key to ID map to find the matching criterion
            const criterionId = criterionKeyToIdMap.get(key);
            
            // If this property matches a criterion key, add it to scores
            if (criterionId) {
              criteriaScores.push({
                criterionKey: criterionId,
                score: Number(value)
              });
              
              // Log for debugging
              if (index === 0) {
                console.log(`Found criterion: ${key} -> ID: ${criterionId}, Score: ${value}`);
              }
            }
          }
          
          // Format dates to ensure they are valid ISO-8601
          const formatDate = (dateString: string): string => {
            try {
              if (!dateString) return '';
              
              // Check if already in ISO format with time
              if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dateString)) {
                return dateString;
              }
              
              // If it's just a date (YYYY-MM-DD), add time component
              if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                return `${dateString}T00:00:00.000Z`;
              }
              
              // Parse as date and format as ISO
              const date = new Date(dateString);
              if (isNaN(date.getTime())) {
                throw new Error(`Invalid date format: ${dateString}`);
              }
              return date.toISOString();
            } catch (error) {
              console.error(`Error formatting date "${dateString}":`, error);
              throw new Error(`Invalid date format: ${dateString}`);
            }
          };
          
          // Prepare project data
          const projectData: any = {
            name: project.name,
            description: project.description,
            budget: Number(project.budget),
            resources: Number(project.resources),
            startDate: formatDate(project.startDate),
            endDate: formatDate(project.endDate),
            departmentId: departmentId,
            organizationId: organizationId,
            status: project.status || 'initiation'
          };
          
          // Handle tags if they exist
          if (project.tags) {
            const tags = typeof project.tags === 'string' 
              ? project.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
              : [];
            
            if (tags.length > 0) {
              projectData.tags = tags;
            }
          }
          
          let result;
          
          if (isUpdate) {
            // Update existing project
            result = await projectRepo.update(project.id, {
              ...projectData,
              updatedById: userId
            }, userId);
          } else {
            // Create new project
            result = await projectRepo.create({
              ...projectData,
              createdById: userId
            }, userId);
          }
          
          // Update criteria scores
          for (const scoreData of criteriaScores) {
            await projectRepo.updateCriteriaScore(
              result.id,
              scoreData.criterionKey,
              activeVersion.id,
              scoreData.score,
              scoreData.comment || null,
              userId
            );
          }
          
          return {
            rowNumber: index + 2,
            projectName: project.name,
            projectId: result.id,
            success: true
          };
        } catch (error) {
          console.error(`Error processing project at row ${index + 2}:`, error);
          return {
            rowNumber: index + 2,
            projectName: project.name,
            success: false,
            error: `Error processing project: ${(error as Error).message}`
          };
        }
      })
    );
    
    // Calculate summary statistics
    const successCount = results.filter(result => result.success).length;
    const failureCount = results.length - successCount;
    
    return NextResponse.json({
      results,
      summary: {
        total: results.length,
        success: successCount,
        failure: failureCount
      }
    });
    
  } catch (error) {
    console.error('Error importing projects:', error);
    return NextResponse.json(
      { error: 'Failed to import projects' },
      { status: 500 }
    );
  }
}
