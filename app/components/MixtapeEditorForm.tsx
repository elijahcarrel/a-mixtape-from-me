import { Form, Field } from 'formik';
import { TrackDetails, MixtapeTrackRequest, MixtapeTrackResponse, MixtapeResponse } from '../client';
import { normalizeTrackToResponse } from '../util/track-util';
import { useTheme } from './ThemeProvider';
import TrackAutocomplete from './TrackAutocomplete';
import TrackList from './TrackList';

export interface FormValues {
  name: string;
  intro_text: string;
  cassette_text: string;
  is_public: boolean;
  tracks: (MixtapeTrackResponse | MixtapeTrackRequest)[];
}

export interface MixtapeEditorFormProps {
  mixtape: MixtapeResponse;
  values: FormValues;
  setFieldValue: (field: string, value: any) => void;
  handleSave: (values: FormValues, immediate: boolean) => void;
}
  

export function MixtapeEditorForm({ mixtape, values, setFieldValue, handleSave }: MixtapeEditorFormProps) {
  const { theme } = useTheme();

  const addTrack = (spotifyUri: string, trackData: TrackDetails) => {
    const newTrack: MixtapeTrackRequest | MixtapeTrackResponse = {
      track_position: values.tracks.length + 1,
      track_text: undefined,
      track: trackData,
      spotify_uri: trackData.uri,
    };

    const updatedValues = {
      ...values,
      tracks: [...values.tracks, newTrack]
    };

    // Update all form fields with the new values
    setFieldValue('tracks', updatedValues.tracks);
    handleSave(updatedValues, true); // Immediate save for track changes
  };

  const editTrackText = (position: number, newText: string) => {
    const updatedTracks = values.tracks.map((track: MixtapeTrackResponse | MixtapeTrackRequest) => track.track_position === position ? { ...track, track_text: newText } : track
    );

    const updatedValues = {
      ...values,
      tracks: updatedTracks
    };

    setFieldValue('tracks', updatedTracks);
    handleSave(updatedValues, true); // Immediate save for track changes
  };

  const removeTrack = (position: number) => {
    const updatedTracks = values.tracks
      .filter((track: MixtapeTrackResponse | MixtapeTrackRequest) => track.track_position !== position)
      .map((track: MixtapeTrackResponse | MixtapeTrackRequest, index: number) => ({
        ...track,
        track_position: index + 1
      }));

    const updatedValues = {
      ...values,
      tracks: updatedTracks
    };

    setFieldValue('tracks', updatedTracks);
    handleSave(updatedValues, true); // Immediate save for track changes
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Form className="space-y-4 sm:space-y-6">
        {/* Mixtape Title */}
        <div>
          <Field
            name="name"
            type="text"
            placeholder="Enter mixtape title..."
            className={`w-full text-xl sm:text-2xl md:text-3xl font-bold bg-transparent border-b-2 focus:outline-none transition-colors duration-200 placeholder-neutral-400 ${theme === 'dark'
                ? 'border-amber-600 text-neutral-100 focus:border-amber-400'
                : 'border-amber-300 text-neutral-900 focus:border-amber-600'}`}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setFieldValue('name', e.target.value);
              handleSave({ ...values, name: e.target.value }, false); // Debounced save for text changes
            } } />
        </div>

        {/* Cassette Text */}
        <div>
          <Field
            name="cassette_text"
            as="textarea"
            placeholder="Add some cassette text for your mixtape..."
            rows={3}
            className={`w-full bg-transparent border rounded-lg p-2 sm:p-3 focus:outline-none transition-colors duration-200 placeholder-neutral-400 resize-none text-sm sm:text-base ${theme === 'dark'
                ? 'border-amber-600 text-neutral-100 focus:border-amber-400'
                : 'border-amber-300 text-neutral-900 focus:border-amber-600'}`}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              setFieldValue('cassette_text', e.target.value);
              handleSave({ ...values, cassette_text: e.target.value }, false); // Debounced save for text changes
            } } />
        </div>

        {/* Intro Text */}
        <div>
          <Field
            name="intro_text"
            as="textarea"
            placeholder="Add some intro text for your mixtape..."
            rows={3}
            className={`w-full bg-transparent border rounded-lg p-2 sm:p-3 focus:outline-none transition-colors duration-200 placeholder-neutral-400 resize-none text-sm sm:text-base ${theme === 'dark'
                ? 'border-amber-600 text-neutral-100 focus:border-amber-400'
                : 'border-amber-300 text-neutral-900 focus:border-amber-600'}`}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              setFieldValue('intro_text', e.target.value);
              handleSave({ ...values, intro_text: e.target.value }, false); // Debounced save for text changes
            } } />
        </div>

        {/* Public/Private Toggle */}
        <div className="flex items-center space-x-3">
          <Field
            name="is_public"
            type="checkbox"
            id="is_public"
            className={`w-4 h-4 bg-transparent border rounded focus:ring-2 focus:ring-offset-0 ${theme === 'dark'
                ? 'text-amber-400 border-amber-600 focus:ring-amber-500'
                : 'text-amber-600 border-amber-300 focus:ring-amber-500'}`}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setFieldValue('is_public', e.target.checked);
              handleSave({ ...values, is_public: e.target.checked }, false); // Debounced save for text changes
            } } />
          <label htmlFor="is_public" className={`text-sm sm:text-base ${theme === 'dark' ? 'text-neutral-100' : 'text-neutral-900'}`}>
            Make this mixtape public
          </label>
        </div>
      </Form>

      {/* Track Autocomplete */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className={`text-lg sm:text-xl font-semibold ${theme === 'dark' ? 'text-neutral-100' : 'text-neutral-900'}`}>Add Tracks</h2>
        <TrackAutocomplete onTrackSelect={addTrack} />
      </div>

      {/* Track List */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className={`text-lg sm:text-xl font-semibold ${theme === 'dark' ? 'text-neutral-100' : 'text-neutral-900'}`}>
          Tracks ({values.tracks.length})
        </h2>
        <TrackList
          tracks={values.tracks.map(normalizeTrackToResponse)}
          onRemoveTrack={removeTrack}
          onEditTrackText={editTrackText} />
      </div>
    </div>
  );
}
