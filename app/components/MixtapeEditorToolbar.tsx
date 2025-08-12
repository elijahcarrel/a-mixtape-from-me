import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Undo2,
  Redo2,
  Share2,
  ExternalLink,
  Eye,
  RefreshCcw,
  CloudCheck,
  X,
} from 'lucide-react';
import { MixtapeResponse } from '../client';
import HeaderContainer from './layout/HeaderContainer';
import { useTheme } from './ThemeProvider';
import { FormValues } from './MixtapeEditorForm';

interface MixtapeEditorToolbarProps {
  mixtape: MixtapeResponse;
  isSaving: boolean;
  values: FormValues;
  setFieldValue: (field: string, value: any) => void;
  handleSave: (values: FormValues, immediate: boolean) => void;
}

export default function MixtapeEditorToolbar({
  mixtape,
  isSaving,
  values,
  setFieldValue,
  handleSave,
}: MixtapeEditorToolbarProps) {
  const router = useRouter();
  const { theme } = useTheme();

  // Share dialog state
  const [isShareOpen, setIsShareOpen] = useState(false);
  // Toast message state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const commonBtnStyles =
    'p-2 rounded-md transition-colors duration-150 hover:bg-amber-100 dark:hover:bg-amber-900/30 focus:outline-none';

  return (
    <>
      {/* Toolbar */}
      <HeaderContainer>
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Undo */}
          <button
            type="button"
            title="Undo"
            className={commonBtnStyles}
            // TODO: connect to undo endpoint
            onClick={() => {}}
          >
            <Undo2 size={20} />
          </button>

          {/* Redo */}
          <button
            type="button"
            title="Redo"
            className={commonBtnStyles}
            onClick={() => {}}
          >
            <Redo2 size={20} />
          </button>

          {/* Share */}
          <button
            type="button"
            title="Share"
            className={commonBtnStyles}
            onClick={() => setIsShareOpen(true)}
          >
            <Share2 size={20} />
          </button>

          {/* Export to Spotify */}
          <button
            type="button"
            title="Export to Spotify"
            className={commonBtnStyles}
            onClick={() => copyToClipboard('not implemented yet', 'Spotify URL copied (placeholder)')}
          >
            <ExternalLink size={20} />
          </button>

          {/* Status */}
          <div
            className="flex items-center space-x-1 ml-2 text-xs sm:text-sm"
            data-testid="saving-indicator"
          >
            {isSaving ? (
              <RefreshCcw size={16} className="animate-spin" />
            ) : (
              <CloudCheck size={16} />
            )}
            <span>{isSaving ? 'Saving...' : 'Saved'}</span>
          </div>
        </div>

        {/* Right aligned preview */}
        <div className="ml-auto">
          <button
            type="button"
            title="Preview"
            className={`${commonBtnStyles} flex items-center space-x-1`}
            data-testid="preview-button"
            onClick={() => router.push(`/mixtape/${mixtape.public_id}`)}
          >
            <Eye size={20} />
            <span className="text-sm">Preview</span>
          </button>
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