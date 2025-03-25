'use client';

import { useAuth } from '@/app/_contexts/AuthContext';
import { useProjects } from '@/app/_contexts/ProjectContext';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export default function DevAuthSwitcher() {
  const { user, users, organizations, login, switchOrganization } = useAuth();
  const { refreshProjects, setSelectedProject } = useProjects();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  
  // Function to invalidate all queries and refresh data
  const refreshAllData = () => {
    // Invalidate all queries to ensure fresh data
    queryClient.removeQueries();
    
    // Refresh projects data from ProjectContext
    refreshProjects();
    
    // Force a hard reload of the page to ensure all contexts are refreshed
    // This is the most reliable way to ensure all data is refreshed
    window.location.href = window.location.href;
  };
  
  // Custom login handler that also refreshes all data
  const handleLogin = (userId: string) => {
    // Store the user ID in localStorage to persist through reload
    localStorage.setItem('lastSelectedUserId', userId);
    
    // Login and clear selected project
    login(userId);
    setSelectedProject(null);
    
    // Refresh all data
    refreshAllData();
  };
  
  // Custom organization switch handler
  const handleOrgSwitch = (orgId: string) => {
    // Store the org ID in localStorage to persist through reload
    localStorage.setItem('lastSelectedOrgId', orgId);
    
    // Switch organization and clear selected project
    switchOrganization(orgId);
    setSelectedProject(null);
    
    // Refresh all data
    refreshAllData();
  };
  
  // Only show in development
  // if (process.env.NODE_ENV === 'production') {
  //   return null;
  // }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button 
        className="bg-yellow-500 text-black px-3 py-1 rounded-md font-medium text-sm flex items-center gap-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? 'Close' : (
          <>
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
            Dev Auth
          </>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute bottom-10 right-0 bg-white shadow-lg rounded-md p-4 w-64 border border-gray-300">
          <h3 className="font-bold mb-2">Current User</h3>
          <div className="mb-3 text-sm bg-blue-50 p-2 rounded">
            {user ? (
              <>
                <div className="font-semibold">{user.name}</div>
                <div className="text-xs text-gray-600">{user.email}</div>
                <div className="text-xs mt-1 px-2 py-0.5 bg-blue-100 rounded-full inline-block">
                  {user.role}
                </div>
              </>
            ) : (
              <div className="text-red-500">Not logged in</div>
            )}
          </div>
          
          <h3 className="font-bold mb-2">Organization</h3>
          <div className="mb-3">
            {organizations.map(org => (
              <div 
                key={org.id}
                className={`py-1 px-2 text-sm cursor-pointer rounded ${
                  user?.organizationId === org.id ? 'bg-blue-100 font-medium' : 'hover:bg-gray-100'
                }`}
                onClick={() => handleOrgSwitch(org.id)}
              >
                {org.name}
              </div>
            ))}
          </div>
          
          <h3 className="font-bold mb-2">Switch User</h3>
          <div className="mb-3 max-h-48 overflow-y-auto">
            {users.map(u => (
              <div 
                key={u.id}
                className={`py-1 px-2 text-sm cursor-pointer rounded flex items-center justify-between ${
                  user?.id === u.id ? 'bg-blue-100 font-medium' : 'hover:bg-gray-100'
                }`}
                onClick={() => handleLogin(u.id)}
              >
                <span>{u.name}</span>
                <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">
                  {u.role}
                </span>
              </div>
            ))}
          </div>
          
          <div className="text-xs text-gray-500 mt-2 border-t pt-2">
            Dev mode only - Authentication mocked for testing
          </div>
        </div>
      )}
    </div>
  );
}
