/**
 * Project Score Calculator Library
 * 
 * This library provides a centralized, consistent way to calculate project scores
 * throughout the application. It should be the only place where score calculation
 * logic is implemented.
 */

import { Criterion } from '@/app/contexts/CriteriaContext';

/**
 * Interface for criteria scores with their weights
 */
export interface CriteriaScore {
  criterionId: string;
  criterionKey: string;
  score: number;
  weight: number;
  isInverse: boolean;
  scaleMax: number;
  scaleMin: number;
}

/**
 * Options for score calculation
 */
export interface ScoreCalculationOptions {
  /** Whether to normalize the final score to a specific range (default: 0-10) */
  normalizeOutput?: boolean;
  /** Maximum value for the output scale (default: 10) */
  outputScaleMax?: number;
  /** Minimum value for the output scale (default: 0) */
  outputScaleMin?: number;
  /** Number of decimal places to round to (default: 2) */
  decimalPlaces?: number;
}

/**
 * Calculate a weighted score for a single criterion
 * 
 * @param score The raw score value
 * @param weight The weight to apply (default: 1)
 * @param isInverse Whether this is an inverse criterion (lower is better)
 * @param scaleMin The minimum value on the scale (default: 0)
 * @param scaleMax The maximum value on the scale (default: 10)
 * @returns The weighted, normalized score
 */
export function calculateCriterionScore(
  score: number,
  weight: number = 1,
  isInverse: boolean = false,
  scaleMin: number = 0,
  scaleMax: number = 5
): number {
  // Normalize the score to 0-1 range
  const normalizedScore = (score - scaleMin) / (scaleMax - scaleMin);
  
  // Apply inverse transformation if needed
  const adjustedScore = isInverse ? 1 - normalizedScore : normalizedScore;
  
  // Apply weight
  return adjustedScore * weight;
}

/**
 * Calculate the overall score for a project based on its criteria scores
 * 
 * @param criteriaScores Array of criteria scores with their weights and properties
 * @param options Calculation options
 * @returns The calculated overall score
 */
export function calculateOverallScore(
  criteriaScores: CriteriaScore[],
  options: ScoreCalculationOptions = {}
): number {
  // Default options
  const {
    normalizeOutput = true,
    outputScaleMax = 5,
    outputScaleMin = 0,
    decimalPlaces = 2
  } = options;

  // If no scores, return 0
  if (!criteriaScores.length) {
    return 0;
  }

  // Calculate weighted sum and total weight
  let weightedSum = 0;
  let totalWeight = 0;

  for (const criteriaScore of criteriaScores) {
    const {
      score,
      weight = 1,
      isInverse = false,
      scaleMin = 0,
      scaleMax = 5
    } = criteriaScore;

    // Calculate weighted score for this criterion
    const weightedCriterionScore = calculateCriterionScore(
      score,
      weight,
      isInverse,
      scaleMin,
      scaleMax
    );

    weightedSum += weightedCriterionScore;
    totalWeight += weight;
  }

  // Calculate raw score
  let finalScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // Normalize to output scale if requested
  if (normalizeOutput) {
    finalScore = outputScaleMin + finalScore * (outputScaleMax - outputScaleMin);
  }

  // Round to specified decimal places
  return parseFloat(finalScore.toFixed(decimalPlaces));
}

/**
 * Convert project criteria data to the format needed for score calculation
 * 
 * @param criteriaData Record of criterion keys to scores
 * @param criteria Array of criterion definitions
 * @returns Array of CriteriaScore objects ready for calculation
 */
export function prepareCriteriaScores(
  criteriaData: Record<string, number>,
  criteria: Criterion[]
): CriteriaScore[] {
  return Object.entries(criteriaData).map(([key, score]) => {
    // Find the criterion definition
    const criterion = criteria.find(c => c.key === key);
    
    if (!criterion) {
      // If criterion not found, use defaults
      return {
        criterionId: key,
        criterionKey: key,
        score,
        weight: 1,
        isInverse: false,
        scaleMax: 5,
        scaleMin: 0
      };
    }
    
    // Get scale information
    const scaleMin = criterion.scale?.min || 0;
    const scaleMax = criterion.scale?.max || 5;
    
    return {
      criterionId: criterion.id,
      criterionKey: key,
      score,
      weight: criterion.weight || 1,
      isInverse: criterion.isInverse || false,
      scaleMax,
      scaleMin
    };
  });
}

/**
 * Calculate a preview score for a project
 * This is used for UI previews before saving to the database
 * 
 * @param criteriaData Record of criterion keys to scores
 * @param criteria Array of criterion definitions
 * @param options Calculation options
 * @returns The calculated preview score
 */
export function calculatePreviewScore(
  criteriaData: Record<string, number>,
  criteria: Criterion[],
  options: ScoreCalculationOptions = {}
): number {
  const criteriaScores = prepareCriteriaScores(criteriaData, criteria);
  return calculateOverallScore(criteriaScores, options);
}
