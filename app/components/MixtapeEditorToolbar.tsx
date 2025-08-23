import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Undo2,
  Redo2,
  Share2,
  ExternalLink,
  Eye,
  RefreshCcw,
  CloudCheck,
  History,
  X,
} from 'lucide-react';
import { ToolbarButton, ToolbarButtonLink } from './ToolbarButton';
import { MixtapeResponse } from '../client';
import HeaderContainer from './layout/HeaderContainer';
import { useTheme } from './ThemeProvider';
import { FormValues } from './MixtapeEditorForm';
import { useAuthenticatedRequest } from '../hooks/useAuthenticatedRequest';

interface MixtapeEditorToolbarProps {
  mixtape: MixtapeResponse;
  isSaving: boolean; // saving OR unsaved pending – pre-calculated by parent
  values: FormValues;
  setFieldValue: (field: string, value: any) => void;
  handleSave: (values: FormValues, immediate: boolean) => void;
  onUndoRedo: (updatedMixtape: MixtapeResponse) => void;
}

export default function MixtapeEditorToolbar({
  mixtape,
  isSaving,
  values,
  setFieldValue,
  handleSave,
  onUndoRedo,
}: MixtapeEditorToolbarProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const { makeRequest } = useAuthenticatedRequest();

  // Prefetch viewer route for faster navigation
  useEffect(() => {
    router.prefetch(`/mixtape/${mixtape.public_id}`);
  }, [router, mixtape.public_id]);

  // Share dialog state
  const [isShareOpen, setIsShareOpen] = useState(false);
  // Toast message state (only for errors now)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // Undo/redo loading states
  const [isUndoing, setIsUndoing] = useState(false);
  const [isRedoing, setIsRedoing] = useState(false);
  // Status text state for the status indicator
  const [statusText, setStatusText] = useState<string>('Saved');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    // Auto-dismiss after 2.5s
    setTimeout(() => setToastMessage(null), 2500);
  };

  const copyToClipboard = async (text: string, successMsg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMsg);
    } catch (_) {
      // Fallback
      showToast('Unable to copy to clipboard');
    }
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
      const updatedMixtape = await makeRequest(`/api/mixtape/${mixtape.public_id}/undo`, {
        method: 'POST',
      });
      
      onUndoRedo(updatedMixtape);
      setStatusText('Undo successful');
      // Clear success message after 3 seconds
      setTimeout(() => setStatusText('Saved'), 3000);
    } catch (error) {
      console.error('Error undoing:', error);
      setStatusText('Undo failed');
      showToast('Error undoing changes');
      // Clear failure message after 3 seconds
      setTimeout(() => setStatusText('Saved'), 3000);
    } finally {
      setIsUndoing(false);
    }
  };

  const handleRedo = async () => {
    if (!mixtape.can_redo || isRedoing) return;
    
    setIsRedoing(true);
    setStatusText('Redoing...');
    try {
      const updatedMixtape = await makeRequest(`/api/mixtape/${mixtape.public_id}/redo`, {
        method: 'POST',
      });
      
      onUndoRedo(updatedMixtape);
      setStatusText('Redo successful');
      // Clear success message after 3 seconds
      setTimeout(() => setStatusText('Saved'), 3000);
    } catch (error) {
      console.error('Error redoing:', error);
      setStatusText('Redo failed');
      showToast('Error redoing changes');
      // Clear failure message after 3 seconds
      setTimeout(() => setStatusText('Saved'), 3000);
    } finally {
      setIsRedoing(false);
    }
  };

  const commonBtnStyles = '';// styles are handled by ToolbarButton components

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
          <ToolbarButton icon={<Share2 size={20} />} tooltip="Share" onClick={() => setIsShareOpen(true)} data-testid="share-button" />

          {/* Export to Spotify */}
          <ToolbarButton icon={<ExternalLink size={20} />} tooltip="Export to Spotify" onClick={() => copyToClipboard('not implemented yet', 'Spotify URL copied (placeholder)')} />

          {/* Status */}
          <div
            className="flex items-center space-x-1 ml-2 text-xs sm:text-sm"
            data-testid="status-indicator"
          >
            {isUndoing ? (
              <>
                <History size={16} className="animate-spin" />
                <span>Undoing...</span>
              </>
            ) : isRedoing ? (
              <>
                <History size={16} className="animate-spin scale-x-[-1]" />
                <span>Redoing...</span>
              </>
            ) : isSaving ? (
              <>
                <RefreshCcw size={16} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CloudCheck size={16} />
                <span>{statusText}</span>
              </>
            )}
          </div>
        </div>

        {/* Right aligned preview */}
        <div className="ml-auto">
          <ToolbarButtonLink
            href={`/mixtape/${mixtape.public_id}`}
            icon={<Eye size={20} />}
            tooltip="Preview"
            label="Preview"
            withTooltip={false}
            data-testid="preview-button"
          />
        </div>
      </HeaderContainer>

      {/* Share Modal */}
      {isShareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
          <div
            className={`w-full max-w-sm rounded-lg p-4 sm:p-6 ${
              theme === 'dark' ? 'bg-neutral-800 text-neutral-100' : 'bg-white text-neutral-900'
            }`}
          >
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
                onChange={(e) => handleTogglePublic(e.target.checked)}
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
                  className={`flex-1 px-2 py-1 border rounded bg-transparent text-sm overflow-hidden truncate ${
                    theme === 'dark' ? 'border-amber-600' : 'border-amber-300'
                  }`}
                />
                <button
                  type="button"
                  className={`${commonBtnStyles} whitespace-nowrap text-sm`}
                  onClick={() => copyToClipboard(mixtapeUrl, 'Link copied!')}
                >
                  Copy
                </button>
              </div>
            </div>

            <button
              type="button"
              className={`w-full mt-2 text-sm font-medium ${
                theme === 'dark'
                  ? 'bg-amber-600 text-white hover:bg-amber-500'
                  : 'bg-amber-600 text-white hover:bg-amber-700'
              } px-3 py-2 rounded-lg transition-colors`}
              onClick={() => setIsShareOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toastMessage}
        </div>
      )}
    </>
  );
}