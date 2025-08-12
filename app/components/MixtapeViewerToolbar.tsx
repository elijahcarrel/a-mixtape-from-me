import React from 'react';
import { MixtapeResponse } from '../client';
import EditButton from './EditButton';
import HeaderContainer from './layout/HeaderContainer';

interface MixtapeViewerToolbarProps {
  mixtape: MixtapeResponse;
}

export default function MixtapeViewerToolbar({ mixtape }: MixtapeViewerToolbarProps) {
  return (
    <HeaderContainer>
      <div className="flex items-center space-x-1 sm:space-x-2">
        <EditButton mixtape={mixtape} />
      </div>
    </HeaderContainer>
  );
}
