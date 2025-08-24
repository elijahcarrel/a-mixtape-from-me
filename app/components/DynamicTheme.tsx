'use client';

import { StackTheme } from '@stackframe/stack';
import { useThemeForStackAuth } from './ThemeProvider';

interface DynamicThemeProps {
  theme: any;
  children: React.ReactNode;
}

export default function DynamicTheme({ theme, children }: DynamicThemeProps) {
  const { theme: currentTheme } = useThemeForStackAuth();
  
  // Select the appropriate theme variant based on current theme.
  const selectedTheme = {
    ...theme,
    ...theme[currentTheme as keyof typeof theme]
  };

  return (
    <StackTheme theme={selectedTheme}>
      {children}
    </StackTheme>
  );
} 