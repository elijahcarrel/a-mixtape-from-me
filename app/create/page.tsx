'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiRequest } from '@/app/hooks/useApiRequest';
import MainContainer from '../components/layout/MainContainer';
import ContentPane from '../components/layout/ContentPane';
import { useAuth } from '@/app/hooks/useAuth';

export default function CreateMixtapePage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(true);
  const { isAuthenticated } = useAuth({ requireAuth: false });

  // Default mixtapes to private if the user is authenticated;
  // everyone prefers private-by-default.
  // However, if the user is unauthenticated, we have no choice
  // but to make it public. Otherwise, the user will be unable
  // to access their own mixtape.
  const isPublic = !isAuthenticated;
  const {
    data: createResponse,
    loading,
    error,
  } = useApiRequest<{ public_id: string }>({
    url: '/api/mixtape',
    method: 'POST',
    body: {
      name: 'Untitled Mixtape',
      intro_text: null,
      is_public: isPublic,
      tracks: [],
    },
  });

  useEffect(() => {
    if (!loading) {
      setIsCreating(false);
    }
  }, [loading]);

  useEffect(() => {
    if (createResponse?.public_id) {
      // Redirect to the edit page for the newly created mixtape
      router.replace(`/mixtape/${createResponse.public_id}/edit`);
    }
  }, [createResponse, router]);

  if (loading || isCreating) {
    return (
      <MainContainer>
        <ContentPane>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800 mx-auto mb-4"></div>
              <p className="text-lg text-amber-800">Creating your mixtape...</p>
            </div>
          </div>
        </ContentPane>
      </MainContainer>
    );
  }

  if (error) {
    return (
      <MainContainer>
        <ContentPane>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-800 mb-4">
              Error Creating Mixtape
            </h1>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-amber-800 text-white px-4 py-2 rounded hover:bg-amber-700"
            >
              Try Again
            </button>
          </div>
        </ContentPane>
      </MainContainer>
    );
  }

  return null;
}
