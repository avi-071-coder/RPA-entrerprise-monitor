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

  const layoutClass = (showGrid && showSidebar) 
    ? 'layout-state-both' 
    : (showSidebar ? 'layout-state-sidebar' : 'layout-state-grid');

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
        <div ref={contentRef} className={`content-layout ${layoutClass}`}>
          {showGrid && (
            <div className="main-panel">
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
