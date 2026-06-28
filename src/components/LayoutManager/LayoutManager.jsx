// layoutManager.jsx — Feature 6: Show/hide UI panels with localStorage persistence.
// toggles for Grid Window, Department Analytics, and Infrastructure Toggles.

import React, { useEffect, useRef } from 'react';
import { useStreamState, useStreamDispatch } from '../../store/streamStore.jsx';

const PANELS = [
  { id: 'gridWindow', label: 'Grid Window' },
  { id: 'analyticsChart', label: 'Analytics' },
];

const LayoutManager = React.memo(function LayoutManager() {
  const { layout } = useStreamState();
  const dispatch = useStreamDispatch();
  const initialized = useRef(false);

  // Load layout from localStorage on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      const stored = localStorage.getItem('rpa_monitor_layout');
      if (stored) {
        const parsed = JSON.parse(stored);
        for (const [panelId, visible] of Object.entries(parsed)) {
          dispatch({ type: 'LAYOUT_SET', payload: { panelId, visible } });
        }
      }
    } catch (e) {
      // ignore
    }
  }, [dispatch]);

  const handleToggle = (panelId) => {
    dispatch({ type: 'LAYOUT_SET', payload: { panelId, visible: !layout[panelId] } });
  };

  return (
    <div className="layout-manager">
      {PANELS.map(panel => (
        <button
          key={panel.id}
          className={`layout-toggle ${layout[panel.id] ? 'layout-visible' : 'layout-hidden'}`}
          onClick={() => handleToggle(panel.id)}
          title={`${layout[panel.id] ? 'Hide' : 'Show'} ${panel.label}`}
        >
          <span className="layout-icon">{layout[panel.id] ? '👁' : '👁‍🗨'}</span>
          <span className="layout-label">{panel.label}</span>
        </button>
      ))}
    </div>
  );
});

export default LayoutManager;
