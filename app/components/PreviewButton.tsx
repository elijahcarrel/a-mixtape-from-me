import React from 'react';
import { useRouter } from 'next/navigation';
import { MixtapeResponse } from '../client';
import FloatingNavButton from './FloatingNavButton';

interface PreviewButtonProps {
  mixtape: MixtapeResponse;
}

export default function PreviewButton({ mixtape }: PreviewButtonProps) {
  const router = useRouter();
  return (
    <FloatingNavButton
      label="Preview"
      icon={
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="14" cy="14" r="13" stroke="#a16207" strokeWidth="2" fill="none" />
          <polyline points="11,8 18,14 11,20" fill="none" stroke="#a16207" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      }
      position="right"
      onClick={() => router.push(`/mixtape/${mixtape.public_id}`)}
      data-testid="preview-button"
    />
  );
} 