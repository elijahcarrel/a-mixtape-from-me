'use client';

import { StackTheme } from '@stackframe/stack';
import { useTheme } from './ThemeProvider';

interface DynamicThemeProps {
  theme: any;
  children: React.ReactNode;
}

export default function DynamicTheme({ theme, children }: DynamicThemeProps) {
  const { theme: currentTheme } = useTheme();
  
  // Select the appropriate theme variant based on current theme

  // TODO: reinstate this.
  // Currently, stack auth is mishandling theme toggling
  // at times (started a thread in discord at 
  // https://discord.com/channels/1215503771199864912/1215504021348032603/1408992634478788649).
  // To alleviate this somewhat, we're passing in the known
  // theme values for both light and dark, to force stack-auth's
  // hand. Unfortunately, it doesn't fix everything, because
  // stack auth still forces the text to be white in dark mode
  // regardless of the theme value.
  const selectedTheme = {
    ...theme,
    ...theme[currentTheme as keyof typeof theme]
  };


  // const selectedTheme = {
  //   ...theme[currentTheme as keyof typeof theme],
  //   dark: theme[currentTheme as keyof typeof theme],
  //   light: theme[currentTheme as keyof typeof theme],
  // };

  return (
    <StackTheme theme={selectedTheme}>
      {children}
    </StackTheme>
  );
} 