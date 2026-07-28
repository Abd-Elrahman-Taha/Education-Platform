import React from 'react';
import { ShieldAlert, CheckCircle } from 'lucide-react';

interface AntiCheatingModalProps {
  isOpen: boolean;
  warningsCount: number;
  onClose: () => void;
}

export const AntiCheatingModal: React.FC<AntiCheatingModalProps> = ({ isOpen, warningsCount, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" style={{ zIndex: 3000 }}>
      <div className="modal-box" style={{ maxWidth: '480px', textAlign: 'center' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.2)',
          border: '2px solid var(--danger)',
          color: 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem auto'
        }}>
          <ShieldAlert size={36} />
        </div>

        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--danger)', marginBottom: '0.5rem' }}>
          تـنـبـيـه حـمـايـة الاكـتـبـار!
        </h3>

        <div className="cheating-warning-box">
          <p style={{ margin: 0 }}>
            لقد قمت بالخروج من شاشة الامتحان أو تبديل النافذة (التحذير رقم <strong style={{ fontSize: '1.2rem', color: '#FFF' }}>{warningsCount} من 3</strong>).
          </p>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          نظام المراقبة الذكي للـ Assessment يمنع فتح نواتج البحث أو التنقل بين التطبيقات أثناء أداء الاختبارات. التكرار للمرة الثالثة سيؤدي لتسليم الامتحان تلقائياً.
        </p>

        <button className="btn btn-primary" style={{ width: '100%' }} onClick={onClose}>
          <CheckCircle size={18} /> فهمت وموافق على المتابعة
        </button>
      </div>
    </div>
  );
};
