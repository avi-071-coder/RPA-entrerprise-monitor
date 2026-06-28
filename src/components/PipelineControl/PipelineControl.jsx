// pipelineControl.jsx — Feature 5: Pause/Play toggle for the data stream.
// the dataStream.js interval CANNOT be stopped — "Pause" means the UI stops updating
// while the store buffers incoming batches into pendingQueue.

import React from 'react';
import { useStreamState, useStreamDispatch } from '../../store/streamStore.jsx';

const PipelineControl = React.memo(function PipelineControl() {
  const { isPaused, pendingQueue } = useStreamState();
  const dispatch = useStreamDispatch();

  const handleToggle = () => {
    dispatch({ type: 'PAUSE_TOGGLE' });
  };

  return (
    <div className="pipeline-control">
      {isPaused ? (
        <>
          <span className="pipeline-indicator pipeline-paused">
            <span className="pulse-dot pulse-red"></span>
            PAUSED
          </span>
          <span className="pipeline-buffered">{pendingQueue.length} rows buffered</span>
          <button className="pipeline-btn pipeline-btn-resume" onClick={handleToggle}>
            ▶ RESUME
          </button>
        </>
      ) : (
        <>
          <span className="pipeline-indicator pipeline-live">
            <span className="pulse-dot pulse-green"></span>
            LIVE
          </span>
          <button className="pipeline-btn pipeline-btn-pause" onClick={handleToggle}>
            ⏸ PAUSE
          </button>
        </>
      )}
    </div>
  );
});

export default PipelineControl;
