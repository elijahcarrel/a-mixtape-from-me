'use client';

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  createContext,
  useContext,
} from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLazyRequest } from '@/hooks/useLazyRequest';
import { useAuth } from '@/hooks/useAuth';
import { MixtapeRequest, MixtapeResponse } from '@/client';
import { User } from '@stackframe/stack';

// Higher-level context for managing create flow across route changes
interface MixtapeCreateContextValue {
  createdMixtape: MixtapeResponse | null;
  isCreating: boolean;
  didCreate: boolean;
  createError: string | null;
}

const MixtapeCreateContext = createContext<
  MixtapeCreateContextValue | undefined
>(undefined);

export function useMixtapeCreate() {
  const ctx = useContext(MixtapeCreateContext);
  if (ctx === undefined) {
    throw new Error(
      'useMixtapeCreate must be used within a MixtapeCreateProvider'
    );
  }
  return ctx;
}

interface MixtapeLayoutProps {
  children: React.ReactNode;
}

const createInitialMixtapeRequest = (
  isAuthenticated: boolean
): MixtapeRequest => ({
  name: 'Untitled Mixtape',
  intro_text: null,
  subtitle1: null,
  subtitle2: null,
  subtitle3: null,
  is_public: !isAuthenticated, // Default to private if authenticated, public if not
  tracks: [],
});

const createFallbackMixtapeResponse = (
  isAuthenticated: boolean,
  user: User | null
): MixtapeResponse => ({
  public_id: '', // Will be filled by server.
  name: 'Untitled Mixtape',
  intro_text: null,
  subtitle1: null,
  subtitle2: null,
  subtitle3: null,
  is_public: !isAuthenticated, // Default to private if authenticated, public if not
  create_time: '', // Will be set by server
  last_modified_time: '', // Will be set by server
  stack_auth_user_id: isAuthenticated ? user?.id || null : null, // Will be set by server. For now, use a placeholder if and only if we would expect one.
  version: 1,
  can_undo: false,
  can_redo: false,
  spotify_playlist_url: null,
  tracks: [],
});

export default function MixtapeLayout({ children }: MixtapeLayoutProps) {
  const params = useParams();
  const router = useRouter();
  const publicId = params.publicId as string;
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    user,
  } = useAuth({
    requireAuth: false,
  });
  const { makeRequest } = useLazyRequest();
  const isCreateMode = publicId === 'new';

  // Global state for created mixtapes (persists across route changes)
  const [createdMixtape, setCreatedMixtape] = useState<MixtapeResponse | null>(
    createFallbackMixtapeResponse(isAuthenticated, user)
  );
  const [isCreating, setIsCreating] = useState(false);
  const [didCreate, setDidCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Fire-once create logic
  const hasCreatedRef = useRef(false);

  useEffect(() => {
    if (
      hasCreatedRef.current || // already ran
      createError || // already errored
      !isCreateMode || // not in create mode
      isAuthLoading // not ready to run yet
    ) {
      return;
    }

    hasCreatedRef.current = true;

    // Create mixtape on server in background
    (async () => {
      const initialMixtape = createInitialMixtapeRequest(isAuthenticated);
      setIsCreating(true);

      try {
        const mixtape = await makeRequest<MixtapeResponse>('/api/mixtape', {
          method: 'POST',
          body: initialMixtape,
        });

        // Store the created mixtape with its real ID
        setCreatedMixtape(mixtape);
        setDidCreate(true);
        const newUrl = `/mixtape/${mixtape.public_id}/edit`;
        router.replace(newUrl, { scroll: false });
      } catch (err: any) {
        setCreateError(err.message || 'Failed to create mixtape');
      } finally {
        setIsCreating(false);
      }
    })();

    // Intentionally NOT including router, makeRequest, createInitialMixtape
    // to ensure this only fires once. These references are stable enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreateMode, isAuthLoading]);

  // Provide context value with created mixtape awareness
  const contextValue = {
    createdMixtape,
    isCreating,
    didCreate,
    createError,
  };

  return (
    <MixtapeCreateContext.Provider value={contextValue}>
      {children}
    </MixtapeCreateContext.Provider>
  );
}
