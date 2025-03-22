import { NextRequest, NextResponse } from 'next/server';
import { CriteriaRepository } from '@/src/repositories/CriteriaRepository';

const criteriaRepo = new CriteriaRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: { criterionId: string } }
) {
  try {
    // Await the params object before accessing properties
    const { criterionId } = await params;
    const criterion = await criteriaRepo.findCriterionById(criterionId);
    if (!criterion) {
      return NextResponse.json(
        { error: "Criterion not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(criterion);
  } catch (error) {
    console.error(`Error fetching criterion:`, error);
    return NextResponse.json(
      { error: "Failed to fetch criterion" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { criterionId: string } }
) {
  try {
    // Await the params object before accessing properties
    const { criterionId } = await params;
    const data = await request.json();
    const existingCriterion = await criteriaRepo.findCriterionById(criterionId);
    if (!existingCriterion) {
      return NextResponse.json(
        { error: "Criterion not found" },
        { status: 404 }
      );
    }
    if (!data.updatedById) {
      return NextResponse.json(
        { error: "Missing updatedById field" },
        { status: 400 }
      );
    }
    const updatedCriterion = await criteriaRepo.updateCriterion(
      criterionId,
      data,
      data.updatedById
    );
    return NextResponse.json(updatedCriterion);
  } catch (error) {
    console.error(`Error updating criterion:`, error);
    return NextResponse.json(
      { error: "Failed to update criterion" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { criterionId: string } }
) {
  try {
    // Await the params object before accessing properties
    const { criterionId } = await params;
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required to delete a criterion" },
        { status: 400 }
      );
    }
    const existingCriterion = await criteriaRepo.findCriterionById(criterionId);
    if (!existingCriterion) {
      return NextResponse.json(
        { error: "Criterion not found" },
        { status: 404 }
      );
    }
    await criteriaRepo.deleteCriterion(criterionId, userId);
    return NextResponse.json(
      { message: "Criterion deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting criterion:`, error);
    return NextResponse.json(
      { error: "Failed to delete criterion" },
      { status: 500 }
    );
  }
}
