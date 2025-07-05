import React from 'react';

interface LoadingDisplayProps {
  message?: string;
}

export default function LoadingDisplay({ message = "Loading..." }: LoadingDisplayProps) {
  return (
    <div className="flex flex-col items-center mt-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
      <h1 className="text-2xl font-bold mb-4">{message}</h1>
    </div>
  );
} 