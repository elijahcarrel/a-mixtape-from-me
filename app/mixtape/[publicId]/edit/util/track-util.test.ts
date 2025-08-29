import {
  normalizeTrackToRequest,
  normalizeTrackToResponse,
} from './track-util';
import type {
  MixtapeTrackRequest,
  MixtapeTrackResponse,
  TrackDetails,
} from '../../../../client/types.gen';

describe('normalizeTrackToRequest', () => {
  it('converts MixtapeTrackResponse to MixtapeTrackRequest', () => {
    const trackDetails: TrackDetails = {
      id: 'track1',
      name: 'Test Track',
      artists: [{ name: 'Artist 1' }],
      album: { name: 'Album 1', images: [] },
      uri: 'spotify:track:track1',
    };
    const response: MixtapeTrackResponse = {
      track_position: 1,
      track_text: 'A note',
      track: trackDetails,
    };
    const req = normalizeTrackToRequest(response);
    expect(req).toEqual({
      track_position: 1,
      track_text: 'A note',
      spotify_uri: 'spotify:track:track1',
    });
  });

  it('returns input unchanged if already MixtapeTrackRequest', () => {
    const request: MixtapeTrackRequest = {
      track_position: 2,
      track_text: 'Another note',
      spotify_uri: 'spotify:track:track2',
    };
    const req = normalizeTrackToRequest(request);
    expect(req).toEqual(request);
  });
});

describe('normalizeTrackToResponse', () => {
  it('converts MixtapeTrackRequest to MixtapeTrackResponse with default track', () => {
    const request: MixtapeTrackRequest = {
      track_position: 3,
      track_text: 'Default track',
      spotify_uri: 'spotify:track:track3',
    };
    const res = normalizeTrackToResponse(request);
    expect(res.track_position).toBe(3);
    expect(res.track_text).toBe('Default track');
    expect(res.track).toEqual({
      id: '',
      name: '',
      artists: [],
      album: { name: '', images: [] },
      uri: 'spotify:track:track3',
    });
  });

  it('returns input unchanged if already MixtapeTrackResponse', () => {
    const trackDetails: TrackDetails = {
      id: 'track4',
      name: 'Track 4',
      artists: [{ name: 'Artist 4' }],
      album: { name: 'Album 4', images: [] },
      uri: 'spotify:track:track4',
    };
    const response: MixtapeTrackResponse = {
      track_position: 4,
      track_text: 'Already response',
      track: trackDetails,
    };
    const res = normalizeTrackToResponse(response);
    expect(res).toEqual(response);
  });
});
