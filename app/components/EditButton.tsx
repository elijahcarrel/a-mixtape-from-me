import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { MixtapeResponse } from '../client';

interface EditButtonProps {
  mixtape: MixtapeResponse;
}

export default function EditButton({ mixtape }: EditButtonProps) {
  const { user } = useAuth({ requireAuth: false });
  const router = useRouter();

  if (!user || user.id !== mixtape.stack_auth_user_id) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => router.push(`/mixtape/${mixtape.public_id}/edit`)}
      className="fixed bottom-8 left-8 z-30 bg-amber-700 hover:bg-amber-800 text-white rounded-full shadow-lg px-8 py-4 flex items-center gap-2 text-lg font-semibold transition-all duration-200 active:scale-95"
      style={{boxShadow: '0 4px 24px #bfa76a33'}}
      data-testid="edit-button"
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="14" fill="#fff" fillOpacity="0.18" />
        <polygon points="18,8 8,14 18,20" fill="#fff" />
      </svg>
      <span>Edit</span>
    </button>
  );
} 