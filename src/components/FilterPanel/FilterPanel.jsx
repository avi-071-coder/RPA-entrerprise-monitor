// filterPanel.jsx — Feature 7: Categorical filter dropdowns with multi-select.
// three dropdowns: automation_type, department, industry.
// active filters shown as dismissible chips.

import React, { useState, useRef, useEffect, useCallback } from 'react';
import useFilterEngine from '../../hooks/useFilterEngine.js';
import { useStreamDispatch, useStreamState } from '../../store/streamStore.jsx';

const FILTER_LABELS = {
  project_status: 'Status',
  automation_type: 'Automation Type',
  department: 'Department',
  industry: 'Industry',
};

function FilterDropdown({ field, label, options, selected, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const selectedSet = new Set(selected);
  const selectedCount = selected.length;

  const handleCheckbox = (value) => {
    if (selectedSet.has(value)) {
      onSelect(field, selected.filter(v => v !== value));
    } else {
      onSelect(field, [...selected, value]);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onSelect(field, []);
    setIsOpen(false);
  };

  return (
    <div className="filter-dropdown" ref={dropdownRef}>
      <button
        className={`filter-dropdown-btn ${selectedCount > 0 ? 'filter-active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="filter-btn-label">{label}</span>
        <span className="filter-btn-count">
          {selectedCount > 0 ? `(${selectedCount})` : 'All'}
        </span>
        <span className="filter-btn-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="filter-dropdown-panel">
          <div className="filter-panel-header">
            <span>{label}</span>
            {selectedCount > 0 && (
              <button className="filter-clear-btn" onClick={handleClear}>Clear</button>
            )}
          </div>
          <div className="filter-options-list">
            {options.map(opt => (
              <label key={opt} className="filter-option">
                <input
                  type="checkbox"
                  checked={selectedSet.has(opt)}
                  onChange={() => handleCheckbox(opt)}
                />
                <span className="filter-option-text">{opt}</span>
              </label>
            ))}
            {options.length === 0 && (
              <div className="filter-loading">Loading options...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SortDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const dispatch = useStreamDispatch();
  const { sortPriority } = useStreamState();

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const handleSort = (column, direction) => {
    dispatch({ type: 'SORT_SET', payload: { column, direction } });
    setIsOpen(false);
  };

  const activeSortColumn = sortPriority && sortPriority.length > 0 ? sortPriority[0].column : null;

  return (
    <div className="filter-dropdown" ref={dropdownRef} style={{ marginRight: '8px' }}>
      <button
        className={`filter-dropdown-btn ${activeSortColumn ? 'filter-active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Sort Data"
      >
        <span className="filter-btn-label">⇅ Sort</span>
        <span className="filter-btn-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="filter-dropdown-panel">
          <div className="filter-panel-header">
            <span>Sort By</span>
            {activeSortColumn && (
              <button className="filter-clear-btn" onClick={() => dispatch({ type: 'SORT_SET', payload: { column: '', direction: 'asc' } })}>Clear</button>
            )}
          </div>
          <div className="filter-options-list">
            <label className="filter-option">
              <input
                type="checkbox"
                checked={activeSortColumn === 'project_status'}
                onChange={() => handleSort('project_status', 'asc')}
              />
              <span className="filter-option-text">Status</span>
            </label>
            <label className="filter-option">
              <input
                type="checkbox"
                checked={activeSortColumn === 'internal_uid'}
                onChange={() => handleSort('internal_uid', 'asc')}
              />
              <span className="filter-option-text">ID</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

const FilterPanel = React.memo(function FilterPanel() {
  const { filterOptions, activeFilters, setFilter } = useFilterEngine();

  return (
    <div className="filter-panel">
      <SortDropdown />
      {Object.entries(FILTER_LABELS).map(([field, label]) => (
        <FilterDropdown
          key={field}
          field={field}
          label={label}
          options={filterOptions[field] || []}
          selected={activeFilters[field] || []}
          onSelect={setFilter}
        />
      ))}

      {/* active filter chips */}
      <div className="filter-chips">
        {Object.entries(activeFilters).map(([field, values]) =>
          values.map(val => (
            <span key={`${field}-${val}`} className="filter-chip">
              {val}
              <button
                className="chip-dismiss"
                onClick={() => setFilter(field, activeFilters[field].filter(v => v !== val))}
              >
                ✕
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
});

export default FilterPanel;
