import { NextRequest, NextResponse } from "next/server";
import { ProjectRepository } from "@/src/repositories/ProjectRepository";

const projectRepo = new ProjectRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    // Await the params object before accessing properties
    const { projectId } = await params;
    
    // Get the project with scores
    const project = await projectRepo.findWithScores(projectId);
    
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
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
  { params }: { params: { projectId: string } }
) {
  try {
    // Await the params object before accessing properties
    const { projectId } = await params;
    const data = await request.json();
    
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
    
    // Update the criterion score
    const result = await projectRepo.updateCriteriaScore(
      projectId,
      data.criterionId,
      data.versionId,
      data.score,
      data.comment || null,
      data.userId
    );
    
    // Calculate overall score after update
    const overallScore = await projectRepo.calculateOverallScore(projectId, data.versionId);
    
    return NextResponse.json({
      score: result,
      overallScore: overallScore
    }, { status: 201 });
  } catch (error) {
    console.error(`Error updating project score:`, error);
    return NextResponse.json(
      { error: "Failed to update project score" },
      { status: 500 }
    );
  }
}
