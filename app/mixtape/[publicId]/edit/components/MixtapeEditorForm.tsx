import { Form, Field } from 'formik';
import {
  TrackDetails,
  MixtapeTrackRequest,
  MixtapeTrackResponse,
  MixtapeResponse,
} from '@/app/client';
import { normalizeTrackToResponse } from '../util/track-util';
import TrackAutocomplete from './tracks/TrackAutocomplete';
import TrackList from './tracks/TrackList';
import InteractiveCassetteEditor from './InteractiveCassetteEditor';

// TODO: do we need a bespoke FormValues type or can we just use MixtapeResponse?
export interface FormValues {
  name: string;
  intro_text: string;
  subtitle1: string;
  subtitle2: string;
  subtitle3: string;
  is_public: boolean;
  tracks: (MixtapeTrackResponse | MixtapeTrackRequest)[];
}

// See above TODO; we might just be able to replace this with the identity function.
export function mixtapeToFormValues(mixtape: MixtapeResponse): FormValues {
  return {
    name: mixtape.name,
    intro_text: mixtape.intro_text || '',
    subtitle1: mixtape.subtitle1 || '',
    subtitle2: mixtape.subtitle2 || '',
    subtitle3: mixtape.subtitle3 || '',
    is_public: mixtape.is_public,
    tracks: mixtape.tracks,
  };
}

export interface MixtapeEditorFormProps {
  mixtape: MixtapeResponse;
  values: FormValues;
  setFieldValue: (field: string, value: any) => void;
  handleSave: (values: FormValues, immediate: boolean) => void;
}

export function MixtapeEditorForm({
  mixtape,
  values,
  setFieldValue,
  handleSave,
}: MixtapeEditorFormProps) {
  const addTrack = (spotifyUri: string, trackData: TrackDetails) => {
    const newTrack: MixtapeTrackRequest | MixtapeTrackResponse = {
      track_position: values.tracks.length + 1,
      track_text: undefined,
      track: trackData,
      spotify_uri: trackData.uri,
    };

    const updatedValues = {
      ...values,
      tracks: [...values.tracks, newTrack],
    };

    // Update all form fields with the new values
    setFieldValue('tracks', updatedValues.tracks);
    handleSave(updatedValues, true); // Immediate save for track changes
  };

  const editTrackText = (position: number, newText: string) => {
    const updatedTracks = values.tracks.map(
      (track: MixtapeTrackResponse | MixtapeTrackRequest) =>
        track.track_position === position
          ? { ...track, track_text: newText }
          : track
    );

    const updatedValues = {
      ...values,
      tracks: updatedTracks,
    };

    setFieldValue('tracks', updatedTracks);
    handleSave(updatedValues, true); // Immediate save for track changes
  };

  const removeTrack = (position: number) => {
    const updatedTracks = values.tracks
      .filter(
        (track: MixtapeTrackResponse | MixtapeTrackRequest) =>
          track.track_position !== position
      )
      .map(
        (track: MixtapeTrackResponse | MixtapeTrackRequest, index: number) => ({
          ...track,
          track_position: index + 1,
        })
      );

    const updatedValues = {
      ...values,
      tracks: updatedTracks,
    };

    setFieldValue('tracks', updatedTracks);
    handleSave(updatedValues, true); // Immediate save for track changes
  };

  const reorderTracks = (
    updatedTracks: (MixtapeTrackResponse | MixtapeTrackRequest)[]
  ) => {
    const updatedValues = {
      ...values,
      tracks: updatedTracks,
    };
    setFieldValue('tracks', updatedTracks);
    handleSave(updatedValues, true); // Immediate save for reorder
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Form className="space-y-4 sm:space-y-6">
        {/* Mixtape Title - Hidden field, title is now part of cassette text */}
        <Field name="name" type="hidden" />
        {/* visually hidden checkbox field kept for legacy tests (not visible to users) */}
        <Field name="is_public" type="checkbox" className="sr-only" />

        {/* Interactive Cassette Editor */}
        <div className="space-y-3">
          <InteractiveCassetteEditor
            title={values.name}
            subtitle1={values.subtitle1}
            subtitle2={values.subtitle2}
            subtitle3={values.subtitle3}
            onTitleChange={title => {
              setFieldValue('name', title);
              handleSave({ ...values, name: title }, false);
            }}
            onSubtitle1Change={subtitle1 => {
              setFieldValue('subtitle1', subtitle1);
              handleSave({ ...values, subtitle1 }, false);
            }}
            onSubtitle2Change={subtitle2 => {
              setFieldValue('subtitle2', subtitle2);
              handleSave({ ...values, subtitle2 }, false);
            }}
            onSubtitle3Change={subtitle3 => {
              setFieldValue('subtitle3', subtitle3);
              handleSave({ ...values, subtitle3 }, false);
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
            className="w-full bg-transparent border rounded-lg p-2 sm:p-3 focus:outline-none transition-colors duration-200 placeholder-neutral-400 resize-none text-sm sm:text-base border-amber-300 text-neutral-900 focus:border-amber-600 dark:border-amber-600 dark:text-neutral-100 dark:focus:border-amber-400"
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              setFieldValue('intro_text', e.target.value);
              handleSave({ ...values, intro_text: e.target.value }, false); // Debounced save for text changes
            }}
          />
        </div>

        {/* Public/Private toggle moved to Share dialog */}
      </Form>

      {/* Track Autocomplete */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Add Tracks
        </h2>
        <TrackAutocomplete onTrackSelect={addTrack} />
      </div>

      {/* Track List */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Tracks ({values.tracks.length})
        </h2>
        <TrackList
          tracks={values.tracks.map(normalizeTrackToResponse)}
          onRemoveTrack={removeTrack}
          onEditTrackText={editTrackText}
          onReorder={reorderTracks}
        />
      </div>
    </div>
  );
}
