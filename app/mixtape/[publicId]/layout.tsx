'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth({ requireAuth: false });
  const { makeRequest } = useLazyRequest();

  // Local state to track mixtape updates from editor (for optimistic updates)
  const [localMixtape, setLocalMixtape] = useState<MixtapeResponse | null>(null);
  
  // State for create mode.
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Fetch existing mixtape from server (skip if create mode)
  const {
    data: mixtape,
    loading,
    error,
    refetch,
  } = useApiRequest<MixtapeResponse>({
    url: `/api/mixtape/${publicId}`,
    method: 'GET',
    skip: isCreateMode || isCreating,
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

  // ---- FIX: Fire-once create logic ----
  const hasCreatedRef = useRef(false);

  useEffect(() => {
    if (hasCreatedRef.current) return; // already ran
    if (!isCreateMode || createError || isAuthLoading) return;

    hasCreatedRef.current = true;

    // Immediately clean up URL (don't wait for server response)
    const newUrl = `/mixtape/${publicId}/edit`;
    router.replace(newUrl, { scroll: false });

    // Create mixtape on server in background
    (async () => {
      setIsCreating(true);
      try {
        await makeRequest<MixtapeResponse>('/api/mixtape', {
          method: 'POST',
          body: createInitialMixtape(),
        });
      } catch (err: any) {
        if (
          !err.message?.includes('409') &&
          !err.message?.includes('already taken')
        ) {
          setCreateError(err.message || 'Failed to create mixtape');
        }
      } finally {
        setIsCreating(false);
      }
    })();

    // Intentionally NOT including router, makeRequest, createInitialMixtape
    // to ensure this only fires once. These references are stable enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreateMode, isAuthLoading, createError, publicId]);

  // Determine which mixtape to use (priority: local updates > initial mixtape -> loaded server data)
  const currentMixtape = localMixtape || 
                        (isCreateMode || isCreating ? createInitialMixtape() : mixtape);

  // Handle updates from the editor (save, undo, redo)
  const handleMixtapeUpdate = useCallback(
    (updatedMixtape: MixtapeResponse) => {
      setLocalMixtape(updatedMixtape);
    },
    []
  );

  const handleRefetch = useCallback(async () => {
    await refetch();
    setLocalMixtape(null); // Clear local state after fetching fresh data
  }, [refetch]);

  // Loading state
  const isLoading = !currentMixtape && loading;
  if (isLoading) {
    return <LoadingDisplay message="Loading mixtape..." />;
  }

  // Error state
  if (createError || error || !currentMixtape) {
    return (
      <MainContainer>
        <ContentPane>
          <ErrorDisplay message={(createError || error) ?? 'Mixtape not found'} />
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