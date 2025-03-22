import prisma from '../lib/prisma';
import { BaseRepository } from './BaseRepository';

// Temporary type definitions until Prisma client is generated
export interface Criterion {
  id: string;
  key: string;
  label: string;
  description?: string;
  isInverse: boolean;
  isDefault: boolean;
  weight?: number;
  scale?: Record<string, any>;
  rubric?: Record<string, string>;
  versionId: string;
  createdAt: Date;
  updatedAt: Date;
  createdById?: string;
  updatedById?: string;
}

export interface CriteriaVersion {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  createdById?: string;
  updatedById?: string;
  criteria?: Criterion[];
}

export interface PairwiseComparison {
  id: string;
  versionId: string;
  criterionAId: string;
  criterionBId: string;
  value: number;
  createdAt: Date;
}

// Input types
export interface CriterionCreateInput {
  key: string;
  label: string;
  description?: string;
  isInverse?: boolean;
  isDefault?: boolean;
  weight?: number;
  scale?: Record<string, any>;
  rubric?: Record<string, string>;
  versionId: string;
  createdById: string;
}

export interface CriterionUpdateInput {
  key?: string;
  label?: string;
  description?: string;
  isInverse?: boolean;
  isDefault?: boolean;
  weight?: number;
  scale?: Record<string, any>;
  rubric?: Record<string, string>;
  updatedById: string;
}

export interface CriteriaVersionCreateInput {
  name: string;
  description?: string;
  isActive?: boolean;
  organizationId: string;
  createdById: string;
}

export interface CriteriaVersionUpdateInput {
  name?: string;
  description?: string;
  isActive?: boolean;
  updatedById: string;
}

export class CriteriaRepository {
  /**
   * Find all criteria versions for an organization
   */
  async findVersionsByOrganization(organizationId: string): Promise<CriteriaVersion[]> {
    return prisma.criteriaVersion.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find active criteria version for an organization
   */
  async findActiveVersion(organizationId: string): Promise<CriteriaVersion | null> {
    return prisma.criteriaVersion.findFirst({
      where: { 
        organizationId,
        isActive: true 
      },
      include: {
        criteria: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  /**
   * Find criteria version by ID with associated criteria
   */
  async findVersionById(id: string): Promise<CriteriaVersion | null> {
    console.log(`[CriteriaRepository] Finding version by ID: ${id}`);
    
    // Execute with debug logging
    try {
      const result = await prisma.criteriaVersion.findUnique({
        where: { id },
        include: {
          criteria: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });
      
      console.log(`[CriteriaRepository] Version found: ${result ? 'Yes' : 'No'}`);
      if (result) {
        console.log(`[CriteriaRepository] Version name: ${result.name}`);
        console.log(`[CriteriaRepository] Criteria included: ${result.criteria ? result.criteria.length : 'undefined'}`);
        
        // Debug criteria data
        if (!result.criteria || result.criteria.length === 0) {
          console.log(`[CriteriaRepository] No criteria found for version ${id}`);
          
          // Additional check - query criteria directly to see if any exist
          const directCriteriaCount = await prisma.criterion.count({
            where: { versionId: id }
          });
          
          console.log(`[CriteriaRepository] Direct criteria count: ${directCriteriaCount}`);
        }
      }
      
      return result;
    } catch (error) {
      console.error(`[CriteriaRepository] Error finding version by ID:`, error);
      throw error;
    }
  }

  /**
   * Create a criteria version
   */
  async createVersion(data: CriteriaVersionCreateInput, userId: string): Promise<CriteriaVersion> {
    return prisma.$transaction(async (tx: any) => {
      // If making this version active, deactivate all others
      if (data.isActive) {
        await tx.criteriaVersion.updateMany({
          where: {
            organizationId: data.organizationId,
            isActive: true
          },
          data: {
            isActive: false,
            updatedById: data.createdById
          }
        });
      }

      // Create the new version
      const createData: any = {
        name: data.name,
        description: data.description,
        isActive: data.isActive ?? false,
        organization: {
          connect: { id: data.organizationId }
        },
        createdBy: {
          connect: { id: data.createdById }
        }
      };

      const result = await tx.criteriaVersion.create({
        data: createData
      });

      // Log the action
      await tx.auditLog.create({
        data: {
          userId,
          action: 'CREATE',
          entityType: 'criteria_version',
          entityId: result.id,
        },
      });

      return result;
    });
  }

  /**
   * Update a criteria version
   */
  async updateVersion(id: string, data: CriteriaVersionUpdateInput, userId: string): Promise<CriteriaVersion> {
    return prisma.$transaction(async (tx: any) => {
      const version = await tx.criteriaVersion.findUnique({
        where: { id },
        select: { organizationId: true }
      });

      if (!version) {
        throw new Error(`Version with ID ${id} not found`);
      }

      // If making this version active, deactivate all others
      if (data.isActive) {
        await tx.criteriaVersion.updateMany({
          where: {
            organizationId: version.organizationId,
            isActive: true,
            id: { not: id }
          },
          data: {
            isActive: false,
            updatedById: data.updatedById
          }
        });
      }

      // Update the version
      const updateData: any = {
        ...data,
        updatedBy: {
          connect: { id: data.updatedById }
        }
      };

      // Remove the updatedById field to avoid TS errors
      delete updateData.updatedById;

      const result = await tx.criteriaVersion.update({
        where: { id },
        data: updateData
      });

      // Log the action
      await tx.auditLog.create({
        data: {
          userId,
          action: 'UPDATE',
          entityType: 'criteria_version',
          entityId: id,
        },
      });

      return result;
    });
  }

  /**
   * Delete a criteria version (and all associated criteria)
   */
  async deleteVersion(id: string, userId: string): Promise<CriteriaVersion> {
    return prisma.$transaction(async (tx: any) => {
      // First delete all criteria in this version
      await tx.criterion.deleteMany({
        where: { versionId: id }
      });

      // Then delete the version
      const result = await tx.criteriaVersion.delete({
        where: { id }
      });

      // Log the action
      await tx.auditLog.create({
        data: {
          userId,
          action: 'DELETE',
          entityType: 'criteria_version',
          entityId: id,
        },
      });

      return result;
    });
  }

  /**
   * Find criterion by ID
   */
  async findCriterionById(id: string): Promise<Criterion | null> {
    return prisma.criterion.findUnique({
      where: { id }
    });
  }

  /**
   * Create a criterion
   */
  async createCriterion(data: CriterionCreateInput, userId: string): Promise<Criterion> {
    return prisma.$transaction(async (tx: any) => {
      // Create criterion
      const createData: any = {
        key: data.key,
        label: data.label,
        description: data.description,
        isInverse: data.isInverse ?? false,
        isDefault: data.isDefault ?? false,
        weight: data.weight,
        scale: data.scale,
        rubric: data.rubric,
        version: {
          connect: { id: data.versionId }
        },
        createdBy: {
          connect: { id: data.createdById }
        }
      };

      const result = await tx.criterion.create({
        data: createData
      });

      // Log the action
      await tx.auditLog.create({
        data: {
          userId,
          action: 'CREATE',
          entityType: 'criterion',
          entityId: result.id,
        },
      });

      return result;
    });
  }

  /**
   * Update a criterion
   */
  async updateCriterion(id: string, data: CriterionUpdateInput, userId: string): Promise<Criterion> {
    return prisma.$transaction(async (tx: any) => {
      // Update criterion
      const updateData: any = {
        ...data,
        updatedBy: {
          connect: { id: data.updatedById }
        }
      };

      // Remove the updatedById field to avoid TS errors
      delete updateData.updatedById;

      const result = await tx.criterion.update({
        where: { id },
        data: updateData
      });

      // Log the action
      await tx.auditLog.create({
        data: {
          userId,
          action: 'UPDATE',
          entityType: 'criterion',
          entityId: id,
        },
      });

      return result;
    });
  }

  /**
   * Delete a criterion
   */
  async deleteCriterion(id: string, userId: string): Promise<Criterion> {
    return prisma.$transaction(async (tx: any) => {
      // Delete criterion
      const result = await tx.criterion.delete({
        where: { id }
      });

      // Log the action
      await tx.auditLog.create({
        data: {
          userId,
          action: 'DELETE',
          entityType: 'criterion',
          entityId: id,
        },
      });

      return result;
    });
  }

  /**
   * Save pairwise comparisons and recalculate weights
   */
  async savePairwiseComparisons(
    versionId: string, 
    comparisons: { criterionAId: string; criterionBId: string; value: number }[],
    userId: string
  ): Promise<void> {
    return prisma.$transaction(async (tx: any) => {
      // Delete existing comparisons
      await tx.pairwiseComparison.deleteMany({
        where: { versionId }
      });

      // Create new comparisons
      for (const comparison of comparisons) {
        await tx.pairwiseComparison.create({
          data: {
            version: {
              connect: { id: versionId }
            },
            criterionA: {
              connect: { id: comparison.criterionAId }
            },
            criterionB: {
              connect: { id: comparison.criterionBId }
            },
            value: comparison.value
          }
        });
      }

      // Fetch all criteria for this version
      const criteria = await tx.criterion.findMany({
        where: { versionId }
      });

      // Build comparison matrix for AHP calculation
      const matrix = this.buildComparisonMatrix(criteria, comparisons);
      
      // Calculate weights using AHP method
      const weights = this.calculateAHPWeights(matrix);

      // Update criteria with calculated weights
      for (let i = 0; i < criteria.length; i++) {
        await tx.criterion.update({
          where: { id: criteria[i].id },
          data: {
            weight: weights[i],
            updatedBy: {
              connect: { id: userId }
            }
          }
        });
      }

      // Log the action
      await tx.auditLog.create({
        data: {
          userId,
          action: 'UPDATE',
          entityType: 'criteria_weights',
          entityId: versionId,
        },
      });
    });
  }

  /**
   * Build comparison matrix for AHP calculation
   */
  private buildComparisonMatrix(
    criteria: Criterion[],
    comparisons: { criterionAId: string; criterionBId: string; value: number }[]
  ): number[][] {
    const n = criteria.length;
    // Initialize matrix with 1s on diagonal (equal comparison to self)
    const matrix = Array(n).fill(0).map(() => Array(n).fill(1));
    
    // Create index map for quick lookup
    const criteriaIndexMap = new Map<string, number>();
    criteria.forEach((criterion, index) => {
      criteriaIndexMap.set(criterion.id, index);
    });
    
    // Fill matrix with comparison values
    comparisons.forEach(comparison => {
      const i = criteriaIndexMap.get(comparison.criterionAId);
      const j = criteriaIndexMap.get(comparison.criterionBId);
      
      if (i !== undefined && j !== undefined) {
        matrix[i][j] = comparison.value;
        matrix[j][i] = 1 / comparison.value; // Reciprocal value for opposite comparison
      }
    });
    
    return matrix;
  }

  /**
   * Calculate weights using AHP method
   */
  private calculateAHPWeights(matrix: number[][]): number[] {
    const n = matrix.length;
    
    // 1. Calculate column sums
    const colSums = Array(n).fill(0);
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        colSums[j] += matrix[i][j];
      }
    }
    
    // 2. Normalize the matrix by dividing each cell by its column sum
    const normalizedMatrix = matrix.map((row, i) => 
      row.map((val, j) => val / colSums[j])
    );
    
    // 3. Calculate row averages to get the weights
    const weights = normalizedMatrix.map(row => 
      row.reduce((sum, val) => sum + val, 0) / n
    );
    
    // 4. Normalize weights to sum to 1
    const weightSum = weights.reduce((sum, w) => sum + w, 0);
    
    // Return rounded results to 4 decimal places
    return weights.map(w => parseFloat((w / weightSum).toFixed(4)));
  }
}
