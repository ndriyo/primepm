// Script to update all existing projects with calculated scores
// Run this script after applying the migration to add the score field

// Import the score calculator library
const { calculateOverallScore } = require('./scoreCalculator.cjs');

// Try to load environment variables from .env file
try {
  require('dotenv').config();
} catch (error) {
  console.warn('Warning: dotenv module not found. If you need to load environment variables from a .env file, install it with:');
  console.warn('npm install dotenv');
  console.warn('Continuing without dotenv...');
}

// Check if DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is not defined.');
  console.error('Please set the DATABASE_URL environment variable before running this script.');
  console.error('You can:');
  console.error('1. Create a .env file with DATABASE_URL and install dotenv: npm install dotenv');
  console.error('2. Set it directly when running the script: DATABASE_URL=postgresql://... node scripts/update-project-scores.cjs');
  console.error('3. Set it in your shell: export DATABASE_URL=postgresql://...');
  process.exit(1);
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateProjectScores() {
  console.log('Starting to update project scores...');
  
  try {
    // Get all organizations
    const organizations = await prisma.organization.findMany({
      select: { id: true }
    });
    
    console.log(`Found ${organizations.length} organizations`);
    
    // Process each organization
    for (const organization of organizations) {
      console.log(`Processing organization: ${organization.id}`);
      
      // Find the active criteria version for this organization
      const activeVersion = await prisma.criteriaVersion.findFirst({
        where: { 
          organizationId: organization.id,
          isActive: true 
        }
      });
      
      if (!activeVersion) {
        console.log(`No active criteria version found for organization ${organization.id}, skipping`);
        continue;
      }
      
      console.log(`Found active version: ${activeVersion.id} (${activeVersion.name})`);
      
      // Get all criteria for this version to ensure we have the correct weights
      const criteria = await prisma.criterion.findMany({
        where: {
          versionId: activeVersion.id
        }
      });
      
      console.log(`Found ${criteria.length} criteria in active version`);
      
      // Create a map of criterion ID to weight and other properties
      const criteriaMap = {};
      for (const criterion of criteria) {
        criteriaMap[criterion.id] = {
          weight: criterion.weight || 1,
          isInverse: criterion.isInverse || false,
          scale: criterion.scale || { min: 1, max: 5 }
        };
      }
      
      // Get all projects for this organization
      const projects = await prisma.project.findMany({
        where: { organizationId: organization.id },
        include: {
          projectScores: {
            where: { versionId: activeVersion.id },
            include: {
              criterion: true
            }
          }
        }
      });
      
      console.log(`Found ${projects.length} projects in organization ${organization.id}`);
      
      // Process each project
      for (const project of projects) {
        const scores = project.projectScores;
        
        if (!scores || scores.length === 0) {
          console.log(`Skipping project ${project.id} (${project.name}) - no scores found for active version`);
          continue;
        }
        
        // Convert scores to the format expected by the score calculator
        const criteriaScores = scores.map(score => {
          const { criterion } = score;
          const criterionInfo = criteriaMap[criterion.id] || { 
            weight: 1, 
            isInverse: false, 
            scale: { min: 1, max: 5 } 
          };
          
          // Get scale information
          const scaleMin = criterionInfo.scale && 
                          typeof criterionInfo.scale === 'object' && 
                          criterionInfo.scale.min ? 
                          Number(criterionInfo.scale.min) : 0;
          
          const scaleMax = criterionInfo.scale && 
                          typeof criterionInfo.scale === 'object' && 
                          criterionInfo.scale.max ? 
                          Number(criterionInfo.scale.max) : 5;
          
          return {
            criterionId: criterion.id,
            criterionKey: criterion.key,
            score: score.score,
            weight: criterionInfo.weight,
            isInverse: criterionInfo.isInverse,
            scaleMax,
            scaleMin
          };
        });
        
        // Use the centralized score calculator
        const calculatedScore = calculateOverallScore(criteriaScores, {
          normalizeOutput: true,
          outputScaleMax: 5,
          outputScaleMin: 0,
          decimalPlaces: 2
        });
        
        // Update the project with the calculated score
        try {
          // Try to update using the score field
          await prisma.project.update({
            where: { id: project.id },
            data: { score: calculatedScore }
          });
        } catch (updateError) {
          if (updateError.message && updateError.message.includes('Unknown argument `score`')) {
            console.error(`Error: The 'score' field is not recognized by Prisma.`);
            console.error(`You need to regenerate the Prisma client after adding the 'score' field to the schema.`);
            console.error(`Run: npx prisma generate`);
            console.error(`Then try running this script again.`);
            process.exit(1);
          } else {
            // Re-throw other errors
            throw updateError;
          }
        }
        
        console.log(`Updated project ${project.id} (${project.name}) with score: ${calculatedScore}`);
      }
    }
    
    console.log('Finished updating project scores');
  } catch (error) {
    console.error('Error updating project scores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateProjectScores();
