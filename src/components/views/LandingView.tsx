import React, { useState, useEffect } from 'react';
import {
  Sparkles, Rocket, Star, Award, TrendingUp, Users, BookOpen, UserCheck, Smile,
  CheckSquare, Lock, FileCheck, Bot, MessageSquare, ChevronDown, Check, ArrowLeft,
  Clock, Sigma, Box, Play, Video, ClipboardList, Radio, FileText, BarChart2
} from 'lucide-react';
import { AppView, Course } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface LandingViewProps {
  onNavigateView: (view: AppView) => void;
  onOpenAuthModal: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigateView, onOpenAuthModal }) => {
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  const [isYearlyBilling, setIsYearlyBilling] = useState<boolean>(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Animated counters
  const [counters, setCounters] = useState({ students: 0, lessons: 0, score: 0, rating: 0 });

  useEffect(() => {
    const duration = 1500;
    const steps = 30;
    const intervalTime = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const p = step / steps;
      setCounters({
        students: Math.floor(18500 * p),
        lessons:  Math.floor(320 * p),
        score:    Math.floor(97 * p),
        rating:   Math.floor(99 * p),
      });

      if (step >= steps) {
        clearInterval(timer);
        setCounters({ students: 18500, lessons: 320, score: 97, rating: 99 });
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  const faqs = [
    {
      q: 'ما هي المواد الدراسية المتاحة على المنصة؟',
      a: 'تتخصص المنصة حصريًا في مادتي التفاضل والتكامل (Calculus) والهندسة الفراغية (3D Geometry) للمرحلة الثانوية بكل مستوياتها، مع شرح مفصّل وامتحانات تفاعلية وملازم PDF.',
    },
    {
      q: 'كيف تضمن المنصة حماية الفيديوهات من التسريب؟',
      a: 'تعتمد المنصة على تقنية DRM المتقدمة مع طباعة علامة مائية ديناميكية تتبع حركة العين والشاشة وتحتوي على اسم الطالب وكوده وعنوان الـ IP لمنع أي تصوير أو تسجيل.',
    },
    {
      q: 'كيف يستفيد ولي الأمر من المنصة؟',
      a: 'يحصل ولي الأمر على كود متابعة خاص لبوابة ولي الأمر لرؤية منحنى أداء الطالب في مادتي التفاضل والهندسة الفراغية، نسبة الحضور، ودرجات الاختبارات مع إمكانية استلام تقرير شامل تلقائي.',
    },
    {
      q: 'هل يمكنني استخدام المساعد الذكي AI Tutor لحل مسائل الرياضيات؟',
      a: 'نعم! مساعد Syntax AI متخصص في مسائل التفاضل والتكامل والهندسة الفراغية ويستجيب فوراً مع توليد خطوات الحل التفصيلية ورسوم بيانية توضيحية.',
    },
  ];

  return (
    <div className="fade-in-up">
      {/* ── HERO SECTION ─────────────────────────────────── */}
      <section className="hero-section">
        <div className="container hero-grid">
          {/* Left: Content */}
          <div className="hero-content">
            <div className="gradient-badge">
              <Sparkles size={15} /> منصة التفاضل والهندسة الفراغية الأولى في مصر
            </div>

            <h1>
              أتقن{' '}
              <span className="gradient-text">التفاضل والتكامل</span>{' '}
              و<span className="gradient-text">الهندسة الفراغية</span>{' '}
              بأسلوب عصري
            </h1>

            <p className="hero-subtitle">
              تجربة تعليمية متكاملة في مادتي التفاضل والتكامل والهندسة الفراغية تجمع بين شرح الفيديو المحمي DRM،
              امتحانات تفاعلية، ومساعد الذكاء الاصطناعي المتاح 24/7.
            </p>

            <div className="hero-cta-group">
              <button
                className="btn btn-primary btn-lg"
                onClick={isAuthenticated ? () => onNavigateView('view-drm-player') : onOpenAuthModal}
                style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}
              >
                <Rocket size={20} /> ابدأ التعلم الآن
              </button>
              <button
                className="btn btn-secondary btn-lg"
                onClick={() => onNavigateView('view-assessment')}
                style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}
              >
                <Play size={18} /> جرّب امتحان مجاني
              </button>
            </div>

            <div className="hero-trust-badge">
              <div className="avatar-group">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" className="avatar-stack" alt="Student" />
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" className="avatar-stack" alt="Student" />
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" className="avatar-stack" alt="Student" />
              </div>
              <div className="trust-info">
                <div className="stars">
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <span style={{ marginRight: '4px' }}>(4.9/5)</span>
                </div>
                <span className="trust-text">محل ثقة أكثر من 18,000 طالب في التفاضل والهندسة الفراغية</span>
              </div>
            </div>
          </div>

          {/* Right: Teacher Image Visual */}
          <div className="hero-visual-wrapper">
            <div className="hero-teacher-image-wrapper">
              <img
                src="/teacher_hero.png"
                alt="أستاذ التفاضل والتكامل والهندسة الفراغية"
                className="hero-teacher-image"
              />
              {/* Overlay with subject badges */}
              <div className="hero-teacher-overlay">
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <div style={{
                    background: 'rgba(8,145,178,0.9)', backdropFilter: 'blur(8px)',
                    padding: '0.4rem 0.9rem', borderRadius: '9999px', fontSize: '0.78rem',
                    fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem'
                  }}>
                    <Sigma size={13} /> التفاضل والتكامل
                  </div>
                  <div style={{
                    background: 'rgba(13,148,136,0.9)', backdropFilter: 'blur(8px)',
                    padding: '0.4rem 0.9rem', borderRadius: '9999px', fontSize: '0.78rem',
                    fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem'
                  }}>
                    <Box size={13} /> الهندسة الفراغية
                  </div>
                </div>
                <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', padding: '0.35rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, color: '#10B981' }}>
                  ● متاح الآن
                </div>
              </div>
            </div>

            {/* Floating stat cards */}
            <div className="glass-card floating-card-1">
              <TrendingUp size={26} color="var(--success)" />
              <div>
                <strong style={{ fontSize: '0.88rem', display: 'block', color: 'var(--text-bright)' }}>معدل النجاح</strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--success)' }}>97% من الطلاب تفوقوا</span>
              </div>
            </div>

            <div className="glass-card floating-card-2">
              <Award size={26} color="var(--accent)" />
              <div>
                <strong style={{ fontSize: '0.88rem', display: 'block', color: 'var(--text-bright)' }}>أعلى الدرجات</strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>+12 طالب الأوائل هذا الشهر</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATISTICS BAR ───────────────────────────────── */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="glass-card stat-card">
              <div className="stat-number gradient-text">{counters.students.toLocaleString()}+</div>
              <div className="stat-label"><Users size={16} /> طالب مشترك</div>
            </div>
            <div className="glass-card stat-card">
              <div className="stat-number gradient-text">{counters.lessons}+</div>
              <div className="stat-label"><BookOpen size={16} /> درس ومحاضرة</div>
            </div>
            <div className="glass-card stat-card">
              <div className="stat-number gradient-text">{counters.score}%</div>
              <div className="stat-label"><TrendingUp size={16} /> معدل النجاح</div>
            </div>
            <div className="glass-card stat-card">
              <div className="stat-number gradient-text">{counters.rating}%</div>
              <div className="stat-label"><Smile size={16} /> رضا أولياء الأمور</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SUBJECTS SECTION ─────────────────────────────── */}
      <section className="container" style={{ padding: '5rem 1.5rem' }}>
        <div className="section-header">
          <span className="gradient-badge"><Sigma size={15} /> المواد الدراسية المتخصصة</span>
          <h2 className="section-title">مادتان. شرح شامل. نتائج مضمونة.</h2>
          <p className="section-subtitle">نتخصص حصريًا في التفاضل والتكامل والهندسة الفراغية لضمان أعمق مستوى من الفهم والإتقان.</p>
        </div>

        <div className="subjects-grid">
          {/* Calculus */}
          <div className="glass-card subject-card" onClick={() => onNavigateView('view-drm-player')}>
            <div className="subject-icon">
              <Sigma size={30} />
            </div>
            <h3 className="subject-title">التفاضل والتكامل</h3>
            <p className="subject-subtitle">
              من المشتقات إلى التكاملات — شرح تفصيلي لكل مفهوم مع حل أمثلة من امتحانات وزارة التربية والتعليم.
            </p>
            <div className="subject-features">
              <div className="subject-feature-item"><Check size={15} /> <span>دروس فيديو محمية DRM</span></div>
              <div className="subject-feature-item"><Check size={15} /> <span>واجبات وامتحانات تفاعلية</span></div>
              <div className="subject-feature-item"><Check size={15} /> <span>ملازم PDF مفصّلة</span></div>
              <div className="subject-feature-item"><Check size={15} /> <span>جلسات بث مباشر أسبوعية</span></div>
              <div className="subject-feature-item"><Check size={15} /> <span>مساعد AI متخصص في الحساب</span></div>
            </div>
            <button className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }}>
              ابدأ التفاضل والتكامل <ArrowLeft size={16} />
            </button>
          </div>

          {/* 3D Geometry */}
          <div className="glass-card subject-card" onClick={() => onNavigateView('view-drm-player')}>
            <div className="subject-icon" style={{
              background: 'linear-gradient(135deg, rgba(13,148,136,.2), rgba(8,145,178,.2))',
              borderColor: 'rgba(13,148,136,.25)',
              color: 'var(--secondary-light)'
            }}>
              <Box size={30} />
            </div>
            <h3 className="subject-title">الهندسة الفراغية</h3>
            <p className="subject-subtitle">
              الأجسام ثلاثية الأبعاد، المستويات، الحجوم — شرح بصري ثلاثي الأبعاد مع تطبيقات عملية ومسائل احترافية.
            </p>
            <div className="subject-features">
              <div className="subject-feature-item"><Check size={15} /> <span>رسوم توضيحية ثلاثية الأبعاد</span></div>
              <div className="subject-feature-item"><Check size={15} /> <span>واجبات وامتحانات تفاعلية</span></div>
              <div className="subject-feature-item"><Check size={15} /> <span>ملازم PDF مع رسومات هندسية</span></div>
              <div className="subject-feature-item"><Check size={15} /> <span>جلسات بث مباشر أسبوعية</span></div>
              <div className="subject-feature-item"><Check size={15} /> <span>مساعد AI متخصص في الهندسة</span></div>
            </div>
            <button className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%', background: 'linear-gradient(135deg, var(--secondary), var(--primary))' }}>
              ابدأ الهندسة الفراغية <ArrowLeft size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── PLATFORM FEATURES ────────────────────────────── */}
      <section className="container" style={{ padding: '2rem 1.5rem 6rem 1.5rem' }}>
        <div className="section-header">
          <span className="gradient-badge"><Sparkles size={15} /> المنظومة التعليمية المتكاملة</span>
          <h2 className="section-title">لماذا يختارنا طلاب الرياضيات؟</h2>
        </div>

        <div className="features-grid">
          <div className="glass-card feature-card">
            <div className="feature-icon-box"><Lock size={28} /></div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-bright)' }}>حماية الفيديوهات DRM</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7 }}>
              علامات مائية متحركة بأسم الطالب وكوده لحماية شرح المعلم ومنع التسريب.
            </p>
          </div>

          <div className="glass-card feature-card">
            <div className="feature-icon-box"><FileCheck size={28} /></div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-bright)' }}>امتحانات البابل شيت</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7 }}>
              اختبارات أونلاين تفاعلية بنظام البابل شيت مع تصحيح فوري وتحليل الأخطاء.
            </p>
          </div>

          <div className="glass-card feature-card">
            <div className="feature-icon-box"><Bot size={28} /></div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-bright)' }}>مساعد الذكاء الاصطناعي 24/7</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7 }}>
              مساعد متخصص في التفاضل والهندسة الفراغية يحل المسائل خطوة بخطوة في أي وقت.
            </p>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────── */}
      <section className="container" style={{ padding: '2rem 1.5rem 6rem 1.5rem' }}>
        <div className="section-header">
          <span className="gradient-badge"><Award size={15} /> الاشتراكات والباقات</span>
          <h2 className="section-title">اختر خطة تفوقك في الرياضيات</h2>
        </div>

        <div className="pricing-toggle-wrap">
          <span style={{ fontWeight: !isYearlyBilling ? 700 : 400, color: !isYearlyBilling ? 'var(--text-bright)' : 'var(--text-muted)' }}>شهري</span>
          <div
            className={`toggle-switch ${isYearlyBilling ? 'active' : ''}`}
            onClick={() => {
              setIsYearlyBilling(!isYearlyBilling);
              showToast(!isYearlyBilling ? 'تم اختيار الاشتراك السنوي (خصم 20% مفعل)' : 'تم اختيار الاشتراك الشهري');
            }}
          >
            <div className="toggle-handle"></div>
          </div>
          <span style={{ fontWeight: isYearlyBilling ? 700 : 400, color: isYearlyBilling ? 'var(--text-bright)' : 'var(--text-muted)' }}>
            سنوي <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>(خصم 20%)</span>
          </span>
        </div>

        <div className="pricing-grid">
          <div className="glass-card pricing-card">
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-bright)' }}>مادة واحدة</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>التفاضل أو الهندسة الفراغية</p>
            <div className="price-amount">
              {isYearlyBilling ? '2000' : '250'} <span className="price-period">ج.م / {isYearlyBilling ? 'سنة' : 'شهر'}</span>
            </div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', fontSize: '0.9rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}><Check size={16} color="var(--success)" /> جميع محاضرات المادة المختارة</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}><Check size={16} color="var(--success)" /> امتحانات البابل شيت الأسبوعية</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}><Check size={16} color="var(--success)" /> تقرير شهري لولي الأمر</li>
            </ul>
            <button className="btn btn-secondary" style={{ marginTop: 'auto' }} onClick={onOpenAuthModal}>اشترك الآن</button>
          </div>

          <div className="glass-card pricing-card popular">
            <div className="popular-badge">الأكثر اختياراً</div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-bright)' }}>المادتان معاً</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>التفاضل + الهندسة الفراغية</p>
            <div className="price-amount">
              {isYearlyBilling ? '3600' : '450'} <span className="price-period">ج.م / {isYearlyBilling ? 'سنة' : 'شهر'}</span>
            </div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', fontSize: '0.9rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}><Check size={16} color="var(--success)" /> وصول غير محدود للمادتين</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}><Check size={16} color="var(--success)" /> امتحانات بابل شيت لا نهائية</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}><Check size={16} color="var(--success)" /> مساعد AI غير محدود 24/7</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}><Check size={16} color="var(--success)" /> جلسات بث مباشر أسبوعية</li>
            </ul>
            <button className="btn btn-primary" style={{ marginTop: 'auto' }} onClick={onOpenAuthModal}>احصل على الخطة الشاملة</button>
          </div>

          <div className="glass-card pricing-card">
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-bright)' }}>باقة السنتر</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>للمجموعات والسناتر التعليمية</p>
            <div className="price-amount">
              {isYearlyBilling ? '6000' : '750'} <span className="price-period">ج.م / {isYearlyBilling ? 'سنة' : 'شهر'}</span>
            </div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', fontSize: '0.9rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}><Check size={16} color="var(--success)" /> كروت شحن للمجموعات الحضورية</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}><Check size={16} color="var(--success)" /> ملازم PDF مطبوعة تصل للمنزل</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}><Check size={16} color="var(--success)" /> متابعة مساعد خاص من الأستاذ</li>
            </ul>
            <button className="btn btn-secondary" style={{ marginTop: 'auto' }} onClick={onOpenAuthModal}>تواصل مع الإدارة</button>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section className="container" style={{ padding: '2rem 1.5rem 7rem 1.5rem' }}>
        <div className="section-header">
          <span className="gradient-badge"><MessageSquare size={15} /> الأسئلة الشائعة</span>
          <h2 className="section-title">إجابات لكافة استفساراتك</h2>
        </div>

        <div className="faq-container">
          {faqs.map((faq, idx) => (
            <div key={idx} className={`faq-item ${openFaq === idx ? 'active' : ''}`}>
              <div className="faq-question" onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
                <span>{faq.q}</span>
                <ChevronDown size={18} className="faq-icon" />
              </div>
              <div className="faq-answer">
                <p>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
