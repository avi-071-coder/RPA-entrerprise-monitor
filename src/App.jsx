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

  // Mobile App-like Tab Navigation State
  const [mobileTab, setMobileTab] = useState('grid'); // 'grid' | 'analytics'

  return (
    <div className={`app-root mobile-active-${mobileTab}`}>
      <header className="app-header">
        <h1 className="app-title">
          <span className="title-dot"></span>
          RPA Enterprise Monitor
        </h1>

        <div className="header-controls">
          <PipelineControl />
          <div className="desktop-layout-manager">
            <LayoutManager />
          </div>
        </div>
      </header>

      <div className="kpi-wrapper">
        <KPIStrip />
      </div>

      <main className="main-content">
        <div ref={contentRef} className={`content-layout ${layoutClass}`}>
          <div className="main-panel">
            <div className="toolbar-row">
              <SearchBar />
              <FilterPanel />
            </div>
            <div className="grid-panel">
              <DataGrid />
            </div>
          </div>

          <aside className="sidebar-panel" style={{ 
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
          }}>
            <AnalyticsPanel />
            <InfraToggles />
          </aside>
        </div>
      </main>

      {// ─── mobile bottom navigation ───}
      <nav className="mobile-bottom-nav">
        <button 
          className={`mobile-nav-btn ${mobileTab === 'grid' ? 'active' : ''}`}
          onClick={() => setMobileTab('grid')}
        >
          <span className="icon">≡</span> 
          <span>Data Grid</span>
        </button>
        <button 
          className={`mobile-nav-btn ${mobileTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setMobileTab('analytics')}
        >
          <span className="icon">📊</span> 
          <span>Analytics</span>
        </button>
      </nav>
    </div>
  );
}

export default AppContent;
