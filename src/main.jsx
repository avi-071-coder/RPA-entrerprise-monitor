import React from 'react';
import ReactDOM from 'react-dom/client';
import { StreamProvider } from './store/streamStore.jsx';
import AppContent from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>⚠️ Dashboard Error</h2>
          <pre>{this.state.error?.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <StreamProvider>
        <AppContent />
      </StreamProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
