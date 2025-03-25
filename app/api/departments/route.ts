import { NextRequest, NextResponse } from "next/server";
import { DepartmentRepository } from "@/app/_repositories";

const departmentRepo = new DepartmentRepository();

export async function GET(request: NextRequest) {
  try {
    const organizationId = request.headers.get("x-organization-id");
    
    if (!organizationId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const departments = await departmentRepo.findByOrganization(organizationId);
    
    return NextResponse.json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    return NextResponse.json(
      { error: "Failed to fetch departments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const organizationId = request.headers.get("x-organization-id");
    
    if (!userId || !organizationId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    
    // Ensure organizationId is included
    const departmentData = {
      ...data,
      organizationId,
      createdById: userId
    };
    
    const department = await departmentRepo.create(departmentData, userId);
    
    return NextResponse.json(department);
  } catch (error) {
    console.error("Error creating department:", error);
    return NextResponse.json(
      { error: "Failed to create department" },
      { status: 500 }
    );
  }
}
