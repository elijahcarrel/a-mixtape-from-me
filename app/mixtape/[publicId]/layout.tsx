'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

import LoadingDisplay from '@/components/layout/LoadingDisplay';
import ErrorDisplay from '@/components/layout/ErrorDisplay';
import MainContainer from '@/components/layout/MainContainer';
import ContentPane from '@/components/layout/ContentPane';
import { useApiRequest } from '@/hooks/useApiRequest';
import { useAuth } from '@/hooks/useAuth';
import { MixtapeResponse } from '@/client';
import { MixtapeContext } from '../MixtapeContext';

interface MixtapeLayoutProps {
  children: React.ReactNode;
}

export default function MixtapeLayout({ children }: MixtapeLayoutProps) {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const publicId = params.publicId as string;
  const isCreateMode = searchParams.get('create') === 'true';
  const { isAuthenticated } = useAuth({ requireAuth: false });

  // Create initial mixtape object for create mode
  const initialMixtape: MixtapeResponse | null = isCreateMode ? {
    public_id: publicId,
    name: 'Untitled Mixtape',
    intro_text: null,
    subtitle1: null,
    subtitle2: null,
    subtitle3: null,
    is_public: !isAuthenticated, // Default to private if authenticated, public if not
    create_time: new Date().toISOString(),
    last_modified_time: new Date().toISOString(),
    stack_auth_user_id: null, // Will be set by server
    version: 1,
    can_undo: false,
    can_redo: false,
    spotify_playlist_url: null,
    tracks: [],
  } : null;

  // Local state to track mixtape updates from editor
  const [localMixtape, setLocalMixtape] = useState<MixtapeResponse | null>(
    null
  );
  
  // State for create mode
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdMixtape, setCreatedMixtape] = useState<MixtapeResponse | null>(null);

  // Always call the hook but we'll handle the logic conditionally
  const getRequest = useApiRequest<MixtapeResponse>({
    url: `/api/mixtape/${publicId}`,
    method: 'GET',
  });

  // Handle create mode with useEffect
  useEffect(() => {
    if (isCreateMode && !createdMixtape && !createError) {
      // Immediately remove the ?create=true parameter
      const newUrl = `/mixtape/${publicId}/edit`;
      router.replace(newUrl, { scroll: false });

      // Make the create request
      const createMixtape = async () => {
        try {
          const response = await fetch('/api/mixtape', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              public_id: publicId,
              name: 'Untitled Mixtape',
              intro_text: null,
              subtitle1: null,
              subtitle2: null,
              subtitle3: null,
              is_public: !isAuthenticated,
              tracks: [],
            }),
          });

          if (!response.ok) {
            if (response.status === 409) {
              // Mixtape already exists, this is fine - just refetch it
              // This can happen due to React re-renders
              const existingMixtape = await fetch(`/api/mixtape/${publicId}`);
              if (existingMixtape.ok) {
                const mixtapeData = await existingMixtape.json();
                setCreatedMixtape(mixtapeData);
                return;
              }
            }
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP ${response.status}`);
          }

          const mixtapeData = await response.json();
          setCreatedMixtape(mixtapeData);
        } catch (err: any) {
          setCreateError(err.message || 'Failed to create mixtape');
        }
      };

      createMixtape();
    }
  }, [isCreateMode, publicId, router, isAuthenticated, createdMixtape, createError]);

  // Choose which mixtape data to use
  const mixtape = isCreateMode ? createdMixtape : getRequest.data;
  const loading = isCreateMode ? false : getRequest.loading; // Never show loading in create mode
  const error = createError || (!isCreateMode ? getRequest.error : null);
  const refetch = getRequest.refetch;

  // Handle updates from the editor (save, undo, redo)
  const handleMixtapeUpdateViaAnotherEndpoint = useCallback(
    (updatedMixtape: MixtapeResponse) => {
      setLocalMixtape(updatedMixtape);
    },
    []
  );

  // Determine which mixtape to use
  const currentMixtape = localMixtape || 
                        (isCreateMode ? (mixtape || initialMixtape) : mixtape);

  const handleRefetch = useCallback(async () => {
    await refetch();
    // Now that the mixtape has been refetched, we can clear the local state.
    setLocalMixtape(null);
  }, [refetch]);

  // Handle loading states
  if (isCreateMode && loading) {
    // In create mode, show the initial mixtape immediately while creating
    // (this allows immediate editing without waiting for server response)
    const tempMixtape = initialMixtape;
    if (!tempMixtape) {
      return <LoadingDisplay message="Preparing new mixtape..." />;
    }
    
    return (
      <MixtapeContext.Provider
        value={{
          mixtape: tempMixtape,
          refetch: handleRefetch,
          onMixtapeUpdated: handleMixtapeUpdateViaAnotherEndpoint,
        }}
      >
        {children}
      </MixtapeContext.Provider>
    );
  }

  if (!isCreateMode && loading) {
    return <LoadingDisplay message="Loading mixtape..." />;
  }

  // Handle errors
  const currentError = createError || error;
  if (currentError || (!isCreateMode && !currentMixtape)) {
    return (
      <MainContainer>
        <ContentPane>
          <ErrorDisplay message={currentError ?? 'Mixtape not found'} />
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

  if (!currentMixtape) {
    return <LoadingDisplay message="Loading mixtape..." />;
  }

  return (
    <MixtapeContext.Provider
      value={{
        mixtape: currentMixtape,
        refetch: handleRefetch,
        onMixtapeUpdated: handleMixtapeUpdateViaAnotherEndpoint,
      }}
    >
      {children}
    </MixtapeContext.Provider>
  );
}
