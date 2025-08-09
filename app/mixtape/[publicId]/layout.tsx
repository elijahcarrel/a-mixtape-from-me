"use client";

import React from 'react';
import { useParams } from 'next/navigation';

import LoadingDisplay from '../../../components/LoadingDisplay';
import ErrorDisplay from '../../../components/ErrorDisplay';
import MainContainer from '../../../components/layout/MainContainer';
import ContentPane from '../../../components/layout/ContentPane';
import { useApiRequest } from '../../../hooks/useApiRequest';
import { MixtapeResponse } from '../../../client';
import { MixtapeContext } from '../../MixtapeContext';

interface MixtapeLayoutProps {
  children: React.ReactNode;
}

export default function MixtapeLayout({ children }: MixtapeLayoutProps) {
  const params = useParams();
  const publicId = params.publicId as string;

  const {
    data: mixtape,
    loading,
    error,
    refetch,
  } = useApiRequest<MixtapeResponse>({
    url: `/api/mixtape/${publicId}`,
    method: 'GET',
  });

  if (loading) {
    return <LoadingDisplay message="Loading mixtape..." />;
  }

  if (error || !mixtape) {
    return (
      <MainContainer>
        <ContentPane>
          <ErrorDisplay message={error ?? 'Mixtape not found'} />
          <div className="text-center mt-4">
            <button
              onClick={refetch}
              className="bg-amber-800 text-white px-4 py-2 rounded hover:bg-amber-700"
            >
              Try Again
            </button>
          </div>
        </ContentPane>
      </MainContainer>
    );
  }

  return (
    <MixtapeContext.Provider value={{ mixtape, refetch }}>
      {children}
    </MixtapeContext.Provider>
  );
}