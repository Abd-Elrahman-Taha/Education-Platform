import React, { useState, useEffect } from 'react';
import { Timer, CheckCircle, FileText, LayoutGrid, ChevronRight, ChevronLeft } from 'lucide-react';
import { Question } from '../../types';
import { useToast } from '../../context/ToastContext';
import { AntiCheatingModal } from '../modals/AntiCheatingModal';
import { ExamResultModal } from '../modals/ExamResultModal';

export const AssessmentView: React.FC = () => {
  const { showToast } = useToast();
  const [examMode, setExamMode] = useState<'bubble' | 'single'>('bubble');
  const [timerSeconds, setTimerSeconds] = useState(30 * 60); // 30 mins
  const [warningsCount, setWarningsCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState(0);

  const questions: Question[] = [
    {
      id: 1,
      text: 'في التفاعل الكهروضوئي، إذا مضاعفة تردد الضوء الساقط على سطح معدني (بحيث يظل أكبر من التردد الحرِج)، فإن طاقة الحركة العظمى للإلكترونات المنبعثة:',
      options: [
        { key: 'A', label: 'تتضاعف بالضبط' },
        { key: 'B', label: 'تزداد إلى أكثر من ضعف قيمتها الأولى' },
        { key: 'C', label: 'تظل ثابته بدون تغيير' },
        { key: 'D', label: 'تقل إلى النصف' },
      ],
      correctAnswer: 'B',
      explanation: 'لأن KE = hν - E_w. عند مضاعفة ν إلى 2ν، تصبح الطاقة KE\' = 2hν - E_w = 2(KE + E_w) - E_w = 2KE + E_w، وهي أكبر من ضعف القيمة الأولى.',
    },
    {
      id: 2,
      text: 'إذا كان التغير في الفيض المغناطيسي الذي يخترق ملفاً مكوناً من 50 لفّة هو 0.02 وبر خلال زمن 0.1 ثانية، فإن القوة الدافعة الكهربية المستحثة تكون:',
      options: [
        { key: 'A', label: '10 فولت' },
        { key: 'B', label: '25 فولت' },
        { key: 'C', label: '100 فولت' },
        { key: 'D', label: '50 فولت' },
      ],
      correctAnswer: 'A',
      explanation: 'حسب قانون فاراداي: emf = -N (ΔΦm / Δt) = 50 * (0.02 / 0.1) = 10 V.',
    },
    {
      id: 3,
      text: 'شدة الإشعاع الصادر من جسم أسود عند الأطوال الموجية القصيرة جداً تقترب من:',
      options: [
        { key: 'A', label: 'اللانهاية' },
        { key: 'B', label: 'الصفر' },
        { key: 'C', label: 'القيمة العظمى' },
        { key: 'D', label: 'نصف القيمة العظمى' },
      ],
      correctAnswer: 'B',
      explanation: 'طبقاً لمنحنى بلانك، تقترب شدة الإشعاع من الصفر عند الأطوال الموجية القصيرة جداً وكذلك الطويلة جداً.',
    },
    {
      id: 4,
      text: 'في دائرة التيار المتردد المحتوية على مكثف وملف حث ومقاومة أومية، تكون الدائرة في حالة رنين عندما يكون:',
      options: [
        { key: 'A', label: 'X_L = X_C' },
        { key: 'B', label: 'R = 0' },
        { key: 'C', label: 'X_L > X_C' },
        { key: 'D', label: 'Z = X_L' },
      ],
      correctAnswer: 'A',
      explanation: 'شرط الرنين الأساسي هو تساوي المعاوقة الحثية مع المعاوقة السعوية X_L = X_C.',
    },
    {
      id: 5,
      text: 'الوحدة المستخدمة لقياس ثابت بلانك (h) في النظام الدولي هي:',
      options: [
        { key: 'A', label: 'جول / ثانية' },
        { key: 'B', label: 'جول • ثانية' },
        { key: 'C', label: 'وات • ثانية' },
        { key: 'D', label: 'نيوتن • متر' },
      ],
      correctAnswer: 'B',
      explanation: 'لأن E = hν ⟹ h = E / ν ⟹ Joules / (1/sec) = Joule • sec.',
    },
  ];

  // Exam Countdown Timer
  useEffect(() => {
    if (showResultModal) return;

    const interval = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showResultModal]);

  // Anti-Cheating Tab Switching Visibility Listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !showResultModal) {
        setWarningsCount(prev => {
          const nextCount = prev + 1;
          setShowWarningModal(true);
          showToast(`تحذير حماية ${nextCount}/3: تم كشف تبديل الشاشة أثناء الامتحان!`, 'danger');

          if (nextCount >= 3) {
            handleSubmitExam();
          }
          return nextCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [showResultModal]);

  const handleSelectOption = (questionId: number, optionKey: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionKey,
    }));
  };

  const handleSubmitExam = () => {
    let calculatedScore = 0;
    questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        calculatedScore += 1;
      }
    });
    setScore(calculatedScore);
    setShowResultModal(true);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="container fade-in-up" style={{ padding: '2rem 1.5rem 5rem 1.5rem' }}>
      <AntiCheatingModal
        isOpen={showWarningModal}
        warningsCount={warningsCount}
        onClose={() => setShowWarningModal(false)}
      />

      <ExamResultModal
        isOpen={showResultModal}
        score={score}
        totalQuestions={questions.length}
        answeredCount={Object.keys(selectedAnswers).length}
        onClose={() => setShowResultModal(false)}
        onRetry={() => {
          setSelectedAnswers({});
          setTimerSeconds(30 * 60);
          setWarningsCount(0);
          setShowResultModal(false);
        }}
      />

      {/* Top Bar Wrapper */}
      <div className="exam-engine-wrapper">
        <div className="exam-top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="exam-timer">
              <Timer size={18} /> {formatTimer(timerSeconds)}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              اختبار الشامل - الفيزياء الحديثة (البابل شيت التفاعلي)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="exam-mode-toggle">
              <button
                className={`exam-mode-btn ${examMode === 'bubble' ? 'active' : ''}`}
                onClick={() => {
                  setExamMode('bubble');
                  showToast("تم التحويل لنظام البابل شيت والمستند المنقسم");
                }}
              >
                <LayoutGrid size={15} /> البابل شيت المنقسم
              </button>
              <button
                className={`exam-mode-btn ${examMode === 'single' ? 'active' : ''}`}
                onClick={() => {
                  setExamMode('single');
                  showToast("تم التحويل لنظام السؤال المنفرد");
                }}
              >
                <FileText size={15} /> سؤال بسؤال
              </button>
            </div>

            <button className="btn btn-primary" onClick={handleSubmitExam} style={{ padding: '0.5rem 1.25rem' }}>
              <CheckCircle size={16} /> إنهاء وتسليم الاختبار
            </button>
          </div>
        </div>

        {/* MODE 1: BUBBLE SHEET SPLIT VIEW */}
        {examMode === 'bubble' ? (
          <div className="bubble-sheet-layout">
            {/* Left: PDF / Question Document Mockup */}
            <div className="pdf-preview-pane">
              <div className="pdf-mock-page">
                <div style={{ borderBottom: '2px solid #0F172A', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>اختبار الفيزياء الحديثة العام - 2026</h3>
                    <span style={{ fontSize: '0.85rem', color: '#64748B' }}>وزارة التربية والتعليم • منصة Syntax EdTech</span>
                  </div>
                  <div style={{ border: '1px dashed #0F172A', padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 700 }}>
                    كود الورقة: #PHYS-994
                  </div>
                </div>

                {questions.map((q) => (
                  <div key={q.id} style={{ marginBottom: '2rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.6rem' }}>
                      س{q.id}: {q.text}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', paddingRight: '1rem' }}>
                      {q.options.map(opt => (
                        <div key={opt.key} style={{ fontSize: '0.95rem' }}>
                          <strong style={{ color: 'var(--primary)' }}>({opt.key})</strong> {opt.label}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Bubble Sheet Answer Grid */}
            <div className="bubble-sheet-pane">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <strong style={{ fontSize: '1.05rem' }}>ورقة البابل شيت التفاعلية</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  المجاب: {Object.keys(selectedAnswers).length} من {questions.length}
                </span>
              </div>

              {questions.map((q) => (
                <div key={q.id} className="bubble-question-row">
                  <div className="bubble-q-num">سؤال رقم ({q.id})</div>
                  <div className="bubble-options-group">
                    {['A', 'B', 'C', 'D'].map((key) => {
                      const isSelected = selectedAnswers[q.id] === key;
                      return (
                        <div
                          key={key}
                          className={`bubble-circle ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleSelectOption(q.id, key)}
                        >
                          {key}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* MODE 2: SINGLE QUESTION STEPPER VIEW */
          <div style={{ padding: '3rem 2.5rem', minHeight: '520px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="gradient-badge">سؤال {currentQuestionIndex + 1} من {questions.length}</span>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {questions.map((_, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    style={{
                      width: '28px',
                      height: '8px',
                      borderRadius: '4px',
                      background: idx === currentQuestionIndex ? 'var(--primary)' : (selectedAnswers[questions[idx].id] ? 'var(--success)' : 'var(--border-glass)'),
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '2rem', lineHeight: '1.6' }}>
              {questions[currentQuestionIndex].text}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
              {questions[currentQuestionIndex].options.map(opt => {
                const isSelected = selectedAnswers[questions[currentQuestionIndex].id] === opt.key;
                return (
                  <div
                    key={opt.key}
                    className="glass-card"
                    style={{
                      padding: '1.1rem 1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      cursor: 'pointer',
                      borderColor: isSelected ? 'var(--primary-light)' : 'var(--border-glass)',
                      background: isSelected ? 'rgba(79, 70, 229, 0.15)' : 'var(--bg-glass-card)'
                    }}
                    onClick={() => handleSelectOption(questions[currentQuestionIndex].id, opt.key)}
                  >
                    <div className={`bubble-circle ${isSelected ? 'selected' : ''}`}>{opt.key}</div>
                    <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>{opt.label}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                className="btn btn-secondary"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              >
                <ChevronRight size={18} /> السؤال السابق
              </button>

              <button
                className="btn btn-primary"
                onClick={() => {
                  if (currentQuestionIndex < questions.length - 1) {
                    setCurrentQuestionIndex(prev => prev + 1);
                  } else {
                    handleSubmitExam();
                  }
                }}
              >
                {currentQuestionIndex === questions.length - 1 ? 'تسليم الامتحان النهائي' : 'السؤال التالي'} <ChevronLeft size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
