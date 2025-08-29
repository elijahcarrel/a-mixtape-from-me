import React, { createContext, useContext } from 'react';
import { MixtapeResponse } from '@/app/client';

interface MixtapeContextValue {
  mixtape: MixtapeResponse;
  /**
   * Re-fetch the mixtape from the API. This is most commonly used after an update
   * (e.g. claiming or editing the mixtape) so that consumers can show fresh
   * data without forcing a full navigation or refresh.
   */
  refetch: () => void;
  /**
   * Callback to update the mixtape in the context with new data from API responses.
   * This is used by the editor to propagate changes (save, undo, redo) to all
   * components that consume the mixtape context.
   */
  onMixtapeUpdated: (updatedMixtape: MixtapeResponse) => void;
}

// We intentionally initialise with "undefined" so that we can throw a helpful
// error when the context is used outside of its provider.
const MixtapeContext = createContext<MixtapeContextValue | undefined>(
  undefined
);

export function useMixtape() {
  const ctx = useContext(MixtapeContext);
  if (ctx === undefined) {
    throw new Error('useMixtape must be used within a MixtapeProvider');
  }
  return ctx;
}

export type { MixtapeContextValue };
export { MixtapeContext };
