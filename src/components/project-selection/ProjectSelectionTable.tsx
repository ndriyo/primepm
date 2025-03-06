import { useState, useEffect } from 'react';
import { Project } from '../../data/projects';

interface ProjectRating {
  id: string;
  name: string;
  income: number;
  policyImpact: number;
  budget: number;
  resources: number;
  complexity: number;
}

interface ProjectScore extends ProjectRating {
  portfolioScore: number;
  rank: number;
}

interface ProjectSelectionTableProps {
  projects: Project[];
}

export const ProjectSelectionTable = ({ projects }: ProjectSelectionTableProps) => {
  const [weights, setWeights] = useState({
    income: 52,
    policyImpact: 23,
    budget: 15,
    resources: 7,
    complexity: 4,
  });

  const [projectRatings, setProjectRatings] = useState<ProjectRating[]>([]);
  const [projectScores, setProjectScores] = useState<ProjectScore[]>([]);

  useEffect(() => {
    // Initialize project ratings from the existing projects
    const initialRatings = projects.map(project => ({
      id: project.id,
      name: project.name,
      income: Math.min(5, Math.ceil(project.criteria.revenue / 2)), // Scale from 1-10 to 1-5
      policyImpact: Math.min(5, Math.ceil(project.criteria.policyImpact / 2)), // Scale from 1-10 to 1-5
      budget: Math.min(5, Math.ceil((11 - project.criteria.budget) / 2)), // Inverse and scale
      resources: Math.min(5, Math.ceil((11 - project.criteria.resources) / 2)), // Inverse and scale
      complexity: Math.min(5, Math.ceil((11 - project.criteria.complexity) / 2)), // Inverse and scale
    }));
    setProjectRatings(initialRatings);
  }, [projects]);

  useEffect(() => {
    // Calculate portfolio scores and ranks whenever ratings or weights change
    if (projectRatings.length === 0) return;

    const scores = projectRatings.map(project => {
      const score = 
        (project.income * weights.income / 100) +
        (project.policyImpact * weights.policyImpact / 100) +
        (project.budget * weights.budget / 100) +
        (project.resources * weights.resources / 100) +
        (project.complexity * weights.complexity / 100);
        
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
  }, [projectRatings, weights]);

  const handleRatingChange = (id: string, criterion: keyof ProjectRating, value: number) => {
    setProjectRatings(prev => 
      prev.map(project => 
        project.id === id ? { ...project, [criterion]: value } : project
      )
    );
  };

  const handleWeightChange = (criterion: keyof typeof weights, value: number) => {
    setWeights(prev => ({ ...prev, [criterion]: value }));
  };

  // Ensure the total of all weights equals 100%
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);

  return (
    <div className="overflow-x-auto">
      <div className="text-center font-semibold mb-2">
        Please rate using 1 to 5 scale (1 = very small ... 5 = very big)
      </div>
      <table className="min-w-full border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 px-4 py-2 w-16">No.</th>
            <th className="border border-gray-300 px-4 py-2">Description of Projects</th>
            <th className="border border-gray-300 px-4 py-2 w-24">Rating</th>
            <th className="border border-gray-300 px-4 py-2 w-28">Weighting</th>
            <th className="border border-gray-300 px-4 py-2 w-24">Rating</th>
            <th className="border border-gray-300 px-4 py-2 w-28">Weighting</th>
            <th className="border border-gray-300 px-4 py-2 w-24">Rating</th>
            <th className="border border-gray-300 px-4 py-2 w-28">Weighting</th>
            <th className="border border-gray-300 px-4 py-2 w-24">Rating</th>
            <th className="border border-gray-300 px-4 py-2 w-28">Weighting</th>
            <th className="border border-gray-300 px-4 py-2 w-24">Rating</th>
            <th className="border border-gray-300 px-4 py-2 w-28">Weighting</th>
            <th className="border border-gray-300 px-4 py-2 w-36">Portfolio Score</th>
            <th className="border border-gray-300 px-4 py-2 w-36">Ranked Priority</th>
          </tr>
          <tr>
            <th colSpan={2} className="border border-gray-300"></th>
            <th colSpan={2} className="border border-gray-300 px-4 py-2 text-center">Income</th>
            <th colSpan={2} className="border border-gray-300 px-4 py-2 text-center">Policy Impact</th>
            <th colSpan={2} className="border border-gray-300 px-4 py-2 text-center">Budget</th>
            <th colSpan={2} className="border border-gray-300 px-4 py-2 text-center">Resources</th>
            <th colSpan={2} className="border border-gray-300 px-4 py-2 text-center">Complexity</th>
            <th colSpan={2} className="border border-gray-300"></th>
          </tr>
        </thead>
        <tbody>
          {projectScores.map((project, index) => (
            <tr key={project.id}>
              <td className="border border-gray-300 px-4 py-2 text-center">{index + 1}</td>
              <td className="border border-gray-300 px-4 py-2">{project.name}</td>
              
              {/* Income */}
              <td className="border border-gray-300 px-4 py-2 text-center">
                <select 
                  value={project.income}
                  onChange={(e) => handleRatingChange(project.id, 'income', Number(e.target.value))}
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
                    value={weights.income}
                    onChange={(e) => handleWeightChange('income', Number(e.target.value))}
                    className="w-16 p-1 text-center"
                  />
                )}
                {index === 0 && <span>%</span>}
              </td>
              
              {/* Policy Impact */}
              <td className="border border-gray-300 px-4 py-2 text-center">
                <select 
                  value={project.policyImpact}
                  onChange={(e) => handleRatingChange(project.id, 'policyImpact', Number(e.target.value))}
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
                    value={weights.policyImpact}
                    onChange={(e) => handleWeightChange('policyImpact', Number(e.target.value))}
                    className="w-16 p-1 text-center"
                  />
                )}
                {index === 0 && <span>%</span>}
              </td>
              
              {/* Budget */}
              <td className="border border-gray-300 px-4 py-2 text-center">
                <select 
                  value={project.budget}
                  onChange={(e) => handleRatingChange(project.id, 'budget', Number(e.target.value))}
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
                    value={weights.budget}
                    onChange={(e) => handleWeightChange('budget', Number(e.target.value))}
                    className="w-16 p-1 text-center"
                  />
                )}
                {index === 0 && <span>%</span>}
              </td>
              
              {/* Resources */}
              <td className="border border-gray-300 px-4 py-2 text-center">
                <select 
                  value={project.resources}
                  onChange={(e) => handleRatingChange(project.id, 'resources', Number(e.target.value))}
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
                    value={weights.resources}
                    onChange={(e) => handleWeightChange('resources', Number(e.target.value))}
                    className="w-16 p-1 text-center"
                  />
                )}
                {index === 0 && <span>%</span>}
              </td>
              
              {/* Complexity */}
              <td className="border border-gray-300 px-4 py-2 text-center">
                <select 
                  value={project.complexity}
                  onChange={(e) => handleRatingChange(project.id, 'complexity', Number(e.target.value))}
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
                    value={weights.complexity}
                    onChange={(e) => handleWeightChange('complexity', Number(e.target.value))}
                    className="w-16 p-1 text-center"
                  />
                )}
                {index === 0 && <span>%</span>}
              </td>
              
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
