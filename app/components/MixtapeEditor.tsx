'use client';

import { useState, useEffect, useCallback } from 'react';
import { Formik, Form, Field } from 'formik';
import TrackAutocomplete from './TrackAutocomplete';
import TrackList from './TrackList';
import { debounce } from 'lodash';
import { useAuthenticatedRequest } from '../hooks/useApiRequest';
import HeaderContainer from './layout/HeaderContainer';
import { useTheme } from './ThemeProvider';
import { useAuth } from '../hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';

interface TrackDetails {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; width: number; height: number }>;
  };
  uri: string;
}

interface Track {
  track_position: number;
  track_text?: string;
  track: TrackDetails;
}

interface MixtapeData {
  public_id: string;
  name: string;
  intro_text?: string;
  is_public: boolean;
  create_time: string;
  last_modified_time: string;
  tracks: Track[];
  stack_auth_user_id?: string;
}

interface MixtapeEditorProps {
  mixtape: MixtapeData;
  onMixtapeClaimed?: () => void;
}

export default function MixtapeEditor({ mixtape, onMixtapeClaimed }: MixtapeEditorProps) {
  const [tracks, setTracks] = useState<Track[]>(mixtape.tracks);
  const [isSaving, setIsSaving] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const { makeRequest } = useAuthenticatedRequest();
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const currentPath = usePathname();
  const router = useRouter();

  const isAnonymousMixtape = !mixtape.stack_auth_user_id;

  const handleClaimMixtape = async () => {
    if (!isAuthenticated) {
      router.push(`/handler/signup?next=${encodeURIComponent(currentPath)}`);
      return;
    }
    setIsClaiming(true);
    try {
      await makeRequest(`/api/main/mixtape/${mixtape.public_id}/claim`, {
        method: 'POST',
        body: {}
      });
      onMixtapeClaimed?.();
    } catch (error) {
      console.error('Error claiming mixtape:', error);
    } finally {
      setIsClaiming(false);
    }
  };

  // Debounced save function that always uses the latest tracks
  const debouncedSave = useCallback(
    debounce(async (values: any, tracksOverride: Track[]) => {
      setIsSaving(true);
      try {
        await makeRequest(`/api/main/mixtape/${mixtape.public_id}`, {
          method: 'PUT',
          body: {
            ...values,
            tracks: tracksOverride.map(t => ({
              track_position: t.track_position,
              track_text: t.track_text,
              spotify_uri: t.track.uri
            }))
          }
        });
      } catch (error) {
        console.error('Error saving mixtape:', error);
      } finally {
        setIsSaving(false);
      }
    }, 1000),
    [mixtape.public_id, makeRequest]
  );

  useEffect(() => {
    setTracks(mixtape.tracks);
  }, [mixtape.tracks]);

  const handleFormChange = (values: any) => {
    debouncedSave(values, tracks);
  };

  const addTrack = (spotifyUri: string, trackData: TrackDetails) => {
    const newTrack: Track = {
      track_position: tracks.length + 1,
      track_text: trackData.name,
      track: trackData
    };
    const updatedTracks = [...tracks, newTrack];
    setTracks(updatedTracks);
    debouncedSave({ name: mixtape.name, intro_text: mixtape.intro_text, is_public: mixtape.is_public }, updatedTracks);
  };

  const removeTrack = (position: number) => {
    const updatedTracks = tracks
      .filter(track => track.track_position !== position)
      .map((track, index) => ({
        ...track,
        track_position: index + 1
      }));
    setTracks(updatedTracks);
    debouncedSave({ name: mixtape.name, intro_text: mixtape.intro_text, is_public: mixtape.is_public }, updatedTracks);
  };

  return (
    <div className="space-y-6 relative">
      {/* Anonymous Mixtape Warning */}
      {isAnonymousMixtape && (
        <div className={`p-4 rounded-lg border-2 ${
          theme === 'dark' 
            ? 'bg-amber-900/20 border-amber-600 text-amber-200' 
            : 'bg-amber-50 border-amber-300 text-amber-800'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold mb-2">
                {isAuthenticated ? 'Claim this mixtape' : 'Sign in to save this mixtape'}
              </h3>
              <p className="text-sm mb-3">
                {isAuthenticated 
                  ? 'This mixtape was created anonymously. Click below to attach it to your account so you can find it later and control who can edit it.'
                  : 'This mixtape was created anonymously. Sign in to attach it to your account so you can find it later and control who can edit it.'
                }
              </p>
              <button
                onClick={handleClaimMixtape}
                disabled={isClaiming}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  isClaiming 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:opacity-80'
                } ${
                  theme === 'dark'
                    ? 'bg-amber-600 text-white hover:bg-amber-500'
                    : 'bg-amber-600 text-white hover:bg-amber-700'
                }`}
              >
                {isClaiming ? 'Claiming...' : (isAuthenticated ? 'Claim Mixtape' : 'Sign In')}
              </button>
            </div>
          </div>
        </div>
      )}

      <HeaderContainer>
        {isSaving && (
          <div 
            className={`absolute top-4 right-4 text-sm flex items-center px-3 py-2 rounded-lg shadow-sm border z-10 ${
              theme === 'dark' 
                ? 'text-amber-300 bg-amber-900/20 border-amber-700' 
                : 'text-amber-600 bg-amber-50 border-amber-200'
            }`} 
            data-testid="saving-indicator"
          >
            <div className={`animate-spin rounded-full h-4 w-4 border-b-2 mr-2 ${
              theme === 'dark' ? 'border-amber-300' : 'border-amber-600'
            }`}></div>
            Saving...
          </div>
        )}
      </HeaderContainer>

      <Formik
        initialValues={{
          name: mixtape.name,
          intro_text: mixtape.intro_text || '',
          is_public: mixtape.is_public
        }}
        onSubmit={() => {}} // We handle saving via debounced function
      >
        {({ values, setFieldValue }) => (
          <Form className="space-y-6">
            {/* Mixtape Title */}
            <div>
              <Field
                name="name"
                type="text"
                placeholder="Enter mixtape title..."
                className={`w-full text-3xl font-bold bg-transparent border-b-2 focus:outline-none transition-colors duration-200 placeholder-neutral-400 ${
                  theme === 'dark'
                    ? 'border-amber-600 text-neutral-100 focus:border-amber-400'
                    : 'border-amber-300 text-neutral-900 focus:border-amber-600'
                }`}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFieldValue('name', e.target.value);
                  handleFormChange({ ...values, name: e.target.value });
                }}
              />
            </div>

            {/* Intro Text */}
            <div>
              <Field
                name="intro_text"
                as="textarea"
                placeholder="Add some intro text for your mixtape..."
                rows={3}
                className={`w-full bg-transparent border rounded-lg p-3 focus:outline-none transition-colors duration-200 placeholder-neutral-400 resize-none ${
                  theme === 'dark'
                    ? 'border-amber-600 text-neutral-100 focus:border-amber-400'
                    : 'border-amber-300 text-neutral-900 focus:border-amber-600'
                }`}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  setFieldValue('intro_text', e.target.value);
                  handleFormChange({ ...values, intro_text: e.target.value });
                }}
              />
            </div>

            {/* Public/Private Toggle */}
            <div className="flex items-center space-x-3">
              <Field
                name="is_public"
                type="checkbox"
                id="is_public"
                className={`w-4 h-4 bg-transparent border rounded focus:ring-2 focus:ring-offset-0 ${
                  theme === 'dark'
                    ? 'text-amber-400 border-amber-600 focus:ring-amber-500'
                    : 'text-amber-600 border-amber-300 focus:ring-amber-500'
                }`}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFieldValue('is_public', e.target.checked);
                  handleFormChange({ ...values, is_public: e.target.checked });
                }}
              />
              <label htmlFor="is_public" className={theme === 'dark' ? 'text-neutral-100' : 'text-neutral-900'}>
                Make this mixtape public
              </label>
            </div>
          </Form>
        )}
      </Formik>

      {/* Track Autocomplete */}
      <div className="space-y-4">
        <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-neutral-100' : 'text-neutral-900'}`}>Add Tracks</h2>
        <TrackAutocomplete onTrackSelect={addTrack} />
      </div>

      {/* Track List */}
      <div className="space-y-4">
        <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-neutral-100' : 'text-neutral-900'}`}>
          Tracks ({tracks.length})
        </h2>
        <TrackList tracks={tracks} onRemoveTrack={removeTrack} />
      </div>
    </div>
  );
} 