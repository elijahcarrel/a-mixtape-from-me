'use client';

// No page-level data fetching necessary – Mixtape is provided by layout context
import { useMixtape } from '../../MixtapeContext';
import MixtapeEditor from '../../../components/MixtapeEditor';
import MainContainer from '../../../components/layout/MainContainer';
import ContentPane from '../../../components/layout/ContentPane';

export default function EditMixtapePage() {
  const { mixtape, refetch } = useMixtape();

  return (
    <MainContainer>
      <ContentPane>
        <MixtapeEditor mixtape={mixtape} onMixtapeClaimed={refetch} />
      </ContentPane>
    </MainContainer>
  );
} 