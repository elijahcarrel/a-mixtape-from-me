import React from 'react';
import { render, act } from './test-utils';
import SpotifyPlayer from '../SpotifyPlayer';

describe('SpotifyPlayer', () => {
  const mockController = {
    play: jest.fn(),
    loadUri: jest.fn(),
    addListener: jest.fn(),
  } as any;

  const eventCallbacks: Record<string, (payload: any) => void> = {};

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();

    // Prepare stub IFrame API
    (global as any).SpotifyIframeAPI = {
      createController: (_el: any, _opts: any, cb: any) => {
        // intercept addListener to capture callbacks
        mockController.addListener = jest.fn((event: string, handler: any) => {
          eventCallbacks[event] = handler;
        });
        cb(mockController);
      },
    };

    // Ensure promise is cleared
    delete (global as any)._spotifyIframeApiPromise;
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('creates Spotify embed controller with provided URI', async () => {
    await act(async () => {
      render(<SpotifyPlayer uri="spotify:track:123" />);
    });

    expect((global as any).SpotifyIframeAPI.createController).toBeDefined();
    // @ts-ignore
    expect((global as any).SpotifyIframeAPI.createController).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ uri: 'spotify:track:123' }),
      expect.any(Function)
    );
  });

  it('invokes onIsPlayingChange on playback updates', async () => {
    const onPlaying = jest.fn();

    await act(async () => {
      render(<SpotifyPlayer uri="spotify:track:123" onIsPlayingChange={onPlaying} />);
    });

    // Simulate playback update event
    act(() => {
      eventCallbacks['playback_update']?.({ data: { isPaused: false } });
    });
    expect(onPlaying).toHaveBeenCalledWith(true);

    act(() => {
      eventCallbacks['playback_update']?.({ data: { isPaused: true } });
    });
    expect(onPlaying).toHaveBeenCalledWith(false);
  });

  it('loads new URI when prop changes', async () => {
    const { rerender } = render(<SpotifyPlayer uri="spotify:track:123" />);

    // wait
    await act(async () => {});

    mockController.loadUri.mockClear();
    rerender(<SpotifyPlayer uri="spotify:track:456" />);

    await act(async () => {});

    expect(mockController.loadUri).toHaveBeenCalledWith('spotify:track:456');
  });
});