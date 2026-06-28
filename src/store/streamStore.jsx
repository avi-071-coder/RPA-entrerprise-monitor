// streamStore.jsx — Central State Engine (useReducer + Context API)
// manages the entire data pipeline state for the RPA Monitor dashboard.

import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { multiColumnSort } from '../utils/sortUtils.js';
import { createTokenMatcher } from '../hooks/useFuzzySearch.js';

const StreamStateContext = createContext(null);
const StreamDispatchContext = createContext(null);

const MAX_PENDING_QUEUE = 1000;

// Load persisted layout from localStorage
function loadLayout() {
  try {
    const stored = localStorage.getItem('rpa_monitor_layout');
    if (stored) return JSON.parse(stored);
  } catch (e) {
    // ignore
  }
  return { gridWindow: true, analyticsChart: true, infraToggles: true };
}

const initialState = {
  dataMap: new Map(),
  viewPool: [],
  viewDirty: false,
  sortPriority: [],
  filters: { automation_type: [], department: [], industry: [], project_status: [] },
  infraFilters: { ai_enabled: [], cloud_deployment: [] },
  searchQuery: '',
  isPaused: false,
  pendingQueue: [],
  totalRowsProcessed: 0,
  kpiRobotsDeployed: 0,
  kpiCumulativeSavings: 0,
  layout: loadLayout(),
  streamError: null,
};

function streamReducer(state, action) {
  switch (action.type) {
    case 'STREAM_BATCH_RECEIVED': {
      if (state.isPaused) {
        // Buffer to pending queue with cap
        let newQueue = [...state.pendingQueue, ...action.payload];
        if (newQueue.length > MAX_PENDING_QUEUE) {
          newQueue = newQueue.slice(-MAX_PENDING_QUEUE);
        }
        return { ...state, pendingQueue: newQueue };
      }

      const newMap = new Map(state.dataMap);
      let deltaRobots = 0;
      let deltaSavings = 0;
      let newRows = 0;

      for (const row of action.payload) {
        const uid = row.internal_uid;
        if (!uid) continue;

        const existing = newMap.get(uid);
        if (existing) {
          // Compute KPI deltas from existing values
          deltaRobots += (row.robots_deployed || 0) - (existing.robots_deployed || 0);
          deltaSavings += (row.annual_savings_usd || 0) - (existing.annual_savings_usd || 0);
        } else {
          // Initial load — add row
          deltaRobots += (row.robots_deployed || 0);
          deltaSavings += (row.annual_savings_usd || 0);
          newRows++;
        }
        newMap.set(uid, row);
      }

      return {
        ...state,
        dataMap: newMap,
        totalRowsProcessed: newMap.size,
        kpiRobotsDeployed: state.kpiRobotsDeployed + deltaRobots,
        kpiCumulativeSavings: state.kpiCumulativeSavings + deltaSavings,
        viewDirty: true,
      };
    }

    case 'SORT_SET':
      return {
        ...state,
        sortPriority: [{ column: action.payload.column, direction: action.payload.direction }],
        viewDirty: true,
      };

    case 'SORT_MULTI_ADD': {
      const { column } = action.payload;
      const existing = state.sortPriority.findIndex(s => s.column === column);
      let newPriority;

      if (existing !== -1) {
        // Toggle direction
        newPriority = state.sortPriority.map((s, i) =>
          i === existing ? { ...s, direction: s.direction === 'asc' ? 'desc' : 'asc' } : s
        );
      } else if (state.sortPriority.length < 3) {
        newPriority = [...state.sortPriority, { column, direction: 'asc' }];
      } else {
        return state; // Max 3 sort columns
      }

      return { ...state, sortPriority: newPriority, viewDirty: true };
    }

    case 'FILTER_SET':
      return {
        ...state,
        filters: { ...state.filters, [action.payload.field]: action.payload.values },
        viewDirty: true,
      };

    case 'INFRA_FILTER_SET':
      return {
        ...state,
        infraFilters: { ...state.infraFilters, [action.payload.field]: action.payload.values },
        viewDirty: true,
      };

    case 'SEARCH_SET':
      return { ...state, searchQuery: action.payload, viewDirty: true };

    case 'PAUSE_TOGGLE': {
      if (state.isPaused) {
        // Resuming — flush pending queue
        const newMap = new Map(state.dataMap);
        let deltaRobots = 0;
        let deltaSavings = 0;

        for (const row of state.pendingQueue) {
          const uid = row.internal_uid;
          if (!uid) continue;
          const existing = newMap.get(uid);
          if (existing) {
            deltaRobots += (row.robots_deployed || 0) - (existing.robots_deployed || 0);
            deltaSavings += (row.annual_savings_usd || 0) - (existing.annual_savings_usd || 0);
          } else {
            deltaRobots += (row.robots_deployed || 0);
            deltaSavings += (row.annual_savings_usd || 0);
          }
          newMap.set(uid, row);
        }

        return {
          ...state,
          isPaused: false,
          dataMap: newMap,
          pendingQueue: [],
          totalRowsProcessed: newMap.size,
          kpiRobotsDeployed: state.kpiRobotsDeployed + deltaRobots,
          kpiCumulativeSavings: state.kpiCumulativeSavings + deltaSavings,
          viewDirty: true,
        };
      }

      return { ...state, isPaused: true };
    }

    case 'LAYOUT_SET':
      return {
        ...state,
        layout: { ...state.layout, [action.payload.panelId]: action.payload.visible },
      };

    case 'VIEW_RECOMPUTED':
      return { ...state, viewPool: action.payload, viewDirty: false };

    case 'STREAM_ERROR':
      return { ...state, streamError: action.payload };

    default:
      return state;
  }
}

// pure function to recompute the view pool (filtered + sorted array).
// called from useEffect, NOT from the reducer.
export function recomputeViewPool(dataMap, sortPriority, filters, searchQuery, infraFilters) {
  let data = Array.from(dataMap.values());

  // Apply categorical filters
  for (const [field, values] of Object.entries(filters)) {
    if (values && values.length > 0) {
      const valueSet = new Set(values);
      data = data.filter(row => valueSet.has(row[field]));
    }
  }

  // Apply infra filters
  if (infraFilters) {
    for (const [field, values] of Object.entries(infraFilters)) {
      if (values && values.length > 0) {
        const valueSet = new Set(values);
        data = data.filter(row => valueSet.has(row[field]));
      }
    }
  }

  // Apply fuzzy search
  if (searchQuery && searchQuery.trim()) {
    const matcher = createTokenMatcher(searchQuery);
    data = data.filter(matcher);
  }

  // Apply sorting
  if (sortPriority && sortPriority.length > 0) {
    data = multiColumnSort(data, sortPriority);
  }

  return data;
}

export function StreamProvider({ children }) {
  const [state, dispatch] = useReducer(streamReducer, initialState);
  const rafRef = useRef(null);

  // Recompute viewPool when dirty, scheduled via rAF
  useEffect(() => {
    if (!state.viewDirty) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      const newView = recomputeViewPool(
        state.dataMap,
        state.sortPriority,
        state.filters,
        state.searchQuery,
        state.infraFilters
      );
      dispatch({ type: 'VIEW_RECOMPUTED', payload: newView });
    });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [state.viewDirty, state.dataMap, state.sortPriority, state.filters, state.searchQuery, state.infraFilters]);

  // Persist layout to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('rpa_monitor_layout', JSON.stringify(state.layout));
    } catch (e) {
      // ignore
    }
  }, [state.layout]);

  return (
    <StreamStateContext.Provider value={state}>
      <StreamDispatchContext.Provider value={dispatch}>
        {children}
      </StreamDispatchContext.Provider>
    </StreamStateContext.Provider>
  );
}

export function useStreamState() {
  const context = useContext(StreamStateContext);
  if (!context) throw new Error('useStreamState must be used within StreamProvider');
  return context;
}

export function useStreamDispatch() {
  const context = useContext(StreamDispatchContext);
  if (!context) throw new Error('useStreamDispatch must be used within StreamProvider');
  return context;
}
