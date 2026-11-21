'use client';

import { useCallback, useState } from 'react';

/**
 * Tracks which "Add new" form is open from a combo box, and the text typed
 * before it was opened (handy to pre-fill the new record's name).
 *
 *   const addNew = useAddNew<'client' | 'project'>();
 *   <ComboBox addNew onAddNew={(typed) => addNew.open('client', typed)} … />
 *   <FormModal open={addNew.is('client')} onClose={addNew.close}> … </FormModal>
 */
export function useAddNew<K extends string>() {
  const [state, setState] = useState<{ kind: K; seed: string } | null>(null);
  const open = useCallback((kind: K, seed = '') => setState({ kind, seed }), []);
  const close = useCallback(() => setState(null), []);
  return {
    open,
    close,
    is: (kind: K) => state?.kind === kind,
    seed: state?.seed ?? '',
  };
}
