"use client";

import React, { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';

import LoadingDisplay from '../../components/LoadingDisplay';
import ErrorDisplay from '../../components/ErrorDisplay';
import MainContainer from '../../components/layout/MainContainer';
import ContentPane from '../../components/layout/ContentPane';
import { useApiRequest } from '../../hooks/useApiRequest';
import { MixtapeResponse } from '../../client';
import { MixtapeContext } from '../MixtapeContext';

interface MixtapeLayoutProps {
  children: React.ReactNode;
}

export default function MixtapeLayout({ children }: MixtapeLayoutProps) {
  const params = useParams();
  const publicId = params.publicId as string;

  const {
    data: mixtape,
    loading,
    error,
    refetch,
  } = useApiRequest<MixtapeResponse>({
    url: `/api/mixtape/${publicId}`,
    method: 'GET',
  });

  // Local state to track mixtape updates from editor
  const [localMixtape, setLocalMixtape] = useState<MixtapeResponse | null>(null);

  // Use local state if available, otherwise use API response
  const currentMixtape = localMixtape || mixtape;

  // Handle updates from the editor (save, undo, redo)
  const handleMixtapeUpdate = useCallback((updatedMixtape: MixtapeResponse) => {
    setLocalMixtape(updatedMixtape);
  }, []);

  // Reset local state when refetching from server
  const handleRefetch = useCallback(async () => {
    setLocalMixtape(null);
    await refetch();
  }, [refetch]);

  if (loading) {
    return <LoadingDisplay message="Loading mixtape..." />;
  }

  if (error || !currentMixtape) {
    return (
      <MainContainer>
        <ContentPane>
          <ErrorDisplay message={error ?? 'Mixtape not found'} />
          <div className="text-center mt-4">
            <button
              onClick={handleRefetch}
              className="bg-amber-800 text-white px-4 py-2 rounded hover:bg-amber-700"
            >
              Try Again
            </button>
          </div>
        </ContentPane>
      </MainContainer>
    );
  }

  return (
    <MixtapeContext.Provider value={{ mixtape: currentMixtape, refetch: handleRefetch }}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { onMixtapeUpdated: handleMixtapeUpdate } as any);
        }
        return child;
      })}
    </MixtapeContext.Provider>
  );
}