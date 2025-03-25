import { useState, useEffect } from 'react';
import { Project } from '@/src/data/projects';
import { useCriteria } from '@/app/_contexts/CriteriaContext';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { LoadingWrapper } from '@/app/_components/ui/LoadingWrapper';
import { SkeletonTable } from '@/app/_components/ui/skeleton';
import { SkeletonElement } from '@/app/_components/ui/skeleton';

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
  onSelectProject?: (project: Project) => void;
  loading?: boolean;
}

export const ProjectSelectionTable = ({ 
  projects, 
  onSelectProject,
  loading = false
}: ProjectSelectionTableProps) => {
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

  // Custom skeleton for the criteria weights section
  const CriteriaWeightsSkeleton = () => (
    <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
      <div className="flex items-center mb-4">
        <SkeletonElement className="h-7 w-48" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col">
            <SkeletonElement className="h-6 w-24 mb-2" />
            <div className="flex items-center">
              <SkeletonElement className="h-10 w-full" rounded="rounded-md" />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4">
        <SkeletonElement className="h-6 w-32" />
      </div>
    </div>
  );
  
  return (
    <LoadingWrapper
      isLoading={loading}
      skeleton={
        <div className="overflow-x-auto space-y-8 font-sans">
          <CriteriaWeightsSkeleton />
          <div>
            <div className="text-center mb-4">
              <SkeletonElement className="h-6 w-96 mx-auto" />
            </div>
            <SkeletonTable 
              rows={8} 
              columns={criteria.length > 0 ? criteria.length + 3 : 7} 
              showHeader={true} 
            />
          </div>
        </div>
      }
    >
      <div className="overflow-x-auto space-y-8 font-sans">
        {/* Criteria Weights Section */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            <h2 className="text-xl font-semibold">Criteria Weights</h2>
            <div className="ml-2 text-gray-500 cursor-help relative">
              <QuestionMarkCircleIcon className="h-5 w-5" title="Set weights for each criterion. Total should equal 100%" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {criteria.map(criterion => (
              <div key={criterion.id} className="flex flex-col">
                <label 
                  className="text-sm font-medium mb-2 flex items-center"
                  title={criterion.description || ""}
                >
                  {criterion.label}
                  {criterion.isInverse && <span className="text-xs ml-1">(Inverse)</span>}
                  <div className="ml-1 group relative inline-block">
                    <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    <span className="hidden group-hover:block absolute z-10 bg-black text-white text-xs rounded px-2 py-1 w-48 -left-20 top-6">
                      {criterion.description || `${criterion.label} criterion`}
                      {criterion.isInverse && " (Lower values are better)"}
                    </span>
                  </div>
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={weights[criterion.key] || 0}
                    onChange={(e) => handleWeightChange(criterion.key, Number(e.target.value))}
                    className="w-full p-2 text-center border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="ml-2">%</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex items-center">
            <div className={`font-medium ${totalWeight === 100 ? 'text-green-600' : 'text-red-500'}`}>
              Total Weight: {totalWeight}%
            </div>
            {totalWeight !== 100 && (
              <div className="ml-2 text-red-500 text-sm">
                (Should equal 100%)
              </div>
            )}
          </div>
        </div>

        {/* Project Rating Section */}
        <div>
          <div className="text-center font-medium mb-4 text-gray-700">
            Please rate using 1 to 5 scale (1 = very small ... 5 = very big)
          </div>
          
          <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">No.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projects</th>
                  {criteria.map(criterion => (
                    <th key={criterion.id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative">
                      {criterion.label}
                      <div className="group relative inline-block ml-1">
                        <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 inline-block" />
                        <span className="hidden group-hover:block absolute z-10 bg-black text-white text-xs rounded px-2 py-1 w-48 -left-20 top-6">
                          {criterion.description || `Impact on ${criterion.label}`}
                          {criterion.isInverse && " (Lower values are better)"}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Portfolio Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Rank</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projectScores.map((project, index) => (
                  <tr 
                    key={project.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => onSelectProject && onSelectProject(projects.find(p => p.id === project.id)!)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{project.name}</td>
                    
                    {criteria.map(criterion => (
                      <td key={`cell-${criterion.id}-${project.id}`} className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        <input 
                          type="text"
                          value={project[criterion.key] as number || 1}
                          onChange={(e) => handleRatingChange(project.id, criterion.key, Number(e.target.value))}
                          className="w-16 p-2 text-center border border-gray-200 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                    ))}
                    
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">
                      {project.portfolioScore.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full 
                        ${project.rank === 1 ? 'bg-green-100 text-green-800' : 
                         project.rank === 2 ? 'bg-green-50 text-green-600' : 
                         project.rank === 3 ? 'bg-yellow-100 text-yellow-800' : 
                         project.rank === 4 ? 'bg-yellow-50 text-yellow-600' : 
                        'bg-red-100 text-red-800'}`}>
                        {project.rank}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-2 text-xs text-gray-500">
            * Portfolio Score is calculated based on the weighted average of all criteria
          </div>
        </div>
      </div>
    </LoadingWrapper>
  );
};
