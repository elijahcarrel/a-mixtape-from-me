'use client';

import { useMixtape } from '../../MixtapeContext';
import MixtapeEditor from '../../../components/MixtapeEditor';
import MainContainer from '../../../components/layout/MainContainer';
import ContentPane from '../../../components/layout/ContentPane';

export default function EditMixtapePage() {
  const { mixtape, refetch, onMixtapeUpdated } = useMixtape();

  return (
    <MainContainer>
      <ContentPane>
        <MixtapeEditor 
          mixtape={mixtape} 
          onMixtapeClaimed={refetch}
          onMixtapeUpdated={onMixtapeUpdated}
        />
      </ContentPane>
    </MainContainer>
  );
} 