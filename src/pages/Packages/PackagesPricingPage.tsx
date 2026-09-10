import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
  Award,
  ArrowRight,
  BookOpen,
  CreditCard,
  Clock,
  Layers
} from 'lucide-react';
import { coursesApi } from '../../api/courses.api';
import { Course } from '../../types/api.types';
import { AcademicYear, ACADEMIC_YEAR_LABELS } from '../../types';
import { matchesAcademicYear } from '../../utils/courseFilter';

export interface SelectedPackagePayment {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  type: 'monthly' | 'semester' | 'vip' | 'course';
  courseId?: string;
}

interface PackagesPricingPageProps {
  onProceedToPayment: (pkg: SelectedPackagePayment) => void;
  onBack?: () => void;
}

const YEAR_TABS: { key: AcademicYear | 'all'; label: string }[] = [
  { key: 'all', label: 'جميع المراحل' },
  { key: 'third_secondary', label: 'الصف الثالث الثانوي' },
  { key: 'second_secondary', label: 'الصف الثاني الثانوي' },
  { key: 'first_secondary', label: 'الصف الأول الثانوي' },
];

export const PackagesPricingPage: React.FC<PackagesPricingPageProps> = ({
  onProceedToPayment,
  onBack,
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | 'all'>('all');

  useEffect(() => {
    setLoadingCourses(true);
    coursesApi.getCourses({ limit: 50 })
      .then(res => {
        const list = res.courses || (res.data as any)?.courses || [];
        setCourses(list);
      })
      .catch(() => setCourses([]))
      .finally(() => setLoadingCourses(false));
  }, []);

  const standardPackages: {
    id: string;
    title: string;
    badge: string;
    price: number;
    originalPrice: number;
    period: string;
    isPopular?: boolean;
    features: string[];
    type: 'monthly' | 'semester' | 'vip';
  }[] = [
    {
      id: 'pkg-monthly',
      title: 'باقة الشهر التعليمي',
      badge: 'المرونة الشهرية',
      price: 250,
      originalPrice: 320,
      period: 'لكل شهر',
      features: [
        'وصول كامل لمحاضرات الشهر بجودة عالية',
        'مشغل فيديو محمي بحماية مشددة ضد التصوير',
        'واجبات واختبارات إلكترونية بعد كل محاضرة',
        'تقارير فورية لدرجات الطالب',
        'دعم فني واستفسارات دراسية',
      ],
      type: 'monthly',
    },
    {
      id: 'pkg-semester',
      title: 'باقة الترم الشاملة',
      badge: 'الأكثر طلباً وتوفيراً 🔥',
      price: 450,
      originalPrice: 750,
      period: 'للترم كاملاً (توفير 40%)',
      isPopular: true,
      features: [
        'وصول غير محدود لجميع محاضرات الترم كاملة',
        'جميع امتحانات بابل شيت والامتحانات التراكمية',
        'بنك أسئلة شامل مع نماذج الوزارة والإجابات النموذجية',
        'بوابة خاصة لولي الأمر لمتابعة الدرجات ونسب الحضور',
        'مراجعات نهائية مكثفة وليالي الامتحان',
        'أولوية الإجابة على الأسئلة في المنتدى التعليمي',
      ],
      type: 'semester',
    },
    {
      id: 'pkg-vip-center',
      title: 'باقة السنتر VIP + أونلاين',
      badge: 'النخبة والأوائل 👑',
      price: 650,
      originalPrice: 1000,
      period: 'للترم كاملاً',
      features: [
        'جميع ميزات الباقة الشاملة أونلاين',
        'حجز مقعد دائم في السنتر للمحاضرات التفاعلية',
        'المذكرات والملازم المطبوعة تسليم يدوي',
        'ورش عمل حل مسائل معقدة ومتابعة خاصة',
        'جلسات مراجعة فردية مع فريق التدريس المساعد',
        'شهادات تقدير وجوائز للمتفوقين شهرياً',
      ],
      type: 'vip',
    },
  ];

  const filteredCourses = selectedYear === 'all'
    ? courses
    : courses.filter(c => matchesAcademicYear(c, selectedYear));

  return (
    <div className="container fade-in-up" style={{ padding: '2.5rem 1rem 5rem' }}>
      {/* Navigation Top Bar */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="btn btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginBottom: '1.5rem',
            fontSize: '0.88rem',
          }}
        >
          <ArrowRight size={16} /> العودة
        </button>
      )}

      {/* Header Section */}
      <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 1rem',
            borderRadius: '9999px',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: 'var(--primary-light)',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '1rem',
          }}
        >
          <Sparkles size={15} /> باقات الاشتراك وأسعار المنصة التعليمية
        </div>

        <h1 style={{ fontSize: '2.3rem', fontWeight: 900, color: 'var(--text-bright)', marginBottom: '0.8rem', lineHeight: 1.25 }}>
          اختر باقتك التعليمية وانطلق نحو التفوق
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.02rem', lineHeight: 1.6 }}>
          طرق دفع مصرية ميسرة ومباشرة عبر <strong>فوري (Fawry)، فودافون كاش والمحافظ الذكية، إنستاباي (InstaPay)، وبطاقات ميزة</strong>
        </p>
      </div>

      {/* ── SECTION 1: MAIN SUBSCRIPTION TIERS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.75rem', marginBottom: '4.5rem' }}>
        {standardPackages.map(pkg => (
          <div
            key={pkg.id}
            className="glass-card"
            style={{
              padding: '2.25rem 1.75rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderRadius: 'var(--radius-lg)',
              position: 'relative',
              border: pkg.isPopular ? '2px solid var(--primary)' : '1px solid var(--border-glass)',
              background: pkg.isPopular ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-glass)',
              transform: pkg.isPopular ? 'scale(1.03)' : 'none',
              boxShadow: pkg.isPopular ? '0 12px 35px rgba(99, 102, 241, 0.25)' : 'none',
              transition: 'all 0.3s ease',
            }}
          >
            {pkg.isPopular && (
              <div
                style={{
                  position: 'absolute',
                  top: '-13px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  color: '#fff',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  padding: '0.25rem 1rem',
                  borderRadius: '9999px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                }}
              >
                {pkg.badge}
              </div>
            )}

            <div>
              {!pkg.isPopular && (
                <div style={{
                  display: 'inline-block',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--primary-light)',
                  background: 'rgba(99, 102, 241, 0.1)',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '6px',
                  marginBottom: '0.75rem',
                }}>
                  {pkg.badge}
                </div>
              )}

              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.75rem' }}>
                {pkg.title}
              </h3>

              {/* Price block */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--text-bright)' }}>
                  {pkg.price}
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-light)' }}>
                  جنيه مصري
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                  {pkg.originalPrice} ج.م
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
                {pkg.period}
              </div>

              {/* Feature list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                {pkg.features.map((feat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.88rem' }}>
                    <CheckCircle2 size={16} style={{ color: '#10B981', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: 'var(--text-bright)', lineHeight: 1.45 }}>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              className={pkg.isPopular ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={() => onProceedToPayment({
                id: pkg.id,
                title: pkg.title,
                price: pkg.price,
                originalPrice: pkg.originalPrice,
                type: pkg.type,
              })}
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '0.95rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <CreditCard size={18} /> متابعة الدفع عبر بوابة الدفع الإلكتروني
            </button>
          </div>
        ))}
      </div>

      {/* ── SECTION 2: INDIVIDUAL COURSES CATALOG ── */}
      <div style={{ marginTop: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
              أو اشترك في كورس محدد بشكل منفصل
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0.3rem 0 0' }}>
              اختر المادة أو الكورس المناسب لصفك الدراسي وادفع قيمته مباشرة
            </p>
          </div>

          {/* Academic Year Selector */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {YEAR_TABS.map(tab => (
              <button
                key={tab.key}
                type="button"
                className={`filter-btn ${selectedYear === tab.key ? 'active' : ''}`}
                onClick={() => setSelectedYear(tab.key)}
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.9rem' }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loadingCourses ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            جاري تحميل الكورسات المتاحة...
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            لا توجد كورسات متاحة حالياً للتصنيف المحدد.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {filteredCourses.map(course => (
              <div
                key={course._id}
                className="glass-card"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-glass)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: 'var(--primary-light)',
                    }}>
                      {course.Grade ? `الصف ${course.Grade}` : 'كورس تعليمي'}
                    </span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-bright)' }}>
                      {course.Price ?? 150} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ج.م</span>
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.5rem' }}>
                    {course.Title}
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                    {course.Description || 'كورس شامل يحتوي على محاضرات فيديو مشفرة وامتحانات تقييم مستمر.'}
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onProceedToPayment({
                    id: course._id,
                    title: `كورس: ${course.Title}`,
                    price: course.Price ?? 150,
                    type: 'course',
                    courseId: course._id,
                  })}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <CreditCard size={15} /> دفع واشتراك في هذا الكورس
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trust & Guarantee Banner */}
      <div
        className="glass-card"
        style={{
          marginTop: '3.5rem',
          padding: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: '1.5rem',
          background: 'rgba(16, 185, 129, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldCheck size={26} style={{ color: '#10B981' }} />
          <div>
            <strong style={{ display: 'block', color: 'var(--text-bright)', fontSize: '0.95rem' }}>دفع مصري آمن 100%</strong>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>معتمد عبر فوري وبنك مصر وشبكات المحافظ الذكية</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Zap size={26} style={{ color: 'var(--primary-light)' }} />
          <div>
            <strong style={{ display: 'block', color: 'var(--text-bright)', fontSize: '0.95rem' }}>تفعيل فوري للاشتراك</strong>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>يتم فتح المحاضرات والامتحانات لحظياً بعد السداد</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Award size={26} style={{ color: '#F59E0B' }} />
          <div>
            <strong style={{ display: 'block', color: 'var(--text-bright)', fontSize: '0.95rem' }}>ضمان التفوق الدراسي</strong>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>متابعة أسبوعية وامتحانات مطابقة للمواصفات الوزارية</span>
          </div>
        </div>
      </div>
    </div>
  );
};
