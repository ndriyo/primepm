'use client';

import { BentoMetrics } from '@/app/dashboard/components/BentoMetrics';
import { ScoreQuadrantChart } from '@/app/dashboard/components/ScoreQuadrantChart';
import { StatusChart } from '@/app/dashboard/components/StatusChart';
import { TopProjects } from '@/app/dashboard/components/TopProjects';
import { useRouter } from 'next/navigation';

export const Dashboard = () => {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex space-x-2">
          <button 
            className="btn btn-primary"
            onClick={() => router.push('/projects/new')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Project
          </button>
        </div>
      </div>

      <BentoMetrics />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusChart />
        <ScoreQuadrantChart />
      </div>

      <TopProjects />
    </div>
  );
};
