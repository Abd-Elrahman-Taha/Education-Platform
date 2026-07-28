import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Rocket,
  PlayCircle,
  Star,
  Play,
  Award,
  TrendingUp,
  Users,
  BookOpen,
  UserCheck,
  Smile,
  Atom,
  CheckSquare,
  FlaskConical,
  Dna,
  Lock,
  FileCheck,
  Bot,
  MessageSquare,
  ChevronDown,
  Check,
  ArrowLeft,
  Clock
} from 'lucide-react';
import { AppView, Course } from '../../types';
import { useToast } from '../../context/ToastContext';

interface LandingViewProps {
  onNavigateView: (view: AppView) => void;
  onOpenAuthModal: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigateView, onOpenAuthModal }) => {
  const { showToast } = useToast();
  const [activeCourseTab, setActiveCourseTab] = useState<string>('all');
  const [isYearlyBilling, setIsYearlyBilling] = useState<boolean>(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Animated counters
  const [counters, setCounters] = useState({ students: 0, courses: 0, teachers: 0, rating: 0 });

  useEffect(() => {
    const duration = 1500;
    const steps = 30;
    const intervalTime = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setCounters({
        students: Math.floor(100000 * progress),
        courses: Math.floor(500 * progress),
        teachers: Math.floor(150 * progress),
        rating: Math.floor(98 * progress),
      });

      if (step >= steps) {
        clearInterval(timer);
        setCounters({ students: 100000, courses: 500, teachers: 150, rating: 98 });
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  const sampleCourses: Course[] = [
    {
      id: 'c1',
      title: 'الفيزياء الحديثة وقوانين كيرشوف والكهربية للمرحلة الثانوية',
      category: 'physics',
      level: 'الصف الثالث الثانوي',
      instructor: { name: 'أ.د. محمود فاروق', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80', role: 'خبير الفيزياء' },
      duration: '42 ساعة',
      lessonsCount: 36,
      examsCount: 12,
      rating: 4.9,
      studentsCount: 14200,
      price: '350 ج.م',
      image: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=600&q=80',
      tag: 'مباشر حصري',
    },
    {
      id: 'c2',
      title: 'التفاضل والتكامل والهندسة الفراغية - مراجعة ليلة الامتحان',
      category: 'math',
      level: 'الصف الثالث الثانوي',
      instructor: { name: 'م. أحمد الشريف', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80', role: 'كبير معلمي الرياضيات' },
      duration: '50 ساعة',
      lessonsCount: 45,
      examsCount: 18,
      rating: 5.0,
      studentsCount: 18900,
      price: '400 ج.م',
      image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80',
      tag: 'الأعلى طلباً',
    },
    {
      id: 'c3',
      title: 'الكيمياء العضوية والتجميعات والمخططات السريعة',
      category: 'chemistry',
      level: 'الصف الثاني الثانوي',
      instructor: { name: 'د. سارة عبد الفتاح', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80', role: 'استشاري المادة' },
      duration: '38 ساعة',
      lessonsCount: 30,
      examsCount: 10,
      rating: 4.8,
      studentsCount: 9400,
      price: '300 ج.م',
      image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80',
      tag: 'تأسيس مكثف',
    },
  ];

  const filteredCourses = activeCourseTab === 'all'
    ? sampleCourses
    : sampleCourses.filter(c => c.category === activeCourseTab);

  const faqs = [
    {
      q: 'كيف تضمن منصة Syntax EdTech حماية الفيديوهات من التسريب؟',
      a: 'تعتمد المنصة على تقنية DRM المتقدمة مع طباعة علامة مائية ديناميكية تتبع حركة العين والشاشة وتحتوي على اسم الطالب، كوده الخاص، وعنوان الـ IP لمنع أي تصوير أو تسجيل.',
    },
    {
      q: 'ما هو نظام امتحانات البابل شيت والتصحيح بالذكاء الاصطناعي؟',
      a: 'يتيح للطلاب حل الامتحانات عبر واجهة تفاعلية شاشة منقسمة (Split View)، أو رفع ورقة البابل شيت الورقية ليتم تصحيحها فورياً واستخراج تقرير بنقاط القوة والضعف.',
    },
    {
      q: 'كيف يستفيد ولي الأمر من المنصة؟',
      a: 'يحصل ولي الأمر على كود متابعة خاص لبوابة ولي الأمر لرؤية منحنى أداء الطالب، نسبة الحضور، ودرجات الاختبارات مع إمكانية استلام تقرير شامل تلقائي عبر WhatsApp.',
    },
    {
      q: 'هل يمكنني استخدام المساعد الذكي AI Tutor على مدار 24 ساعة؟',
      a: 'نعم! مساعد Syntax AI متصل بقواعد بيانات المنهج التعليمي ويستجيب فورياً لأسئلتك واستفساراتك مع توليد تدريبات ومسائل مشابهة.',
    },
  ];

  return (
    <div className="fade-in-up">
      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-content">
            <div className="gradient-badge">
              <Sparkles size={16} /> المنصة الأولى المعتمدة بالذكاء الاصطناعي في مصر
            </div>
            <h1>تعلم المهارات التي <span className="gradient-text">تشكل مستقبلك الدراسي</span></h1>
            <p className="hero-subtitle">
              تجربة تعليمية متكاملة تجمع بين حماية الفيديوهات DRM، امتحانات البابل شيت والتصحيح التلقائي، ومساعد الذكاء الاصطناعي الذكي المتاح 24/7 لمتابعة الطلاب وأولياء الأمور لحظياً.
            </p>

            <div className="hero-cta-group">
              <button className="btn btn-primary btn-lg" onClick={onOpenAuthModal} style={{ padding: '0.9rem 1.8rem', fontSize: '1.05rem' }}>
                <Rocket size={20} /> ابدأ التعلم مجاناً الان
              </button>
              <button
                className="btn btn-secondary btn-lg"
                onClick={() => onNavigateView('view-drm-player')}
                style={{ padding: '0.9rem 1.8rem', fontSize: '1.05rem' }}
              >
                <PlayCircle size={20} /> تجربة المشغل DRM
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
                  <Star size={14} fill="currentColor" /> (4.9/5)
                </div>
                <span className="trust-text">محل ثقة أكثر من 100,000 طالب وطالبة بجمهورية مصر العربية</span>
              </div>
            </div>
          </div>

          {/* Hero Floating Card Visual */}
          <div className="hero-visual-wrapper">
            <div className="glass-card hero-main-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className="pulse-dot"></span>
                  <strong style={{ fontSize: '0.9rem' }}>بث مباشر الان: الفيزياء الحديثة</strong>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>1,420 طالب يشاهدون الان</span>
              </div>
              <div style={{ width: '100%', height: '220px', background: '#0F172A', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} alt="Live Class" />
                <button
                  onClick={() => onNavigateView('view-drm-player')}
                  style={{ position: 'absolute', background: 'rgba(79, 70, 229, 0.9)', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', border: 'none', cursor: 'pointer', boxShadow: '0 0 20px var(--primary-glow)' }}
                >
                  <Play size={24} fill="#FFF" />
                </button>
              </div>
            </div>

            <div className="glass-card floating-card-1">
              <Award size={26} color="var(--accent)" />
              <div>
                <strong style={{ fontSize: '0.85rem', display: 'block' }}>شهادة معتمدة موثقة</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>المرتبة الأولى بالمحافظة</span>
              </div>
            </div>

            <div className="glass-card floating-card-2">
              <TrendingUp size={26} color="var(--secondary-light)" />
              <div>
                <strong style={{ fontSize: '0.85rem', display: 'block' }}>المعدل التراكمي: 98%</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>+4.5% تحسن مستمر</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATISTICS BAR */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="glass-card stat-card">
              <div className="stat-number gradient-text">{counters.students.toLocaleString()}+</div>
              <div className="stat-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                <Users size={16} /> طالب مشترك بالمنصة
              </div>
            </div>
            <div className="glass-card stat-card">
              <div className="stat-number gradient-text">{counters.courses}+</div>
              <div className="stat-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                <BookOpen size={16} /> كورس ودرس حصري
              </div>
            </div>
            <div className="glass-card stat-card">
              <div className="stat-number gradient-text">{counters.teachers}+</div>
              <div className="stat-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                <UserCheck size={16} /> مدرس ومعلم خبير
              </div>
            </div>
            <div className="glass-card stat-card">
              <div className="stat-number gradient-text">{counters.rating}%</div>
              <div className="stat-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                <Smile size={16} /> نسبة رضا أولياء الأمور
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES SECTION */}
      <section className="container" style={{ padding: '4rem 1.5rem' }}>
        <div className="section-header">
          <span className="gradient-badge"><Atom size={16} /> الأقسام والمواد الدراسية</span>
          <h2 className="section-title">استكشف مسارات التخصص والتفوق</h2>
          <p className="section-subtitle">اختر المادة الدراسية للحصول على شرح بالفيديو، ملازم PDF، وامتحانات بابل شيت تفاعلية.</p>
        </div>

        <div className="categories-grid">
          <div className="glass-card category-card" onClick={() => setActiveCourseTab('physics')}>
            <div className="category-icon"><Atom size={28} /></div>
            <h3 className="category-title">الفيزياء الثانوية</h3>
            <span className="category-count">48 درس • 120 امتحان</span>
          </div>

          <div className="glass-card category-card" onClick={() => setActiveCourseTab('math')}>
            <div className="category-icon"><CheckSquare size={28} /></div>
            <h3 className="category-title">الرياضيات والتفاضل</h3>
            <span className="category-count">64 درس • 150 امتحان</span>
          </div>

          <div className="glass-card category-card" onClick={() => setActiveCourseTab('chemistry')}>
            <div className="category-icon"><FlaskConical size={28} /></div>
            <h3 className="category-title">الكيمياء العضوية</h3>
            <span className="category-count">40 درس • 90 امتحان</span>
          </div>

          <div className="glass-card category-card" onClick={() => setActiveCourseTab('biology')}>
            <div className="category-icon"><Dna size={28} /></div>
            <h3 className="category-title">الأحياء والجيولوجيا</h3>
            <span className="category-count">36 درس • 85 امتحان</span>
          </div>
        </div>
      </section>

      {/* COURSES FILTER & GRID */}
      <section className="container" style={{ padding: '2rem 1.5rem 5rem 1.5rem' }}>
        <div className="courses-filter-bar">
          <button className={`filter-btn ${activeCourseTab === 'all' ? 'active' : ''}`} onClick={() => setActiveCourseTab('all')}>جميع الكورسات</button>
          <button className={`filter-btn ${activeCourseTab === 'physics' ? 'active' : ''}`} onClick={() => setActiveCourseTab('physics')}>الفيزياء</button>
          <button className={`filter-btn ${activeCourseTab === 'math' ? 'active' : ''}`} onClick={() => setActiveCourseTab('math')}>الرياضيات</button>
          <button className={`filter-btn ${activeCourseTab === 'chemistry' ? 'active' : ''}`} onClick={() => setActiveCourseTab('chemistry')}>الكيمياء</button>
        </div>

        <div className="courses-grid">
          {filteredCourses.map(course => (
            <div key={course.id} className="glass-card course-card">
              <div className="course-thumb">
                <img src={course.image} className="course-img" alt={course.title} />
                <span className="course-badge">{course.tag}</span>
              </div>
              <div className="course-body">
                <div className="course-meta">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={14} /> {course.duration}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Star size={14} fill="var(--accent)" color="var(--accent)" /> {course.rating} ({course.studentsCount})</span>
                </div>
                <h3 className="course-title">{course.title}</h3>

                <div className="course-instructor">
                  <img src={course.instructor.avatar} className="instructor-avatar" alt={course.instructor.name} />
                  <div>
                    <span className="instructor-name">{course.instructor.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', display: 'block' }}>{course.instructor.role}</span>
                  </div>
                </div>

                <div className="course-footer">
                  <div className="course-price">{course.price}</div>
                  <button className="btn btn-primary" onClick={() => onNavigateView('view-drm-player')}>
                    ابدأ الدرس الان <ArrowLeft size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PLATFORM FEATURES SHOWCASE */}
      <section className="container" style={{ padding: '3rem 1.5rem 6rem 1.5rem' }}>
        <div className="section-header">
          <span className="gradient-badge"><Sparkles size={16} /> المنظومة التعليمية المتكاملة</span>
          <h2 className="section-title">لماذا يختارنا الطلاب وأولياء الأمور؟</h2>
        </div>

        <div className="features-grid">
          <div className="glass-card feature-card">
            <div className="feature-icon-box"><Lock size={28} /></div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>حماية الفيديوهات DRM</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              علامات مائية متحركة ديناميكياً بأسم الطالب وكوده لحماية الحقوق الفكرية ومنع التسريب أو تسجيل الشاشة.
            </p>
          </div>

          <div className="glass-card feature-card">
            <div className="feature-icon-box"><FileCheck size={28} /></div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>امتحانات البابل شيت</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              اختبارات أونلاين تفاعلية بنظام البابل شيت مع تحذيرات حظر التنقل بين النوافذ وتصحيح فوري بالنماذج الرسمية.
            </p>
          </div>

          <div className="glass-card feature-card">
            <div className="feature-icon-box"><Bot size={28} /></div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>مساعد الذكاء الاصطناعي 24/7</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              مساعد تعليمي ذكي يفهم أسئلة الفيزياء والرياضيات والكيمياء ويولد حلولاً وخطوات تفصيلية في أي وقت.
            </p>
          </div>
        </div>
      </section>

      {/* PRICING PLANS SECTION */}
      <section className="container" style={{ padding: '2rem 1.5rem 6rem 1.5rem' }}>
        <div className="section-header">
          <span className="gradient-badge"><Award size={16} /> الاشتراكات والباقات</span>
          <h2 className="section-title">اختر الخطة المناسبة لرحلة تفوقك</h2>
        </div>

        <div className="pricing-toggle-wrap">
          <span style={{ fontWeight: !isYearlyBilling ? 700 : 400, color: !isYearlyBilling ? 'var(--text-main)' : 'var(--text-muted)' }}>شهري</span>
          <div
            className={`toggle-switch ${isYearlyBilling ? 'active' : ''}`}
            onClick={() => {
              setIsYearlyBilling(!isYearlyBilling);
              showToast(!isYearlyBilling ? "تم اختيار الاشتراك السنوي (خصم 20% مفعل)" : "تم اختيار الاشتراك الشهري");
            }}
          >
            <div className="toggle-handle"></div>
          </div>
          <span style={{ fontWeight: isYearlyBilling ? 700 : 400, color: isYearlyBilling ? 'var(--text-main)' : 'var(--text-muted)' }}>
            سنوي <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>(خصم 20%)</span>
          </span>
        </div>

        <div className="pricing-grid">
          <div className="glass-card pricing-card">
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>الباقة الأساسية</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>للطالب الراغب في مادة واحدة</p>
            <div className="price-amount">
              {isYearlyBilling ? '2000' : '250'} <span className="price-period">ج.م / {isYearlyBilling ? 'سنة' : 'شهر'}</span>
            </div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', fontSize: '0.9rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="var(--success)" /> مشاهدة فيديوهات مادة واحدة DRM</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="var(--success)" /> امتحانات البابل شيت الأسبوعية</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="var(--success)" /> تقرير شهر لولي الأمر</li>
            </ul>
            <button className="btn btn-secondary" style={{ marginTop: 'auto' }} onClick={onOpenAuthModal}>اشترك الان</button>
          </div>

          <div className="glass-card pricing-card popular">
            <div className="popular-badge">الأكثر اختياراً</div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>الباقة الشاملة للمرحلة</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>جميع المواد للمرحلة الثانوية</p>
            <div className="price-amount">
              {isYearlyBilling ? '4800' : '600'} <span className="price-period">ج.م / {isYearlyBilling ? 'سنة' : 'شهر'}</span>
            </div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', fontSize: '0.9rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="var(--success)" /> وصول غير محدود لجميع المحاضرات</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="var(--success)" /> امتحانات بابل شيت متقدمة لا نهائية</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="var(--success)" /> مساعد AI Tutor غير محدود 24/7</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="var(--success)" /> إشعارات واتساب لحظية لولي الأمر</li>
            </ul>
            <button className="btn btn-primary" style={{ marginTop: 'auto' }} onClick={onOpenAuthModal}>احصل على الخطة الشاملة</button>
          </div>

          <div className="glass-card pricing-card">
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>باقة السنتر والمجموعات</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>لطلاب السناثر وكروت الشحن</p>
            <div className="price-amount">
              {isYearlyBilling ? '7200' : '900'} <span className="price-period">ج.م / {isYearlyBilling ? 'سنة' : 'شهر'}</span>
            </div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', fontSize: '0.9rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="var(--success)" /> كروت شحن الأكواد الخاصة بالسنتر</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="var(--success)" /> متابعة مساعدة خاصة من الأسستنت</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="var(--success)" /> ملازم ومذكرات PDF مطبوعة تصل للمنزل</li>
            </ul>
            <button className="btn btn-secondary" style={{ marginTop: 'auto' }} onClick={onOpenAuthModal}>تواصل مع الإدارة</button>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="container" style={{ padding: '2rem 1.5rem 6rem 1.5rem' }}>
        <div className="section-header">
          <span className="gradient-badge"><MessageSquare size={16} /> الأسئلة الشائعة</span>
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
