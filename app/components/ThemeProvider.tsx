'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import usePrefersScheme from '../hooks/usePrefersScheme';
import { StackTheme } from '@stackframe/stack';

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
  console.log('root.classList before', root.classList);
  console.log('removing dark class');
  root.classList.remove('dark');
  if (newTheme === 'dark') {
    console.log('adding dark class');
    root.classList.add('dark');
  }
  console.log('root.classList', root.classList);
}  

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
}

// Custom theme matching the vintage, sepia aesthetic, in the format expected by StackAuth.
const stackThemeConfig = {
  light: {
    primary: '#D4C4B0',
    primaryForeground: '#2D2D2D',
    // TODO: consider adding secondary and secondaryForeground.
    background: '#F4EDE4',
    foreground: '#2D2D2D',
    card: '#F4EDE4',
    cardForeground: '#2D2D2D',
    popover: '#F4EDE4',
    popoverForeground: '#2D2D2D',
    muted: '#E8DCC8',
    mutedForeground: '#5A5A5A',
    accent: '#D4C4B0',
    accentForeground: '#2D2D2D',
    destructive: '#D32F2F',
    destructiveForeground: '#FFFFFF',
    border: '#D4C4B0',
    input: '#F4EDE4',
    ring: '#D4C4B0',
  },
  dark: {
    primary: '#8B7355',
    primaryForeground: '#F4EDE4',
    // TODO: consider adding secondary and secondaryForeground.
    background: '#1A1A1A',
    foreground: '#F4EDE4',
    card: '#2D2D2D',
    cardForeground: '#F4EDE4',
    popover: '#2D2D2D',
    popoverForeground: '#F4EDE4',
    muted: '#404040',
    mutedForeground: '#B8B8B8',
    accent: '#8B7355',
    accentForeground: '#F4EDE4',
    destructive: '#D32F2F',
    destructiveForeground: '#FFFFFF',
    border: '#404040',
    input: '#2D2D2D',
    ring: '#8B7355',
  },
  radius: '0.75rem',
};

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
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
  }, []);

  // If the user changes their preferred scheme (i.e. they toggle dark mode in their system settings), update the theme.
  useEffect(() => {
    handleSetTheme(preferredScheme as Theme);
  }, [preferredScheme]);

  // Select the appropriate stack-auth theme variant based on current theme.
  const selectedStackAuthTheme = {
    ...stackThemeConfig,
    ...stackThemeConfig[theme]
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      <StackTheme theme={selectedStackAuthTheme}>
        {children}
      </StackTheme>
    </ThemeContext.Provider>
  );
}
