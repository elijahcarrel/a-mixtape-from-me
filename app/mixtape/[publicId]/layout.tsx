'use client';

import React, { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';

import LoadingDisplay from '@/components/layout/LoadingDisplay';
import ErrorDisplay from '@/components/layout/ErrorDisplay';
import MainContainer from '@/components/layout/MainContainer';
import ContentPane from '@/components/layout/ContentPane';
import { useApiRequest } from '@/hooks/useApiRequest';
import { MixtapeResponse } from '@/client';
import { MixtapeContext } from '../MixtapeContext';
import { useMixtapeCreate } from '../layout';

interface MixtapeLayoutProps {
  children: React.ReactNode;
}

export default function MixtapeLayout({ children }: MixtapeLayoutProps) {
  const params = useParams();
  const publicId = params.publicId as string;
  const isCreateMode = publicId === 'new';

  // Get create context from higher-level provider
  const { createdMixtape, isCreating, didCreate, createError } =
    useMixtapeCreate();
  // TODO: we probably don't need all three of these variables. Figure out if we can simplify.
  const isOrWasCreating = isCreateMode || isCreating || didCreate;
  const createdMixtapeIfApplicable = isOrWasCreating ? createdMixtape : null;

  // Local state to track mixtape updates from editor (for optimistic updates)
  const [localMixtape, setLocalMixtape] = useState<MixtapeResponse | null>(
    null
  );

  // Fetch existing mixtape from server (skip if create mode or we have a created mixtape)
  const {
    data: mixtape,
    loading,
    error,
    refetch,
  } = useApiRequest<MixtapeResponse>({
    url: `/api/mixtape/${publicId}`,
    method: 'GET',
    skip: isCreateMode || isCreating || !!createdMixtape,
  });

  // Determine which mixtape to use (priority: local updates > just-created mixtape from POST request > loaded server data from GET request)
  const currentMixtape = localMixtape || createdMixtapeIfApplicable || mixtape;

  // Handle updates from the editor (save, undo, redo)
  const handleMixtapeUpdate = useCallback((updatedMixtape: MixtapeResponse) => {
    setLocalMixtape(updatedMixtape);
  }, []);

  const handleRefetch = useCallback(async () => {
    await refetch();
    // TODO: there may be a race condition here. If the user has continued to edit the local state while refetching is occurring, we should not clear the local it.
    setLocalMixtape(null); // Clear local state after fetching fresh data
  }, [refetch]);

  // Loading state - only show loading if we don't have any mixtape data
  const isLoading = !currentMixtape && loading;
  if (isLoading) {
    return <LoadingDisplay message="Loading mixtape..." />;
  }

  // Error state
  if (createError || error || !currentMixtape) {
    return (
      <MainContainer>
        <ContentPane>
          <ErrorDisplay
            message={(createError || error) ?? 'Mixtape not found'}
          />
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
    <MixtapeContext.Provider
      value={{
        mixtape: currentMixtape,
        refetch: handleRefetch,
        onMixtapeUpdated: handleMixtapeUpdate,
      }}
    >
      {children}
    </MixtapeContext.Provider>
  );
}
