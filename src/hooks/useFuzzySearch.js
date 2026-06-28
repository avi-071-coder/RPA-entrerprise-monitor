/**
 * useFuzzySearch.js — Feature 10: Multi-field fuzzy search matcher
 * Implements out-of-order token matching across specified row fields.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useStreamDispatch } from '../store/streamStore.jsx';

const SEARCH_FIELDS = ['project_name', 'project_id', 'company_id', 'implementation_partner', 'country'];

/**
 * Check if a single row matches a search query.
 * @param {Object} row - Data row
 * @param {string} query - Raw search string
 * @returns {boolean}
 */
export function fuzzyMatch(row, query) {
  if (!query || !query.trim()) return true;

  const tokens = query.toLowerCase().trim().split(/\s+/);

  return tokens.every(token =>
    SEARCH_FIELDS.some(field => {
      const val = row[field];
      return val != null && String(val).toLowerCase().includes(token);
    })
  );
}

/**
 * Creates a curried matcher function for use inside Array.filter.
 * Pre-lowercases tokens once outside the loop for performance.
 * @param {string} query - Raw search string
 * @returns {(row: Object) => boolean}
 */
export function createTokenMatcher(query) {
  if (!query || !query.trim()) return () => true;

  const tokens = query.toLowerCase().trim().split(/\s+/);

  return (row) => {
    return tokens.every(token =>
      SEARCH_FIELDS.some(field => {
        const val = row[field];
        return val != null && String(val).toLowerCase().includes(token);
      })
    );
  };
}

/**
 * Custom hook for debounced fuzzy search dispatch.
 */
export default function useFuzzySearch() {
  const dispatch = useStreamDispatch();
  const [localQuery, setLocalQuery] = useState('');
  const timerRef = useRef(null);

  const setSearch = useCallback((value) => {
    setLocalQuery(value);

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      dispatch({ type: 'SEARCH_SET', payload: value });
    }, 150);
  }, [dispatch]);

  const clearSearch = useCallback(() => {
    setLocalQuery('');
    if (timerRef.current) clearTimeout(timerRef.current);
    dispatch({ type: 'SEARCH_SET', payload: '' });
  }, [dispatch]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { localQuery, setSearch, clearSearch };
}
