import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { MixtapeResponse } from '../client';
import FloatingNavButton from './FloatingNavButton';

interface EditButtonProps {
  mixtape: MixtapeResponse;
}

export default function EditButton({ mixtape }: EditButtonProps) {
  const { user } = useAuth({ requireAuth: false });
  const router = useRouter();

  // Only show the "Edit" button on a mixtape if the user who owns
  // the mixtape is viewing it.
  if (!user || user.id !== mixtape.stack_auth_user_id) {
    return null;
  }

  return (
    <FloatingNavButton
      label="Edit"
      icon={
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="14" cy="14" r="13" stroke="#a16207" strokeWidth="2" fill="none" />
          <polyline points="17,8 10,14 17,20" fill="none" stroke="#a16207" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      }
      position="left"
      onClick={() => router.push(`/mixtape/${mixtape.public_id}/edit`)}
      data-testid="edit-button"
    />
  );
} 