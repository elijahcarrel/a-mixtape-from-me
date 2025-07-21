import React from 'react';
import { useRouter } from 'next/navigation';
import CassetteSVG from './CassetteSVG';

interface TrackDetails {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; width: number; height: number }>;
  };
  uri: string;
}

interface Track {
  track_position: number;
  track_text?: string;
  track: TrackDetails;
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
        <CassetteSVG isAnimated={false} />
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