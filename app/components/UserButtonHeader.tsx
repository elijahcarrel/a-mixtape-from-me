'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UserButton } from '@stackframe/stack';
import UserButtonContainer from './layout/UserButtonContainer';
import { useTheme } from './ThemeProvider';

export default function UserButtonHeader() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  
  // Proper theme toggle that updates the theme context
  const handleColorModeToggle = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [theme, setTheme]);

  const extraItems = [
    {
      text: 'My Mixtapes',
      icon: <span role="img" aria-label="mixtapes">🎵</span>,
      onClick: () => router.push('/my-mixtapes'),
    },
  ];

  return (
    <UserButtonContainer>
      <UserButton
        showUserInfo={true}
        colorModeToggle={handleColorModeToggle}
        extraItems={extraItems}
      />
    </UserButtonContainer>
  );
} 