import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'حدث خطأ غير متوقع',
  message = 'تعذر تحميل البيانات المطلوبة. يرجى المحاولة مرة أخرى.',
  onRetry,
}) => {
  return (
    <div
      className="glass-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '3rem 2rem',
        margin: '1.5rem auto',
        maxWidth: '540px',
        border: '1px solid rgba(239, 68, 68, 0.3)',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.12)',
          color: 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
        }}
      >
        <AlertCircle size={30} />
      </div>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-bright)', margin: '0 0 0.5rem' }}>
        {title}
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
        {message}
      </p>
      {onRetry && (
        <button
          className="btn btn-primary"
          onClick={onRetry}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={16} /> إعادة المحاولة
        </button>
      )}
    </div>
  );
};
