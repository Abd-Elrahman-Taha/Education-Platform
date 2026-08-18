import React, { useState } from 'react';
import { mockDB } from '../../services/db';
import { AcademicYear, ACADEMIC_YEAR_LABELS, Package } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, BookOpen, ClipboardList, Video, Star, LogIn, UserPlus, Layers, Sigma, Box, Zap, ShieldCheck } from 'lucide-react';

interface Props {
  onOpenAuthModal: () => void;
  initialYear?: AcademicYear;
}

const YEAR_ORDER: AcademicYear[] = ['third_secondary', 'second_secondary', 'first_secondary'];

const PACKAGE_FEATURES: Record<string, string[]> = {
  'pkg-1': ['جميع محاضرات التفاضل والتكامل', 'امتحانات بابل شيت تفاعلية', 'ملازم PDF عالية الجودة', 'نظام فتح الدروس التدريجي', 'مساعد الذكاء الاصطناعي'],
  'pkg-2': ['جميع محاضرات الهندسة الفراغية', 'امتحانات بابل شيت تفاعلية', 'ملازم PDF وقوانين المجسمات', 'نظام فتح الدروس التدريجي', 'مساعد الذكاء الاصطناعي'],
  'pkg-3': ['كل محاضرات التفاضل والهندسة', 'امتحانات بابل شيت الشاملة', 'بث مباشر أسبوعي مع المعلم', 'مساعد الذكاء الاصطناعي', 'متابعة لحظية لولي الأمر', 'ملازم PDF وقوانين شاملة'],
  'pkg-4': ['محاضرات الجبر والمثلثات', 'الهندسة المستوية الأساسية', 'امتحانات تفاعلية', 'ملازم PDF'],
  'pkg-5': ['الدوال الحقيقية والنهايات', 'التفاضل والتكامل التأسيسي', 'امتحانات بابل شيت', 'ملازم PDF'],
};

const PACKAGE_ICONS: Record<string, React.ElementType> = {
  'pkg-1': Sigma,
  'pkg-2': Box,
  'pkg-3': Star,
  'pkg-4': BookOpen,
  'pkg-5': Layers,
};

export const PublicPackagesView: React.FC<Props> = ({ onOpenAuthModal, initialYear }) => {
  const { isAuthenticated } = useAuth();
  const allPackages = mockDB.getPackages();
  const [selectedYear, setSelectedYear] = useState<AcademicYear>(initialYear || 'third_secondary');

  const filtered = allPackages.filter(p => p.academicYear === selectedYear);

  const getLessonCount = (pkg: Package) => pkg.includedLessonIds.length;

  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <span className="gradient-badge" style={{ marginBottom: '0.6rem' }}>
          <Zap size={14} /> باقات الاشتراك التعليمية
        </span>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-bright)', margin: '0.4rem 0 0.6rem' }}>
          اختر الباقة المناسبة لك
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '540px', margin: '0 auto' }}>
          جميع باقاتنا تشمل فيديوهات محمية DRM، امتحانات بابل شيت، وبوابة متابعة ولي الأمر
        </p>
      </div>

      {/* Year Filter */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
        {YEAR_ORDER.map(yr => (
          <button
            key={yr}
            className={`filter-btn ${selectedYear === yr ? 'active' : ''}`}
            onClick={() => setSelectedYear(yr)}
            style={{ fontSize: '0.88rem', padding: '0.55rem 1.25rem' }}
          >
            {ACADEMIC_YEAR_LABELS[yr]}
          </button>
        ))}
      </div>

      {/* Package Cards */}
      {filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <BookOpen size={36} style={{ marginBottom: '1rem', opacity: 0.4 }} />
          <p>لا توجد باقات متاحة لهذا الصف حالياً. تابعنا قريباً!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {filtered.map((pkg, idx) => {
            const Icon = PACKAGE_ICONS[pkg.id] || BookOpen;
            const features = PACKAGE_FEATURES[pkg.id] || [];
            const isFeatured = pkg.id === 'pkg-3' || idx === 1;

            return (
              <div
                key={pkg.id}
                className="glass-card"
                style={{
                  padding: '2rem',
                  position: 'relative',
                  border: isFeatured ? '2px solid var(--primary-light)' : '1px solid var(--border-glass)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(8,145,178,0.18)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '';
                }}
              >
                {isFeatured && (
                  <div style={{
                    position: 'absolute', top: '-12px', right: '50%', transform: 'translateX(50%)',
                    background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                    color: '#fff', fontSize: '0.75rem', fontWeight: 800,
                    padding: '0.25rem 1rem', borderRadius: '9999px',
                    whiteSpace: 'nowrap',
                  }}>
                    ⭐ الأكثر اشتراكاً
                  </div>
                )}

                {/* Icon + Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: '46px', height: '46px', borderRadius: '14px', flexShrink: 0,
                    background: isFeatured ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'rgba(8,145,178,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={22} color={isFeatured ? '#fff' : 'var(--primary-light)'} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                      {pkg.name}
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {ACADEMIC_YEAR_LABELS[pkg.academicYear]}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p style={{ fontSize: '0.87rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                  {pkg.description}
                </p>

                {/* Stats Row */}
                <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Video size={14} color="var(--primary-light)" /> {getLessonCount(pkg)} محاضرة
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <ClipboardList size={14} color="var(--primary-light)" /> امتحانات بابل شيت
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <ShieldCheck size={14} color="var(--primary-light)" /> DRM
                  </span>
                </div>

                {/* Features List */}
                {features.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginBottom: '1.5rem', flex: 1 }}>
                    {features.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-bright)' }}>
                        <CheckCircle2 size={15} color="#10B981" style={{ flexShrink: 0 }} />
                        {f}
                      </div>
                    ))}
                  </div>
                )}

                {/* Price + CTA */}
                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary-light)' }}>{pkg.price}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}> جنيه / فصل دراسي</span>
                    </div>
                    <button
                      className={`btn ${isFeatured ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={onOpenAuthModal}
                      style={{ padding: '0.65rem 1.5rem', fontSize: '0.9rem' }}
                    >
                      {isAuthenticated ? 'اشترك الآن' : <><LogIn size={16} /> اشترك الآن</>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Trust badges */}
      {!isAuthenticated && (
        <div className="glass-card" style={{ marginTop: '2.5rem', padding: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.25rem', justifyContent: 'center', alignItems: 'center' }}>
          {[
            { icon: ShieldCheck, text: 'فيديوهات محمية DRM' },
            { icon: Star, text: 'تقييم 4.9 / 5 من الطلاب' },
            { icon: CheckCircle2, text: 'ضمان استعادة الاشتراك' },
            { icon: UserPlus, text: '+1200 طالب مشترك' },
          ].map(b => {
            const Icon = b.icon;
            return (
              <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <Icon size={16} color="var(--primary-light)" /> {b.text}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
