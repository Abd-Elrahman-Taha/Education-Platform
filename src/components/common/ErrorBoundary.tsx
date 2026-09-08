import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          className="container fade-in-up"
          style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1.5rem',
          }}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '2.5rem 2rem',
              textAlign: 'center',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              background: 'rgba(20, 24, 38, 0.95)',
              borderRadius: 'var(--radius-lg, 16px)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                color: 'var(--danger, #EF4444)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <AlertTriangle size={36} />
            </div>

            <h2
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: 'var(--text-bright, #FFF)',
                margin: '0 0 0.65rem',
              }}
            >
              عذراً، حدث خطأ غير متوقع
            </h2>

            <p
              style={{
                color: 'var(--text-muted, #94A3B8)',
                fontSize: '0.88rem',
                lineHeight: 1.6,
                margin: '0 0 1.75rem',
              }}
            >
              نعتذر عن هذا الخطأ المؤقت. يمكنك إعادة تحميل الصفحة أو العودة للصفحة الرئيسية.
            </p>

            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                className="btn btn-primary"
                onClick={this.handleReload}
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.88rem' }}
              >
                <RefreshCw size={15} /> إعادة المحاولة
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={this.handleReset}
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.88rem' }}
              >
                <Home size={15} /> العودة للرئيسية
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
