// gridRow.jsx — Feature 3: Single row in the virtual grid with alert flash capability.
// memoized with custom comparator for performance.
// all formatting via formatters.js utilities.

import React from 'react';
import { isAlertRow, formatCurrency, formatInteger, formatPercent } from '../../utils/formatters.js';

function GridRowInner({ row, style, columns }) {
  const alert = isAlertRow(row);

  const renderCell = (col) => {
    const val = row[col.key];

    switch (col.key) {
      case 'budget_usd':
      case 'annual_savings_usd':
        return <span className="cell-currency">{formatCurrency(val)}</span>;

      case 'roi_percent': {
        const num = Number(val) || 0;
        const colorClass = num < 50 ? 'roi-negative' : num <= 100 ? 'roi-warning' : 'roi-positive';
        return <span className={`cell-roi ${colorClass}`}>{formatPercent(val)}</span>;
      }

      case 'robots_deployed':
      case 'employee_hours_saved':
        return <span className="cell-number">{formatInteger(val)}</span>;

      case 'project_status': {
        const statusClass = {
          'Active': 'badge-active',
          'Completed': 'badge-completed',
          'Complete': 'badge-completed',
          'Planned': 'badge-planned',
          'Failed': 'badge-failed',
          'Fail': 'badge-failed',
        }[val] || 'badge-default';
        return <span className={`status-badge ${statusClass}`}>{val}</span>;
      }

      case 'ai_enabled':
      case 'cloud_deployment':
        return (
          <span className={`pill-badge ${val === 'Yes' ? 'pill-yes' : 'pill-no'}`}>
            {val}
          </span>
        );

      default:
        return <span className="cell-text" title={val}>{val}</span>;
    }
  };

  return (
    <div
      className={`grid-row ${alert ? 'row--alert' : ''}`}
      style={style}
      data-uid={row.internal_uid}
    >
      {columns.map(col => (
        <div
          key={col.key}
          className={`grid-cell ${col.key === 'project_id' ? 'sticky-col' : ''}`}
          style={{ width: col.width, minWidth: col.width }}
        >
          {renderCell(col)}
        </div>
      ))}
    </div>
  );
}

const GridRow = React.memo(GridRowInner, (prevProps, nextProps) => {
  const prev = prevProps.row;
  const next = nextProps.row;
  return (
    prev.internal_uid === next.internal_uid &&
    prev.annual_savings_usd === next.annual_savings_usd &&
    prev.roi_percent === next.roi_percent &&
    prev.project_status === next.project_status &&
    prevProps.style.top === nextProps.style.top
  );
});

export default GridRow;
