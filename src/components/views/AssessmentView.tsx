import React, { useState, useEffect } from 'react';
import {
  Timer, CheckCircle, FileText, LayoutGrid, ChevronRight, ChevronLeft,
  ClipboardList, Clock, Users, Target, AlertTriangle, PlayCircle, Sigma
} from 'lucide-react';
import { Question } from '../../types';
import { useToast } from '../../context/ToastContext';
import { AntiCheatingModal } from '../modals/AntiCheatingModal';
import { ExamResultModal } from '../modals/ExamResultModal';

export const AssessmentView: React.FC = () => {
  const { showToast } = useToast();
  const [examStarted, setExamStarted] = useState(false);
  const [examMode, setExamMode] = useState<'bubble' | 'single'>('bubble');
  const [timerSeconds, setTimerSeconds] = useState(30 * 60);
  const [warningsCount, setWarningsCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState(0);

  const examInfo = {
    title: 'اختبار التفاضل والتكامل — الفصل الثالث: المشتقات',
    duration: 30,
    questionCount: 5,
    passingScore: 60,
    subject: 'التفاضل والتكامل',
    instructions: [
      'اقرأ كل سؤال بعناية قبل الإجابة',
      'لا يُسمح بمغادرة الصفحة أثناء الامتحان (سيتم التسجيل)',
      'أجب على جميع الأسئلة — لا يوجد خصم على الإجابة الخاطئة',
      'سيُغلق الامتحان تلقائياً عند انتهاء الوقت',
      'يمكنك التبديل بين نظام البابل شيت ونظام السؤال المنفرد',
    ],
  };

  const questions: Question[] = [
    {
      id: 1,
      text: 'إذا كانت f(x) = 3x³ − 5x² + 2x − 7، فإن f\'(x) =',
      options: [
        { key: 'A', label: '9x² − 10x + 2' },
        { key: 'B', label: '9x² − 10x − 2' },
        { key: 'C', label: '3x² − 10x + 2' },
        { key: 'D', label: '9x³ − 10x + 2' },
      ],
      correctAnswer: 'A',
      explanation: 'نطبق قاعدة الضرب: f\'(x) = 3·3x² − 5·2x + 2 = 9x² − 10x + 2',
    },
    {
      id: 2,
      text: 'ما هو تفاضل الدالة g(x) = sin(x²) بالنسبة لـ x؟',
      options: [
        { key: 'A', label: 'cos(x²)' },
        { key: 'B', label: '2x · cos(x²)' },
        { key: 'C', label: '2x · sin(x²)' },
        { key: 'D', label: 'cos(2x)' },
      ],
      correctAnswer: 'B',
      explanation: 'بتطبيق قاعدة السلسلة: g\'(x) = cos(x²) · 2x = 2x·cos(x²)',
    },
    {
      id: 3,
      text: 'إذا كان y = e^(3x)، فإن dy/dx =',
      options: [
        { key: 'A', label: 'e^(3x)' },
        { key: 'B', label: '3 · e^(3x)' },
        { key: 'C', label: '3x · e^(3x-1)' },
        { key: 'D', label: 'e^(3)' },
      ],
      correctAnswer: 'B',
      explanation: 'مشتقة e^(ax) = a · e^(ax)، لذا dy/dx = 3·e^(3x)',
    },
    {
      id: 4,
      text: 'في أي نقطة تكون المماس لمنحنى f(x) = x² − 4x + 3 أفقياً؟',
      options: [
        { key: 'A', label: 'x = 4' },
        { key: 'B', label: 'x = 2' },
        { key: 'C', label: 'x = 1' },
        { key: 'D', label: 'x = 0' },
      ],
      correctAnswer: 'B',
      explanation: 'f\'(x) = 2x − 4 = 0 ⟹ x = 2. المنحنى أفقي عند x = 2',
    },
    {
      id: 5,
      text: 'مشتقة الدالة h(x) = ln(5x) هي:',
      options: [
        { key: 'A', label: '1/x' },
        { key: 'B', label: '5/x' },
        { key: 'C', label: '1/(5x)' },
        { key: 'D', label: 'ln(5)' },
      ],
      correctAnswer: 'A',
      explanation: 'h\'(x) = (5x)\' / (5x) = 5/(5x) = 1/x. أو: ln(5x) = ln5 + lnx، فمشتقتها 1/x',
    },
  ];

  // Timer — only runs after exam starts
  useEffect(() => {
    if (!examStarted || showResultModal) return;

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
  }, [examStarted, showResultModal]);

  // Anti-cheating — only active after exam starts
  useEffect(() => {
    if (!examStarted || showResultModal) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarningsCount(prev => {
          const nextCount = prev + 1;
          setShowWarningModal(true);
          showToast(`تحذير ${nextCount}/3: تم كشف تبديل الشاشة أثناء الامتحان!`, 'danger');
          if (nextCount >= 3) handleSubmitExam();
          return nextCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [examStarted, showResultModal]);

  const handleSelectOption = (questionId: number, optionKey: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionKey }));
  };

  const handleSubmitExam = () => {
    let calc = 0;
    questions.forEach(q => { if (selectedAnswers[q.id] === q.correctAnswer) calc++; });
    setScore(calc);
    setShowResultModal(true);
  };

  const handleStartExam = () => {
    setExamStarted(true);
    showToast('بدأ الاختبار — حظاً موفقاً! الوقت يسير الآن.', 'success');
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
          setExamStarted(false);
          setShowResultModal(false);
        }}
      />

      {/* ── EXAM LOBBY ─────────────────────────────────── */}
      {!examStarted ? (
        <div className="glass-card exam-engine-wrapper">
          <div className="exam-lobby">
            <div className="exam-lobby-icon">
              <Sigma size={36} />
            </div>

            <div>
              <div className="gradient-badge" style={{ marginBottom: '0.75rem' }}>
                <ClipboardList size={14} /> {examInfo.subject}
              </div>
              <h1 className="exam-lobby-title">{examInfo.title}</h1>
            </div>

            {/* Meta chips */}
            <div className="exam-lobby-meta">
              <div className="exam-lobby-meta-item">
                <Clock size={16} />
                <span>المدة: {examInfo.duration} دقيقة</span>
              </div>
              <div className="exam-lobby-meta-item">
                <ClipboardList size={16} />
                <span>{examInfo.questionCount} أسئلة</span>
              </div>
              <div className="exam-lobby-meta-item">
                <Target size={16} />
                <span>درجة النجاح: {examInfo.passingScore}%</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="glass-card" style={{ padding: '1.5rem', width: '100%' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-bright)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} color="var(--accent)" /> تعليمات الاختبار
              </h3>
              <div className="exam-lobby-instructions">
                {examInfo.instructions.map((inst, i) => (
                  <div key={i} className="exam-lobby-instruction-item">
                    <CheckCircle size={16} />
                    <span>{inst}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Start button */}
            <button className="exam-start-btn" onClick={handleStartExam}>
              <PlayCircle size={22} style={{ marginLeft: '0.5rem' }} />
              ابدأ الاختبار الآن
            </button>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              سيبدأ العد التنازلي فقط بعد الضغط على الزر أعلاه
            </p>
          </div>
        </div>
      ) : (
        /* ── ACTIVE EXAM ─────────────────────────────── */
        <div className="exam-engine-wrapper">
          {/* Exam Top Bar */}
          <div className="exam-top-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className="exam-timer">
                <Timer size={18} /> {formatTimer(timerSeconds)}
              </span>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                {examInfo.title}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="exam-mode-toggle">
                <button
                  className={`exam-mode-btn ${examMode === 'bubble' ? 'active' : ''}`}
                  onClick={() => { setExamMode('bubble'); showToast('نظام البابل شيت المنقسم'); }}
                >
                  <LayoutGrid size={14} /> البابل شيت
                </button>
                <button
                  className={`exam-mode-btn ${examMode === 'single' ? 'active' : ''}`}
                  onClick={() => { setExamMode('single'); showToast('نظام السؤال المنفرد'); }}
                >
                  <FileText size={14} /> سؤال بسؤال
                </button>
              </div>
              <button className="btn btn-primary" onClick={handleSubmitExam} style={{ padding: '0.5rem 1.25rem' }}>
                <CheckCircle size={16} /> تسليم الاختبار
              </button>
            </div>
          </div>

          {/* Bubble sheet mode */}
          {examMode === 'bubble' ? (
            <div className="bubble-sheet-layout">
              {/* Questions pane */}
              <div className="pdf-preview-pane">
                <div className="pdf-mock-page">
                  <div style={{ borderBottom: '2px solid #0F172A', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{examInfo.title}</h3>
                      <span style={{ fontSize: '0.82rem', color: '#64748B' }}>منصة Syntax Math • التفاضل والتكامل</span>
                    </div>
                    <div style={{ border: '1px dashed #0F172A', padding: '0.3rem 0.7rem', fontSize: '0.8rem', fontWeight: 700 }}>
                      #CALC-2026
                    </div>
                  </div>
                  {questions.map(q => (
                    <div key={q.id} style={{ marginBottom: '2rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.6rem' }}>
                        س{q.id}: {q.text}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', paddingRight: '1rem' }}>
                        {q.options.map(opt => (
                          <div key={opt.key} style={{ fontSize: '0.93rem' }}>
                            <strong style={{ color: '#0891B2' }}>({opt.key})</strong> {opt.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bubble answer pane */}
              <div className="bubble-sheet-pane">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '1rem', color: 'var(--text-bright)' }}>البابل شيت التفاعلي</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {Object.keys(selectedAnswers).length} / {questions.length}
                  </span>
                </div>
                {questions.map(q => (
                  <div key={q.id} className="bubble-question-row">
                    <div className="bubble-q-num">سؤال ({q.id})</div>
                    <div className="bubble-options-group">
                      {['A', 'B', 'C', 'D'].map(key => (
                        <div
                          key={key}
                          className={`bubble-circle ${selectedAnswers[q.id] === key ? 'selected' : ''}`}
                          onClick={() => handleSelectOption(q.id, key)}
                        >
                          {key}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Single question mode */
            <div style={{ padding: '3rem 2.5rem', minHeight: '520px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="gradient-badge">سؤال {currentQuestionIndex + 1} من {questions.length}</span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {questions.map((_, idx) => (
                    <div
                      key={idx}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      style={{
                        width: '28px', height: '8px', borderRadius: '4px', cursor: 'pointer',
                        background: idx === currentQuestionIndex
                          ? 'var(--primary)'
                          : selectedAnswers[questions[idx].id]
                          ? 'var(--success)'
                          : 'var(--border-glass)',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '2rem', lineHeight: 1.6, color: 'var(--text-bright)' }}>
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
                        display: 'flex', alignItems: 'center', gap: '1rem',
                        cursor: 'pointer',
                        borderColor: isSelected ? 'var(--primary-light)' : 'var(--border-glass)',
                        background: isSelected ? 'rgba(8, 145, 178, 0.12)' : 'var(--bg-glass-card)',
                      }}
                      onClick={() => handleSelectOption(questions[currentQuestionIndex].id, opt.key)}
                    >
                      <div className={`bubble-circle ${isSelected ? 'selected' : ''}`}>{opt.key}</div>
                      <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-bright)' }}>{opt.label}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between' }}>
                <button
                  className="btn btn-secondary"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex(p => Math.max(0, p - 1))}
                >
                  <ChevronRight size={18} /> السابق
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    if (currentQuestionIndex < questions.length - 1) {
                      setCurrentQuestionIndex(p => p + 1);
                    } else {
                      handleSubmitExam();
                    }
                  }}
                >
                  {currentQuestionIndex === questions.length - 1 ? 'تسليم الامتحان' : 'التالي'} <ChevronLeft size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
