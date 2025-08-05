'use client';

import { useState, useCallback } from 'react';
import { Formik } from 'formik';
import { debounce } from 'lodash';
import { useAuthenticatedRequest } from '../hooks/useApiRequest';
import HeaderContainer from './layout/HeaderContainer';
import { useTheme } from './ThemeProvider';
import { useAuth } from '../hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { MixtapeResponse, MixtapeTrackRequest, MixtapeTrackResponse } from '../client';
import { normalizeTrackToRequest } from '../util/track-util';
import PreviewButton from './PreviewButton';
import { MixtapeEditorForm, FormValues } from './MixtapeEditorForm';

export interface MixtapeEditorProps {
  mixtape: MixtapeResponse;
  onMixtapeClaimed?: () => void;
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


  // Immediate save function for track changes
  const immediateSave = useCallback(async (values: FormValues) => {
    setIsSaving(true);
    try {
      await makeRequest(`/api/mixtape/${mixtape.public_id}`, {
        method: 'PUT',
        body: {
          name: values.name,
          intro_text: values.intro_text,
          subtitle1: values.subtitle1,
          subtitle2: values.subtitle2,
          subtitle3: values.subtitle3,
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

  // Debounced save function for text changes
  const debouncedSave = useCallback(
    debounce(async (values: FormValues) => {
      await immediateSave(values);
    }, 1000),
    [mixtape.public_id, makeRequest]
  );

  // Unified save handler
  const handleSave = useCallback(async (values: FormValues, immediate: boolean = false) => {
    if (immediate) {
      await immediateSave(values);
    } else {
      debouncedSave(values);
    }
  }, [immediateSave, debouncedSave]);

  return (
    <div className="space-y-4 sm:space-y-6 relative">
      {/* Anonymous Mixtape Warning */}
      {isAnonymousMixtape && (
        <div className={`p-3 sm:p-4 rounded-lg border-2 ${
          theme === 'dark' 
            ? 'bg-amber-900/20 border-amber-600 text-amber-200' 
            : 'bg-amber-50 border-amber-300 text-amber-800'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold mb-2 text-sm sm:text-base">
                {isAuthenticated ? 'Claim this mixtape' : 'Sign in to save this mixtape'}
              </h3>
              <p className="text-xs sm:text-sm mb-3">
                {isAuthenticated 
                  ? 'This mixtape was created anonymously. Click below to attach it to your account so you can find it later and control who can edit it.'
                  : 'This mixtape was created anonymously. Sign in to attach it to your account so you can find it later and control who can edit it.'
                }
              </p>
              <button
                onClick={handleClaimMixtape}
                disabled={isClaiming}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm sm:text-base ${
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
            className={`absolute top-2 sm:top-4 right-2 sm:right-4 text-xs sm:text-sm flex items-center px-2 sm:px-3 py-1 sm:py-2 rounded-lg shadow-sm border z-10 ${
              theme === 'dark' 
                ? 'text-amber-300 bg-amber-900/20 border-amber-700' 
                : 'text-amber-600 bg-amber-50 border-amber-200'
            }`} 
            data-testid="saving-indicator"
          >
            <div className={`animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 mr-1 sm:mr-2 ${
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
          subtitle1: mixtape.subtitle1 || '',
          subtitle2: mixtape.subtitle2 || '',
          subtitle3: mixtape.subtitle3 || '',
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