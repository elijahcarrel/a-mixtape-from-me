'use client';

import { useState, useCallback } from 'react';
import { Formik } from 'formik';
import { debounce } from 'lodash';
import { useAuthenticatedRequest } from '../hooks/useAuthenticatedRequest';
import { useTheme } from './ThemeProvider';
import { useAuth } from '../hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { MixtapeResponse, MixtapeTrackRequest, MixtapeTrackResponse } from '../client';
import { normalizeTrackToRequest } from '../util/track-util';
import MixtapeEditorToolbar from './MixtapeEditorToolbar';
import { MixtapeEditorForm, FormValues } from './MixtapeEditorForm';

export interface MixtapeEditorProps {
  mixtape: MixtapeResponse;
  onMixtapeClaimed?: () => void;
  onMixtapeUpdated?: (updatedMixtape: MixtapeResponse) => void;
}

export default function MixtapeEditor({ mixtape, onMixtapeClaimed, onMixtapeUpdated }: MixtapeEditorProps) {
  const [isSaving, setIsSaving] = useState(false); // request in-flight
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
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
      const response = await makeRequest(`/api/mixtape/${mixtape.public_id}`, {
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
      
      // Use the response directly to update the layout context
      if (response && onMixtapeUpdated) {
        onMixtapeUpdated(response);
      }
      
      // Saved successfully
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving mixtape:', error);
    } finally {
      setIsSaving(false);
    }
  }, [mixtape.public_id, makeRequest, onMixtapeUpdated]);

  // Debounced save function for text changes
  // TODO: fix this. Error is "React Hook useCallback received a function whose dependencies are unknown. Pass an inline function instead..
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce(async (values: FormValues) => {
      await immediateSave(values);
    }, 1000),
    [mixtape.public_id, makeRequest]
  );

  // Unified save handler
  const handleSave = useCallback(async (values: FormValues, immediate: boolean = false) => {
    // Mark unsaved changes immediately
    setHasUnsavedChanges(true);

    if (immediate) {
      await immediateSave(values);
    } else {
      debouncedSave(values);
    }
  }, [immediateSave, debouncedSave]);

  // Handle undo/redo responses
  const handleUndoRedo = useCallback((updatedMixtape: MixtapeResponse) => {
    if (onMixtapeUpdated) {
      onMixtapeUpdated(updatedMixtape);
    }
  }, [onMixtapeUpdated]);

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

      {/* Toolbar is rendered inside Formik below to access live form state */}

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
        // We use optimistic UI updates, so the values are usually the most up to date
        // whereas the mixtape values from the MixtapeContext are sometimes slightly stale.
        // If we left this enabled, we would see a flash of the stale data when the mixtape
        // auto-saves.
        enableReinitialize={false}
        onSubmit={() => {}} // We handle saving via our custom handlers
      >
        {({ values, setFieldValue }) => (
          <>
            {/* Toolbar has access to live Formik context now */}
            <MixtapeEditorToolbar
              mixtape={mixtape}
              isSaving={isSaving || hasUnsavedChanges}
              values={values}
              setFieldValue={setFieldValue}
              handleSave={handleSave}
              onUndoRedo={handleUndoRedo}
            />

            <MixtapeEditorForm
              mixtape={mixtape}
              values={values}
              setFieldValue={setFieldValue}
              handleSave={handleSave}
            />
          </>
        )}
      </Formik>
    </div>
  );
} 