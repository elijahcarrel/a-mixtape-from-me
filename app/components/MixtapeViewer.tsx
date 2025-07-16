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
  // Cassette SVG inspired by the provided reference image
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
      {/* Spools */}
      <g>
        <circle cx="120" cy="140" r="32" fill="#fff" stroke="#bfa76a" strokeWidth="4" />
        <circle cx="280" cy="140" r="32" fill="#fff" stroke="#bfa76a" strokeWidth="4" />
        {/* Spool teeth */}
        {[...Array(8)].map((_, i) => {
          const angle = (i * Math.PI) / 4;
          const x1 = 120 + Math.cos(angle) * 12;
          const y1 = 140 + Math.sin(angle) * 12;
          const x2 = 120 + Math.cos(angle) * 20;
          const y2 = 140 + Math.sin(angle) * 20;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#bfa76a" strokeWidth="2" />;
        })}
        {[...Array(8)].map((_, i) => {
          const angle = (i * Math.PI) / 4;
          const x1 = 280 + Math.cos(angle) * 12;
          const y1 = 140 + Math.sin(angle) * 12;
          const x2 = 280 + Math.cos(angle) * 20;
          const y2 = 140 + Math.sin(angle) * 20;
          return <line key={i+8} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#bfa76a" strokeWidth="2" />;
        })}
        {/* Spool holes */}
        <circle cx="120" cy="140" r="10" fill="#bfa76a" />
        <circle cx="280" cy="140" r="10" fill="#bfa76a" />
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