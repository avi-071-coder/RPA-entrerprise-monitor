/**
 * KPIStrip.jsx — Feature 1: Live-updating KPI counter strip.
 * Uses React.memo with per-card memoization for minimal re-renders.
 * CSS animation flash on value change (no JS timers).
 */

import React, { useRef, useEffect } from 'react';
import { useStreamState } from '../../store/streamStore.jsx';
import { formatCurrency, formatInteger } from '../../utils/formatters.js';

const KPICard = React.memo(function KPICard({ label, value, accentClass }) {
  const spanRef = useRef(null);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prevValueRef.current !== value && spanRef.current) {
      spanRef.current.classList.remove('kpi-flash');
      // Trigger reflow to restart animation
      void spanRef.current.offsetWidth;
      spanRef.current.classList.add('kpi-flash');
    }
    prevValueRef.current = value;
  }, [value]);

  return (
    <div className={`kpi-card ${accentClass}`}>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value" ref={spanRef}>{value}</span>
    </div>
  );
});

const KPIStrip = React.memo(function KPIStrip() {
  const { totalRowsProcessed, kpiRobotsDeployed, kpiCumulativeSavings } = useStreamState();

  return (
    <div className="kpi-strip">
      <KPICard
        label="TOTAL ROWS PROCESSED"
        value={formatInteger(totalRowsProcessed)}
        accentClass="kpi-accent-amber"
      />
      <KPICard
        label="ACTIVE ROBOTS DEPLOYED"
        value={formatInteger(kpiRobotsDeployed)}
        accentClass="kpi-accent-blue"
      />
      <KPICard
        label="GLOBAL CUMULATIVE SAVINGS"
        value={formatCurrency(kpiCumulativeSavings)}
        accentClass="kpi-accent-green"
      />
    </div>
  );
});

export default KPIStrip;
