import { useState } from 'react';
import { MixtapeTrackResponse } from '@/client';

type Props = {
  isEditing: boolean;
  track: MixtapeTrackResponse;
  onEditTrackText?: (newText: string) => void;
  setIsEditingTrack: (isEditing: boolean) => void;
};

export default function TrackTextEditor(props: Props) {
  const { isEditing, track, onEditTrackText, setIsEditingTrack } = props;
  const [draftText, setDraftText] = useState(track.track_text || '');

  const preview = track.track_text
    ? track.track_text.length > 80
      ? track.track_text.slice(0, 80) + '...'
      : track.track_text
    : '';

  if (isEditing) {
    return (
      <div className="mt-2">
        <textarea
          className="w-full p-2 rounded border resize-y focus:outline-none transition-colors duration-200 text-sm border-amber-300 bg-white text-neutral-900 focus:border-amber-600 dark:border-amber-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-amber-400"
          rows={4}
          value={draftText}
          onChange={e => setDraftText(e.target.value)}
          data-testid={`track-textarea-${track.track_position}`}
        />
        <div className="flex space-x-2 mt-1">
          <button
            className="px-2 sm:px-3 py-1 rounded font-medium text-xs transition-colors duration-200 border border-2 bg-amber-600 text-white hover:bg-amber-700 border-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 dark:border-amber-800"
            onClick={() => {
              onEditTrackText?.(draftText);
              setIsEditingTrack(false);
            }}
            data-testid={`save-track-text-${track.track_position}`}
          >
            Save
          </button>
          <button
            className="px-2 sm:px-3 py-1 rounded font-medium text-xs transition-colors duration-200 border border-2 bg-neutral-200 text-neutral-700 hover:bg-neutral-300 border-neutral-400 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:border-neutral-700"
            onClick={() => setIsEditingTrack(false)}
            data-testid={`cancel-track-text-${track.track_position}`}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="mt-1 flex items-center justify-between">
      <div className="flex-1 min-w-0">
        {track.track_text ? (
          <span className="text-xs text-amber-700 dark:text-neutral-400">
            {preview}
          </span>
        ) : (
          <span className="text-xs italic text-neutral-400">No note</span>
        )}
      </div>
      <button
        className="text-xs underline shrink-0 ml-2 text-amber-700 dark:text-amber-400"
        onClick={() => {
          setIsEditingTrack(true);
          setDraftText(track.track_text || '');
        }}
        data-testid={`edit-track-text-${track.track_position}`}
      >
        {track.track_text ? 'Edit note' : 'Add note'}
      </button>
    </div>
  );
}
