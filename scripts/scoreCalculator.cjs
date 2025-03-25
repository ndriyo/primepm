/**
 * Project Score Calculator Library (CommonJS version)
 * 
 * This is a CommonJS version of the scoreCalculator library for use in scripts.
 * It provides the same functionality as src/lib/scoreCalculator.ts but in CommonJS format.
 */

/**
 * Calculate a weighted score for a single criterion
 * 
 * @param {number} score The raw score value
 * @param {number} weight The weight to apply (default: 1)
 * @param {boolean} isInverse Whether this is an inverse criterion (lower is better)
 * @param {number} scaleMin The minimum value on the scale (default: 0)
 * @param {number} scaleMax The maximum value on the scale (default: 10)
 * @returns {number} The weighted, normalized score
 */
function calculateCriterionScore(
  score,
  weight = 1,
  isInverse = false,
  scaleMin = 0,
  scaleMax = 10
) {
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
 * @param {Array} criteriaScores Array of criteria scores with their weights and properties
 * @param {Object} options Calculation options
 * @returns {number} The calculated overall score
 */
function calculateOverallScore(
  criteriaScores,
  options = {}
) {
  // Default options
  const {
    normalizeOutput = true,
    outputScaleMax = 10,
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
      scaleMax = 10
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

module.exports = {
  calculateCriterionScore,
  calculateOverallScore
};
