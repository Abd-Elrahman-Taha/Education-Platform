import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'جاري التحميل...',
  size = 'md',
}) => {
  const dim = size === 'sm' ? 24 : size === 'lg' ? 56 : 38;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        gap: '1rem',
      }}
    >
      <div
        style={{
          width: `${dim}px`,
          height: `${dim}px`,
          border: '3px solid rgba(8, 145, 178, 0.2)',
          borderTopColor: 'var(--primary-light)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {message && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
          {message}
        </p>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
