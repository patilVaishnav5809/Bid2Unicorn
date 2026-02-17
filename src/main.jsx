import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

import ErrorBoundary from '@/components/ErrorBoundary';

window.onerror = function(message, source, lineno, colno, error) {
  document.body.innerHTML = `<div style="color:red; padding:20px;">
    <h1>Global Error Caught</h1>
    <p>${message}</p>
    <p>${source}:${lineno}:${colno}</p>
    <pre>${error?.stack}</pre>
  </div>`;
};

window.onunhandledrejection = function(event) {
    document.body.innerHTML = `<div style="color:red; padding:20px;">
    <h1>Unhandled Promise Rejection</h1>
    <p>${event.reason}</p>
  </div>`;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
