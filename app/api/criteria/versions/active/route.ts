import { NextRequest, NextResponse } from "next/server";
import { CriteriaRepository } from "@/app/_repositories/CriteriaRepository";

const criteriaRepo = new CriteriaRepository();

export async function GET(request: NextRequest) {
  try {
    // Get organization ID from header
    const organizationId = request.headers.get("x-organization-id");
    
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }
    
    // Find active version
    const activeVersion = await criteriaRepo.findActiveVersion(organizationId);
    
    if (!activeVersion) {
      return NextResponse.json(
        { error: "No active criteria version found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(activeVersion);
  } catch (error) {
    console.error("Error fetching active criteria version:", error);
    return NextResponse.json(
      { error: "Failed to fetch active criteria version" },
      { status: 500 }
    );
  }
}
