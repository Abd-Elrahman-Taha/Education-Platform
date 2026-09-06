import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'لا توجد بيانات متاحة',
  message = 'لم يتم العثور على أي عناصر مطابقة في الوقت الحالي.',
  icon,
  actionText,
  onAction,
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
        padding: '3.5rem 2rem',
        margin: '1.5rem auto',
        maxWidth: '520px',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(8, 145, 178, 0.1)',
          color: 'var(--primary-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
        }}
      >
        {icon || <Inbox size={28} />}
      </div>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-bright)', margin: '0 0 0.4rem' }}>
        {title}
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 1.25rem', lineHeight: 1.6 }}>
        {message}
      </p>
      {actionText && onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
};
