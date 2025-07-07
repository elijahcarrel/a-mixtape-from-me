'use client';

import { useCallback } from 'react';
import { UserButton } from '@stackframe/stack';
import UserButtonContainer from './layout/UserButtonContainer';

export default function UserButtonHeader() {
  // Simple color mode toggle: toggles a value in localStorage and reloads the page
  const handleColorModeToggle = useCallback(() => {
    const current = localStorage.getItem('theme');
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    window.location.reload();
  }, []);

  return (
    <UserButtonContainer>
      <UserButton
        showUserInfo={true}
        colorModeToggle={handleColorModeToggle}
      />
    </UserButtonContainer>
  );
} 