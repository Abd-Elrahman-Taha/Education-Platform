import React from 'react';
import { ShieldCheck, Globe, Shield, Phone, Heart, GraduationCap, Users, BookOpen, Award, HelpCircle, ChevronLeft } from 'lucide-react';
import { AppView } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface FooterProps {
  onNavigateView?: (view: AppView) => void;
  onOpenAuthModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateView, onOpenAuthModal }) => {
  const { isAuthenticated } = useAuth();

  const handleNav = (view: AppView) => {
    if (onNavigateView) {
      onNavigateView(view);
    }
  };

  return (
    <footer className="footer" style={{ borderTop: '1px solid var(--border-glass)', background: 'var(--bg-surface)', padding: '4rem 0 2rem' }}>
      <div className="container">
        <div className="footer-grid">
          {/* Col 1: Logo, Brand & Description */}
          <div className="footer-col">
            <div
              className="logo-brand"
              style={{ marginBottom: '1.25rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}
              onClick={() => handleNav('view-landing')}
            >
              <div className="logo-icon" style={{ width: '42px', height: '42px', fontSize: '1.4rem' }}>∫</div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                Syntax <span style={{ color: 'var(--secondary-light)', fontWeight: 400 }}>Math</span>
              </span>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.8', marginBottom: '1.5rem', maxWidth: '340px' }}>
              المنظومة التعليمية المتكاملة لمادتي التفاضل والتكامل والهندسة الفراغية: فيديوهات مشفرة DRM، امتحانات بابل شيت، وبوابة متابعة لحظية لولي الأمر.
            </p>

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button className="icon-btn" onClick={() => handleNav('view-faq')} title="الأسئلة الشائعة">
                <HelpCircle size={18} />
              </button>
              <button className="icon-btn" onClick={() => handleNav('view-parent-portal')} title="بوابة ولي الأمر">
                <ShieldCheck size={18} />
              </button>
              <button className="icon-btn" onClick={() => handleNav('view-community')} title="مجتمع الطلاب">
                <Globe size={18} />
              </button>
            </div>
          </div>

          {/* Col 2: المنصة والمحتوى */}
          <div className="footer-col">
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '1.25rem' }}>المنصة والمحتوى</h4>
            <div className="footer-links" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button className="footer-link" onClick={() => handleNav('view-landing')}>
                الرئيسية
              </button>
              <button className="footer-link" onClick={() => handleNav('view-drm-player')}>
                الدروس والمحاضرات
              </button>
              <button className="footer-link" onClick={() => handleNav('view-assessment')}>
                سجل الامتحانات
              </button>
              <button className="footer-link" onClick={() => handleNav('view-community')}>
                مجتمع الطلاب
              </button>
            </div>
          </div>

          {/* Col 3: المستخدمون والبوابات */}
          <div className="footer-col">
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '1.25rem' }}>المستخدمون والبوابات</h4>
            <div className="footer-links" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button className="footer-link" onClick={() => handleNav('view-parent-portal')}>
                بوابة ولي الأمر (بدون حساب)
              </button>
              <button className="footer-link" onClick={isAuthenticated ? () => handleNav('view-student-dashboard') : onOpenAuthModal}>
                دخول الطلاب
              </button>
              <button className="footer-link" onClick={isAuthenticated ? () => handleNav('view-admin') : onOpenAuthModal}>
                لوحة تحكم المعلم والإدارة
              </button>
              <button className="footer-link" onClick={() => handleNav('view-faq')}>
                الأسئلة الشائعة (FAQ)
              </button>
            </div>
          </div>

          {/* Col 4: الأمان والدعم */}
          <div className="footer-col">
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '1.25rem' }}>الأمان والدعم</h4>
            <div className="footer-links" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button className="footer-link" onClick={() => handleNav('view-faq')}>
                حماية DRM والعلامات المائية
              </button>
              <button className="footer-link" onClick={() => handleNav('view-faq')}>
                سياسة الامتحانات وتصحيح البابل شيت
              </button>
              <button className="footer-link" onClick={() => handleNav('view-faq')}>
                شروط الاستخدام والخصوصية
              </button>
              <button className="footer-link" onClick={() => handleNav('view-faq')}>
                تواصل مع الدعم الفني
              </button>
            </div>
          </div>
        </div>

        <div className="footer-bottom" style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          <span>© 2026 Syntax Math Educational Platform. جميع الحقوق محفوظة.</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary-light)', fontWeight: 600 }}>
            منصة التفاضل والتكامل والهندسة الفراغية للمرحلة الثانوية
          </span>
        </div>
      </div>
    </footer>
  );
};
