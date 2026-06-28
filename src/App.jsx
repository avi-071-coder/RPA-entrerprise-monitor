import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useStreamState } from './store/streamStore.jsx';
import useStreamEngine from './hooks/useStreamEngine.js';
import KPIStrip from './components/KPIStrip/KPIStrip.jsx';
import DataGrid from './components/DataGrid/DataGrid.jsx';
import PipelineControl from './components/PipelineControl/PipelineControl.jsx';
import LayoutManager from './components/LayoutManager/LayoutManager.jsx';
import FilterPanel from './components/FilterPanel/FilterPanel.jsx';
import SearchBar from './components/SearchBar/SearchBar.jsx';
import InfraToggles from './components/InfraToggles/InfraToggles.jsx';
import AnalyticsPanel from './components/AnalyticsPanel/AnalyticsPanel.jsx';

function AppContent() {
  useStreamEngine();

  const { layout } = useStreamState();
  const showGrid = layout.gridWindow;
  const showSidebar = layout.analyticsChart;

  const contentRef = useRef(null);

  // Adaptive grid columns:
  // Both visible  → grid gets ~76%, sidebar gets ~24% (fixed 240px)
  // Only grid     → grid fills 100%
  // Only sidebar  → sidebar fills 100%
  const gridColumns = (() => {
    if (showGrid && showSidebar) return 'minmax(0, 1fr) 240px';
    return 'minmax(0, 1fr)';
  })();

  return (
    <div className="app-root">
      <header className="app-header">
        <h1 className="app-title">
          <span className="title-dot"></span>
          RPA Enterprise Monitor 2026
        </h1>

        <div className="header-controls">
          <PipelineControl />
          <LayoutManager />
        </div>
      </header>

      <KPIStrip />

      <main className="main-content">
        <div ref={contentRef} className="content-layout" style={{ 
          display: 'grid', 
          gridTemplateColumns: gridColumns,
          width: '100%',
          height: '100%',
          overflow: 'hidden'
        }}>
          {showGrid && (
            <div className="main-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, borderRight: showSidebar ? '2px solid var(--border-bright)' : 'none' }}>
              <div className="toolbar-row">
                <SearchBar />
                <FilterPanel />
              </div>
              <div className="grid-panel">
                <DataGrid />
              </div>
            </div>
          )}

          {showSidebar && (
            <aside className="sidebar-panel" style={{ 
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
            }}>
              <AnalyticsPanel />
              <InfraToggles />
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}

export default AppContent;
