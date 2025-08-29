import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Undo2, Redo2, Share2, ExternalLink, Eye, X } from 'lucide-react';
import { ToolbarButton, ToolbarButtonLink } from './ToolbarButton';
import { MixtapeResponse } from '@/app/client';
import HeaderContainer from '../../../../../components/layout/HeaderContainer';
import { FormValues } from '../MixtapeEditorForm';
import { useAuthenticatedRequest } from '@/app/hooks/useAuthenticatedRequest';
import StatusIndicator from './StatusIndicator';
import Link from 'next/link';

interface MixtapeEditorToolbarProps {
  mixtape: MixtapeResponse;
  isSaving: boolean; // saving OR unsaved pending – pre-calculated by parent
  values: FormValues;
  setFieldValue: (field: string, value: any) => void;
  handleSave: (values: FormValues, immediate: boolean) => void;
  onUndoRedo: (updatedMixtape: MixtapeResponse) => void;
  resetForm: (updatedMixtape: MixtapeResponse) => void;
  statusText: string;
  setStatusText: (text: string) => void;
}

export default function MixtapeEditorToolbar({
  mixtape,
  isSaving,
  values,
  setFieldValue,
  handleSave,
  onUndoRedo,
  resetForm,
  statusText,
  setStatusText,
}: MixtapeEditorToolbarProps) {
  const router = useRouter();
  const { makeRequest } = useAuthenticatedRequest();

  // Prefetch viewer route for faster navigation
  useEffect(() => {
    router.prefetch(`/mixtape/${mixtape.public_id}`);
  }, [router, mixtape.public_id]);

  // Share dialog state
  const [isShareOpen, setIsShareOpen] = useState(false);
  // Undo/redo loading states
  const [isUndoing, setIsUndoing] = useState(false);
  const [isRedoing, setIsRedoing] = useState(false);

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      // Fallback
      toast.error(`Unable to copy to clipboard: ${String(error)}`);
      return false;
    }
    return true;
  };

  const mixtapeUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/mixtape/${mixtape.public_id}`;

  // Handlers
  const handleTogglePublic = (newValue: boolean) => {
    setFieldValue('is_public', newValue);
    handleSave({ ...values, is_public: newValue }, false);
  };

  const handleUndo = async () => {
    if (!mixtape.can_undo || isUndoing) return;

    setIsUndoing(true);
    setStatusText('Undoing...');
    try {
      const updatedMixtape = await makeRequest(
        `/api/mixtape/${mixtape.public_id}/undo`,
        {
          method: 'POST',
        }
      );

      onUndoRedo(updatedMixtape);
      setStatusText('Undo successful');
      // Reset the form to show the updated values
      resetForm(updatedMixtape);
    } catch (error) {
      console.error('Error undoing:', error);
      setStatusText('Undo failed');
      toast.error('Error undoing changes');
    } finally {
      setIsUndoing(false);
    }
  };

  const handleRedo = async () => {
    if (!mixtape.can_redo || isRedoing) return;

    setIsRedoing(true);
    setStatusText('Redoing...');
    try {
      const updatedMixtape = await makeRequest(
        `/api/mixtape/${mixtape.public_id}/redo`,
        {
          method: 'POST',
        }
      );

      onUndoRedo(updatedMixtape);
      setStatusText('Redo successful');
      // Reset the form to show the updated values
      resetForm(updatedMixtape);
    } catch (error) {
      console.error('Error redoing:', error);
      setStatusText('Redo failed');
      toast.error('Error redoing changes');
    } finally {
      setIsRedoing(false);
    }
  };

  const commonBtnStyles = ''; // styles are handled by ToolbarButton components

  return (
    <>
      {/* Toolbar */}
      <HeaderContainer>
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Undo */}
          <ToolbarButton
            icon={<Undo2 size={20} />}
            tooltip="Undo"
            onClick={handleUndo}
            disabled={!mixtape.can_undo || isUndoing}
            data-testid="undo-button"
          />

          {/* Redo */}
          <ToolbarButton
            icon={<Redo2 size={20} />}
            tooltip="Redo"
            onClick={handleRedo}
            disabled={!mixtape.can_redo || isRedoing}
            data-testid="redo-button"
          />

          {/* Share */}
          <ToolbarButton
            icon={<Share2 size={20} />}
            tooltip="Share"
            onClick={() => setIsShareOpen(true)}
            data-testid="share-button"
          />

          {/* Export to Spotify */}
          <ToolbarButton
            icon={<ExternalLink size={20} />}
            tooltip="Export to Spotify"
            data-testid="export-to-spotify-button"
            onClick={async () => {
              try {
                setStatusText('Exporting to Spotify...');
                const resp: MixtapeResponse = await makeRequest(
                  `/api/mixtape/${mixtape.public_id}/spotify-export`,
                  { method: 'POST' }
                );
                if (resp.spotify_playlist_url) {
                  await copyToClipboard(resp.spotify_playlist_url);
                  // Show toast with link
                  toast.success(
                    <span>
                      Spotify playlist copied to clipboard!{' '}
                      <Link
                        href={resp.spotify_playlist_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:no-underline font-semibold"
                      >
                        Open in Spotify
                      </Link>
                    </span>,
                    { duration: 10000 }
                  );
                }
                setStatusText('Exported to Spotify');
              } catch (error) {
                console.error('Error exporting to Spotify:', error);
                toast.error('Error exporting to Spotify');
              }
            }}
          />

          {/* Status */}
          <div
            className="flex items-center ml-2 text-xs sm:text-sm"
            data-testid="status-indicator"
          >
            <StatusIndicator
              isUndoing={isUndoing}
              isRedoing={isRedoing}
              isSaving={isSaving}
              statusText={statusText}
            />
          </div>
        </div>

        {/* Right aligned preview */}
        <div className="ml-auto">
          <ToolbarButtonLink
            href={`/mixtape/${mixtape.public_id}`}
            icon={<Eye size={20} />}
            tooltip="Preview"
            label="Preview"
            withTooltip={true}
            data-testid="preview-button"
          />
        </div>
      </HeaderContainer>

      {/* Share Modal */}
      {isShareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
          <div className="w-full max-w-sm rounded-lg p-4 sm:p-6 bg-white text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Share Mixtape</h2>
              <button
                type="button"
                title="Close"
                className={commonBtnStyles}
                onClick={() => setIsShareOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Public toggle */}
            <div className="flex items-center space-x-2 mb-4">
              <input
                id="is_public_modal"
                type="checkbox"
                checked={values.is_public}
                onChange={e => handleTogglePublic(e.target.checked)}
                className="w-4 h-4 border rounded"
              />
              <label htmlFor="is_public_modal" className="select-none">
                Make this mixtape public
              </label>
            </div>

            {/* Share link */}
            <div className="mb-4">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={mixtapeUrl}
                  className="flex-1 px-2 py-1 border rounded bg-transparent text-sm overflow-hidden truncate border-amber-300 dark:border-amber-600"
                />
                <button
                  type="button"
                  className={`${commonBtnStyles} whitespace-nowrap text-sm`}
                  onClick={async () => {
                    const success = await copyToClipboard(mixtapeUrl);
                    if (success) {
                      toast.success('Link copied to clipboard!');
                    }
                  }}
                >
                  Copy
                </button>
              </div>
            </div>

            <button
              type="button"
              className="w-full mt-2 text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 dark:hover:bg-amber-500 px-3 py-2 rounded-lg transition-colors"
              onClick={() => setIsShareOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
