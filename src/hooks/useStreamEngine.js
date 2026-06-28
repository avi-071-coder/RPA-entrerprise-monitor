/**
 * useStreamEngine.js — Bridge between window.initializeRpaStream and streamStore dispatch.
 * Connects the dataStream.js pipeline to React state.
 * 
 * LIMITATION: The initializeRpaStream sets an internal setInterval that cannot be cleared
 * from outside. The isInitialized guard inside dataStream.js prevents double-initialization.
 */

import { useEffect, useRef } from 'react';
import { useStreamDispatch } from '../store/streamStore.jsx';

export default function useStreamEngine() {
  const dispatch = useStreamDispatch();
  // Use ref to always have the latest dispatch, preventing stale closure leak
  const dispatchRef = useRef(dispatch);

  useEffect(() => {
    dispatchRef.current = dispatch;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.initializeRpaStream) {
      console.warn('[useStreamEngine] window.initializeRpaStream not available');
      return;
    }

    try {
      window.initializeRpaStream((incomingBatch) => {
        // Always dispatch every batch — the reducer handles pause buffering
        dispatchRef.current({ type: 'STREAM_BATCH_RECEIVED', payload: incomingBatch });
      }, '/automation_projects.csv');
    } catch (error) {
      dispatchRef.current({ type: 'STREAM_ERROR', payload: error.message });
    }

    // Cleanup: Cannot clear the internal setInterval of dataStream.js.
    // The isInitialized guard in dataStream.js prevents re-initialization on StrictMode double-invoke.
  }, []); // Empty deps — initialize once on mount
}
