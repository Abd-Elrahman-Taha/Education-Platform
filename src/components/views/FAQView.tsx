import React, { useState } from 'react';
import { MessageSquare, ChevronDown, Sparkles, Search, HelpCircle, Shield, Award, Video, FileText, Phone } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface FAQCategory {
  id: string;
  name: string;
  icon: React.ElementType;
}

const CATEGORIES: FAQCategory[] = [
  { id: 'all', name: 'جميع الأسئلة', icon: HelpCircle },
  { id: 'drm', name: 'حماية الفيديوهات و DRM', icon: Shield },
  { id: 'parent', name: 'متابعة ولي الأمر والتقارير', icon: Award },
  { id: 'exams', name: 'الامتحانات والبابل شيت', icon: FileText },
  { id: 'ai', name: 'مساعد الذكاء الاصطناعي', icon: Sparkles },
];

export const FAQView: React.FC = () => {
  const { showToast } = useToast();
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      cat: 'drm',
      q: 'كيف تضمن المنصة حماية الفيديوهات من التسريب؟',
      a: 'تعتمد المنصة على تقنية DRM المتقدمة لتشفير البث المباشر والمحاضرات مع طباعة علامة مائية ديناميكية متحركة تتبع حركة العين والشاشة وتحتوي على اسم الطالب وكوده وعنوان الـ IP لمنع أي تصوير أو تسجيل.',
    },
    {
      cat: 'parent',
      q: 'كيف يستفيد ولي الأمر من المنصة بدون إنشاء حساب؟',
      a: 'يمكن لولي الأمر الضغط مباشرة على زر "بوابة ولي الأمر" في القائمة العلوية وإدخال كود الطالب والرقم القومي / رقم الهوية للاطلاع الفوري على التقرير الأكاديمي، منحنى الدرجات، ونسبة حضور المحاضرات.',
    },
    {
      cat: 'exams',
      q: 'كيف يعمل نظام فتح الدروس (Lesson Gating) وامتحانات البابل شيت؟',
      a: 'يتم قفل المحاضرات المتقدمة تلقائياً حتى يقوم الطالب باجتياز امتحان المحاضرة السابقة بنسبة نجاح 60% على الأقل لضمان التسلسل التعليمي الفعال وتثبيت المعلومة.',
    },
    {
      cat: 'ai',
      q: 'هل يمكنني استخدام المساعد الذكي AI Tutor لحل مسائل الرياضيات؟',
      a: 'نعم! مساعد Syntax AI المدمج في كل درس متخصص في مسائل التفاضل والتكامل والهندسة الفراغية ويقدم شرحاً تفاعلياً خطوة بخطوة مع توضيح القوانين وإمكانية نسخ وتوليد الإجابات.',
    },
    {
      cat: 'exams',
      q: 'ما هي المواد الدراسية المتاحة على المنصة؟',
      a: 'تتخصص المنصة حصرياً في مادتي التفاضل والتكامل (Calculus) والهندسة الفراغية (3D Geometry) للمرحلة الثانوية بصفوفها الثلاثة الأول والثاني والثالث الثانوي.',
    },
    {
      cat: 'drm',
      q: 'هل يمكن تشغيل المحاضرات على الهاتف المحمول والكمبيوتر؟',
      a: 'نعم، المنصة متوافقة تماماً مع جميع الأجهزة والشاشات مع المحافظة على معايير الأمان وتشغيل الفيديو بجودات متعددة تناسب سرعات الإنترنت المختلفة.',
    },
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchCat = selectedCat === 'all' || faq.cat === selectedCat;
    const matchQuery = !searchQuery || faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div className="container fade-in-up" style={{ padding: '3rem 1.5rem 6rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 2.5rem' }}>
        <span className="gradient-badge" style={{ marginBottom: '0.75rem' }}>
          <MessageSquare size={14} /> مركز الأسئلة والإجابات
        </span>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-bright)', margin: '0.5rem 0' }}>
          الأسئلة الشائعة (Frequently Asked Questions)
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
          إجابات وافية وشاملة لجميع استفسارات الطلاب وأولياء الأمور حول المنصة، نظام حماية DRM، الامتحانات، وبوابة المتابعة.
        </p>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginTop: '1.5rem', maxWidth: '520px', margin: '1.5rem auto 0' }}>
          <Search size={18} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="ابحث عن سؤالك هنا (مثال: DRM، ولي الأمر، البابل شيت)..."
            style={{ width: '100%', paddingRight: '44px', fontSize: '0.9rem' }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
        {CATEGORIES.map(cat => {
          const IconComp = cat.icon;
          const isSel = selectedCat === cat.id;
          return (
            <button
              key={cat.id}
              className={`filter-btn ${isSel ? 'active' : ''}`}
              onClick={() => setSelectedCat(cat.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              <IconComp size={15} />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* FAQ Accordion List */}
      <div className="faq-container" style={{ maxWidth: '850px', margin: '0 auto' }}>
        {filteredFaqs.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            لا توجد أسئلة تطابق بحثك. تواصل مع الدعم الفني لمساعدتك.
          </div>
        ) : (
          filteredFaqs.map((faq, idx) => (
            <div key={idx} className={`faq-item ${openFaq === idx ? 'active' : ''}`} style={{ marginBottom: '1rem' }}>
              <div className="faq-question" onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-bright)' }}>{faq.q}</span>
                <ChevronDown size={18} className="faq-icon" />
              </div>
              <div className="faq-answer">
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.7, margin: 0 }}>{faq.a}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Need More Help Card */}
      <div className="glass-card" style={{ maxWidth: '850px', margin: '3.5rem auto 0', padding: '2rem', textAlign: 'center', background: 'var(--banner-gradient)', border: '1px solid rgba(8,145,178,0.25)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.5rem' }}>
          لديك سؤال آخر لم تجد إجابته؟
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          فريق الدعم الفني والمعلمين متاحون للرد على كافة الاستفسارات التعليمية والتقنية.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => showToast('تواصل مع الدعم الفني عبر واتساب: 01000000001', 'info')}
        >
          <Phone size={16} /> تواصل مع الدعم الفني
        </button>
      </div>
    </div>
  );
};
