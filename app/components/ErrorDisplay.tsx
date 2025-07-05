import React from 'react';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  showLoginLink?: boolean;
}

export default function ErrorDisplay({ 
  title = "Error", 
  message, 
  showLoginLink = false 
}: ErrorDisplayProps) {
  return (
    <div className="flex flex-col items-center mt-8">
      <h1 className="text-2xl font-bold mb-4 text-red-600">{title}</h1>
      <p className="text-gray-600 mb-4">{message}</p>
      {showLoginLink && (
        <a href="/spotify/login" className="underline text-blue-600 hover:text-blue-800">
          Try logging in again
        </a>
      )}
    </div>
  );
} 