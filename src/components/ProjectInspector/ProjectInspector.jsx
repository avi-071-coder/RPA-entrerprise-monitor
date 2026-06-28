import React, { useEffect } from 'react';
import { useStreamState, useStreamDispatch } from '../../store/streamStore.jsx';
import { formatCurrency, formatInteger, formatPercent } from '../../utils/formatters.js';

const ProjectInspector = () => {
  const { inspectedProject } = useStreamState();
  const dispatch = useStreamDispatch();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && inspectedProject) {
        dispatch({ type: 'CLEAR_INSPECTED_PROJECT' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inspectedProject, dispatch]);

  if (!inspectedProject) return null;

  const handleClose = () => {
    dispatch({ type: 'CLEAR_INSPECTED_PROJECT' });
  };

  // Group attributes for a clean display
  const excludeFields = ['internal_uid', 'project_id', 'project_name', 'project_status']; // Internal fields to hide

  const renderFieldValue = (key, val) => {
    if (val === null || val === undefined || val === '') return <span className="inspector-null">N/A</span>;
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    
    // Formatting based on known keys
    if (key.includes('usd')) return formatCurrency(val);
    if (key.includes('percent') || key === 'roi') return formatPercent(val);
    if (typeof val === 'number') return formatInteger(val);
    
    return String(val);
  };

  const getStatusClass = (status) => {
    return {
      'Active': 'badge-active',
      'Completed': 'badge-completed',
      'Complete': 'badge-completed',
      'Planned': 'badge-planned',
      'Failed': 'badge-failed',
      'Fail': 'badge-failed'
    }[status] || 'badge-default';
  };

  const formatLabel = (key) => {
    const customLabels = {
      'project_id': 'Project ID',
      'company_id': 'Company ID',
      'budget_usd': 'Budget (USD)',
      'roi_percent': 'ROI %',
      'annual_savings_usd': 'Savings (USD)'
    };
    if (customLabels[key]) return customLabels[key];
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getDurationMonths = (start, end) => {
    if (!start || !end) return null;
    const d1 = new Date(start);
    const d2 = new Date(end);
    if (isNaN(d1) || isNaN(d2)) return null;
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.round(diffDays / 30);
  };

  const isFinancialField = (key) => ['budget_usd', 'annual_savings_usd', 'roi_percent'].includes(key);
  const durationMonths = getDurationMonths(inspectedProject.start_date, inspectedProject.completion_date);

  return (
    <div className="inspector-overlay" onClick={handleClose}>
      <div className="inspector-panel" onClick={(e) => e.stopPropagation()}>
        
        <div className="inspector-header">
          <div className="inspector-title-group">
            <h3>{inspectedProject.project_name}</h3>
            <span className={`status-badge ${getStatusClass(inspectedProject.project_status)}`}>
              {inspectedProject.project_status}
            </span>
          </div>
          <button className="inspector-close-btn" onClick={handleClose} title="Close Inspector (Esc)">
            ✕
          </button>
        </div>

        <div className="inspector-body">
          <div className="inspector-section">
            <h4 className="inspector-section-title">Core Details</h4>
            <div className="inspector-grid">
              <div className="inspector-field">
                <span className="field-label">Project ID</span>
                <span className="field-value">{inspectedProject.project_id}</span>
              </div>
              <div className="inspector-field">
                <span className="field-label">Company ID</span>
                <span className="field-value">{inspectedProject.company_id}</span>
              </div>
              {durationMonths !== null && (
                <div className="inspector-field">
                  <span className="field-label">Project Duration</span>
                  <span className="field-value">{durationMonths} months</span>
                </div>
              )}
              {Object.entries(inspectedProject).map(([key, val]) => {
                if (excludeFields.includes(key) || key === 'company_id') return null;
                return (
                  <div className={`inspector-field ${isFinancialField(key) ? 'financial-field' : ''}`} key={key}>
                    <span className="field-label">{formatLabel(key)}</span>
                    <span className="field-value">{renderFieldValue(key, val)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="inspector-footer">
          <p>Data frozen at snapshot time.</p>
        </div>

      </div>
    </div>
  );
};

export default ProjectInspector;
