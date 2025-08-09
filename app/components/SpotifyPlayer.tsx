import React, { useEffect, useRef, useState } from 'react';

interface SpotifyPlayerProps {
  uri: string; // spotify:track:* uri
  onIsPlayingChange?: (isPlaying: boolean) => void;
  className?: string;
  width?: string | number;
  height?: string | number;
}

/*
  SpotifyPlayer embeds the Spotify iFrame API and exposes playback state to the rest of
  the application. It makes sure that the iFrame API script is loaded exactly once and
  then creates (or re-uses) an EmbedController instance. When the `uri` prop changes we
  will _not_ recreate the iframe – instead we invoke EmbedController.loadUri so that the
  player switches track seamlessly.

  The component reports current play/pause state via the onIsPlayingChange callback so
  parents can keep in sync (e.g. animate CassetteSVG spools).
*/
export default function SpotifyPlayer({
  uri,
  onIsPlayingChange,
  className,
  width = '100%',
  height = 152,
}: SpotifyPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<any>(null);
  const [isApiReady, setIsApiReady] = useState<boolean>(false);

  /*
    Utility to load the Spotify iFrame API only once. We attach a promise to the window
    object so parallel callers will all await the same load.
  */
  function loadSpotifyApi(): Promise<any> {
    if (typeof window === 'undefined') return Promise.reject('Not in browser');

    const w = window as any;
    if (w._spotifyIframeApiPromise) {
      return w._spotifyIframeApiPromise as Promise<any>;
    }

    w._spotifyIframeApiPromise = new Promise<any>((resolve, reject) => {
      // If API already present, resolve immediately.
      if (w.SpotifyIframeAPI) {
        resolve(w.SpotifyIframeAPI);
        return;
      }

      // Prepare global callback per API docs.
      w.onSpotifyIframeApiReady = (IFrameAPI: any) => {
        resolve(IFrameAPI);
      };

      // Inject script tag if not already present.
      if (!document.querySelector('script[src="https://open.spotify.com/embed/iframe-api/v1"]')) {
        const script = document.createElement('script');
        script.src = 'https://open.spotify.com/embed/iframe-api/v1';
        script.async = true;
        script.onerror = () => reject(new Error('Failed to load Spotify iframe API'));
        document.body.appendChild(script);
      }
    });

    return w._spotifyIframeApiPromise as Promise<any>;
  }

  // Create the embed controller exactly once.
  useEffect(() => {
    let isMounted = true;

    loadSpotifyApi()
      .then((IFrameAPI) => {
        if (!isMounted) return;
        setIsApiReady(true);

        const element = containerRef.current;
        if (!element) return;

        const options = {
          uri,
          width: typeof width === 'number' ? `${width}` : width,
          height: typeof height === 'number' ? `${height}` : height,
        } as any;

        const callback = (EmbedController: any) => {
          if (!isMounted) return;
          controllerRef.current = EmbedController;

          // Attempt autoplay
          EmbedController.play().catch(() => {
            /* Autoplay may fail – ignore. */
          });

          // Listen to playback updates.
          EmbedController.addListener('playback_update', (e: any) => {
            const playing = !e.data.isPaused;
            onIsPlayingChange?.(playing);
          });

          // Some browsers fire separate events for play/pause. Capture them too.
          EmbedController.addListener('play', () => onIsPlayingChange?.(true));
          EmbedController.addListener('pause', () => onIsPlayingChange?.(false));
        };

        IFrameAPI.createController(element, options, callback);
      })
      .catch((err) => {
        console.error('Spotify iframe API failed to load', err);
      });

    return () => {
      isMounted = false;
    };
  }, []); // empty deps – create once

  // When the URI changes, load it via the existing controller (if ready).
  useEffect(() => {
    if (controllerRef.current && isApiReady) {
      controllerRef.current.loadUri(uri);
      // Try to autoplay new track as well.
      controllerRef.current.play?.().catch(() => {});
    }
  }, [uri, isApiReady]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: typeof width === 'number' ? `${width}px` : width, height }}
      data-testid="spotify-player-container"
      data-track-uri={uri}
    />
  );
}