import { NextRequest, NextResponse } from "next/server";
import { CriteriaRepository } from "@/src/repositories/CriteriaRepository";

const criteriaRepo = new CriteriaRepository();

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get("organizationId");
    const active = searchParams.get("active");
    
    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      );
    }
    
    let criteriaVersions;
    if (active === "true") {
      // Use the correct method name: findActiveVersion
      const activeVersion = await criteriaRepo.findActiveVersion(organizationId);
      // Convert to array if not already
      criteriaVersions = activeVersion ? [activeVersion] : [];
    } else {
      criteriaVersions = await criteriaRepo.findVersionsByOrganization(organizationId);
    }
    return NextResponse.json(criteriaVersions);
  } catch (error) {
    console.error("Error fetching criteria versions:", error);
    return NextResponse.json(
      { error: "Failed to fetch criteria versions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.organizationId || !data.createdById) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create the criteria version
    const criteriaVersion = await criteriaRepo.createVersion(data, data.createdById);
    
    return NextResponse.json(criteriaVersion, { status: 201 });
  } catch (error) {
    console.error("Error creating criteria version:", error);
    return NextResponse.json(
      { error: "Failed to create criteria version" },
      { status: 500 }
    );
  }
}
