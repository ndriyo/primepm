import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface Criterion {
  id: string;
  key: string;
  label: string;
  description: string;
  isInverse: boolean;
  isDefault: boolean;
}

interface CriteriaContextType {
  criteria: Criterion[];
  addCriterion: (criterion: Omit<Criterion, 'id' | 'isDefault'>) => void;
  updateCriterion: (id: string, updates: Partial<Omit<Criterion, 'id' | 'isDefault'>>) => void;
  removeCriterion: (id: string) => boolean;
  getDefaultCriteria: () => Criterion[];
  resetToDefaultCriteria: () => void;
}

// Default criteria
const defaultCriteria: Criterion[] = [
  { id: 'c1', key: 'revenue', label: 'Revenue Impact', description: 'Potential revenue generation or savings', isInverse: false, isDefault: true },
  { id: 'c2', key: 'policyImpact', label: 'Policy Impact', description: 'Impact on organizational policies and strategies', isInverse: false, isDefault: true },
  { id: 'c3', key: 'budget', label: 'Budget', description: 'Required financial investment', isInverse: true, isDefault: true },
  { id: 'c4', key: 'resources', label: 'Resources', description: 'Required human and other resources', isInverse: true, isDefault: true },
  { id: 'c5', key: 'complexity', label: 'Complexity', description: 'Technical and implementation complexity', isInverse: true, isDefault: true },
];

// Local storage key
const STORAGE_KEY = 'prime-pm-criteria';

const CriteriaContext = createContext<CriteriaContextType | undefined>(undefined);

export const CriteriaProvider = ({ children }: { children: ReactNode }) => {
  const [criteria, setCriteria] = useState<Criterion[]>(() => {
    // Try to load from localStorage
    const savedCriteria = localStorage.getItem(STORAGE_KEY);
    return savedCriteria ? JSON.parse(savedCriteria) : defaultCriteria;
  });

  // Save to localStorage whenever criteria change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(criteria));
  }, [criteria]);

  const getDefaultCriteria = (): Criterion[] => {
    return defaultCriteria;
  };

  const generateId = (): string => {
    return `c${Date.now()}`;
  };

  const addCriterion = (criterion: Omit<Criterion, 'id' | 'isDefault'>) => {
    const newCriterion: Criterion = {
      ...criterion,
      id: generateId(),
      isDefault: false,
    };
    setCriteria([...criteria, newCriterion]);
  };

  const updateCriterion = (id: string, updates: Partial<Omit<Criterion, 'id' | 'isDefault'>>) => {
    setCriteria(
      criteria.map(criterion => 
        criterion.id === id ? { ...criterion, ...updates } : criterion
      )
    );
  };

  const removeCriterion = (id: string): boolean => {
    // Prevent removal of default criteria
    const criterionToRemove = criteria.find(c => c.id === id);
    if (!criterionToRemove || criterionToRemove.isDefault) {
      return false;
    }

    setCriteria(criteria.filter(criterion => criterion.id !== id));
    return true;
  };

  const resetToDefaultCriteria = () => {
    setCriteria(defaultCriteria);
  };

  return (
    <CriteriaContext.Provider
      value={{
        criteria,
        addCriterion,
        updateCriterion,
        removeCriterion,
        getDefaultCriteria,
        resetToDefaultCriteria,
      }}
    >
      {children}
    </CriteriaContext.Provider>
  );
};

export const useCriteria = (): CriteriaContextType => {
  const context = useContext(CriteriaContext);
  if (context === undefined) {
    throw new Error('useCriteria must be used within a CriteriaProvider');
  }
  return context;
};
