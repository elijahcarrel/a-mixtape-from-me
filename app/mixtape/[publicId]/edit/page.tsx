'use client';

import { useMixtape } from '../../MixtapeContext';
import MixtapeEditor from '../../../components/MixtapeEditor';
import MainContainer from '../../../components/layout/MainContainer';
import ContentPane from '../../../components/layout/ContentPane';
import { MixtapeResponse } from '../../../client';

interface EditMixtapePageProps {
  onMixtapeUpdated?: (updatedMixtape: MixtapeResponse) => void;
}

export default function EditMixtapePage({ onMixtapeUpdated }: EditMixtapePageProps) {
  const { mixtape, refetch } = useMixtape();

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