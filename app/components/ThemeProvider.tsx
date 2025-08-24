'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Get theme from localStorage on mount
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setTheme(savedTheme);
    } else {
      // Default to light theme
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    // Apply theme to document using Tailwind's expected dark class
    const root = document.documentElement;
    root.classList.remove('dark');
    if (theme === 'dark') {
      root.classList.add('dark');
    }
  }, [theme]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);

    // TODO: this is a hack to work around a bug in stack-auth
    // where it doesn't update the theme when the user toggles
    // the theme.
    // https://discord.com/channels/1215503771199864912/1215504021348032603/1408992634478788649.
    // We should remove this once stack-auth is fixed.
    const styleEl = document.head.querySelector('style#--stack-theme-mode[data-stack-theme="dark"]');

    if (styleEl) {
      // Update the attribute value
      styleEl.setAttribute('data-stack-theme', newTheme);
    }

    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
} 