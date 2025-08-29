import React from 'react';
import { Pencil } from 'lucide-react';
import { useAuth } from '@/app/hooks/useAuth';
import { MixtapeResponse } from '@/app/client';
import { ToolbarButtonLink } from '../edit/components/toolbar/ToolbarButton';

interface EditButtonProps {
  mixtape: MixtapeResponse;
  'data-testid'?: string;
}

export default function EditButton({
  mixtape,
  'data-testid': dataTestId,
}: EditButtonProps) {
  const { user } = useAuth({ requireAuth: false });

  if (!user || user.id !== mixtape.stack_auth_user_id) {
    return null;
  }

  return (
    <ToolbarButtonLink
      href={`/mixtape/${mixtape.public_id}/edit`}
      tooltip="Edit"
      icon={<Pencil size={20} />}
      label="Edit"
      withTooltip={false}
      data-testid={dataTestId ?? 'edit-button'}
    />
  );
}
