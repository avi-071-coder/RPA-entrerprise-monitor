// csvExport.js — client-side snapshot export
// takes the current viewPool (already sorted + filtered) and triggers a .csv download
// uses chunked processing via setTimeout so the stream doesn't freeze

const CSV_COLUMNS = [
  { key: 'project_id', header: 'Project ID' },
  { key: 'project_name', header: 'Project Name' },
  { key: 'project_status', header: 'Status' },
  { key: 'automation_type', header: 'Automation Type' },
  { key: 'robots_deployed', header: 'Robots Deployed' },
  { key: 'budget_usd', header: 'Budget (USD)' },
  { key: 'annual_savings_usd', header: 'Annual Savings (USD)' },
  { key: 'roi_percent', header: 'ROI %' },
  { key: 'employee_hours_saved', header: 'Employee Hours Saved' },
  { key: 'department', header: 'Department' },
  { key: 'industry', header: 'Industry' },
  { key: 'country', header: 'Country' },
  { key: 'implementation_partner', header: 'Implementation Partner' },
];

// escape fields that contain commas, quotes, or newlines
function escapeCSV(value) {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// builds csv string in chunks so we don't block the main thread
export function exportSnapshotCSV(viewPool) {
  return new Promise((resolve) => {
    const headerRow = CSV_COLUMNS.map(c => c.header).join(',');
    const chunks = [headerRow];
    const CHUNK_SIZE = 500;
    let i = 0;

    function processChunk() {
      const end = Math.min(i + CHUNK_SIZE, viewPool.length);
      for (; i < end; i++) {
        const row = viewPool[i];
        const line = CSV_COLUMNS.map(c => escapeCSV(row[c.key])).join(',');
        chunks.push(line);
      }

      if (i < viewPool.length) {
        // yield to the browser so the stream keeps running
        setTimeout(processChunk, 0);
      } else {
        // done — trigger the download
        const csvContent = chunks.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
        const filename = `RPA_Snapshot_${timestamp}.csv`;

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();

        // cleanup
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);

        resolve(viewPool.length);
      }
    }

    processChunk();
  });
}
