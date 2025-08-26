import React from 'react';
import { History, RefreshCcw, CloudCheck } from 'lucide-react';
import StatusItem from './StatusItem';
import styles from './MixtapeEditorToolbar.module.scss';

interface StatusIndicatorProps {
  isUndoing: boolean;
  isRedoing: boolean;
  isSaving: boolean;
  statusText: string;
}

export default function StatusIndicator({
  isUndoing,
  isRedoing,
  isSaving,
  statusText,
}: StatusIndicatorProps) {
  if (isUndoing) {
    return (
      <StatusItem
        icon={History}
        text="Undoing..."
        iconClassName={styles.spinReverse}
      />
    );
  }

  if (isRedoing) {
    return (
      <StatusItem
        icon={History}
        text="Redoing..."
        iconClassName={`${styles.spinReverse} scale-x-[-1]`}
      />
    );
  }

  if (isSaving) {
    return (
      <StatusItem
        icon={RefreshCcw}
        text="Saving..."
        iconClassName={styles.spinReverse}
      />
    );
  }

  return (
    <StatusItem
      icon={CloudCheck}
      text={statusText}
    />
  );
}
