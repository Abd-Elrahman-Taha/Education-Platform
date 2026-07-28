import React from 'react';
import { X, Copy, Share2, Check } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const shareUrl = "https://syntax-edtech.eg/post/894021";

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    showToast("تم نسخ رابط السؤال! يتعين على الزائر تسجيل الدخول لرؤية المنشور الكامل.", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(79, 70, 229, 0.15)',
            color: 'var(--primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Share2 size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>مشاركة السؤال العلمي</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>انشر هذا الاستفسار لزملائك والمعلمين</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="input-field"
            style={{ width: '100%', direction: 'ltr', fontSize: '0.9rem' }}
          />
          <button className="btn btn-primary" onClick={handleCopy} style={{ padding: '0.75rem 1.25rem' }}>
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};
