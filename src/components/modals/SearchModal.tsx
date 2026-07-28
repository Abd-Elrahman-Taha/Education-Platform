import React, { useEffect, useState } from 'react';
import { Search, X, BookOpen, Video, FileText, ArrowLeft } from 'lucide-react';
import { AppView } from '../../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateView: (view: AppView) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onNavigateView }) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickLinks = [
    { title: 'مشغل الفيديوهات المحمي DRM', type: 'video', view: 'view-drm-player' as AppView, desc: 'مشاهدة محاضرات الفيزياء بحماية العلامة المائية' },
    { title: 'امتحانات البابل شيت والتصحيح', type: 'exam', view: 'view-assessment' as AppView, desc: 'اختبارات تفاعلية بنظام البابل شيت والشاشة المنقسمة' },
    { title: 'بوابة متابعة ولي الأمر', type: 'parent', view: 'view-parent-portal' as AppView, desc: 'استخراج تقارير الأداء ومنحنيات التقييم' },
    { title: 'مجتمع أسئلة الطلاب', type: 'community', view: 'view-community' as AppView, desc: 'طرح الاستفسارات والمناقشات العلمية' },
    { title: 'لوحة التحكم والإدارة (Admin)', type: 'admin', view: 'view-admin' as AppView, desc: 'توليد كروت الشحن وإدارة الطلاب' },
  ];

  const filteredLinks = quickLinks.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.desc.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={18} />
        </button>

        <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
          <Search size={22} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-light)' }} />
          <input
            type="text"
            autoFocus
            placeholder="ابحث عن دروس، امتحانات، كورس، أو أدوات المنصة... (Ctrl + K)"
            className="input-field"
            style={{ width: '100%', paddingRight: '48px', fontSize: '1.05rem' }}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '360px', overflowY: 'auto' }}>
          {filteredLinks.map((item, idx) => (
            <div
              key={idx}
              className="glass-card"
              style={{
                padding: '0.85rem 1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                borderRadius: 'var(--radius-md)',
              }}
              onClick={() => {
                onNavigateView(item.view);
                onClose();
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(79, 70, 229, 0.15)',
                  color: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {item.type === 'video' && <Video size={18} />}
                  {item.type === 'exam' && <FileText size={18} />}
                  {item.type === 'parent' && <BookOpen size={18} />}
                  {item.type === 'community' && <BookOpen size={18} />}
                  {item.type === 'admin' && <BookOpen size={18} />}
                </div>
                <div>
                  <strong style={{ fontSize: '0.95rem', display: 'block' }}>{item.title}</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.desc}</span>
                </div>
              </div>
              <ArrowLeft size={16} color="var(--text-muted)" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
