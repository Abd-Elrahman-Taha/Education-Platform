import React from 'react';
import { Atom, Globe, Shield, Phone, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="logo-brand" style={{ marginBottom: '1rem' }}>
              <div className="logo-icon">
                <Atom size={22} />
              </div>
              <span>Syntax <span style={{ color: 'var(--secondary-light)', fontWeight: 400 }}>EdTech</span></span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.7', marginBottom: '1.5rem' }}>
              المنصة التعليمية المتكاملة لحماية الفيديوهات DRM، وتصحيح امتحانات البابل شيت بالذكاء الاصطناعي، ومتابعة أولياء الأمور لحظياً.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <a href="#" className="icon-btn" title="الموقع الرسمي"><Globe size={18} /></a>
              <a href="#" className="icon-btn" title="الدعم الفني"><Phone size={18} /></a>
              <a href="#" className="icon-btn" title="حماية البيانات"><Shield size={18} /></a>
            </div>
          </div>

          <div className="footer-col">
            <h4>روابط السريعة</h4>
            <div className="footer-links">
              <a href="#" className="footer-link">المحاضرات المباشرة</a>
              <a href="#" className="footer-link">جدول الامتحانات</a>
              <a href="#" className="footer-link">بوابة ولي الأمر</a>
              <a href="#" className="footer-link">بنوك الأسئلة والحلول</a>
            </div>
          </div>

          <div className="footer-col">
            <h4>المراحل الدراسية</h4>
            <div className="footer-links">
              <a href="#" className="footer-link">الثانوية العامة - الصف الثالث</a>
              <a href="#" className="footer-link">الصف الثاني الثانوي</a>
              <a href="#" className="footer-link">الصف الأول الثانوي</a>
              <a href="#" className="footer-link">الكورسات التأسيسية والجامعية</a>
            </div>
          </div>

          <div className="footer-col">
            <h4>الدعم والأمان</h4>
            <div className="footer-links">
              <a href="#" className="footer-link">شروط الاستخدام وحماية DRM</a>
              <a href="#" className="footer-link">سياسة الخصوصية</a>
              <a href="#" className="footer-link">مركز المساعدة والأسئلة</a>
              <a href="#" className="footer-link">تفعيل كروت السنتر</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Syntax EdTech Platform. جميع الحقوق محفوظة.</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            تم التطوير بواسطة أحدث تقنيات React & TypeScript <Heart size={14} color="var(--danger)" />
          </span>
        </div>
      </div>
    </footer>
  );
};
