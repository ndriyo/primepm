import { NextRequest, NextResponse } from "next/server";
import { CriteriaRepository } from "@/src/repositories/CriteriaRepository";

const criteriaRepo = new CriteriaRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: { versionId: string } }
) {
  try {
    // Await the params object before accessing properties
    const { versionId } = await params;
    
    const criteriaVersion = await criteriaRepo.findVersionById(versionId);
    
    if (!criteriaVersion) {
      return NextResponse.json(
        { error: "Criteria version not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(criteriaVersion);
  } catch (error) {
    console.error(`Error fetching criteria version:`, error);
    return NextResponse.json(
      { error: "Failed to fetch criteria version" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { versionId: string } }
) {
  try {
    // Await the params object before accessing properties
    const { versionId } = await params;
    const data = await request.json();
    
    // Validate if version exists
    const existingVersion = await criteriaRepo.findVersionById(versionId);
    if (!existingVersion) {
      return NextResponse.json(
        { error: "Criteria version not found" },
        { status: 404 }
      );
    }
    
    // Validate required fields for update
    if (!data.updatedById) {
      return NextResponse.json(
        { error: "Missing updatedById field" },
        { status: 400 }
      );
    }
    
    // Update the criteria version
    const updatedVersion = await criteriaRepo.updateVersion(
      versionId,
      data,
      data.updatedById
    );
    
    return NextResponse.json(updatedVersion);
  } catch (error) {
    console.error(`Error updating criteria version:`, error);
    return NextResponse.json(
      { error: "Failed to update criteria version" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { versionId: string } }
) {
  try {
    // Await the params object before accessing properties
    const { versionId } = await params;
    
    // Validate if version exists
    const existingVersion = await criteriaRepo.findVersionById(versionId);
    if (!existingVersion) {
      return NextResponse.json(
        { error: "Criteria version not found" },
        { status: 404 }
      );
    }
    
    // Get the user ID from request header or query parameter
    const userId = request.headers.get("x-user-id") || 
                   request.nextUrl.searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required to delete a criteria version" },
        { status: 400 }
      );
    }
    
    // Delete the criteria version
    await criteriaRepo.deleteVersion(versionId, userId);
    
    return NextResponse.json(
      { message: "Criteria version deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting criteria version:`, error);
    return NextResponse.json(
      { error: "Failed to delete criteria version" },
      { status: 500 }
    );
  }
}
