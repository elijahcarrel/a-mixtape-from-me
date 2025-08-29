'use client';

import { MixtapeTrackResponse } from '@/app/client';
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
  arrayMove,
} from '@dnd-kit/sortable';
import SortableTrack from './SortableTrack';

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

// We purposefully choose `track_position` as the drag-and-drop id. Using the
// track's Spotify URI is unsafe (users can add the same song twice). `track_position`
// is guaranteed to be unique within a mixtape and we always re-number positions
// immediately after any reorder so ids stay stable between renders.
const getTrackId = (track: MixtapeTrackResponse): string => {
  return `${track.track_position}`;
};

export default function TrackList({
  tracks,
  onRemoveTrack,
  onEditTrackText,
  onReorder,
}: TrackListProps) {
  const [editingTrack, setEditingTrack] = useState<number | null>(null);

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

    const oldIndex = tracks.findIndex(t => getTrackId(t) === active.id);
    const newIndex = tracks.findIndex(t => getTrackId(t) === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newArr = arrayMove(tracks, oldIndex, newIndex).map((t, idx) => ({
      ...t,
      track_position: idx + 1,
    }));

    onReorder?.(newArr);
  };

  if (tracks.length === 0) {
    return (
      <div className="text-center py-6 sm:py-8 text-amber-600 dark:text-neutral-300">
        <p className="text-sm sm:text-base">
          No tracks added yet. Search for tracks above to get started!
        </p>
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
      <SortableContext
        items={tracks.map(getTrackId)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 sm:space-y-3">
          {tracks.map(track => (
            <SortableTrack
              key={getTrackId(track)}
              track={track}
              trackId={getTrackId(track)}
              isEditing={editingTrack === track.track_position}
              onEditTrackText={(newText: string) =>
                onEditTrackText?.(track.track_position, newText)
              }
              onRemoveTrack={() => onRemoveTrack(track.track_position)}
              setIsEditingTrack={(isEditing: boolean) =>
                setEditingTrack(isEditing ? track.track_position : null)
              }
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
