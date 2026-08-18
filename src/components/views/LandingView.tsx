import React, { useState, useEffect } from 'react';
import {
  Sparkles, Rocket, Star, Award, TrendingUp, Users, BookOpen, UserCheck,
  Check, ArrowLeft, Clock, Sigma, Box, Play, Video, FileText, BarChart2,
  HelpCircle, ShieldCheck, Shield, Lock, Bot, Layers, CheckCircle2,
  GraduationCap, ChevronDown, ArrowRight, Flame, Activity, Phone
} from 'lucide-react';
import { AppView, ACADEMIC_YEAR_LABELS, AcademicYear } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { mockDB } from '../../services/db';

interface LandingViewProps {
  onNavigateView: (view: AppView) => void;
  onOpenAuthModal: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigateView, onOpenAuthModal }) => {
  const { showToast } = useToast();
  const { isAuthenticated, currentUser } = useAuth();
  const [isYearlyBilling, setIsYearlyBilling] = useState<boolean>(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [previewTab, setPreviewTab] = useState<'student' | 'parent' | 'teacher'>('student');
  const [selectedStudyYear, setSelectedStudyYear] = useState<AcademicYear>('third_secondary');

  // Animated counters
  const [counters, setCounters] = useState({ students: 0, lessons: 0, score: 0, rating: 0 });

  useEffect(() => {
    const duration = 1200;
    const steps = 25;
    const intervalTime = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const p = step / steps;
      setCounters({
        students: Math.floor(18500 * p),
        lessons:  Math.floor(320 * p),
        score:    Math.floor(98 * p),
        rating:   Math.floor(99 * p),
      });

      if (step >= steps) {
        clearInterval(timer);
        setCounters({ students: 18500, lessons: 320, score: 98, rating: 99 });
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  const topFaqs = [
    {
      q: 'كيف يمكن للطالب الوصول للدروس الموحدة وامتحانات البابل شيت؟',
      a: 'بمجرد تسجيل الدخول وتحديد السنة الدراسية (أولى، ثانية، أو ثالثة ثانوي)، يتم فتح المحاضرات المتاحة فوراً مع إمكانية مشاهدة الفيديو المحمي DRM، تنزيل ملزمة PDF، وحل واجب المحاضرة وامتحان البابل شيت.',
    },
    {
      q: 'كيف يتابع ولي الأمر درجات الطالب ونسبة الحضور بدون حساب؟',
      a: 'يمكن لولي الأمر الضغط مباشرة على زر "بوابة ولي الأمر" في القائمة العلوية وإدخال كود الطالب والرقم القومي لرؤية التقرير الأكاديمي الشامل ومنحنى الدرجات ونسبة حضور المحاضرات لحظياً.',
    },
    {
      q: 'كيف تضمن المنصة حماية المحاضرات والفيديوهات من التسريب؟',
      a: 'تعتمد المنصة على تشفير DRM المتقدم مع طباعة علامة مائية ديناميكية تتبع حركة الشاشة وتحتوي على اسم الطالب وكوده وعنوان الـ IP لمنع أي تصوير أو إعادة تسجيل.',
    },
    {
      q: 'كيف يحدد المعلم والإدارة صلاحيات الدروس والامتحانات؟',
      a: 'توفر لوحة تحكم المعلم إمكانية نشر أو إخفاء المحاضرات بنقرة واحدة، وتعيين دروس وباقات اشتراك مخصصة لكل طالب، مع الاطلاع على قائمة أوائل الطلاب المتفوقين.',
    },
    {
      q: 'هل يتوفر مساعد ذكي متخصص في حل مسائل الرياضيات؟',
      a: 'نعم، يتضمن كل درس مساعد Syntax AI الذكي المدرب خصيصاً على تفكيك مسائل التفاضل والتكامل والهندسة الفراغية خطوة بخطوة مع توضيح القوانين والرسوم التوضيحية.',
    },
  ];

  return (
    <div className="fade-in-up">
      {/* ── 1. HERO SECTION (Requirements #1 & #2) ──────────── */}
      <section className="hero-section" style={{ paddingTop: '3.5rem', paddingBottom: '4rem' }}>
        <div className="container hero-grid" style={{ alignItems: 'center' }}>
          {/* Left: Content */}
          <div className="hero-content">
            <div className="gradient-badge" style={{ marginBottom: '1.25rem' }}>
              <Sparkles size={15} /> المنظومة التعليمية المتكاملة للرياضيات في مصر
            </div>

            <h1 style={{ fontSize: 'clamp(2.1rem, 3.8vw, 3.1rem)', fontWeight: 900, lineHeight: 1.25, marginBottom: '1.25rem' }}>
              منظومة متكاملة <span className="gradient-text">للتعلم، متابعة التقدم،</span> والتميز في الرياضيات
            </h1>

            <p className="hero-subtitle" style={{ fontSize: '1.05rem', lineHeight: 1.75, marginBottom: '2rem' }}>
              منصة تعليمية متخصصة تجمع الطلاب وأولياء الأمور والمعلمين في بيئة رقمية واحدة: محاضرات فيديو فائقة الحماية بتقنية DRM، امتحانات بابل شيت تفاعلية مع تصحيح ذكي، ومتابعة فورية لدرجات وتقارير الطالب.
            </p>

            <div className="hero-cta-group" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
              <button
                className="btn btn-primary btn-lg"
                onClick={isAuthenticated ? () => onNavigateView('view-drm-player') : onOpenAuthModal}
                style={{ padding: '0.95rem 2.2rem', fontSize: '1.05rem', fontWeight: 800 }}
              >
                <Rocket size={20} /> ابدأ التعلم الآن
              </button>
              <button
                className="btn btn-secondary btn-lg"
                onClick={() => onNavigateView('view-parent-portal')}
                style={{ padding: '0.95rem 2rem', fontSize: '1.05rem', fontWeight: 700 }}
              >
                <ShieldCheck size={20} color="var(--primary-light)" /> متابعة أداء الطالب
              </button>
            </div>

            {/* Quick Trust Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#F59E0B' }}>
                <Star size={16} fill="#F59E0B" />
                <Star size={16} fill="#F59E0B" />
                <Star size={16} fill="#F59E0B" />
                <Star size={16} fill="#F59E0B" />
                <Star size={16} fill="#F59E0B" />
              </div>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                مصممة خصيصاً لطلاب المرحلة الثانوية • الصفوف الأول والثاني والثالث
              </span>
            </div>
          </div>

          {/* Right: Teacher Image Visual & Live Educational Dashboard Mockup */}
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
                    background: 'rgba(8,145,178,0.92)', backdropFilter: 'blur(8px)',
                    padding: '0.4rem 0.9rem', borderRadius: '9999px', fontSize: '0.78rem',
                    fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem'
                  }}>
                    <Sigma size={13} /> التفاضل والتكامل
                  </div>
                  <div style={{
                    background: 'rgba(13,148,136,0.92)', backdropFilter: 'blur(8px)',
                    padding: '0.4rem 0.9rem', borderRadius: '9999px', fontSize: '0.78rem',
                    fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem'
                  }}>
                    <Box size={13} /> الهندسة الفراغية
                  </div>
                </div>
                <div style={{ background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(16,185,129,0.4)', padding: '0.35rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, color: '#10B981' }}>
                  ● متاح الآن
                </div>
              </div>
            </div>

            {/* Floating stat cards around teacher image */}
            <div className="glass-card floating-card-1">
              <TrendingUp size={26} color="var(--success)" />
              <div>
                <strong style={{ fontSize: '0.88rem', display: 'block', color: 'var(--text-bright)' }}>معدل التفوق</strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 700 }}>98% من الطلاب</span>
              </div>
            </div>

            <div className="glass-card floating-card-2">
              <Award size={26} color="var(--accent)" />
              <div>
                <strong style={{ fontSize: '0.88rem', display: 'block', color: 'var(--text-bright)' }}>أوائل الثانوية العامة</strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>+15 طالباً متفوقاً</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. TRUST & QUICK STATS (Requirement #3) ──────────── */}
      <section className="stats-section" style={{ padding: '2rem 0' }}>
        <div className="container">
          <div className="stats-grid">
            <div className="glass-card stat-card">
              <div className="stat-number gradient-text">{counters.students.toLocaleString()}+</div>
              <div className="stat-label"><Users size={16} /> طالب مسجل في الرياضيات</div>
            </div>
            <div className="glass-card stat-card">
              <div className="stat-number gradient-text">{counters.lessons}+</div>
              <div className="stat-label"><BookOpen size={16} /> محاضرة فيديو محمية DRM</div>
            </div>
            <div className="glass-card stat-card">
              <div className="stat-number gradient-text">{counters.score}%</div>
              <div className="stat-label"><TrendingUp size={16} /> نسبة اجتياز اختبارات البابل شيت</div>
            </div>
            <div className="glass-card stat-card">
              <div className="stat-number gradient-text">3 مراحل</div>
              <div className="stat-label"><GraduationCap size={16} /> أولى وثانية وثالثة ثانوي</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. "WHY THIS PLATFORM?" (Requirement #4) ─────────── */}
      <section className="container" style={{ padding: '5rem 1.5rem 3rem' }}>
        <div className="section-header">
          <span className="gradient-badge"><Award size={15} /> لماذا تختار منصة Syntax؟</span>
          <h2 className="section-title">بيئة تعليمية متطورة مصممة خصيصاً للنجاح</h2>
          <p className="section-subtitle">
            نجمع بين قوة الشرح الرياضي الأكاديمي، أحدث تقنيات حماية البث، والتقييم الذكي لضمان أعلى درجات التفوق.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(8,145,178,0.15)', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>تعلم منظم حسب السنة الدراسية</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.7, margin: 0 }}>
              مقررات دراسية مخصصة بدقة لكل سنة (الأولى، الثانية، والثالثة الثانوي) مع تسلسل منطقي من الأساسيات إلى امتحانات الثانوية العامة.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16,185,129,0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>متابعة فورية للدرجات والتقدم</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.7, margin: 0 }}>
              منحنيات بيانية ورسوم تفاعلية تظهر تطور درجات الطالب بعد كل اختبار بابل شيت مع تحديد فوري لنسب الحضور والإنجاز.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245,158,11,0.15)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>حماية الفيديوهات ونظام فتح الدروس</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.7, margin: 0 }}>
              حماية DRM صارمة بعلامات مائية ديناميكية، ونظام ذكي يشترط اجتياز امتحان الدرس الحالي لفتح المحاضرة التالية.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139,92,246,0.15)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>مساعد ذكي متخصص 24/7</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.7, margin: 0 }}>
              مساعد AI مدمج في كل درس يساعدك على حل خطوات المسائل الصعبة والإجابة على أي استفسار رياضي في أي وقت.
            </p>
          </div>
        </div>
      </section>

      {/* ── 4. HOW IT WORKS (Requirement #5) ─────────────────── */}
      <section className="container" style={{ padding: '4rem 1.5rem 4rem' }}>
        <div className="section-header">
          <span className="gradient-badge"><Clock size={15} /> خطوات سهلة وسريعة</span>
          <h2 className="section-title">كيف تبدأ رحلة تفوقك مع المنصة؟</h2>
          <p className="section-subtitle">
            ثلاث خطوات بسيطة تفصلك عن تجربة تعليمية متكاملة في التفاضل والهندسة الفراغية.
          </p>
        </div>

        <div className="steps-grid">
          <div className="glass-card step-card">
            <div className="step-number-badge">1</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.5rem' }}>
              سجّل حسابك وحدد سنتك الدراسية
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.7 }}>
              أنشئ حساب طالب جديد واختر صفك الدراسي (أولى، ثانية، أو ثالثة ثانوي) لتظهر لك المقررات والباقات المناسبة تلقائياً.
            </p>
          </div>

          <div className="glass-card step-card">
            <div className="step-number-badge">2</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.5rem' }}>
              شاهد المحاضرات وحل الاختبارات
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.7 }}>
              تابع الفيديو المحمي DRM، حمّل ملزمة الـ PDF المرفقة، وحل واجب المحاضرة وامتحان البابل شيت لفتح الدرس التالي.
            </p>
          </div>

          <div className="glass-card step-card">
            <div className="step-number-badge">3</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.5rem' }}>
              تابع درجاتك وشارك تقريرك
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.7 }}>
              راقب منحنى تقدمك الأكاديمي، واستفد من تقارير ولي الأمر الفورية التي تبرز تفوقك والتزامك خطوة بخطوة.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5. DIFFERENT EXPERIENCE FOR EVERY USER (PUBLIC EXPERIENCES: STUDENT & PARENT) ── */}
      <section className="container" style={{ padding: '3rem 1.5rem 5rem' }}>
        <div className="section-header">
          <span className="gradient-badge"><Users size={15} /> تجربة مخصصة لكل مستخدم</span>
          <h2 className="section-title">منظومة تعليمية متكاملة مصممة للتميز</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>
          {/* Card 1: Students */}
          <div className="glass-card experience-card ">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>للطلاب (Students)</h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--primary-light)' }}>تعلّم، تدرّب، وتفوّق</span>
                </div>
              </div>

              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="#10B981" /> دروس فيديو موحدة مع مشغل DRM</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="#10B981" /> امتحانات بابل شيت مع تصحيح لحظي</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="#10B981" /> مساعد AI لحل المسائل خطوة بخطوة</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="#10B981" /> ملازم PDF وواجبات مخصصة لكل درس</li>
              </ul>
            </div>

            <button
              className="btn "
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={isAuthenticated ? () => onNavigateView('view-student-dashboard') : onOpenAuthModal}
            >
              ابدأ التعلم كطالب <ArrowLeft size={16} />
            </button>
          </div>

          {/* Card 2: Parents */}
          <div className="glass-card experience-card">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(16,185,129,0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>لأولياء الأمور (Parents)</h3>
                  <span style={{ fontSize: '0.82rem', color: '#10B981' }}>متابعة لحظية بدون إنشاء حساب</span>
                </div>
              </div>

              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="#10B981" /> استعلام سريع بكود الطالب والرقم القومي</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="#10B981" /> منحنى درجات الامتحانات والتقييمات</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="#10B981" /> نسبة حضور المحاضرات ومعدل الالتزام</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="#10B981" /> إمكانية إرسال التقرير عبر WhatsApp</li>
              </ul>
            </div>

            <button
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => onNavigateView('view-parent-portal')}
            >
              استخراج تقرير الطالب <ArrowLeft size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── 6. INTERACTIVE PLATFORM PREVIEW TABS (BEFORE SUBSCRIPTION - PUBLIC ONLY) ── */}
      {!isAuthenticated && (
        <section className="container" style={{ padding: '2rem 1.5rem 5rem' }}>
          <div className="section-header">
            <span className="gradient-badge"><Activity size={15} /> نظرة حية داخل المنصة</span>
            <h2 className="section-title">شاهد كيف تعمل المنصة قبل الاشتراك</h2>
            <p className="section-subtitle">
              استكشف واجهات المنصة المصممة وفق أعلى معايير تجربة المستخدم لضمان السهولة والدقة.
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div className="preview-tab-bar">
              <button
                className={`preview-tab-btn ${previewTab === 'student' ? 'active' : ''}`}
                onClick={() => setPreviewTab('student')}
              >
                <GraduationCap size={16} /> تجربة الطالب (Learning Hub)
              </button>
              <button
                className={`preview-tab-btn ${previewTab === 'parent' ? 'active' : ''}`}
                onClick={() => setPreviewTab('parent')}
              >
                <ShieldCheck size={16} /> تقرير ولي الأمر (Parent Report)
              </button>
            </div>
          </div>

          {/* Live Preview Display Box */}
          <div className="glass-card" style={{ padding: '2.5rem', maxWidth: '950px', margin: '0 auto', border: '1px solid rgba(8,145,178,0.35)' }}>
            {previewTab === 'student' && (
              <div className="fade-in-up">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
                  <div>
                    <span className="gradient-badge" style={{ fontSize: '0.75rem', marginBottom: '0.35rem' }}>لوحة تحليلات الطالب الشخصية</span>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-bright)', margin: 0 }}>مرحباً بك، أحمد طالب 👋</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-md)', color: '#F59E0B', fontWeight: 800 }}>
                    <Flame size={18} fill="#F59E0B" /> 7 أيام متتالية
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="glass-card" style={{ padding: '1.25rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>المعدل العام</span>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10B981' }}>98%</div>
                  </div>
                  <div className="glass-card" style={{ padding: '1.25rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>المحاضرات المكتملة</span>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary-light)' }}>6 / 8 دروس</div>
                  </div>
                  <div className="glass-card" style={{ padding: '1.25rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>الامتحانات المجتازة</span>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#8B5CF6' }}>5 اختبارات</div>
                  </div>
                </div>

                <div style={{ background: 'rgba(8,145,178,0.12)', border: '1px solid rgba(8,145,178,0.3)', padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary-light)', fontWeight: 700 }}>متابعة التعلم (Continue Learning)</span>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-bright)', margin: '0.2rem 0' }}>المحاضرة 2: مشتقات الدوال المثلثية والهندسية</h4>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>المدة: 1:30:00 • إنجاز 45%</span>
                  </div>
                  <button className="btn btn-primary" onClick={onOpenAuthModal}>
                    <Play size={16} /> ابدأ المشاهدة
                  </button>
                </div>
              </div>
            )}

            {previewTab === 'parent' && (
              <div className="fade-in-up">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
                  <div>
                    <span className="gradient-badge" style={{ fontSize: '0.75rem', marginBottom: '0.35rem' }}>تقرير ولي الأمر المعتمد</span>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-bright)', margin: 0 }}>تقرير الطالب: أحمد طالب (#CODE-94021)</h3>
                  </div>
                  <span className="gradient-badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}>
                    ● حساب نشط ومثالي
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="glass-card" style={{ padding: '1.25rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>المعدل التراكمي للامتحانات</span>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10B981' }}>98.5%</div>
                  </div>
                  <div className="glass-card" style={{ padding: '1.25rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>نسبة حضور المحاضرات</span>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary-light)' }}>100%</div>
                  </div>
                  <div className="glass-card" style={{ padding: '1.25rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>باقة الاشتراك</span>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-bright)' }}>الباقة الشاملة</div>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-glass)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-bright)' }}>آخر اختبار: المشتقات وقاعدة السلسلة</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>الدرجة: 3 / 3 (100% — ناجح)</span>
                  </div>
                  <button className="btn btn-secondary" onClick={() => onNavigateView('view-parent-portal')}>
                    فتح التقرير الكامل <ArrowLeft size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── 7. "WHAT WILL YOU STUDY?" — INTERACTIVE CURRICULUM & PACKAGE PREVIEW ── */}
      {(() => {
        const studyLessons = mockDB.getLessons(selectedStudyYear, true);
        const studyPackages = mockDB.getPackages(selectedStudyYear);
        const totalDurationMins = studyLessons.reduce((acc, l) => acc + (parseInt(l.duration) || 60), 0);

        return (
          <section className="container" style={{ padding: '3rem 1.5rem 5rem' }}>
            <div className="section-header">
              <span className="gradient-badge"><BookOpen size={15} /> استكشف المنهج والمحتوى التعليمي</span>
              <h2 className="section-title">ماذا ستتعلم معنا في مرحلتك الدراسية؟</h2>
              <p className="section-subtitle">
                اختر سنتك الدراسية وتعرّف على المحاضرات المتاحة، الفروع، والملازم والباقات المخصصة لكل صف قبل الاشتراك.
              </p>
            </div>

            {/* Academic Year Switcher Bar */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
              {(['third_secondary', 'second_secondary', 'first_secondary'] as AcademicYear[]).map(yr => (
                <button
                  key={yr}
                  className={`filter-btn ${selectedStudyYear === yr ? 'active' : ''}`}
                  onClick={() => setSelectedStudyYear(yr)}
                  style={{ fontSize: '1rem', padding: '0.65rem 1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <GraduationCap size={18} />
                  {ACADEMIC_YEAR_LABELS[yr]}
                </button>
              ))}
            </div>

            {/* Dynamic Summary Metrics for Selected Year */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
              <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>عدد المحاضرات</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary-light)' }}>{studyLessons.length} محاضرات</div>
              </div>
              <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>مدة الشرح والتدريب</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10B981' }}>+{totalDurationMins} دقيقة</div>
              </div>
              <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>امتحانات بابل شيت</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#F59E0B' }}>{studyLessons.filter(l => l.exam).length} اختبارات</div>
              </div>
              <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>الملازم وملفات PDF</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#8B5CF6' }}>{studyLessons.filter(l => l.pdfUrl).length} ملزمة</div>
              </div>
            </div>

            {/* Curriculum Lesson Cards Grid */}
            <div style={{ marginBottom: '3rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Video size={20} color="var(--primary-light)" /> محاضرات المنهج المقررة — {ACADEMIC_YEAR_LABELS[selectedStudyYear]}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {studyLessons.map((l, index) => (
                  <div
                    key={l.id}
                    className="glass-card"
                    style={{
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary-light)' }}>
                          محاضرة #{index + 1}
                        </span>
                        <span className="gradient-badge" style={{ fontSize: '0.72rem' }}>
                          {l.subject}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-bright)', margin: '0 0 0.35rem' }}>
                        {l.title}
                      </h4>
                      <p style={{ color: 'var(--primary-light)', fontSize: '0.82rem', fontWeight: 600, margin: '0 0 0.75rem' }}>
                        {l.subtitle}
                      </p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
                        {l.description}
                      </p>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={14} /> {l.duration}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#F43F5E', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(244,63,94,0.1)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                        <Lock size={12} /> محتوى محمي للمشتركين
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Packages for Selected Academic Year */}
            <div style={{ marginBottom: '3rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={20} color="var(--primary-light)" /> الباقات المتاحة لـ {ACADEMIC_YEAR_LABELS[selectedStudyYear]}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {studyPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="glass-card"
                    style={{
                      padding: '1.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: '1px solid var(--border-glass)',
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-bright)', margin: '0 0 0.5rem' }}>
                        {pkg.name}
                      </h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
                        {pkg.description}
                      </p>

                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', display: 'flex', gap: '1rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Video size={14} color="var(--primary-light)" /> {pkg.includedLessonIds.length} محاضرة
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <ShieldCheck size={14} color="#10B981" /> تشفير DRM
                        </span>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary-light)' }}>{pkg.price}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}> ج.م</span>
                      </div>
                      <button className="btn btn-primary" onClick={onOpenAuthModal} style={{ padding: '0.55rem 1.25rem', fontSize: '0.88rem' }}>
                        اشترك الآن
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subscribe CTA Card */}
            <div
              className="glass-card"
              style={{
                padding: '2.5rem',
                textAlign: 'center',
                background: 'var(--banner-gradient)',
                border: '1px solid rgba(8,145,178,0.3)',
                borderRadius: '16px',
              }}
            >
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-bright)', marginBottom: '0.5rem' }}>
                ابدأ دراسة مقررات {ACADEMIC_YEAR_LABELS[selectedStudyYear]} اليوم
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
                سجّل حسابك الآن واحصل على وصول فوري لكافة الفيديوهات المحمية، الملازم عالية الجودة، وامتحانات البابل شيت مع متابعة أسبوعية دقيقة.
              </p>
              <button
                className="btn btn-primary btn-lg"
                onClick={onOpenAuthModal}
                style={{ padding: '0.85rem 2.25rem', fontSize: '1rem', fontWeight: 800 }}
              >
                <Rocket size={18} /> اشترك في الباقة الآن
              </button>
            </div>
          </section>
        );
      })()}

      {/* ── 8. PRICING & SUBSCRIPTIONS (Reused & Enhanced) ──── */}
      <section className="container" style={{ padding: '2rem 1.5rem 5rem 1.5rem' }}>
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
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}><Check size={16} color="var(--success)" /> تقرير شامل لولي الأمر</li>
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

      {/* ── 9. FAQ ACCORDION SECTION (Requirement #13) ───────── */}
      <section className="container" style={{ padding: '2rem 1.5rem 5rem 1.5rem' }}>
        <div className="section-header">
          <span className="gradient-badge"><HelpCircle size={15} /> الأسئلة الشائعة</span>
          <h2 className="section-title">إجابات لكافة استفساراتك</h2>
        </div>

        <div className="faq-container" style={{ maxWidth: '850px', margin: '0 auto' }}>
          {topFaqs.map((faq, idx) => (
            <div key={idx} className={`faq-item ${openFaq === idx ? 'active' : ''}`} style={{ marginBottom: '1rem' }}>
              <div className="faq-question" onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-bright)' }}>{faq.q}</span>
                <ChevronDown size={18} className="faq-icon" />
              </div>
              <div className="faq-answer">
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.7, margin: 0 }}>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button className="btn btn-secondary" onClick={() => onNavigateView('view-faq')}>
            <HelpCircle size={16} /> تصفح جميع الأسئلة الشائعة (FAQ Hub)
          </button>
        </div>
      </section>

      {/* ── 10. FINAL CALL TO ACTION (Requirement #14) ──────── */}
      <section className="container" style={{ padding: '2rem 1.5rem 6rem 1.5rem' }}>
        <div className="glass-card" style={{ padding: '3.5rem 2.5rem', textAlign: 'center', background: 'var(--banner-gradient)', border: '1px solid rgba(8,145,178,0.35)', position: 'relative', overflow: 'hidden' }}>
          <span className="gradient-badge" style={{ marginBottom: '1rem' }}>
            <Rocket size={15} /> انضم لمنظومة التفوق في الرياضيات
          </span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.5rem)', fontWeight: 900, color: 'var(--text-bright)', margin: '0.5rem 0 1rem' }}>
            جاهز لبدء رحلة التميز والتفوق الأكاديمي؟
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '680px', margin: '0 auto 2rem', lineHeight: 1.7 }}>
            انضم الآن لآلاف الطلاب واحصل على وصول مباشر لمحاضرات التفاضل والهندسة الفراغية، امتحانات البابل شيت، ومتابعة دقيقة لمستواك الأكاديمي.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={isAuthenticated ? () => onNavigateView('view-drm-player') : onOpenAuthModal}
              style={{ padding: '0.95rem 2.5rem', fontSize: '1.05rem', fontWeight: 800 }}
            >
              <Rocket size={18} /> ابدأ التعلم الآن
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => onNavigateView('view-parent-portal')}
              style={{ padding: '0.95rem 2rem', fontSize: '1.05rem', fontWeight: 700 }}
            >
              <ShieldCheck size={18} /> استخراج تقرير ولي الأمر
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
