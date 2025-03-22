import { NextRequest, NextResponse } from "next/server";
import { CriteriaRepository } from "@/src/repositories/CriteriaRepository";

const criteriaRepo = new CriteriaRepository();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  try {
    // Await the params object before accessing properties
    const { versionId } = await params;
    const data = await request.json();
    
    // Validate required fields
    if (!Array.isArray(data.comparisons) || !data.userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate if version exists
    const existingVersion = await criteriaRepo.findVersionById(versionId);
    if (!existingVersion) {
      return NextResponse.json(
        { error: "Criteria version not found" },
        { status: 404 }
      );
    }
    
    // Save pairwise comparisons and calculate weights
    await criteriaRepo.savePairwiseComparisons(
      versionId,
      data.comparisons,
      data.userId
    );
    
    // Fetch the updated version with calculated weights
    const updatedVersion = await criteriaRepo.findVersionById(versionId);
    
    return NextResponse.json({
      message: "Pairwise comparisons saved and weights calculated successfully",
      criteria: updatedVersion?.criteria
    });
  } catch (error) {
    console.error(`Error saving pairwise comparisons for version:`, error);
    return NextResponse.json(
      { error: "Failed to save pairwise comparisons" },
      { status: 500 }
    );
  }
}
