// useSortEngine.js — Sort dispatch logic for single and multi-column sorting.
// handles Shift+click for multi-sort (max 3 columns) vs regular click for single sort.

import { useCallback } from 'react';
import { useStreamState, useStreamDispatch } from '../store/streamStore.jsx';

export default function useSortEngine() {
  const { sortPriority } = useStreamState();
  const dispatch = useStreamDispatch();

  const handleHeaderClick = useCallback((column, event) => {
    if (event && event.shiftKey) {
      // Multi-sort: add to priority or toggle existing
      dispatch({ type: 'SORT_MULTI_ADD', payload: { column } });
    } else {
      // Single sort: replace all priorities
      const existing = sortPriority.find(s => s.column === column);
      const direction = existing
        ? (existing.direction === 'asc' ? 'desc' : 'asc')
        : 'asc';
      dispatch({ type: 'SORT_SET', payload: { column, direction } });
    }
  }, [dispatch, sortPriority]);

  return { sortPriority, handleHeaderClick };
}
