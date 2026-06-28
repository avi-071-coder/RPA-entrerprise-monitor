/**
 * useVirtualScroll.js — Custom row-recycling virtualization engine.
 * DOM contains only visible rows (max ~30 nodes) instead of all 50,000.
 * Uses rAF-throttled scroll handler for 60fps performance.
 */

import { useState, useRef, useCallback, useMemo } from 'react';

const ROW_HEIGHT = 40; // Fixed row height in pixels
const MAX_VISIBLE = 30; // Hard cap on DOM nodes

export default function useVirtualScroll(totalItems, containerHeight) {
  const [scrollTop, setScrollTop] = useState(0);
  const rafRef = useRef(null);
  const scrollTopRef = useRef(0);

  const handleScroll = useCallback((e) => {
    scrollTopRef.current = e.target.scrollTop;

    if (rafRef.current) return; // Already scheduled

    rafRef.current = requestAnimationFrame(() => {
      setScrollTop(scrollTopRef.current);
      rafRef.current = null;
    });
  }, []);

  const { visibleRange, totalHeight } = useMemo(() => {
    const effectiveHeight = containerHeight || 600;
    let visibleCount = Math.ceil(effectiveHeight / ROW_HEIGHT) + 2; // overscan buffer
    visibleCount = Math.min(visibleCount, MAX_VISIBLE);

    const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 1);
    const endIndex = Math.min(totalItems - 1, startIndex + visibleCount - 1);
    const totalHeight = totalItems * ROW_HEIGHT;

    return {
      visibleRange: { startIndex, endIndex },
      totalHeight,
    };
  }, [scrollTop, totalItems, containerHeight]);

  return {
    visibleRange,
    totalHeight,
    handleScroll,
    rowHeight: ROW_HEIGHT,
  };
}

export { ROW_HEIGHT };
