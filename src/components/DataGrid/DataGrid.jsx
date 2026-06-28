// dataGrid.jsx — Feature 8: Virtualized DOM grid container.
// custom virtual scroll with max ~30 DOM nodes regardless of dataset size.
// NO external virtualization libraries.
// header scrolls horizontally in sync with the grid body.

import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useStreamState, useStreamDispatch } from '../../store/streamStore.jsx';
import useVirtualScroll from '../../hooks/useVirtualScroll.js';
import GridHeader from './GridHeader.jsx';
import GridRow from './GridRow.jsx';

const COLUMNS = [
  { key: 'project_id', label: 'Project ID', width: 100 },
  { key: 'project_name', label: 'Project Name', width: 200 },
  { key: 'project_status', label: 'Status', width: 110 },
  { key: 'automation_type', label: 'Type', width: 150 },
  { key: 'robots_deployed', label: 'Robots', width: 80 },
  { key: 'budget_usd', label: 'Budget', width: 120 },
  { key: 'annual_savings_usd', label: 'Savings', width: 130 },
  { key: 'roi_percent', label: 'ROI %', width: 90 },
  { key: 'employee_hours_saved', label: 'Hrs Saved', width: 100 },
  { key: 'department', label: 'Department', width: 160 },
  { key: 'industry', label: 'Industry', width: 160 },
  { key: 'country', label: 'Country', width: 130 },
  { key: 'implementation_partner', label: 'Partner', width: 160 },
];

const DataGrid = React.memo(function DataGrid() {
  const { viewPool, isPaused } = useStreamState();
  const dispatch = useStreamDispatch();
  const containerRef = useRef(null);
  const headerWrapperRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(600);

  // Track container height with ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Prevent diagonal scrolling by locking wheel events to a single dominant axis
  const wheelLockRef = useRef({ active: false, axis: null, timeout: null });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      const lock = wheelLockRef.current;
      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);

      if (!lock.active) {
        if (absX > 2 || absY > 2) {
          lock.active = true;
          lock.axis = absX > absY ? 'x' : 'y';
        }
      }

      if (lock.active) {
        if (lock.axis === 'x') {
          if (absY > 0) {
            e.preventDefault();
            el.scrollLeft += e.deltaX;
          }
        } else if (lock.axis === 'y') {
          if (absX > 0) {
            e.preventDefault();
            el.scrollTop += e.deltaY;
          }
        }
      }

      clearTimeout(lock.timeout);
      lock.timeout = setTimeout(() => {
        lock.active = false;
        lock.axis = null;
      }, 100);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);


  const { visibleRange, totalHeight, handleScroll: baseHandleScroll, rowHeight } = useVirtualScroll(
    viewPool.length,
    containerHeight
  );

  // Sync header horizontal scroll with grid body scroll
  const handleScroll = useCallback((e) => {
    baseHandleScroll(e);
    if (headerWrapperRef.current) {
      headerWrapperRef.current.scrollLeft = e.target.scrollLeft;
    }
  }, [baseHandleScroll]);

  // Handle delegated row clicks when paused
  const handleRowClick = useCallback((e) => {
    if (!isPaused) return;
    const rowEl = e.target.closest('.grid-row');
    if (!rowEl) return;
    const uid = rowEl.getAttribute('data-uid');
    if (uid) {
      const rowData = viewPool.find(r => r.internal_uid === uid);
      if (rowData) {
        dispatch({ type: 'SET_INSPECTED_PROJECT', payload: rowData });
      }
    }
  }, [isPaused, viewPool, dispatch]);

  const visibleRows = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    if (viewPool.length === 0) return [];
    const rows = [];
    for (let i = startIndex; i <= Math.min(endIndex, viewPool.length - 1); i++) {
      rows.push({ ...viewPool[i], _virtualTop: i * rowHeight, _index: i });
    }
    return rows;
  }, [viewPool, visibleRange, rowHeight]);

  const totalWidth = useMemo(() => COLUMNS.reduce((sum, c) => sum + c.width, 0), []);

  return (
    <div className="data-grid-wrapper" style={{ flex: '1 1 auto', minWidth: 0, overflow: 'hidden' }}>

      {/* header scrolls horizontally in sync — overflow hidden, scrollleft set by js */}
      <div
        ref={headerWrapperRef}
        className="grid-header-wrapper"
        style={{ overflowX: 'hidden', width: '100%', minWidth: 0 }}
      >
        <div style={{ width: totalWidth }}>
          <GridHeader columns={COLUMNS} />
        </div>
      </div>
      <div
        ref={containerRef}
        className={`grid-scroll-container ${isPaused ? 'paused-interactive' : ''}`}
        onScroll={handleScroll}
        onClick={handleRowClick}
        style={{ minWidth: 0, width: '100%' }}
      >
        {viewPool.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-title">No projects match your filters</div>
            <div className="empty-state-desc">Try adjusting your search criteria or clearing your active filters to see more results.</div>
          </div>
        ) : (
          <div
            className="grid-scroll-inner"
            style={{ height: totalHeight, width: totalWidth, position: 'relative' }}
          >
            {visibleRows.map(row => (
              <GridRow
                key={row.internal_uid}
                row={row}
                style={{
                  position: 'absolute',
                  top: row._virtualTop,
                  height: rowHeight,
                  width: '100%',
                }}
                columns={COLUMNS}
              />
            ))}
          </div>
        )}
      </div>
      <div className="grid-status-bar">
        <span>{viewPool.length.toLocaleString()} of 50,000 rows</span>
      </div>
    </div>
  );
});

export default DataGrid;
