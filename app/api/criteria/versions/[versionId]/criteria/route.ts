import { NextRequest, NextResponse } from "next/server";
import { CriteriaRepository } from "@/app/_repositories/CriteriaRepository";
import prisma from "@/app/_lib/prisma";

const criteriaRepo = new CriteriaRepository();

// Helper function to find criterion and verify it belongs to version
async function findCriterionAndVerifyVersion(criterionId: string, versionId: string) {
  const criterion = await prisma.criterion.findUnique({
    where: { id: criterionId }
  });
  
  if (!criterion) {
    return null;
  }
  
  if (criterion.versionId !== versionId) {
    return null;
  }
  
  return criterion;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  try {
    // Await the params object before accessing properties
    const { versionId } = await params;
    console.log(`Fetching criteria for version: ${versionId}`);
    
    // Fetch the version with its criteria
    const version = await criteriaRepo.findVersionById(versionId);
    
    if (!version) {
      console.log(`Version not found: ${versionId}`);
      return NextResponse.json(
        { error: "Criteria version not found" },
        { status: 404 }
      );
    }
    
    console.log(`Version found: ${version.id}, Name: ${version.name}`);
    console.log(`Criteria available: ${version.criteria ? version.criteria.length : 'undefined'}`);
    
    if (!version.criteria) {
      console.log('WARNING: version.criteria is undefined');
    } else if (version.criteria.length === 0) {
      console.log('WARNING: version.criteria is an empty array');
    } else {
      console.log('Criteria data sample:', version.criteria[0]);
    }
    
    // Additional diagnostic: directly query criteria table to confirm data exists
    const directCriteria = await prisma.criterion.findMany({
      where: { versionId: versionId }
    });
    console.log(`Direct criteria query result count: ${directCriteria.length}`);
    
    return NextResponse.json(version.criteria || []);
  } catch (error) {
    console.error(`Error fetching criteria for version:`, error);
    return NextResponse.json(
      { error: "Failed to fetch criteria" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ versionId: string }>}
) {
  try {
    // Await the params object before accessing properties
    const { versionId } = await params;
    const data = await request.json();
    
    // Add the versionId to the data
    data.versionId = versionId;
    
    // Validate required fields
    if (!data.key || !data.label || !data.createdById) {
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
    
    // Create the criterion
    const criterion = await criteriaRepo.createCriterion(data, data.createdById);
    
    return NextResponse.json(criterion, { status: 201 });
  } catch (error) {
    console.error(`Error creating criterion for version:`, error);
    return NextResponse.json(
      { error: "Failed to create criterion" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  try {
    // Await the params object before accessing properties
    const { versionId } = await params;
    const data = await request.json();
    
    // Validate required fields
    if (!data.id || !data.updatedById) {
      return NextResponse.json(
        { error: "Missing required fields: id and updatedById are required" },
        { status: 400 }
      );
    }
    
    // Validate if criterion exists and belongs to this version
    const existingCriterion = await findCriterionAndVerifyVersion(data.id, versionId);
    if (!existingCriterion) {
      return NextResponse.json(
        { error: "Criterion not found or does not belong to this version" },
        { status: 404 }
      );
    }
    
    // Extract the criterion ID
    const criterionId = data.id;
    delete data.id; // Remove id from update data
    
    // Update the criterion
    const updatedCriterion = await criteriaRepo.updateCriterion(
      criterionId,
      data,
      data.updatedById
    );
    
    console.log(`Criterion updated successfully: ${criterionId}`);
    return NextResponse.json(updatedCriterion);
  } catch (error) {
    console.error(`Error updating criterion for version:`, error);
    return NextResponse.json(
      { error: "Failed to update criterion" },
      { status: 500 }
    );
  }
}
