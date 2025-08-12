import React from 'react';
import HeaderContainer from './layout/HeaderContainer';
import { MixtapeResponse } from '../client';
import EditButton from './EditButton';

interface MixtapeViewerToolbarProps {
  mixtape: MixtapeResponse;
}

export default function MixtapeViewerToolbar({ mixtape }: MixtapeViewerToolbarProps) {
  return (
    <HeaderContainer>
      <EditButton mixtape={mixtape} />
    </HeaderContainer>
  );
}
