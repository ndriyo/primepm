import { useEffect, useState } from 'react';

const STORAGE_KEY = 'pp-theme';
type Theme = 'light' | 'dark';

function readInitial(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch {
    // ignore
  }
  return 'dark'; // dark by default per design
}

// Apply theme attribute as early as possible to avoid FOUC.
export function bootstrapTheme(): void {
  const t = readInitial();
  document.documentElement.setAttribute('data-theme', t);
}

export function useTheme(): { theme: Theme; toggle: () => void; setTheme: (t: Theme) => void } {
  const [theme, setThemeState] = useState<Theme>(() => readInitial());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  return {
    theme,
    setTheme: setThemeState,
    toggle: () => setThemeState(t => (t === 'dark' ? 'light' : 'dark')),
  };
}
