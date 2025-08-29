'use client';

import { useSortable } from '@dnd-kit/sortable';
import { MixtapeTrackResponse } from '@/app/client';
import TrackTextEditor from './TrackTextEditor';
import { CSS } from '@dnd-kit/utilities';

type SortableTrackProps = {
  track: MixtapeTrackResponse;
  trackId: string;
  isEditing: boolean;
  onEditTrackText?: (newText: string) => void;
  onRemoveTrack: () => void;
  setIsEditingTrack: (isEditing: boolean) => void;
};

export default function SortableTrack(props: SortableTrackProps) {
  const {
    track,
    trackId,
    isEditing,
    onEditTrackText,
    onRemoveTrack,
    setIsEditingTrack,
  } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: trackId });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
    cursor: 'grab',
  };

  const details = track.track;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-start space-x-2 sm:space-x-4 p-3 sm:p-4 border rounded-lg hover:transition-colors duration-200 bg-amber-50 border-amber-200 hover:bg-amber-100 dark:bg-neutral-900 dark:border-amber-700 dark:hover:bg-neutral-800"
      data-testid={`track-${track.track_position}`}
    >
      {/* Album Art */}
      <div className="shrink-0">
        {details.album.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={details.album.images[0].url}
            alt={details.album.name}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded object-cover"
          />
        ) : (
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded flex items-center justify-center bg-amber-200 dark:bg-neutral-800">
            <span className="text-xs text-amber-600 dark:text-neutral-300">
              No Image
            </span>
          </div>
        )}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <div className="text-base sm:text-lg font-medium truncate text-amber-900 dark:text-neutral-100">
          {details.name}
        </div>
        <div className="text-xs sm:text-sm truncate text-amber-600 dark:text-neutral-300">
          {details.artists.map(a => a.name).join(', ')}
        </div>
        <TrackTextEditor
          isEditing={isEditing}
          track={track}
          onEditTrackText={onEditTrackText}
          setIsEditingTrack={setIsEditingTrack}
        />
      </div>

      {/* Delete Button */}
      <button
        onClick={onRemoveTrack}
        className="shrink-0 p-1 sm:p-2 rounded-full transition-colors duration-200 text-amber-600 hover:text-red-600 hover:bg-red-50 dark:text-amber-400 dark:hover:text-red-400 dark:hover:bg-red-900/20"
        title="Remove track"
      >
        <svg
          className="w-4 h-4 sm:w-5 sm:h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );
}
