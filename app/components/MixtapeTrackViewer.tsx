import React, { useEffect, useRef } from 'react';

interface Track {
  track_position: number;
  track_text?: string;
  spotify_uri: string;
}

interface MixtapeData {
  public_id: string;
  name: string;
  intro_text?: string;
  is_public: boolean;
  create_time: string;
  last_modified_time: string;
  tracks: Track[];
  stack_auth_user_id?: string;
}

interface MixtapeTrackViewerProps {
  mixtape: MixtapeData;
  track: Track;
  trackNumber: number;
  onPrevTrack?: () => void;
  onNextTrack?: () => void;
}

function AnimatedCassetteSVG({ spinning }: { spinning: boolean }) {
  // Animate the spools with CSS
  return (
    <svg viewBox="0 0 400 220" width="100%" height="180" className="mx-auto mb-6 drop-shadow-lg" aria-label="Cassette tape">
      {/* Outer black body */}
      <rect x="8" y="8" width="384" height="204" rx="12" fill="#232323" stroke="#111" strokeWidth="4" />
      {/* Screws */}
      <circle cx="24" cy="24" r="4" fill="#bbb" stroke="#888" strokeWidth="1.5" />
      <circle cx="376" cy="24" r="4" fill="#bbb" stroke="#888" strokeWidth="1.5" />
      <circle cx="24" cy="196" r="4" fill="#bbb" stroke="#888" strokeWidth="1.5" />
      <circle cx="376" cy="196" r="4" fill="#bbb" stroke="#888" strokeWidth="1.5" />
      {/* Label area */}
      <rect x="32" y="24" width="336" height="60" rx="4" fill="#e6e6d6" stroke="#bfa76a" strokeWidth="2" />
      {/* Label lines */}
      <line x1="48" y1="44" x2="352" y2="44" stroke="#bfa76a" strokeWidth="1" />
      <line x1="48" y1="56" x2="352" y2="56" stroke="#bfa76a" strokeWidth="1" />
      <line x1="48" y1="68" x2="352" y2="68" stroke="#bfa76a" strokeWidth="1" />
      {/* Colored stripes */}
      <rect x="32" y="84" width="336" height="14" fill="#e74c3c" />
      <rect x="32" y="98" width="336" height="14" fill="#f39c12" />
      <rect x="32" y="112" width="336" height="14" fill="#f7d358" />
      {/* Spools (animated) */}
      <g>
        <g className={spinning ? 'cassette-spool-spin' : ''} style={{ transformOrigin: '120px 140px' }}>
          <circle cx="120" cy="140" r="32" fill="#fff" stroke="#bfa76a" strokeWidth="4" />
          {[...Array(8)].map((_, i) => {
            const angle = (i * Math.PI) / 4;
            const x1 = 120 + Math.cos(angle) * 12;
            const y1 = 140 + Math.sin(angle) * 12;
            const x2 = 120 + Math.cos(angle) * 20;
            const y2 = 140 + Math.sin(angle) * 20;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#bfa76a" strokeWidth="2" />;
          })}
          <circle cx="120" cy="140" r="10" fill="#bfa76a" />
        </g>
        <g className={spinning ? 'cassette-spool-spin' : ''} style={{ transformOrigin: '280px 140px' }}>
          <circle cx="280" cy="140" r="32" fill="#fff" stroke="#bfa76a" strokeWidth="4" />
          {[...Array(8)].map((_, i) => {
            const angle = (i * Math.PI) / 4;
            const x1 = 280 + Math.cos(angle) * 12;
            const y1 = 140 + Math.sin(angle) * 12;
            const x2 = 280 + Math.cos(angle) * 20;
            const y2 = 140 + Math.sin(angle) * 20;
            return <line key={i+8} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#bfa76a" strokeWidth="2" />;
          })}
          <circle cx="280" cy="140" r="10" fill="#bfa76a" />
        </g>
      </g>
      {/* Tape between spools */}
      <rect x="152" y="134" width="96" height="12" rx="6" fill="#7c4a03" />
      {/* Bottom holes */}
      <rect x="60" y="192" width="24" height="10" rx="2" fill="#bbb" />
      <rect x="316" y="192" width="24" height="10" rx="2" fill="#bbb" />
      <rect x="192" y="192" width="16" height="10" rx="2" fill="#bbb" />
      {/* Side A label */}
      <rect x="40" y="36" width="24" height="24" rx="3" fill="#6b3e26" />
      <text x="52" y="54" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#fff" fontFamily="monospace">A</text>
    </svg>
  );
}

export default function MixtapeTrackViewer({ mixtape, track, trackNumber, onPrevTrack, onNextTrack }: MixtapeTrackViewerProps) {
  // Add spinning animation class to spools
  useEffect(() => {
    // Add CSS for spinning animation if not present
    if (!document.getElementById('cassette-spool-spin-style')) {
      const style = document.createElement('style');
      style.id = 'cassette-spool-spin-style';
      style.innerHTML = `
        .cassette-spool-spin {
          animation: cassette-spin 3s linear infinite;
        }
        @keyframes cassette-spin {
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between bg-amber-50 dark:bg-amber-950 overflow-hidden pb-40">
      {/* Grain overlay */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{backgroundImage: 'url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2P4//8/AwAI/AL+Qn6nAAAAAElFTkSuQmCC\")', opacity: 0.18, mixBlendMode: 'multiply'}} />
      <div className="relative z-10 w-full max-w-md px-4 pt-8 flex flex-col items-center">
        <AnimatedCassetteSVG spinning={true} />
        <div className="w-full text-center mb-4">
          <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-1 truncate">{mixtape.name}</h2>
          <div className="text-sm text-amber-700 dark:text-amber-200 mb-2">Track {trackNumber} of {mixtape.tracks.length}</div>
          <div className="text-xl font-semibold text-amber-800 dark:text-amber-100 mb-2 truncate">{track.track_text}</div>
        </div>
        {track.track_text && (
          <div className="w-full bg-amber-100/70 dark:bg-amber-900/40 rounded-lg p-4 mb-6 text-amber-900 dark:text-amber-100 text-base shadow-inner whitespace-pre-line" style={{textShadow: '0 1px 0 #fff8, 0 2px 8px #bfa76a22'}}>
            {track.track_text}
          </div>
        )}
        <div className="flex w-full justify-between mt-2 mb-4">
          <button
            onClick={onPrevTrack}
            disabled={!onPrevTrack}
            className="px-4 py-2 rounded-lg font-medium bg-amber-700 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-800 transition-all"
          >
            Prev
          </button>
          <button
            onClick={onNextTrack}
            disabled={!onNextTrack}
            className="px-4 py-2 rounded-lg font-medium bg-amber-700 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-800 transition-all"
          >
            Next
          </button>
        </div>
      </div>
      {/* Spotify embed at the bottom */}
      <div className="fixed bottom-0 left-0 w-full z-20 flex justify-center bg-gradient-to-t from-amber-100/90 dark:from-amber-950/90 to-transparent pb-2">
        <iframe
          data-testid="spotify-embed"
          style={{ borderRadius: 12 }}
          src={`https://open.spotify.com/embed/track/${track.spotify_uri.replace('spotify:track:', '')}?utm_source=generator`}
          width="100%"
          height="152"
          frameBorder="0"
          allowFullScreen={false}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        ></iframe>
      </div>
    </div>
  );
} 