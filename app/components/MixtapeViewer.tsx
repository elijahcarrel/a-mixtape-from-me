import React from 'react';
import { useRouter } from 'next/navigation';

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

interface MixtapeViewerProps {
  mixtape: MixtapeData;
}

function CassetteSVG() {
  // Improved, more vintage cassette SVG
  return (
    <svg viewBox="0 0 340 140" width="100%" height="110" className="mx-auto mb-6 drop-shadow-lg" aria-label="Cassette tape">
      {/* Cassette body */}
      <rect x="10" y="20" width="320" height="100" rx="18" fill="#f8ecd7" stroke="#bfa76a" strokeWidth="5" />
      {/* Label area */}
      <rect x="40" y="36" width="260" height="32" rx="6" fill="#fff8e1" stroke="#bfa76a" strokeWidth="2" />
      {/* Tape window */}
      <rect x="110" y="60" width="120" height="18" rx="4" fill="#e2cfa3" stroke="#bfa76a" strokeWidth="2" />
      {/* Tape (inside window) */}
      <rect x="120" y="68" width="100" height="4" rx="2" fill="#a67c52" />
      {/* Spools */}
      <circle cx="80" cy="80" r="18" fill="#fff" stroke="#bfa76a" strokeWidth="4" />
      <circle cx="260" cy="80" r="18" fill="#fff" stroke="#bfa76a" strokeWidth="4" />
      {/* Spool holes */}
      <circle cx="80" cy="80" r="7" fill="#bfa76a" />
      <circle cx="260" cy="80" r="7" fill="#bfa76a" />
      {/* Screws */}
      <circle cx="30" cy="40" r="2.5" fill="#bfa76a" />
      <circle cx="310" cy="40" r="2.5" fill="#bfa76a" />
      <circle cx="30" cy="120" r="2.5" fill="#bfa76a" />
      <circle cx="310" cy="120" r="2.5" fill="#bfa76a" />
      {/* Bottom holes */}
      <rect x="70" y="110" width="20" height="8" rx="2" fill="#d6c08a" />
      <rect x="250" y="110" width="20" height="8" rx="2" fill="#d6c08a" />
      {/* Subtle shadow */}
      <ellipse cx="170" cy="130" rx="120" ry="8" fill="#bfa76a22" />
    </svg>
  );
}

export default function MixtapeViewer({ mixtape }: MixtapeViewerProps) {
  const router = useRouter();

  const handleNext = () => {
    if (mixtape.tracks && mixtape.tracks.length > 0) {
      router.push(`/mixtape/${mixtape.public_id}/track/1`);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start bg-amber-50 dark:bg-amber-950 overflow-hidden">
      {/* Grain overlay */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{backgroundImage: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2P4//8/AwAI/AL+Qn6nAAAAAElFTkSuQmCC")', opacity: 0.18, mixBlendMode: 'multiply'}} />
      <div className="relative z-10 w-full max-w-md px-4 pt-8 pb-24 flex flex-col items-center">
        <CassetteSVG />
        <h1 className="text-3xl sm:text-4xl font-bold text-amber-900 dark:text-amber-100 text-center mb-4 drop-shadow-sm">
          {mixtape.name}
        </h1>
        {mixtape.intro_text && (
          <p className="text-lg text-amber-800 dark:text-amber-200 text-center mb-8 whitespace-pre-line font-medium" style={{textShadow: '0 1px 0 #fff8, 0 2px 8px #bfa76a22'}}>
            {mixtape.intro_text}
          </p>
        )}
        <button
          onClick={handleNext}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 bg-amber-700 hover:bg-amber-800 text-white rounded-full shadow-lg px-8 py-4 flex items-center gap-2 text-lg font-semibold transition-all duration-200 active:scale-95"
          style={{boxShadow: '0 4px 24px #bfa76a33'}}
        >
          <span>Next</span>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="14" cy="14" r="14" fill="#fff" fillOpacity="0.18" />
            <polygon points="10,8 20,14 10,20" fill="#fff" />
          </svg>
        </button>
      </div>
    </div>
  );
} 