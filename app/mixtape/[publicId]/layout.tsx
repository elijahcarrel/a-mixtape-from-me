'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

import LoadingDisplay from '@/components/layout/LoadingDisplay';
import ErrorDisplay from '@/components/layout/ErrorDisplay';
import MainContainer from '@/components/layout/MainContainer';
import ContentPane from '@/components/layout/ContentPane';
import { useApiRequest } from '@/hooks/useApiRequest';
import { useLazyRequest } from '@/hooks/useLazyRequest';
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
  const { makeRequest } = useLazyRequest();

  // Local state to track mixtape updates from editor (for optimistic updates)
  const [localMixtape, setLocalMixtape] = useState<MixtapeResponse | null>(null);
  
  // State for create mode
  const [serverMixtape, setServerMixtape] = useState<MixtapeResponse | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  // Only fetch from server if NOT in create mode
  // TODO: Could refactor to use useLazyRequest for GET as well for consistency
  const getRequest = useApiRequest<MixtapeResponse>({
    url: `/api/mixtape/${publicId}`,
    method: 'GET',
  });

  // Create initial mixtape object for immediate rendering in create mode
  const createInitialMixtape = useCallback((): MixtapeResponse => ({
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
  }), [publicId, isAuthenticated]);

  // Handle create mode: remove URL param and create mixtape on server
  useEffect(() => {
    if (!isCreateMode || serverMixtape || createError) return;

    // Immediately clean up URL (don't wait for server response)
    const newUrl = `/mixtape/${publicId}/edit`;
    router.replace(newUrl, { scroll: false });

    // Create mixtape on server in background
    const createOnServer = async () => {
      try {
        const mixtapeData = await makeRequest<MixtapeResponse>('/api/mixtape', {
          method: 'POST',
          body: {
            public_id: publicId,
            name: 'Untitled Mixtape',
            intro_text: null,
            subtitle1: null,
            subtitle2: null,
            subtitle3: null,
            is_public: !isAuthenticated,
            tracks: [],
          },
        });
        setServerMixtape(mixtapeData);
      } catch (err: any) {
        // Handle 409 conflicts gracefully (React re-renders)
        if (err.message?.includes('409') || err.message?.includes('already taken')) {
          try {
            // Mixtape already exists, just fetch it
            const existingMixtape = await makeRequest<MixtapeResponse>(`/api/mixtape/${publicId}`);
            setServerMixtape(existingMixtape);
          } catch (fetchErr: any) {
            setCreateError(fetchErr.message || 'Failed to fetch existing mixtape');
          }
        } else {
          setCreateError(err.message || 'Failed to create mixtape');
        }
      }
    };

    createOnServer();
  }, [isCreateMode, publicId, router, isAuthenticated, serverMixtape, createError, makeRequest]);

  // Determine which mixtape to use (priority: local updates > server data > initial)
  const currentMixtape = localMixtape || 
                        serverMixtape || 
                        (isCreateMode ? createInitialMixtape() : getRequest.data);

  // Determine loading and error states
  const isLoading = isCreateMode ? false : getRequest.loading; // Never show loading in create mode
  const currentError = createError || (!isCreateMode ? getRequest.error : null);

  // Handle updates from the editor (save, undo, redo)
  const handleMixtapeUpdate = useCallback(
    (updatedMixtape: MixtapeResponse) => {
      setLocalMixtape(updatedMixtape);
    },
    []
  );

  // Handle refetch requests
  const handleRefetch = useCallback(async () => {
    if (isCreateMode) {
      // In create mode, refetch means re-fetching the server mixtape
      // TODO: This could be simplified by using a single data source
      try {
        const mixtapeData = await makeRequest<MixtapeResponse>(`/api/mixtape/${publicId}`);
        setServerMixtape(mixtapeData);
        setLocalMixtape(null); // Clear local state
      } catch (err: any) {
        setCreateError(err.message || 'Failed to refetch mixtape');
      }
    } else {
      await getRequest.refetch();
      setLocalMixtape(null); // Clear local state
    }
  }, [isCreateMode, publicId, makeRequest, getRequest]);

  // Loading state
  if (isLoading) {
    return <LoadingDisplay message="Loading mixtape..." />;
  }

  // Error state
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

  // Success state - should always have a mixtape at this point
  if (!currentMixtape) {
    // This should never happen, but just in case
    return <LoadingDisplay message="Preparing mixtape..." />;
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
