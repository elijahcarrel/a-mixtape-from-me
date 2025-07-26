'use client';

import { useState, useCallback } from 'react';
import { Formik, Form, Field } from 'formik';
import TrackAutocomplete from './TrackAutocomplete';
import TrackList from './TrackList';
import { debounce } from 'lodash';
import { useAuthenticatedRequest } from '../hooks/useApiRequest';
import HeaderContainer from './layout/HeaderContainer';
import { useTheme } from './ThemeProvider';
import { useAuth } from '../hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { MixtapeResponse, MixtapeTrackRequest, MixtapeTrackResponse, TrackDetails } from '../client';
import { normalizeTrackToRequest, normalizeTrackToResponse } from '../util/track-util';
import PreviewButton from './PreviewButton';

interface MixtapeEditorProps {
  mixtape: MixtapeResponse;
  onMixtapeClaimed?: () => void;
}

interface FormValues {
  name: string;
  intro_text: string;
  is_public: boolean;
  tracks: (MixtapeTrackResponse | MixtapeTrackRequest)[];
}

interface MixtapeEditorFormProps {
  mixtape: MixtapeResponse;
  values: FormValues;
  setFieldValue: (field: string, value: any) => void;
  handleSave: (values: FormValues, immediate: boolean) => void;
}

function MixtapeEditorForm({ mixtape, values, setFieldValue, handleSave }: MixtapeEditorFormProps) {
  const { theme } = useTheme();

  const addTrack = (spotifyUri: string, trackData: TrackDetails) => {
    const newTrack: MixtapeTrackRequest | MixtapeTrackResponse = {
      track_position: values.tracks.length + 1,
      track_text: undefined,
      track: trackData,
      spotify_uri: trackData.uri,
    };
    
    const updatedValues = {
      ...values,
      tracks: [...values.tracks, newTrack]
    };
    
    // Update all form fields with the new values
    setFieldValue('tracks', updatedValues.tracks);
    handleSave(updatedValues, true); // Immediate save for track changes
  };

  const editTrackText = (position: number, newText: string) => {
    const updatedTracks = values.tracks.map((track: MixtapeTrackResponse | MixtapeTrackRequest) =>
      track.track_position === position ? { ...track, track_text: newText } : track
    );
    
    const updatedValues = {
      ...values,
      tracks: updatedTracks
    };
    
    setFieldValue('tracks', updatedTracks);
    handleSave(updatedValues, true); // Immediate save for track changes
  };

  const removeTrack = (position: number) => {
    const updatedTracks = values.tracks
      .filter((track: MixtapeTrackResponse | MixtapeTrackRequest) => track.track_position !== position)
      .map((track: MixtapeTrackResponse | MixtapeTrackRequest, index: number) => ({
        ...track,
        track_position: index + 1
      }));
    
    const updatedValues = {
      ...values,
      tracks: updatedTracks
    };
    
    setFieldValue('tracks', updatedTracks);
    handleSave(updatedValues, true); // Immediate save for track changes
  };

  return (
    <div className="space-y-6">
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
              handleSave({ ...values, name: e.target.value }, false); // Debounced save for text changes
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
              handleSave({ ...values, intro_text: e.target.value }, false); // Debounced save for text changes
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
              handleSave({ ...values, is_public: e.target.checked }, false); // Debounced save for text changes
            }}
          />
          <label htmlFor="is_public" className={theme === 'dark' ? 'text-neutral-100' : 'text-neutral-900'}>
            Make this mixtape public
          </label>
        </div>
      </Form>

      {/* Track Autocomplete */}
      <div className="space-y-4">
        <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-neutral-100' : 'text-neutral-900'}`}>Add Tracks</h2>
        <TrackAutocomplete onTrackSelect={addTrack} />
      </div>

      {/* Track List */}
      <div className="space-y-4">
        <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-neutral-100' : 'text-neutral-900'}`}>
          Tracks ({values.tracks.length})
        </h2>
        <TrackList 
          tracks={values.tracks.map(normalizeTrackToResponse)} 
          onRemoveTrack={removeTrack} 
          onEditTrackText={editTrackText} 
        />
      </div>
    </div>
  );
}

export default function MixtapeEditor({ mixtape, onMixtapeClaimed }: MixtapeEditorProps) {
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
      // Redirect to sign in with current page as next parameter.
      router.push(`/handler/signup?next=${encodeURIComponent(currentPath)}`);
      return;
    }
    setIsClaiming(true);
    try {
      await makeRequest(`/api/mixtape/${mixtape.public_id}/claim`, {
        method: 'POST',
        body: {}
      });
      // Call the parent's callback to refresh data.
      onMixtapeClaimed?.();
    } catch (error) {
      console.error('Error claiming mixtape:', error);
    } finally {
      setIsClaiming(false);
    }
  };

  // Debounced save function for text changes
  const debouncedSave = useCallback(
    debounce(async (values: FormValues) => {
      setIsSaving(true);
      try {
        await makeRequest(`/api/mixtape/${mixtape.public_id}`, {
          method: 'PUT',
          body: {
            name: values.name,
            intro_text: values.intro_text,
            is_public: values.is_public,
            tracks: values.tracks.map(normalizeTrackToRequest)
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

  // Immediate save function for track changes
  const immediateSave = useCallback(async (values: FormValues) => {
    setIsSaving(true);
    try {
      await makeRequest(`/api/mixtape/${mixtape.public_id}`, {
        method: 'PUT',
        body: {
          name: values.name,
          intro_text: values.intro_text,
          is_public: values.is_public,
          tracks: values.tracks.map(normalizeTrackToRequest)
        }
      });
    } catch (error) {
      console.error('Error saving mixtape:', error);
    } finally {
      setIsSaving(false);
    }
  }, [mixtape.public_id, makeRequest]);

  // Unified save handler
  const handleSave = useCallback(async (values: FormValues, immediate: boolean = false) => {
    if (immediate) {
      await immediateSave(values);
    } else {
      debouncedSave(values);
    }
  }, [immediateSave, debouncedSave]);

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
          is_public: mixtape.is_public,
          tracks: mixtape.tracks
        }}
        enableReinitialize={true}
        onSubmit={() => {}} // We handle saving via our custom handlers
      >
        {({ values, setFieldValue }) => (
          <MixtapeEditorForm
            mixtape={mixtape}
            values={values}
            setFieldValue={setFieldValue}
            handleSave={handleSave}
          />
        )}
      </Formik>

      {/* Preview Button - floating bottom right */}
      <PreviewButton mixtape={mixtape} />
    </div>
  );
} 