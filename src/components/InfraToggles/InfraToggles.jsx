// infraToggles.jsx — Infrastructure filter toggles (ai_enabled, cloud_deployment).
// dispatches INFRA_FILTER_SET for binary Yes/No filtering.
// CSS-only toggle switches.

import React, { useState, useCallback } from 'react';
import { useStreamState, useStreamDispatch } from '../../store/streamStore.jsx';

const InfraToggles = React.memo(function InfraToggles() {
  const { infraFilters } = useStreamState();
  const dispatch = useStreamDispatch();

  const aiEnabled = infraFilters?.ai_enabled?.length > 0;
  const cloudDeployed = infraFilters?.cloud_deployment?.length > 0;

  const handleAiToggle = useCallback(() => {
    dispatch({
      type: 'INFRA_FILTER_SET',
      payload: { field: 'ai_enabled', values: aiEnabled ? [] : ['Yes'] },
    });
  }, [dispatch, aiEnabled]);

  const handleCloudToggle = useCallback(() => {
    dispatch({
      type: 'INFRA_FILTER_SET',
      payload: { field: 'cloud_deployment', values: cloudDeployed ? [] : ['Yes'] },
    });
  }, [dispatch, cloudDeployed]);

  return (
    <div className="infra-toggles-panel">
      <h3 className="infra-title">Infrastructure Filters</h3>
      <div className="infra-toggle-group">
        <label className="toggle-label">
          <span className="toggle-text">AI Enabled Only</span>
          <div className={`toggle-switch ${aiEnabled ? 'toggle-on' : ''}`} onClick={handleAiToggle}>
            <div className="toggle-knob"></div>
          </div>
        </label>
        <label className="toggle-label">
          <span className="toggle-text">Cloud Deployed Only</span>
          <div className={`toggle-switch ${cloudDeployed ? 'toggle-on' : ''}`} onClick={handleCloudToggle}>
            <div className="toggle-knob"></div>
          </div>
        </label>
      </div>
    </div>
  );
});

export default InfraToggles;
