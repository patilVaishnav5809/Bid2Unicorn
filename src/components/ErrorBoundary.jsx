import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', color: '#dc2626', backgroundColor: '#fef2f2', borderRadius: '8px', margin: '20px' }}>
          <h1 style={{ marginBottom: '10px' }}>Something went wrong.</h1>
          <p style={{ color: '#666' }}>Please refresh the page or contact support if the issue persists.</p>
          {isDev && (
            <details style={{ whiteSpace: 'pre-wrap', marginTop: '16px', fontSize: '12px', color: '#333' }}>
              <summary>Error Details (Dev Only)</summary>
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
