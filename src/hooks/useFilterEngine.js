/**
 * useFilterEngine.js — Feature 7: Categorical filter logic.
 * Extracts unique filter options from dataMap with debounced recomputation.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useStreamState, useStreamDispatch } from '../store/streamStore.jsx';

const FILTER_FIELDS = ['automation_type', 'department', 'industry', 'project_status'];

export default function useFilterEngine() {
  const { dataMap, filters } = useStreamState();
  const dispatch = useStreamDispatch();
  const [filterOptions, setFilterOptions] = useState({
    automation_type: ['API', 'UI', 'Hybrid'],
    department: [],
    industry: [],
    project_status: ['Active', 'Completed', 'Failed', 'Planned'],
  });
  const dataMapRef = useRef(dataMap);
  useEffect(() => {
    dataMapRef.current = dataMap;
  }, [dataMap]);

  useEffect(() => {
    const runComputation = () => {
      const currentDataMap = dataMapRef.current;
      const options = {};
      for (const field of FILTER_FIELDS) {
        const uniqueSet = new Set();
        for (const row of currentDataMap.values()) {
          if (row[field]) uniqueSet.add(row[field]);
        }
        options[field] = Array.from(uniqueSet).sort();
      }
      
      // Ensure fixed categories are always present even if they haven't appeared in the stream yet
      options.automation_type = Array.from(new Set([...(options.automation_type || []), 'API', 'UI', 'Hybrid'])).sort();
      options.project_status = Array.from(new Set([...(options.project_status || []), 'Active', 'Completed', 'Failed', 'Planned'])).sort();
      
      setFilterOptions(options);
    };

    // Initial run to populate options quickly
    const initialTimer = setTimeout(runComputation, 1000);

    // Periodic run to catch new dynamic fields like department/industry
    const interval = setInterval(runComputation, 5000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  const setFilter = useCallback((field, values) => {
    dispatch({ type: 'FILTER_SET', payload: { field, values } });
  }, [dispatch]);

  return { filterOptions, activeFilters: filters, setFilter };
}
