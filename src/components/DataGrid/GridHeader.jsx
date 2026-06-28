/**
 * GridHeader.jsx — Features 4 + 9: Sortable column headers with visual sort indicators.
 * Supports single-click sort and Shift+click multi-sort.
 */

import React from 'react';
import useSortEngine from '../../hooks/useSortEngine.js';

const SORTABLE_COLUMNS = new Set([
  'budget_usd', 'roi_percent', 'employee_hours_saved',
  'robots_deployed', 'annual_savings_usd',
]);

const GridHeader = React.memo(function GridHeader({ columns }) {
  const { sortPriority, handleHeaderClick } = useSortEngine();

  const getSortIndicator = (columnKey) => {
    const idx = sortPriority.findIndex(s => s.column === columnKey);
    if (idx === -1) {
      return SORTABLE_COLUMNS.has(columnKey) ? <span className="sort-icon sort-neutral">⇅</span> : null;
    }
    const dir = sortPriority[idx].direction;
    const arrow = dir === 'asc' ? '↑' : '↓';
    if (sortPriority.length > 1) {
      return <span className="sort-icon sort-active">{arrow}<sup>{idx + 1}</sup></span>;
    }
    return <span className="sort-icon sort-active">{arrow}</span>;
  };

  return (
    <div className="grid-header">
      {columns.map(col => {
        const sortable = SORTABLE_COLUMNS.has(col.key);
        return (
          <div
            key={col.key}
            className={`header-cell ${sortable ? 'header-sortable' : ''} ${col.key === 'project_id' ? 'sticky-col' : ''}`}
            style={{ width: col.width, minWidth: col.width }}
            onClick={sortable ? (e) => handleHeaderClick(col.key, e) : undefined}
            title={sortable ? 'Click to sort | Shift+Click to multi-sort' : col.label}
          >
            <span className="header-label">{col.label}</span>
            {getSortIndicator(col.key)}
          </div>
        );
      })}
    </div>
  );
});

export default GridHeader;
