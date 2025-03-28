import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  try {
    // Get authentication information from headers
    const userId = request.headers.get("x-user-id");
    const organizationId = request.headers.get("x-organization-id");
    const userRole = request.headers.get("x-user-role");

    if (!userId || !organizationId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Create headers for internal API requests
    const headers: Record<string, string> = {
      "x-user-id": userId,
      "x-organization-id": organizationId,
    };
    if (userRole) {
      headers["x-user-role"] = userRole;
    }

    // Get the base URL from the request
    const origin = request.nextUrl.origin;

    // Fetch active criteria version with absolute URL and query parameters
    const criteriaResponse = await fetch(
      `${origin}/api/criteria/versions?organizationId=${organizationId}&active=true`,
      { headers }
    );
    if (!criteriaResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch criteria versions" },
        { status: 500 }
      );
    }
    const criteriaVersions = await criteriaResponse.json();
    const activeVersion = criteriaVersions.find((version: any) => version.isActive);
    if (!activeVersion) {
      return NextResponse.json(
        { error: "No active criteria version found" },
        { status: 400 }
      );
    }

    // Fetch criteria for active version with absolute URL
    const criteriaDetailsResponse = await fetch(
      `${origin}/api/criteria/versions/${activeVersion.id}/criteria`,
      { headers }
    );
    if (!criteriaDetailsResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch criteria details" },
        { status: 500 }
      );
    }
    const criteriaDetails = await criteriaDetailsResponse.json();

    // Prepare data for the "Instructions" sheet using SheetJS (xlsx)
    const instructionsData: any[][] = [
      ["Project Import Template"],
      [],
      ["Instructions:"],
      ["1. This template is used to import multiple projects at once"],
      ["2. Fill in the Project Data sheet with your project information"],
      ["3. Required fields are marked with an asterisk (*)"],
      ["4. For existing projects (updates), include the Project ID"],
      ["5. Department names must match existing departments exactly"],
      ["6. Dates should be in YYYY-MM-DD format"],
      ["7. Status must be one of: initiation, planning, in-progress, completed, on-hold"],
      ["8. Tags should be comma-separated"],
      ["9. You can import this Excel file directly, or create a JSON file with a 'projects' array"],
      ["10. Column names in Excel must match the expected field names shown below"],
      [],
      ["Criteria Scoring Information:"]
    ];

    // Append criteria scoring rows
    for (const criterion of criteriaDetails) {
      instructionsData.push([`${criterion.key} (1-5): ${criterion.description}`]);
    }
    instructionsData.push([]);
    instructionsData.push(["Scoring Guide:"]);
    instructionsData.push(["1 = Very Low"]);
    instructionsData.push(["2 = Low"]);
    instructionsData.push(["3 = Medium"]);
    instructionsData.push(["4 = High"]);
    instructionsData.push(["5 = Very High"]);

    // Prepare data for the "Project Data" sheet
    const baseHeaders = [
      "id", // Project ID
      "name", // Project Name
      "description", // Description
      "department", // Department/Division
      "budget", // Budget
      "startDate", // Start Date
      "endDate", // End Date 
      "resources", // Resources (mandays)
      "status", // Status
      "tags" // Tags
    ];
    
    // Row with field descriptions
    const headerDescriptions = [
      "Leave empty for new projects",
      "Project Name (required)",
      "Project Description (required)",
      "Department Name (required)",
      "Project Budget (required)",
      "Start Date in YYYY-MM-DD format (required)",
      "End Date in YYYY-MM-DD format (required)",
      "Resources in mandays (required)",
      "One of: initiation, planning, in-progress, completed, on-hold",
      "Comma-separated tags"
    ];
    // Append dynamic criteria headers
    for (const criterion of criteriaDetails) {
      baseHeaders.push(`${criterion.key}`);
    }
    const exampleRow = [
      "", // Project ID (empty for new projects)
      "Example Project",
      "This is an example project description",
      "IT",
      100000,
      "2025-01-01",
      "2025-12-31",
      120,
      "planning",
      "mobile,web,critical"
    ];
    // Append default score of 3 for each criterion
    for (const criterion of criteriaDetails) {
      exampleRow.push(3);
    }
    const projectData = [baseHeaders, headerDescriptions, exampleRow];

    // Create a new workbook
    const wb = XLSX.utils.book_new();
    // Create worksheets from the prepared data
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
    XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");

    const wsProjectData = XLSX.utils.aoa_to_sheet(projectData);
    XLSX.utils.book_append_sheet(wb, wsProjectData, "Project Data");

    // Write workbook to a buffer
    const wbOpts = { bookType: "xlsx" as XLSX.BookType, type: "buffer" as "buffer" };
    const buffer = XLSX.write(wb, wbOpts);

    return new NextResponse(buffer, {
      headers: {
        "Content-Disposition": 'attachment; filename="project_import_template.xlsx"',
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }
    });
  } catch (error) {
    console.error("Error generating template:", error);
    return NextResponse.json(
      { error: "Failed to generate template" },
      { status: 500 }
    );
  }
}
