import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: error.message
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo: errorInfo.componentStack || error.message
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          backgroundColor: '#fee2e2',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '600px',
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h1 style={{
              color: '#dc2626',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '16px'
            }}>
              Application Error
            </h1>
            <p style={{
              color: '#374151',
              marginBottom: '16px',
              lineHeight: '1.5'
            }}>
              Something went wrong. Please refresh the page or contact support if the problem persists.
            </p>
            <div style={{
              backgroundColor: '#f3f4f6',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '16px',
              maxHeight: '300px',
              overflow: 'auto'
            }}>
              <p style={{
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#dc2626',
                marginBottom: '8px',
                fontWeight: 'bold'
              }}>
                {this.state.error?.name}: {this.state.error?.message}
              </p>
              <pre style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                color: '#6b7280',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                margin: 0
              }}>
                {this.state.error?.stack}
              </pre>
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#ea580c',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
