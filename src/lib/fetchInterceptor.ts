import { MockUser } from '@/app/contexts/AuthContext';

// Helper to add auth headers to fetch options
export function addAuthHeaders(options: RequestInit = {}, user: MockUser | null) {
  const newOptions = { ...options };
  
  if (!newOptions.headers) {
    newOptions.headers = {};
  }
  
  if (user) {
    // Add user and organization headers
    (newOptions.headers as Record<string, string>)['x-user-id'] = user.id;
    (newOptions.headers as Record<string, string>)['x-user-role'] = user.role;
    (newOptions.headers as Record<string, string>)['x-organization-id'] = user.organizationId;
    
    // Add department ID if available
    if (user.departmentId) {
      (newOptions.headers as Record<string, string>)['x-department-id'] = user.departmentId;
    }
  }
  
  return newOptions;
}

// Enhanced fetch with auth headers
export async function fetchWithAuth(url: string, options: RequestInit = {}, user: MockUser | null) {
  const authOptions = addAuthHeaders(options, user);
  return fetch(url, authOptions);
}
