import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { examsApi } from '../api/examsApi';
import { ExamRecord } from '../../../types';
import { Award, CheckCircle, XCircle, Clock, Calendar, BarChart2, Eye, X, Sigma, Check, HelpCircle } from 'lucide-react';

export const StandaloneExamsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'passed' | 'failed' | 'completed'>('all');
  const [selectedExamDetail, setSelectedExamDetail] = useState<ExamRecord | null>(null);

  const { data: historyRes, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['examHistory'],
    queryFn: examsApi.getExamHistory,
  });

  const { data: statsRes, isLoading: isStatsLoading } = useQuery({
    queryKey: ['examStats'],
    queryFn: examsApi.getExamStats,
  });

  const history = historyRes?.data || [];
  const stats = statsRes?.data;

  const filteredHistory = history.filter(record => {
    if (activeTab === 'passed') return record.isPassed;
    if (activeTab === 'failed') return !record.isPassed;
    if (activeTab === 'completed') return true;
    return true;
  });

  if (isHistoryLoading || isStatsLoading) {
    return (
      <div className="container fade-in-up" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '3rem', maxWidth: '500px', margin: '0 auto' }}>
          <div className="spinner" style={{ margin: '0 auto 1.5rem', width: '40px', height: '40px', border: '4px solid rgba(8,145,178,0.2)', borderTopColor: 'var(--primary-light)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-bright)' }}>جاري استرجاع سجل وإحصائيات الامتحانات السابقة...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="container fade-in-up" style={{ padding: '2.5rem 1.5rem 5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="gradient-badge">
              <Award size={14} /> Exam Analytics & Archive
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>أرشيف السجل والنتائج</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
            سجل وتاريخ الامتحانات (Exams History & Statistics)
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            تأدية الامتحانات التفاعلية تكون داخل صفحات الدروس المحددة. هذه الصفحة مخصصة لعرض التحليلات والتاريخ والنتائج السابقة.
          </p>
        </div>
      </div>

      {/* ── EXAM STATISTICS SUMMARY ────────────────────────── */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي المحاولات</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-bright)', marginTop: '0.35rem' }}>
              {stats.totalAttempted} اختبارات
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>الناجحة (Passed)</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10B981', marginTop: '0.35rem' }}>
              {stats.passedCount}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>غير المكتملة/الراسبة</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#E11D48', marginTop: '0.35rem' }}>
              {stats.failedCount}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>متوسط الدرجات</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary-light)', marginTop: '0.35rem' }}>
              {stats.averageScore}%
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>نسبة النجاح العامة</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#8B5CF6', marginTop: '0.35rem' }}>
              {stats.overallPassRate}%
            </div>
          </div>
        </div>
      )}

      {/* ── FILTER TABS ───────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          className={`filter-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          سجل الامتحانات الكامل (Previous Exams)
        </button>
        <button
          className={`filter-btn ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          المكتملة (Completed Exams)
        </button>
        <button
          className={`filter-btn ${activeTab === 'passed' ? 'active' : ''}`}
          onClick={() => setActiveTab('passed')}
        >
          الناجحة (Passed Exams)
        </button>
        <button
          className={`filter-btn ${activeTab === 'failed' ? 'active' : ''}`}
          onClick={() => setActiveTab('failed')}
        >
          الراسبة (Failed Exams)
        </button>
      </div>

      {/* ── EXAM CARDS GRID ────────────────────────────────── */}
      {filteredHistory.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Award size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-bright)' }}>لا توجد سجلات امتحانات في هذا التصنيف</h3>
          <p style={{ color: 'var(--text-muted)' }}>قم بتأدية الامتحانات المتاحة داخل المحاضرات والدروس أولاً.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredHistory.map(record => (
            <div
              key={record.id}
              className="glass-card"
              style={{
                padding: '1.5rem',
                borderLeft: `5px solid ${record.isPassed ? '#10B981' : '#E11D48'}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={13} /> {record.date}
                  </span>

                  <span
                    style={{
                      padding: '0.2rem 0.65rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: record.isPassed ? 'rgba(16,185,129,0.15)' : 'rgba(225,29,72,0.15)',
                      color: record.isPassed ? '#10B981' : '#E11D48',
                      border: `1px solid ${record.isPassed ? 'rgba(16,185,129,0.3)' : 'rgba(225,29,72,0.3)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    {record.isPassed ? <CheckCircle size={13} /> : <XCircle size={13} />}
                    {record.isPassed ? 'Pass (ناجح)' : 'Fail (راسب)'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                  {record.lessonTitle}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', background: 'rgba(15,23,42,0.4)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.25rem', textAlign: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>النتيجة</span>
                    <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-bright)' }}>{record.score} / {record.totalQuestions}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>النسبة</span>
                    <strong style={{ display: 'block', fontSize: '0.95rem', color: record.isPassed ? '#10B981' : '#E11D48' }}>{record.percentage}%</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>الزمن</span>
                    <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-bright)' }}>{record.durationSpent}</strong>
                  </div>
                </div>
              </div>

              <button
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.55rem' }}
                onClick={() => setSelectedExamDetail(record)}
              >
                <Eye size={16} /> View Details (عرض التفاصيل والإجابات)
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── EXAM DETAILS MODAL ────────────────────────────── */}
      {selectedExamDetail && (
        <div className="modal-overlay active" onClick={() => setSelectedExamDetail(null)}>
          <div className="modal-container active" style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--primary-light)', fontWeight: 700 }}>
                  تفاصيل نتيجة الاختبار
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-bright)', margin: '0.2rem 0 0' }}>
                  {selectedExamDetail.lessonTitle}
                </h3>
              </div>
              <button className="icon-btn" onClick={() => setSelectedExamDetail(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(8,145,178,0.1)', padding: '0.85rem 1.25rem', borderRadius: '10px' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>النسبة المئوية:</span>
                <strong style={{ display: 'block', fontSize: '1.2rem', color: selectedExamDetail.isPassed ? '#10B981' : '#E11D48' }}>{selectedExamDetail.percentage}%</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>التاريخ:</span>
                <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-bright)' }}>{selectedExamDetail.date}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>الحالة:</span>
                <strong style={{ display: 'block', fontSize: '0.9rem', color: selectedExamDetail.isPassed ? '#10B981' : '#E11D48' }}>{selectedExamDetail.isPassed ? 'ناجح ✅' : 'راسب ❌'}</strong>
              </div>
            </div>

            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.85rem' }}>
              تحليل إجابات الأسئلة التفصيلي:
            </h4>

            {selectedExamDetail.details && selectedExamDetail.details.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {selectedExamDetail.details.map((dt, idx) => (
                  <div key={idx} style={{ background: 'rgba(15,23,42,0.5)', border: `1px solid ${dt.isCorrect ? 'rgba(16,185,129,0.3)' : 'rgba(225,29,72,0.3)'}`, borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-bright)', marginBottom: '0.5rem' }}>
                      س{dt.questionId}: {dt.questionText}
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                      <span style={{ color: dt.isCorrect ? '#10B981' : '#E11D48' }}>
                        إجابتك: ({dt.studentAnswer || 'لم يتم الإجابة'}) {dt.isCorrect ? '✅ صحيح' : '❌ خطأ'}
                      </span>
                      <span style={{ color: '#10B981' }}>
                        الإجابة الصحيحة: ({dt.correctAnswer})
                      </span>
                    </div>
                    {dt.explanation && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                        💡 الشرح: {dt.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                تم تسليم الاختبار بنجاح في السجل التراكمي.
              </p>
            )}

            <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
              <button className="btn btn-primary" onClick={() => setSelectedExamDetail(null)}>
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
