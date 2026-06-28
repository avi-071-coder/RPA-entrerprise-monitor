// sortUtils.js — Multi-column sort comparator for the data grid.
// must complete in <150ms for 50,000 rows using a single Array.sort call.

const NUMERIC_COLUMNS = new Set([
  'budget_usd',
  'roi_percent',
  'employee_hours_saved',
  'robots_deployed',
  'annual_savings_usd',
]);

// multi-column sort function.
// @param {Array} data - Array of row objects (not mutated)
// @param {Array} sortPriority - [{ column: string, direction: 'asc'|'desc' }, ...]
// @returns {Array} New sorted array
export function multiColumnSort(data, sortPriority) {
  if (!sortPriority || sortPriority.length === 0) return data;

  // Pre-compute direction multipliers and column types for performance
  const priorities = sortPriority.map(p => ({
    column: p.column,
    multiplier: p.direction === 'desc' ? -1 : 1,
    isNumeric: NUMERIC_COLUMNS.has(p.column),
  }));

  return [...data].sort((a, b) => {
    for (let i = 0; i < priorities.length; i++) {
      const { column, multiplier, isNumeric } = priorities[i];
      let comparison;

      if (isNumeric) {
        const aVal = Number(a[column]) || 0;
        const bVal = Number(b[column]) || 0;
        comparison = aVal - bVal;
      } else if (column === 'project_status') {
        const statusOrder = { 'Completed': 1, 'Active': 2, 'Planned': 3, 'Failed': 4 };
        const aRank = statusOrder[a[column]] || 99;
        const bRank = statusOrder[b[column]] || 99;
        comparison = aRank - bRank;
      } else if (column === 'internal_uid') {
        const aVal = Number(String(a[column] || '').replace(/[^0-9]/g, '')) || 0;
        const bVal = Number(String(b[column] || '').replace(/[^0-9]/g, '')) || 0;
        comparison = aVal - bVal;
      } else {
        const aVal = String(a[column] || '');
        const bVal = String(b[column] || '');
        comparison = aVal.localeCompare(bVal);
      }

      if (comparison !== 0) {
        return comparison * multiplier;
      }
      // Equal at this priority — fall through to next
    }
    return 0;
  });
}
