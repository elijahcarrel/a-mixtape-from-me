'use client';

import { MixtapeTrackResponse } from '../client';
import { useTheme } from './ThemeProvider';
import { useState } from 'react';
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  closestCenter,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TrackListProps {
  tracks: MixtapeTrackResponse[];
  onRemoveTrack: (position: number) => void;
  onEditTrackText?: (position: number, newText: string) => void;
  /**
   * Called when the user reorders tracks via drag-and-drop. Receives the updated
   * array with correctly updated track_position fields.
   */
  onReorder?: (reorderedTracks: MixtapeTrackResponse[]) => void;
}

// Utility to derive a unique id for drag-and-drop
const getTrackId = (track: MixtapeTrackResponse): string => {
  // @ts-expect-error – spotify_uri may exist on request objects
  return track.spotify_uri ?? track?.track?.uri ?? `${track.track_position}`;
};

export default function TrackList({ tracks, onRemoveTrack, onEditTrackText, onReorder }: TrackListProps) {
  const { theme } = useTheme();
  const [editingTrack, setEditingTrack] = useState<number | null>(null);
  const [draftText, setDraftText] = useState<string>('');

  // -- Drag & Drop Setup --
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // small threshold to prevent accidental drags
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = tracks.findIndex((t) => getTrackId(t) === active.id);
    const newIndex = tracks.findIndex((t) => getTrackId(t) === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newArr = arrayMove(tracks, oldIndex, newIndex).map((t, idx) => ({
      ...t,
      track_position: idx + 1,
    }));

    onReorder?.(newArr);
  };

  if (tracks.length === 0) {
    return (
      <div className={`text-center py-6 sm:py-8 ${
        theme === 'dark' ? 'text-neutral-300' : 'text-amber-600'
      }`}>
        <p className="text-sm sm:text-base">No tracks added yet. Search for tracks above to get started!</p>
      </div>
    );
  }

  return (
    // ---- Drag enabled list ----
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={tracks.map(getTrackId)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 sm:space-y-3">
          {tracks.map((track) => (
            <SortableTrack key={getTrackId(track)} track={track} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );

  // ---- Sortable item component ----

  function SortableTrack({ track }: { track: MixtapeTrackResponse }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: getTrackId(track) });

    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.6 : undefined,
      cursor: 'grab',
    };

    const details = track.track;
    const isEditing = editingTrack === track.track_position;
    const preview = track.track_text
      ? track.track_text.length > 80
        ? track.track_text.slice(0, 80) + '...'
        : track.track_text
      : '';

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`flex items-start space-x-2 sm:space-x-4 p-3 sm:p-4 border rounded-lg hover:transition-colors duration-200 ${
          theme === 'dark'
            ? 'bg-neutral-900 border-amber-700 hover:bg-neutral-800'
            : 'bg-amber-50 border-amber-200 hover:bg-amber-100'
        }`}
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
            <div
              className={`w-12 h-12 sm:w-16 sm:h-16 rounded flex items-center justify-center ${
                theme === 'dark' ? 'bg-neutral-800' : 'bg-amber-200'
              }`}
            >
              <span
                className={`text-xs ${
                  theme === 'dark' ? 'text-neutral-300' : 'text-amber-600'
                }`}
              >
                No Image
              </span>
            </div>
          )}
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <div
            className={`text-base sm:text-lg font-medium truncate ${
              theme === 'dark' ? 'text-neutral-100' : 'text-amber-900'
            }`}
          >
            {details.name}
          </div>
          <div
            className={`text-xs sm:text-sm truncate ${
              theme === 'dark' ? 'text-neutral-300' : 'text-amber-600'
            }`}
          >
            {details.artists.map((a) => a.name).join(', ')}
          </div>
          {/* Track Text Editor */}
          {isEditing ? (
            <div className="mt-2">
              <textarea
                className={`w-full p-2 rounded border resize-y focus:outline-none transition-colors duration-200 text-sm ${
                  theme === 'dark'
                    ? 'border-amber-700 bg-neutral-900 text-neutral-100 focus:border-amber-400'
                    : 'border-amber-300 bg-white text-neutral-900 focus:border-amber-600'
                }`}
                rows={4}
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                data-testid={`track-textarea-${track.track_position}`}
              />
              <div className="flex space-x-2 mt-1">
                <button
                  className={`px-2 sm:px-3 py-1 rounded font-medium text-xs transition-colors duration-200 border border-2 ${
                    theme === 'dark'
                      ? 'bg-amber-700 text-white hover:bg-amber-600 border-amber-800'
                      : 'bg-amber-600 text-white hover:bg-amber-700 border-amber-700'
                  }`}
                  onClick={() => {
                    onEditTrackText?.(track.track_position, draftText);
                    setEditingTrack(null);
                  }}
                  data-testid={`save-track-text-${track.track_position}`}
                >
                  Save
                </button>
                <button
                  className={`px-2 sm:px-3 py-1 rounded font-medium text-xs transition-colors duration-200 border border-2 ${
                    theme === 'dark'
                      ? 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700 border-neutral-700'
                      : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300 border-neutral-400'
                  }`}
                  onClick={() => setEditingTrack(null)}
                  data-testid={`cancel-track-text-${track.track_position}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-1 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                {track.track_text ? (
                  <span
                    className={`text-xs ${
                      theme === 'dark' ? 'text-neutral-400' : 'text-amber-700'
                    }`}
                  >
                    {preview}
                  </span>
                ) : (
                  <span className="text-xs italic text-neutral-400">No note</span>
                )}
              </div>
              <button
                className={`text-xs underline shrink-0 ml-2 ${
                  theme === 'dark' ? 'text-amber-400' : 'text-amber-700'
                }`}
                onClick={() => {
                  setEditingTrack(track.track_position);
                  setDraftText(track.track_text || '');
                }}
                data-testid={`edit-track-text-${track.track_position}`}
              >
                {track.track_text ? 'Edit note' : 'Add note'}
              </button>
            </div>
          )}
        </div>

        {/* Delete Button */}
        <button
          onClick={() => onRemoveTrack(track.track_position)}
          className={`shrink-0 p-1 sm:p-2 rounded-full transition-colors duration-200 ${
            theme === 'dark'
              ? 'text-amber-400 hover:text-red-400 hover:bg-red-900/20'
              : 'text-amber-600 hover:text-red-600 hover:bg-red-50'
          }`}
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
}