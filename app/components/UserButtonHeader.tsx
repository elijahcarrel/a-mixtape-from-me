'use client';

import { useCallback } from 'react';
import { UserButton } from '@stackframe/stack';

export default function UserButtonHeader() {
  // Simple color mode toggle: toggles a value in localStorage and reloads the page
  const handleColorModeToggle = useCallback(() => {
    const current = localStorage.getItem('theme');
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    window.location.reload();
  }, []);

  return (
    <div className="user-button-container">
      <UserButton
        showUserInfo={true}
        colorModeToggle={handleColorModeToggle}
      />
    </div>
  );
} 