import React from 'react';
import { useRouter } from 'next/navigation';
import CassetteSVG from './CassetteSVG';
import { MixtapeResponse } from '../client';
import EditButton from './EditButton';

interface MixtapeViewerProps {
  mixtape: MixtapeResponse;
}

export default function MixtapeViewer({ mixtape }: MixtapeViewerProps) {
  const router = useRouter();

  const handleNext = () => {
    if (mixtape.tracks && mixtape.tracks.length > 0) {
      router.push(`/mixtape/${mixtape.public_id}/track/1`);
    }
  };

  // Prepare label text for the cassette
  const labelText = {
    line1: mixtape.name,
    line2: mixtape.cassette_text ? mixtape.cassette_text.split('\n')[0] : undefined,
    line3: mixtape.cassette_text && mixtape.cassette_text.split('\n').length > 1 
      ? mixtape.cassette_text.split('\n')[1] : undefined,
    line4: mixtape.cassette_text && mixtape.cassette_text.split('\n').length > 2 
      ? mixtape.cassette_text.split('\n')[2] : undefined,
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start overflow-hidden">
      <EditButton mixtape={mixtape} />
      {/* Grain overlay */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{backgroundImage: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2P4//8/AwAI/AL+Qn6nAAAAAElFTkSuQmCC")', opacity: 0.18, mixBlendMode: 'multiply'}} />
      <div className="relative z-10 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl 2xl:max-w-3xl px-4 sm:px-6 pt-4 sm:pt-8 pb-20 sm:pb-24 flex flex-col items-center">
        <CassetteSVG isAnimated={false} labelText={labelText} />
        {mixtape.intro_text && (
          <p className="text-base sm:text-lg text-amber-800 dark:text-amber-200 text-center mb-6 sm:mb-8 whitespace-pre-line font-medium px-2" style={{textShadow: '0 1px 0 #fff8, 0 2px 8px #bfa76a22'}}>
            {mixtape.intro_text}
          </p>
        )}
        <button
          onClick={handleNext}
          className="fixed bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 bg-amber-700 hover:bg-amber-800 text-white rounded-full shadow-lg px-6 sm:px-8 py-3 sm:py-4 flex items-center gap-2 text-base sm:text-lg font-semibold transition-all duration-200 active:scale-95"
          style={{boxShadow: '0 4px 24px #bfa76a33'}}
        >
          <span>Next</span>
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-7 sm:h-7">
            <circle cx="14" cy="14" r="14" fill="#fff" fillOpacity="0.18" />
            <polygon points="10,8 20,14 10,20" fill="#fff" />
          </svg>
        </button>
      </div>
    </div>
  );
} 