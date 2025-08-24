'use client';
import { StackTheme } from '@stackframe/stack';
import { useTheme } from './ThemeProvider';

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

type Props = {
  children: React.ReactNode;
};
export default function StackThemeContainer({ children }: Props) {
  const { theme } = useTheme();

  // Select the appropriate stack-auth theme variant based on current theme.
  const selectedStackAuthTheme = {
    ...stackThemeConfig,
    ...stackThemeConfig[theme],
  };

  return <StackTheme theme={selectedStackAuthTheme}>{children}</StackTheme>;
}
