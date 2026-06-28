// analyticsPanel.jsx — Chart.js data visualization overlay.
// when the pipeline is paused, an "Analytics View" toggle reveals this panel
// with aggregated charts built from the frozen dataMap snapshot.
// when live (not paused), shows the existing summary stats.

import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useStreamState, useStreamDispatch } from '../../store/streamStore.jsx';
import { formatCurrency, formatInteger, formatPercent } from '../../utils/formatters.js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// gotta register these for chartjs to work
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

// base font/color settings for the charts
const CHART_FONT = { family: "'Inter', system-ui, sans-serif", size: 11 };
const GRID_COLOR = 'rgba(51, 65, 85, 0.4)';
const TICK_COLOR = '#64748b';

const STATUS_COLORS = {
  Active: '#4ade80',
  Completed: '#38bdf8',
  Planned: '#fbbf24',
  Failed: '#f87171',
};

const INDUSTRY_COLORS = [
  '#38bdf8', '#4ade80', '#fbbf24', '#f87171', '#22d3ee',
  '#a78bfa', '#fb923c', '#e879f9', '#34d399', '#f472b6',
];

// aggregate data from the frozen dataMap for chart rendering.
function aggregateData(dataMap) {
  const statusCounts = {};
  const industryMap = {};
  const deptMap = {};
  let totalBudget = 0;
  let totalSavings = 0;
  let totalRoi = 0;
  let count = 0;

  for (const row of dataMap.values()) {
    count++;
    // group by status
    const status = row.project_status || 'Unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;

    // sum up savings by industry
    const ind = row.industry || 'Unknown';
    if (!industryMap[ind]) industryMap[ind] = 0;
    industryMap[ind] += (row.annual_savings_usd || 0);

    // avg roi per department
    const dept = row.department || 'Unknown';
    if (!deptMap[dept]) deptMap[dept] = { totalRoi: 0, count: 0 };
    deptMap[dept].totalRoi += (row.roi_percent || 0);
    deptMap[dept].count++;

    totalBudget += (row.budget_usd || 0);
    totalSavings += (row.annual_savings_usd || 0);
    totalRoi += (row.roi_percent || 0);
  }

  const topIndustries = Object.entries(industryMap)
    .map(([name, savings]) => ([name, { savings }]))
    .sort((a, b) => b[1].savings - a[1].savings)
    .slice(0, 5);

  const deptRoi = Object.entries(deptMap)
    .map(([dept, data]) => ({ dept, avgRoi: data.totalRoi / data.count }))
    .sort((a, b) => b.avgRoi - a.avgRoi)
    .slice(0, 5);

  return { statusCounts, topIndustries, deptRoi, totalBudget, totalSavings, totalRoi, count };
}

// chart.js overlay panel — only renders charts when pipeline is paused
// and user clicks "Analytics View".
export default function AnalyticsPanel() {
  const { viewPool, isPaused, dataMap } = useStreamState();
  const dispatch = useStreamDispatch();
  const [showCharts, setShowCharts] = useState(false);

  // hide charts if we unpause so we dont crash the browser
  useEffect(() => {
    if (!isPaused) setShowCharts(false);
  }, [isPaused]);

  const toggleCharts = useCallback(() => {
    if (!isPaused) {
      dispatch({ type: 'TOGGLE_PAUSE' });
      setShowCharts(true);
    } else {
      setShowCharts(prev => !prev);
    }
  }, [isPaused, dispatch]);

  // memoize the chart data so it doesnt lag
  const chartData = useMemo(() => {
    if (!showCharts || !isPaused || dataMap.size === 0) return null;
    return aggregateData(dataMap);
  }, [showCharts, isPaused, dataMap]);

  // quick stats shown before you open the charts
  const stats = useMemo(() => {
    if (viewPool.length === 0) return null;
    const statusCounts = {};
    let totalBudget = 0, totalSavings = 0, totalRoi = 0;
    for (const row of viewPool) {
      statusCounts[row.project_status] = (statusCounts[row.project_status] || 0) + 1;
      totalBudget += row.budget_usd || 0;
      totalSavings += row.annual_savings_usd || 0;
      totalRoi += row.roi_percent || 0;
    }
    return {
      statusCounts,
      avgRoi: totalRoi / viewPool.length,
      totalBudget,
      totalSavings,
      count: viewPool.length,
    };
  }, [viewPool]);

  // ─── Chart configurations ───

  const statusChartData = useMemo(() => {
    if (!chartData) return null;
    const labels = Object.keys(chartData.statusCounts);
    const data = Object.values(chartData.statusCounts);
    return {
      labels,
      datasets: [{
        data,
        backgroundColor: labels.map(l => STATUS_COLORS[l] || '#64748b'),
        borderColor: 'transparent',
        borderWidth: 0,
        hoverOffset: 6,
      }],
    };
  }, [chartData]);

  const industryChartData = useMemo(() => {
    if (!chartData) return null;
    return {
      labels: chartData.topIndustries.map(([name]) => name.length > 14 ? name.slice(0, 12) + '…' : name),
      datasets: [{
        label: 'Savings ($)',
        data: chartData.topIndustries.map(([, d]) => d.savings),
        backgroundColor: INDUSTRY_COLORS.slice(0, chartData.topIndustries.length).map(c => c + '99'),
        borderColor: INDUSTRY_COLORS.slice(0, chartData.topIndustries.length),
        borderWidth: 1,
        borderRadius: 4,
      }],
    };
  }, [chartData]);

  const deptRoiChartData = useMemo(() => {
    if (!chartData) return null;
    return {
      labels: chartData.deptRoi.map(d => d.dept.length > 14 ? d.dept.slice(0, 12) + '…' : d.dept),
      datasets: [{
        label: 'Avg ROI %',
        data: chartData.deptRoi.map(d => parseFloat(d.avgRoi.toFixed(2))),
        backgroundColor: chartData.deptRoi.map(d =>
          d.avgRoi >= 100 ? '#4ade8099' : d.avgRoi >= 50 ? '#fbbf2499' : '#f8717199'
        ),
        borderColor: chartData.deptRoi.map(d =>
          d.avgRoi >= 100 ? '#4ade80' : d.avgRoi >= 50 ? '#fbbf24' : '#f87171'
        ),
        borderWidth: 1,
        borderRadius: 4,
      }],
    };
  }, [chartData]);

  const doughnutOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: TICK_COLOR, font: CHART_FONT, padding: 8, boxWidth: 10, usePointStyle: true },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#e2e8f0',
        bodyColor: '#e2e8f0',
        borderColor: '#334155',
        borderWidth: 1,
        titleFont: CHART_FONT,
        bodyFont: CHART_FONT,
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.parsed.toLocaleString()} projects`,
        },
      },
    },
  }), []);

  const barOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#e2e8f0',
        bodyColor: '#e2e8f0',
        borderColor: '#334155',
        borderWidth: 1,
        titleFont: CHART_FONT,
        bodyFont: CHART_FONT,
        callbacks: {
          label: (ctx) => ` $${(ctx.parsed.x / 1e6).toFixed(1)}M`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: GRID_COLOR },
        ticks: {
          color: TICK_COLOR,
          font: CHART_FONT,
          callback: (v) => `$${(v / 1e6).toFixed(0)}M`,
        },
      },
      y: {
        grid: { display: false },
        ticks: { color: TICK_COLOR, font: { ...CHART_FONT, size: 10 } },
      },
    },
  }), []);

  const roiBarOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#e2e8f0',
        bodyColor: '#e2e8f0',
        borderColor: '#334155',
        borderWidth: 1,
        titleFont: CHART_FONT,
        bodyFont: CHART_FONT,
        callbacks: {
          label: (ctx) => ` ${ctx.parsed.x.toFixed(2)}%`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: GRID_COLOR },
        ticks: {
          color: TICK_COLOR,
          font: CHART_FONT,
          callback: (v) => `${v}%`,
        },
      },
      y: {
        grid: { display: false },
        ticks: { color: TICK_COLOR, font: { ...CHART_FONT, size: 10 } },
      },
    },
  }), []);

  if (!stats) {
    return (
      <div className="analytics-panel">
        <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Loading...</p>
      </div>
    );
  }

  const MAX_EXPECTED = 20000;
  const maxStatus = Math.max(...Object.values(stats.statusCounts), MAX_EXPECTED);

  return (
    <div className="analytics-panel">
      <h3 className="analytics-title">View Analytics</h3>

      {/* close button when charts are visible */}
      {showCharts && (
        <button
          className="analytics-toggle-btn analytics-toggle-active"
          onClick={toggleCharts}
        >
          <span className="analytics-toggle-icon">📈</span>
          Close Analytics
        </button>
      )}

      {/* massive CTA when charts are hidden */}
      {!showCharts && (
        <div className="analytics-empty-cta">
          <div className="cta-icon-pulse">📊</div>
          <h4>Live Analytics Engine</h4>
          <p>Analyzing telemetry in real-time. Generating charts requires pausing the stream to prevent frame drops.</p>
          <button className="massive-safe-check-btn" onClick={toggleCharts}>
            {!isPaused ? 'Safe Check Analytics' : 'Analytics View'}
          </button>
        </div>
      )}

      {/* ─── chart.js overlay (paused + toggled on) ─── */}
      {showCharts && isPaused && chartData && (
        <div className="analytics-charts-overlay">
          <div className="analytics-chart-section">
            <h4 className="chart-section-title">Project Status Distribution</h4>
            <div className="chart-container chart-container-sm">
              <Doughnut data={statusChartData} options={doughnutOptions} />
            </div>
          </div>

          <div className="analytics-chart-section">
            <h4 className="chart-section-title">Top Industries by Savings</h4>
            <div className="chart-container chart-container-md">
              <Bar data={industryChartData} options={barOptions} />
            </div>
          </div>

          <div className="analytics-chart-section">
            <h4 className="chart-section-title">Avg ROI by Department</h4>
            <div className="chart-container chart-container-md">
              <Bar data={deptRoiChartData} options={roiBarOptions} />
            </div>
          </div>

          <div className="analytics-snapshot-info">
            <span className="snapshot-badge">
              📸 Snapshot of {formatInteger(chartData.count)} rows
            </span>
            <span className="snapshot-detail">
              Avg ROI: {formatPercent(chartData.avgRoi)}
            </span>
            <span className="snapshot-detail">
              Total Budget: {formatCurrency(chartData.totalBudget)}
            </span>
          </div>
        </div>
      )}

      {/* ─── existing summary stats (always visible) ─── */}
      <div className="analytics-stats">
        <div className="analytics-stat">
          <span className="stat-label">Avg ROI</span>
          <span className="stat-value">{formatPercent(stats.avgRoi)}</span>
        </div>
        <div className="analytics-stat">
          <span className="stat-label">Total Budget</span>
          <span className="stat-value">{formatCurrency(stats.totalBudget)}</span>
        </div>
        <div className="analytics-stat">
          <span className="stat-label">Total Savings</span>
          <span className="stat-value">{formatCurrency(stats.totalSavings)}</span>
        </div>
        {Object.entries(stats.statusCounts).map(([status, count]) => (
          <div key={status}>
            <div className="analytics-stat">
              <span className="stat-label">{status}</span>
              <span className="stat-value">{formatInteger(count)}</span>
            </div>
            <div className="stat-bar">
              <div className="stat-bar-fill" style={{
                width: `${count === 0 ? 0 : Math.min(100, Math.max(2, (count / maxStatus) * 100 + Math.log10(count + 1) * 2.5))}%`,
                background: status === 'Active' ? 'var(--accent-green)' : status === 'Completed' ? 'var(--accent-blue)' : status === 'Failed' ? 'var(--accent-red)' : 'var(--accent-amber)'
              }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
