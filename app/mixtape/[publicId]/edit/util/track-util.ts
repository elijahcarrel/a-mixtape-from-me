import {
  MixtapeTrackRequest,
  MixtapeTrackResponse,
  TrackDetails,
} from '@/client';

export const normalizeTrackToRequest = (
  t: MixtapeTrackResponse | MixtapeTrackRequest
): MixtapeTrackRequest => ({
  track_position: t.track_position,
  track_text: t.track_text,
  // @ts-expect-error only spotify_uri or track.uri will be defined, but not both.
  spotify_uri: t.spotify_uri || t.track?.uri,
});

export const normalizeTrackToResponse = (
  t: MixtapeTrackResponse | MixtapeTrackRequest
): MixtapeTrackResponse => ({
  track_position: t.track_position,
  track_text: t.track_text,
  track:
    // @ts-expect-error track is only defined if this is a MixtapeTrackResponse.
    t.track ||
    ({
      id: '',
      name: '',
      artists: [],
      album: {
        name: '',
        images: [],
      },
      // @ts-expect-error spotify_uri is only defined if this is a MixtapeTrackRequest.
      uri: t.spotify_uri || '',
    } as TrackDetails),
});
