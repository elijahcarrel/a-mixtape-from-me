'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthenticatedRequest } from '../hooks/useApiRequest';
import { useAuth } from '../hooks/useAuth';
import { MixtapeResponse, MixtapeTrackRequest } from '../client';
import MixtapeEditor from '../components/MixtapeEditor';

export default function CreateMixtapePage() {
  const [mixtape, setMixtape] = useState<MixtapeResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { makeRequest } = useAuthenticatedRequest();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleCreateMixtape = async () => {
    setIsCreating(true);
    try {
      const response = await makeRequest('/api/mixtape', {
        method: 'POST',
        body: {
          name: 'Untitled Mixtape',
          intro_text: null,
          subtitle1: null,
          subtitle2: null,
          subtitle3: null,
          is_public: true,
          tracks: []
        }
      });
      
      const newMixtape: MixtapeResponse = {
        public_id: response.public_id,
        name: 'Untitled Mixtape',
        intro_text: null,
        subtitle1: null,
        subtitle2: null,
        subtitle3: null,
        is_public: true,
        create_time: new Date().toISOString(),
        last_modified_time: new Date().toISOString(),
        stack_auth_user_id: null,
        tracks: []
      };
      
      setMixtape(newMixtape);
    } catch (error) {
      console.error('Error creating mixtape:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleMixtapeClaimed = () => {
    // Refresh the page to get the updated mixtape data
    window.location.reload();
  };

  if (!mixtape) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Create a New Mixtape</h1>
          <button
            onClick={handleCreateMixtape}
            disabled={isCreating}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Start Creating'}
          </button>
        </div>
      </div>
    );
  }

  return <MixtapeEditor mixtape={mixtape} onMixtapeClaimed={handleMixtapeClaimed} />;
} 