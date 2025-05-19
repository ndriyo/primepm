'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react'; // Add useCallback

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
  { id: '441877f5-5cd0-451d-a40c-d5c99b7ba7bc', name: 'Information Technology', organizationId: 'a132be75-295a-4db7-a146-fa19631cfee7'},
  { id: '5821f483-77ff-4e77-8098-3f8d95fe3f3f', name: 'Marketing and Communications', organizationId: 'a132be75-295a-4db7-a146-fa19631cfee7'},
  { id: 'df6b227b-b142-474f-8129-0ee90c3da200', name: 'Business Operations', organizationId: 'a132be75-295a-4db7-a146-fa19631cfee7'},
  { id: 'c8b62fc6-11a9-461d-aab4-ce17e21c51a5', name: 'Infrastructure Department', organizationId: 'a132be75-295a-4db7-a146-fa19631cfee7'},
  { id: 'e3d9f9f1-a5a8-4af9-87a6-2fe881fcadb6', name: 'Research & Development', organizationId: 'a132be75-295a-4db7-a146-fa19631cfee7'}  
];

// Sample mock data
const MOCK_ORGANIZATIONS: MockOrganization[] = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Acme Corporation' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'TechInnovate' },
  { id: 'a132be75-295a-4db7-a146-fa19631cfee7', name: 'PrimePM' },
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
  },
  {
    id: '2f734529-4c00-451a-8274-7df4d1d2c982',
    name: 'Mohammad Ichsan - PMO',
    email: 'mohammad.ichsan@binus.ac.id',
    organizationId: 'a132be75-295a-4db7-a146-fa19631cfee7',
    departmentId: 'df6b227b-b142-474f-8129-0ee90c3da200',
    role: 'pmo'
  },
  {
    id: '1cf8ed7a-fe1c-458d-ae81-d8b77b53a155',
    name: 'Athar Januar - PM',
    email: 'athar.januar@gmail.com',
    organizationId: 'a132be75-295a-4db7-a146-fa19631cfee7',
    departmentId: '441877f5-5cd0-451d-a40c-d5c99b7ba7bc',
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
    // Check if there's a stored user ID in localStorage
    const storedUserId = localStorage.getItem('lastSelectedUserId');
    
    if (!user) {
      let selectedUser;
      
      if (storedUserId) {
        // Try to find the stored user
        selectedUser = MOCK_USERS.find(u => u.id === storedUserId);
      }
      
      // If no stored user or stored user not found, default to first user
      if (!selectedUser && MOCK_USERS.length > 0) {
        selectedUser = MOCK_USERS[0];
      }
      
      if (selectedUser) {
        setUser(selectedUser);
        
        // Check if there's a stored org ID
        const storedOrgId = localStorage.getItem('lastSelectedOrgId');
        let selectedOrg;
        
        if (storedOrgId) {
          // Try to find the stored org
          selectedOrg = MOCK_ORGANIZATIONS.find(org => org.id === storedOrgId);
          
          // Only use the stored org if it matches the user's org
          if (selectedOrg && selectedOrg.id !== selectedUser.organizationId) {
            selectedOrg = null;
          }
        }
        
        // If no valid stored org, use the user's org
        if (!selectedOrg) {
          selectedOrg = MOCK_ORGANIZATIONS.find(org => org.id === selectedUser.organizationId);
        }
        
        if (selectedOrg) {
          setOrganization(selectedOrg);
        }
      }
    }
  }, [user]);
  
  const login = useCallback((userId: string) => {
    const selectedUser = MOCK_USERS.find(u => u.id === userId);
    if (selectedUser) {
      // Store the user ID in localStorage
      localStorage.setItem('lastSelectedUserId', userId);
      
      setUser(selectedUser);
      
      // Set organization based on selected user
      const userOrg = MOCK_ORGANIZATIONS.find(org => org.id === selectedUser.organizationId);
      if (userOrg) {
        // Store the org ID in localStorage
        localStorage.setItem('lastSelectedOrgId', userOrg.id);
        
        setOrganization(userOrg);
      }
    }
  }, []); // setUser and setOrganization are stable, MOCK_ constants are module scope
  
  const switchOrganization = useCallback((orgId: string) => {
    const selectedOrg = MOCK_ORGANIZATIONS.find(org => org.id === orgId);
    if (selectedOrg) {
      // Store the org ID in localStorage
      localStorage.setItem('lastSelectedOrgId', orgId);
      
      setOrganization(selectedOrg);
      
      // If current user isn't in this org, switch to a user who is
      if (user && user.organizationId !== orgId) {
        const orgUser = MOCK_USERS.find(u => u.organizationId === orgId);
        if (orgUser) {
          // Store the user ID in localStorage
          localStorage.setItem('lastSelectedUserId', orgUser.id);
          
          setUser(orgUser);
        }
      }
    }
  }, [user]); // Depends on user state for the conditional logic
  
  const contextValue = useMemo(() => ({
    isAuthenticated: !!user,
    user,
    organization,
    organizations: MOCK_ORGANIZATIONS,
    departments: MOCK_DEPARTMENTS,
    users: MOCK_USERS,
    login,
    switchOrganization
  }), [user, organization, login, switchOrganization]); // Added login and switchOrganization
  
  return (
    <AuthContext.Provider value={contextValue}>
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
