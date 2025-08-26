import React from 'react';
import CenteredPane from './layout/CenteredPane';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  showLoginLink?: boolean;
}

export default function ErrorDisplay({
  title = 'Error',
  message,
  showLoginLink = false,
}: ErrorDisplayProps) {
  return (
    <CenteredPane>
      <h1 className="text-2xl font-bold mb-4 text-red-600">{title}</h1>
      <p className="text-gray-600 mb-4">{message}</p>
      {showLoginLink && (
        <a
          href="/auth/login"
          className="underline text-blue-600 hover:text-blue-800"
        >
          Try logging in again
        </a>
      )}
    </CenteredPane>
  );
}
