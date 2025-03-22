'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define types for our mock users and organizations
export interface MockOrganization {
  id: string;
  name: string;
}

export interface MockUser {
  id: string;
  name: string;
  email: string;
  organizationId: string;
  departmentId?: string; // Added for role-based access control
  role: 'admin' | 'pmo' | 'management' | 'committee' | 'projectManager';
}

// Mock departments for our organizations
export interface MockDepartment {
  id: string;
  name: string;
  organizationId: string;
}

const MOCK_DEPARTMENTS: MockDepartment[] = [
  { id: '33333333-3333-3333-3333-333333333333', name: 'Information Technology', organizationId: '11111111-1111-1111-1111-111111111111' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Marketing', organizationId: '11111111-1111-1111-1111-111111111111' },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Operations', organizationId: '11111111-1111-1111-1111-111111111111' },
  { id: '66666666-6666-6666-6666-666666666666', name: 'Engineering', organizationId: '22222222-2222-2222-2222-222222222222' },
  { id: '77777777-7777-7777-7777-777777777777', name: 'Product', organizationId: '22222222-2222-2222-2222-222222222222' },
];

// Sample mock data
const MOCK_ORGANIZATIONS: MockOrganization[] = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Acme Corporation' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'TechInnovate' },
  // Add more as needed
];

const MOCK_USERS: MockUser[] = [
  { 
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
    name: 'Admin User', 
    email: 'admin@acme.com', 
    organizationId: '11111111-1111-1111-1111-111111111111',
    departmentId: '33333333-3333-3333-3333-333333333333',
    role: 'admin' 
  },
  { 
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', 
    name: 'PMO User', 
    email: 'pmo@acme.com', 
    organizationId: '11111111-1111-1111-1111-111111111111', 
    departmentId: '33333333-3333-3333-3333-333333333333',
    role: 'pmo' 
  },
  { 
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 
    name: 'IT Project Manager', 
    email: 'pm-it@acme.com', 
    organizationId: '11111111-1111-1111-1111-111111111111', 
    departmentId: '33333333-3333-3333-3333-333333333333',
    role: 'projectManager' 
  },
  {
    id: 'gggggggg-gggg-gggg-gggg-gggggggggggg',
    name: 'Operations Lead',
    email: 'ops@acme.com',
    organizationId: '11111111-1111-1111-1111-111111111111',
    departmentId: '55555555-5555-5555-5555-555555555555',
    role: 'projectManager'
  },
  { 
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', 
    name: 'Committee Member', 
    email: 'committee@acme.com', 
    organizationId: '11111111-1111-1111-1111-111111111111', 
    departmentId: '44444444-4444-4444-4444-444444444444',
    role: 'committee' 
  },
  {
    id: 'mgmt-1',
    name: 'Management User',
    email: 'management@acme.com',
    organizationId: '11111111-1111-1111-1111-111111111111',
    departmentId: '44444444-4444-4444-4444-444444444444',
    role: 'management'
  },
  { 
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 
    name: 'Owner', 
    email: 'owner@techinnovate.com', 
    organizationId: '22222222-2222-2222-2222-222222222222', 
    departmentId: '66666666-6666-6666-6666-666666666666',
    role: 'admin' 
  },
  {
    id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    name: 'Product Lead',
    email: 'product@techinnovate.com',
    organizationId: '22222222-2222-2222-2222-222222222222',
    departmentId: '77777777-7777-7777-7777-777777777777',
    role: 'projectManager'
  }
];

interface AuthContextType {
  isAuthenticated: boolean;
  user: MockUser | null;
  organization: MockOrganization | null;
  organizations: MockOrganization[];
  departments: MockDepartment[];
  users: MockUser[];
  login: (userId: string) => void;
  switchOrganization: (orgId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [organization, setOrganization] = useState<MockOrganization | null>(null);
  
  // Auto-login on development
  useEffect(() => {
    // Default to first user if none selected
    if (!user && MOCK_USERS.length > 0) {
      const defaultUser = MOCK_USERS[0];
      setUser(defaultUser);
      
      // Set organization based on user
      const userOrg = MOCK_ORGANIZATIONS.find(org => org.id === defaultUser.organizationId);
      if (userOrg) setOrganization(userOrg);
    }
  }, [user]);
  
  const login = (userId: string) => {
    const selectedUser = MOCK_USERS.find(u => u.id === userId);
    if (selectedUser) {
      setUser(selectedUser);
      
      // Set organization based on selected user
      const userOrg = MOCK_ORGANIZATIONS.find(org => org.id === selectedUser.organizationId);
      if (userOrg) setOrganization(userOrg);
    }
  };
  
  const switchOrganization = (orgId: string) => {
    const selectedOrg = MOCK_ORGANIZATIONS.find(org => org.id === orgId);
    if (selectedOrg) {
      setOrganization(selectedOrg);
      
      // If current user isn't in this org, switch to a user who is
      if (user && user.organizationId !== orgId) {
        const orgUser = MOCK_USERS.find(u => u.organizationId === orgId);
        if (orgUser) setUser(orgUser);
      }
    }
  };
  
  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!user,
      user,
      organization,
      organizations: MOCK_ORGANIZATIONS,
      departments: MOCK_DEPARTMENTS,
      users: MOCK_USERS,
      login,
      switchOrganization
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for consuming the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
