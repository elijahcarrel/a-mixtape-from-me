'use client';

import MainContainer from '../../components/layout/MainContainer';
import ContentPane from '../../components/layout/ContentPane';
import MixtapeViewer from '../../components/MixtapeViewer';
import { useMixtape } from '../MixtapeContext';

export default function ViewMixtapePage() {
  const { mixtape } = useMixtape();

  return (
    <MainContainer>
      <ContentPane>
        <MixtapeViewer mixtape={mixtape} />
      </ContentPane>
    </MainContainer>
  );
} 