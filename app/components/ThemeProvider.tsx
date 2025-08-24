'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import usePrefersScheme from '../hooks/usePrefersScheme';

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

const updateTailwindTheme = (newTheme: Theme) => {
  // Apply theme to document using Tailwind's expected dark class
  const root = document.documentElement;
  root.classList.remove('dark');
  if (newTheme === 'dark') {
    root.classList.add('dark');
  }
};

const updateStackTheme = (newTheme: Theme) => {
  // TODO: this is a hack to work around a bug in stack-auth
  // where it doesn't update the theme when the user toggles
  // the theme.
  // https://discord.com/channels/1215503771199864912/1215504021348032603/1408992634478788649.
  // We should remove this once stack-auth is fixed.
  const styleEl = document.head.querySelector('style#--stack-theme-mode');

  if (styleEl) {
    // Update the attribute value
    styleEl.setAttribute('data-stack-theme', newTheme);
  }
};

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const preferredScheme = usePrefersScheme();
  const [theme, setTheme] = useState<Theme>(preferredScheme as Theme);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    updateTailwindTheme(newTheme);
    updateStackTheme(newTheme);
  };

  // Update the theme on mount.
  useEffect(() => {
    updateTailwindTheme(theme);
    updateStackTheme(theme);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // If the user changes their preferred scheme (i.e. they toggle dark mode in their system settings), update the theme.
  useEffect(() => {
    handleSetTheme(preferredScheme as Theme);
  }, [preferredScheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
