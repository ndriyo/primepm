import React, { useState, useEffect } from 'react';
import { Project } from '../../data/projects';
import { useCriteria } from '../../contexts/CriteriaContext';

interface ProjectRating {
  id: string;
  name: string;
  [key: string]: string | number; // Dynamic criteria keys
}

interface ProjectScore extends ProjectRating {
  portfolioScore: number;
  rank: number;
}

interface ProjectSelectionTableProps {
  projects: Project[];
}

export const ProjectSelectionTable = ({ projects }: ProjectSelectionTableProps) => {
  const { criteria } = useCriteria();

  // Initialize weights with dynamic criteria keys
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [projectRatings, setProjectRatings] = useState<ProjectRating[]>([]);
  const [projectScores, setProjectScores] = useState<ProjectScore[]>([]);

  // Initialize weights when criteria change
  useEffect(() => {
    if (criteria.length === 0) return;

    const newWeights: Record<string, number> = {};
    // Distribute weights evenly across all criteria
    const weightPerCriterion = Math.floor(100 / criteria.length);
    
    criteria.forEach((criterion, index) => {
      // Give the remainder to the first criterion
      newWeights[criterion.key] = index === 0 
        ? weightPerCriterion + (100 - weightPerCriterion * criteria.length) 
        : weightPerCriterion;
    });
    
    setWeights(newWeights);
  }, [criteria]);

  // Initialize project ratings from projects data
  useEffect(() => {
    if (criteria.length === 0 || projects.length === 0) return;

    const initialRatings = projects.map(project => {
      const rating: ProjectRating = {
        id: project.id,
        name: project.name,
      };

      // Add ratings for each criterion
      criteria.forEach(criterion => {
        let value = project.criteria[criterion.key] || 5; // Default to middle value if missing
        
        // Scale from 1-10 to 1-5 and handle inverse criteria
        if (criterion.isInverse) {
          // For inverse criteria, a low value in the project is a high rating
          value = Math.min(5, Math.ceil((11 - value) / 2));
        } else {
          // For regular criteria, a high value in the project is a high rating
          value = Math.min(5, Math.ceil(value / 2));
        }
        
        rating[criterion.key] = value;
      });

      return rating;
    });

    setProjectRatings(initialRatings);
  }, [projects, criteria]);

  // Calculate portfolio scores whenever ratings or weights change
  useEffect(() => {
    if (projectRatings.length === 0 || criteria.length === 0) return;

    const scores = projectRatings.map(project => {
      let totalWeightedScore = 0;
      let totalWeightUsed = 0;

      criteria.forEach(criterion => {
        const rating = project[criterion.key] as number || 0;
        const weight = weights[criterion.key] || 0;
        totalWeightedScore += rating * weight;
        totalWeightUsed += weight;
      });
        
      // Avoid division by zero
      const score = totalWeightUsed > 0 
        ? totalWeightedScore / totalWeightUsed * 100
        : 0;
        
      return {
        ...project,
        portfolioScore: parseFloat(score.toFixed(10)),
        rank: 0, // Placeholder, we'll calculate ranks next
      };
    });
    
    // Sort by portfolio score (highest to lowest) and assign ranks
    const sortedScores = [...scores].sort((a, b) => b.portfolioScore - a.portfolioScore);
    sortedScores.forEach((project, index) => {
      project.rank = index + 1;
    });
    
    setProjectScores(sortedScores);
  }, [projectRatings, weights, criteria]);

  const handleRatingChange = (id: string, criterionKey: string, value: number) => {
    setProjectRatings(prev => 
      prev.map(project => 
        project.id === id ? { ...project, [criterionKey]: value } : project
      )
    );
  };

  const handleWeightChange = (criterionKey: string, value: number) => {
    setWeights(prev => ({ ...prev, [criterionKey]: value }));
  };

  // Ensure the total of all weights equals 100%
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);

  // If no criteria are defined, show a message
  if (criteria.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-lg">No criteria defined. Please add criteria in the Manage Criteria tab.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="text-center font-semibold mb-2">
        Please rate using 1 to 5 scale (1 = very small ... 5 = very big)
      </div>
      <table className="min-w-full border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 px-4 py-2 w-16">No.</th>
            <th className="border border-gray-300 px-4 py-2">Projects</th>
            {criteria.map(criterion => (
              <React.Fragment key={`header-${criterion.id}`}>
                <th className="border border-gray-300 px-4 py-2 w-24">Rating</th>
                <th className="border border-gray-300 px-4 py-2 w-28">Weighting</th>
              </React.Fragment>
            ))}
            <th className="border border-gray-300 px-4 py-2 w-36">Portfolio Score</th>
            <th className="border border-gray-300 px-4 py-2 w-36">Ranked Priority</th>
          </tr>
          <tr>
            <th colSpan={2} className="border border-gray-300"></th>
            {criteria.map(criterion => (
              <th colSpan={2} className="border border-gray-300 px-4 py-2 text-center" key={criterion.id}>
                {criterion.label}
                {criterion.isInverse && <span className="text-xs block">(Inverse)</span>}
              </th>
            ))}
            <th colSpan={2} className="border border-gray-300"></th>
          </tr>
        </thead>
        <tbody>
          {projectScores.map((project, index) => (
            <tr key={project.id}>
              <td className="border border-gray-300 px-4 py-2 text-center">{index + 1}</td>
              <td className="border border-gray-300 px-4 py-2">{project.name}</td>
              
              {criteria.map(criterion => (
                <React.Fragment key={`cell-${criterion.id}-${project.id}`}>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <select 
                      value={project[criterion.key] as number || 1}
                      onChange={(e) => handleRatingChange(project.id, criterion.key, Number(e.target.value))}
                      className="w-full p-1 text-center"
                    >
                      {[1, 2, 3, 4, 5].map(value => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center align-middle">
                    {index === 0 && (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={weights[criterion.key] || 0}
                        onChange={(e) => handleWeightChange(criterion.key, Number(e.target.value))}
                        className="w-16 p-1 text-center"
                      />
                    )}
                    {index === 0 && <span>%</span>}
                  </td>
                </React.Fragment>
              ))}
              
              {/* Portfolio Score and Rank */}
              <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                {project.portfolioScore.toFixed(2)}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                {project.rank}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {totalWeight !== 100 && (
        <div className="mt-4 text-red-500 font-semibold">
          Warning: Total weighting should equal 100%. Current total: {totalWeight}%
        </div>
      )}
    </div>
  );
};
