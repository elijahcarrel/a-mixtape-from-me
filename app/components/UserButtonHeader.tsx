'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UserButton } from '@stackframe/stack';
import UserButtonContainer from './layout/UserButtonContainer';

export default function UserButtonHeader() {
  const router = useRouter();
  // Simple color mode toggle: toggles a value in localStorage and reloads the page
  const handleColorModeToggle = useCallback(() => {
    const current = localStorage.getItem('theme');
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    window.location.reload();
  }, []);

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