import { NextRequest, NextResponse } from 'next/server';
import { PortfolioRepository } from '@/src/repositories/PortfolioRepository';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{}> }
) {
  try {
    // Get organization ID from headers (set by auth context)
    const organizationId = request.headers.get('x-organization-id');
    const userId = request.headers.get('x-user-id');
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get active portfolio
    const portfolioRepo = new PortfolioRepository();
    const activePortfolio = await portfolioRepo.findActiveSelection(organizationId);
    
    return NextResponse.json(activePortfolio);
  } catch (error) {
    console.error('Error fetching active portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active portfolio' },
      { status: 500 }
    );
  }
}
