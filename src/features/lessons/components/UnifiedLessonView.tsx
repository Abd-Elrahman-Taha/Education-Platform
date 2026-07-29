import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lessonsApi } from '../api/lessonsApi';
import { Lesson, Question } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { InlineAIAssistant } from '../../ai/components/InlineAIAssistant';
import { AskTeacherSection } from '../../messages/components/AskTeacherSection';
import {
  Lock, Unlock, Play, Pause, ShieldCheck, Download, FileText,
  CheckCircle2, Star, Send, Award, Clock, ChevronLeft, ChevronRight,
  ClipboardList, AlertTriangle, PlayCircle, HelpCircle, Check
} from 'lucide-react';

interface Props {
  activeLessonId?: string;
  onNavigateView: (view: AppView, lessonId?: string) => void;
}

import { AppView } from '../../../types';

export const UnifiedLessonView: React.FC<Props> = ({ activeLessonId, onNavigateView }) => {
  const { showToast } = useToast();
  const { isAuthenticated, currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [selectedLessonId, setSelectedLessonId] = useState<string>(activeLessonId || 'lesson-1');
  const [isPlaying, setIsPlaying] = useState(false);
  const [resolution, setResolution] = useState('1080p (FHD)');
  const [playbackSpeed, setPlaybackSpeed] = useState('1.0x');

  // Homework state
  const [hwAnswers, setHwAnswers] = useState<Record<number, string>>({});
  const [hwSubmitted, setHwSubmitted] = useState(false);

  // Exam state
  const [examStarted, setExamStarted] = useState(false);
  const [examAnswers, setExamAnswers] = useState<Record<number, string>>({});
  const [examTimer, setExamTimer] = useState(20 * 60);

  // Feedback state
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Sync prop activeLessonId when updated
  useEffect(() => {
    if (activeLessonId) setSelectedLessonId(activeLessonId);
  }, [activeLessonId]);

  // Fetch all lessons (for sidebar / gating selector)
  const { data: lessonsRes, isLoading: isLessonsLoading } = useQuery({
    queryKey: ['studentLessons'],
    queryFn: lessonsApi.getLessons,
  });

  // Fetch active lesson details
  const { data: lessonRes, isLoading: isLessonLoading } = useQuery({
    queryKey: ['studentLesson', selectedLessonId],
    queryFn: () => lessonsApi.getLessonById(selectedLessonId),
  });

  const homeworkMutation = useMutation({
    mutationFn: (answers: Record<number, string>) =>
      lessonsApi.submitHomework(selectedLessonId, answers),
    onSuccess: (res) => {
      setHwSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['studentLesson', selectedLessonId] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
      showToast(`تم تسليم الواجب بنجاح! النتيجة: ${res.data.score}%`, 'success');
    },
  });

  const examMutation = useMutation({
    mutationFn: (answers: Record<number, string>) =>
      lessonsApi.submitLessonExam(selectedLessonId, answers, '15 دقيقة'),
    onSuccess: (res) => {
      setExamStarted(false);
      queryClient.invalidateQueries({ queryKey: ['studentLessons'] });
      queryClient.invalidateQueries({ queryKey: ['studentLesson', selectedLessonId] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['examHistory'] });
      queryClient.invalidateQueries({ queryKey: ['examStats'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      if (res.data.unlockedNextLesson) {
        showToast(`🎉 مبروك! اجتزت الاختبار بنسبة ${res.data.examRecord.percentage}% وتـم فـتـح الـدرس الـقـادم تلقائياً!`, 'success');
      } else if (res.data.examRecord.isPassed) {
        showToast(`أحسنت! اجتزت الاختبار بنسبة ${res.data.examRecord.percentage}%`, 'success');
      } else {
        showToast(`لم تجتز الاختبار (النسبة ${res.data.examRecord.percentage}%). درجات النجاح 60%. حاول مرة أخرى!`, 'warning');
      }
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: (data: { rating: number; comment: string }) =>
      lessonsApi.submitFeedback(selectedLessonId, data.rating, data.comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentLesson', selectedLessonId] });
      showToast('شكراً لتقييمك وملاحظاتك القيمة!', 'success');
    },
  });

  // Dynamic Canvas Bouncing Watermark DRM Protection
  useEffect(() => {
    if (!isAuthenticated) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let x = 30, y = 50, dx = 1.5, dy = 1.2;
    const studentName = currentUser?.name || 'أحمد طالب';
    const studentCode = `CODE: #${currentUser?.id?.slice(-5) || '94021'}`;

    const resizeCanvas = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const drawWatermark = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(13, 31, 35, 0.75)';
      ctx.strokeStyle = 'rgba(8, 145, 178, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, 220, 50, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.font = '600 12px Cairo, sans-serif';
      ctx.fillText(studentName, x + 12, y + 20);
      ctx.fillStyle = '#22D3EE';
      ctx.font = '700 10px monospace';
      ctx.fillText(`${studentCode} • DRM v2.4`, x + 12, y + 38);

      if (x + 220 >= canvas.width || x <= 0) dx = -dx;
      if (y + 50 >= canvas.height || y <= 0) dy = -dy;
      x += dx; y += dy;
      animFrameIdRef.current = requestAnimationFrame(drawWatermark);
    };

    drawWatermark();
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isAuthenticated, currentUser, selectedLessonId]);

  const lessons = lessonsRes?.data || [];
  const lesson = lessonRes?.data;

  // Exam timer ticker
  useEffect(() => {
    if (!examStarted) return;
    const interval = setInterval(() => {
      setExamTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          examMutation.mutate(examAnswers);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [examStarted, examAnswers]);

  if (isLessonsLoading || isLessonLoading) {
    return (
      <div className="container fade-in-up" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '3rem', maxWidth: '500px', margin: '0 auto' }}>
          <div className="spinner" style={{ margin: '0 auto 1.5rem', width: '40px', height: '40px', border: '4px solid rgba(8,145,178,0.2)', borderTopColor: 'var(--primary-light)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-bright)' }}>جاري تحميل محتوى الدرس الموحد...</h3>
        </div>
      </div>
    );
  }

  if (!lesson) return null;

  return (
    <div className="container fade-in-up" style={{ padding: '2rem 1.5rem 5rem' }}>
      {/* ── LESSON UNLOCK SELECTOR BAR ────────────────────── */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-light)', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>مسار التعلم ونظام فتح الدروس (Lesson Unlock Progression)</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            اجتز امتحان كل درس بنسبة 60% لفتح الدرس التالي
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.85rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {lessons.map((l, index) => {
            const isSelected = l.id === selectedLessonId;
            return (
              <button
                key={l.id}
                onClick={() => {
                  if (l.isLocked) {
                    showToast('🔒 هذا الدرس مغلق! يجب عليك تجاوُز امتحان الدرس السابق أولاً لفتحه.', 'warning');
                  } else {
                    setSelectedLessonId(l.id);
                    setExamStarted(false);
                  }
                }}
                className="glass-card"
                style={{
                  minWidth: '220px',
                  padding: '0.75rem 1rem',
                  border: isSelected ? '2px solid var(--primary-light)' : '1px solid var(--border-glass)',
                  background: isSelected ? 'rgba(8,145,178,0.18)' : l.isLocked ? 'rgba(15,23,42,0.6)' : 'var(--bg-glass-card)',
                  opacity: l.isLocked ? 0.65 : 1,
                  cursor: 'pointer',
                  textAlign: 'right',
                  position: 'relative',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isSelected ? 'var(--primary-light)' : 'var(--text-muted)' }}>
                    درس #{index + 1}
                  </span>
                  {l.isLocked ? (
                    <Lock size={14} color="#E11D48" />
                  ) : l.userExamPassed ? (
                    <CheckCircle2 size={14} color="#10B981" />
                  ) : (
                    <Unlock size={14} color="var(--primary-light)" />
                  )}
                </div>

                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-bright)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {l.title}
                </div>

                {l.isLocked && (
                  <span style={{ fontSize: '0.7rem', color: '#E11D48', display: 'block', marginTop: '0.25rem' }}>
                    Complete previous lesson exam to unlock.
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── GATING WARNING BANNER IF LOCKED ───────────────── */}
      {lesson.isLocked ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', border: '1px solid rgba(225,29,72,0.3)' }}>
          <Lock size={56} color="#E11D48" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-bright)' }}>
            هذا الدرس مغلق حالياً (Locked Lesson)
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0.5rem auto 1.5rem', lineHeight: 1.6 }}>
            "Complete the previous lesson exam to unlock."
            <br />
            تجاوز امتحان {lesson.prerequisiteExamTitle || 'الدرس السابق'} بنسبة 60% على الأقل لفتح هذا الدرس تلقائياً.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (lesson.prerequisiteLessonId) setSelectedLessonId(lesson.prerequisiteLessonId);
            }}
          >
            الانتقال للامتحان المطلوب والفتح
          </button>
        </div>
      ) : (
        /* ── UNIFIED LESSON VERTICAL FLOW ──────────────────── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {/* SECTION 1: LESSON DETAILS */}
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <span className="gradient-badge" style={{ marginBottom: '0.5rem' }}>
                  {lesson.subject} • {lesson.duration}
                </span>
                <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-bright)', margin: '0.25rem 0' }}>
                  {lesson.title}
                </h1>
                <p style={{ color: 'var(--primary-light)', fontWeight: 600, fontSize: '1rem', margin: 0 }}>
                  {lesson.subtitle}
                </p>
              </div>

              {lesson.userExamPassed && (
                <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', padding: '0.5rem 1rem', borderRadius: '9999px', color: '#10B981', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CheckCircle2 size={16} /> مكتمل وتم اجتياز الامتحان بنسبة {lesson.userExamScore}%
                </div>
              )}
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>
              {lesson.description}
            </p>
          </div>

          {/* SECTION 2: VIDEO LESSON (DRM PLAYER) */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PlayCircle size={22} color="var(--primary-light)" /> 1. الفيديو المحمي (Video Lesson - DRM Encryption)
            </h2>

            <div className="drm-player-container">
              <div className="drm-video-wrapper">
                <canvas ref={canvasRef} className="drm-watermark-canvas" />
                <video
                  ref={videoRef}
                  className="drm-video-element"
                  src={lesson.videoUrl}
                  poster="https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80"
                />
                {!isPlaying && (
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(13,31,35,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
                    <button
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.play().catch(() => {});
                          setIsPlaying(true);
                        }
                      }}
                      style={{ width: '75px', height: '75px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 0 25px var(--primary-glow)' }}
                    >
                      <Play size={32} fill="#FFF" style={{ marginLeft: '3px' }} />
                    </button>
                  </div>
                )}
              </div>

              <div className="drm-controls-bar">
                <div className="drm-controls-left">
                  <button
                    className="drm-play-btn"
                    onClick={() => {
                      if (videoRef.current) {
                        if (isPlaying) { videoRef.current.pause(); setIsPlaying(false); }
                        else { videoRef.current.play().catch(() => {}); setIsPlaying(true); }
                      }
                    }}
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
                  </button>
                  <span className="drm-time-display">24:15 / {lesson.duration}</span>
                </div>
                <div className="drm-progress-bar-wrap"><div className="drm-progress-fill"></div></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <ShieldCheck size={16} color="var(--success)" />
                  <span>DRM Watermark Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: PDF NOTES */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={22} color="var(--primary-light)" /> 2. ملزمة وملاحظات المحاضرة (PDF Notes)
            </h2>

            <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                  <FileText size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-bright)', margin: 0 }}>
                    {lesson.pdfTitle}
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    ملخص وقوانين ومسائل امتحانات الأعوام السابقة عالية الجودة
                  </span>
                </div>
              </div>

              <a
                href={lesson.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ padding: '0.7rem 1.5rem' }}
                onClick={() => showToast('جاري فتح وتحميل ملف PDF الخاص بالدرس...')}
              >
                <Download size={18} /> تحميل ونقل PDF
              </a>
            </div>
          </div>

          {/* SECTION 4: HOMEWORK */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ClipboardList size={22} color="var(--primary-light)" /> 3. واجب المحاضرة (Homework)
            </h2>

            <div className="glass-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                    {lesson.homework.title}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0.25rem 0 0' }}>
                    {lesson.homework.description} (تاريخ التسليم: {lesson.homework.dueDate})
                  </p>
                </div>

                {lesson.homework.isSubmitted && (
                  <span style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: 700 }}>
                    تم التسليم بنجاح ({lesson.homework.score}%)
                  </span>
                )}
              </div>

              {lesson.homework.questions && lesson.homework.questions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {lesson.homework.questions.map((q, qIdx) => (
                    <div key={q.id} style={{ background: 'rgba(15,23,42,0.4)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '1.25rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-bright)', marginBottom: '1rem' }}>
                        س{qIdx + 1}: {q.text}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        {q.options.map(opt => {
                          const isSel = hwAnswers[q.id] === opt.key;
                          return (
                            <div
                              key={opt.key}
                              onClick={() => {
                                if (!lesson.homework.isSubmitted) {
                                  setHwAnswers(p => ({ ...p, [q.id]: opt.key }));
                                }
                              }}
                              style={{
                                padding: '0.75rem 1rem',
                                borderRadius: '8px',
                                background: isSel ? 'rgba(8,145,178,0.2)' : 'var(--bg-glass-card)',
                                border: `1px solid ${isSel ? 'var(--primary-light)' : 'var(--border-glass)'}`,
                                cursor: lesson.homework.isSubmitted ? 'default' : 'pointer',
                                fontSize: '0.88rem',
                                color: 'var(--text-bright)',
                              }}
                            >
                              <strong style={{ color: 'var(--primary-light)', marginLeft: '6px' }}>({opt.key})</strong> {opt.label}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {!lesson.homework.isSubmitted && (
                    <button
                      className="btn btn-primary"
                      style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}
                      disabled={homeworkMutation.isPending}
                      onClick={() => homeworkMutation.mutate(hwAnswers)}
                    >
                      تسليم واجب الدرس
                    </button>
                  )}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  لا يوجد أسئلة واجب لهذا الدرس حالياً.
                </p>
              )}
            </div>
          </div>

          {/* SECTION 5: LESSON EXAM (GATING EXAM) */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={22} color="var(--primary-light)" /> 4. امتحان المحاضرة التأهيلي (Lesson Exam)
            </h2>

            <div className="glass-card" style={{ padding: '2rem' }}>
              {!examStarted ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                      {lesson.exam.title}
                    </h3>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      <span>المدة: {lesson.exam.durationMinutes} دقيقة</span>
                      <span>درجة النجاح: {lesson.exam.passingScorePercentage}%</span>
                      <span>عدد الأسئلة: {lesson.exam.questions.length}</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#F59E0B', marginTop: '0.5rem', margin: 0 }}>
                      ⚠️ النجاح بنسبة 60% في هذا الامتحان يفتح لك الدرس التالي مباشرة.
                    </p>
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem' }}
                    onClick={() => {
                      setExamStarted(true);
                      setExamTimer(lesson.exam.durationMinutes * 60);
                      showToast('بدأ امتحان الدرس — بالتوفيق!', 'success');
                    }}
                  >
                    <PlayCircle size={20} /> ابدأ الامتحان الآن
                  </button>
                </div>
              ) : (
                /* Active Exam Mode inside Lesson */
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-light)' }}>
                      ⏱ المتبقي: {Math.floor(examTimer / 60)}:{String(examTimer % 60).padStart(2, '0')}
                    </span>
                    <button
                      className="btn btn-primary"
                      onClick={() => examMutation.mutate(examAnswers)}
                      disabled={examMutation.isPending}
                    >
                      تسليم نتائج الامتحان
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {lesson.exam.questions.map((q, idx) => (
                      <div key={q.id} style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '1.25rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-bright)', marginBottom: '1rem' }}>
                          س{idx + 1}: {q.text}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          {q.options.map(opt => {
                            const isSel = examAnswers[q.id] === opt.key;
                            return (
                              <div
                                key={opt.key}
                                onClick={() => setExamAnswers(p => ({ ...p, [q.id]: opt.key }))}
                                style={{
                                  padding: '0.85rem 1rem',
                                  borderRadius: '8px',
                                  background: isSel ? 'rgba(8,145,178,0.2)' : 'var(--bg-glass-card)',
                                  border: `1px solid ${isSel ? 'var(--primary-light)' : 'var(--border-glass)'}`,
                                  cursor: 'pointer',
                                  fontSize: '0.9rem',
                                  color: 'var(--text-bright)',
                                }}
                              >
                                <strong style={{ color: 'var(--primary-light)', marginLeft: '6px' }}>({opt.key})</strong> {opt.label}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 6: STUDENT FEEDBACK */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Star size={22} color="var(--primary-light)" /> 5. تقييم ورأي الطالب في الدرس (Student Feedback)
            </h2>

            <div className="glass-card" style={{ padding: '2rem' }}>
              {lesson.userFeedback ? (
                <div style={{ background: 'rgba(8,145,178,0.1)', border: '1px solid rgba(8,145,178,0.25)', borderRadius: '12px', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {[1, 2, 3, 4, 5].map(st => (
                      <Star key={st} size={18} fill={st <= lesson.userFeedback!.rating ? '#F59E0B' : 'none'} color="#F59E0B" />
                    ))}
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>تم تقديم التقييم</span>
                  </div>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-bright)', margin: 0 }}>
                    "{lesson.userFeedback.comment}"
                  </p>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); feedbackMutation.mutate({ rating, comment: feedbackComment }); }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>مستوى الشرح والفهم:</span>
                    {[1, 2, 3, 4, 5].map(st => (
                      <Star
                        key={st}
                        size={22}
                        fill={st <= rating ? '#F59E0B' : 'none'}
                        color="#F59E0B"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setRating(st)}
                      />
                    ))}
                  </div>

                  <textarea
                    className="input-field"
                    rows={2}
                    placeholder="شاركنا رأيك في شرح المعلم وجودة المادة..."
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    style={{ width: '100%', marginBottom: '0.85rem', resize: 'vertical' }}
                  />

                  <button className="btn btn-primary" type="submit" disabled={feedbackMutation.isPending || !feedbackComment.trim()}>
                    إرسال التقييم
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* SECTION 7: ASK THE TEACHER */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '1rem' }}>
              6. Ask Your Teacher — استفسارات المعلم
            </h2>
            <AskTeacherSection lessonId={selectedLessonId} lessonTitle={lesson.title} />
          </div>

          {/* SECTION 8: ASK AI */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '1rem' }}>
              7. Ask AI — المساعد الذكي
            </h2>
            <InlineAIAssistant lessonId={selectedLessonId} lessonTitle={lesson.title} />
          </div>
        </div>
      )}
    </div>
  );
};
