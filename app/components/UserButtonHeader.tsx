'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserButton } from '@stackframe/stack';
import UserButtonContainer from './layout/UserButtonContainer';
import { useTheme } from './ThemeProvider';

// Custom hook to track window width
function useWindowWidth() {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowWidth;
}

export default function UserButtonHeader() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const windowWidth = useWindowWidth();
  
  // Show user info only on screens wider than 640px (sm breakpoint)
  const showUserInfo = windowWidth > 640;
  
  // Proper theme toggle that updates the theme context
  const handleColorModeToggle = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    console.log('theme', theme);
    console.log('next', next);
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
        showUserInfo={showUserInfo}
        colorModeToggle={handleColorModeToggle}
        extraItems={extraItems}
      />
    </UserButtonContainer>
  );
} 