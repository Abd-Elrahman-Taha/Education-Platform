import React, { useState, useEffect, useCallback } from 'react';
import {
  Trophy, Award, Crown, Medal, Star, TrendingUp, Users,
  GraduationCap, RefreshCw, ChevronLeft, ChevronRight,
  Sparkles, AlertCircle, Shield, Target
} from 'lucide-react';
import { leaderboardApi } from '../../api/leaderboard.api';
import {
  LeaderboardEntry,
} from '../../types/api.types';
import { EDUCATION_STAGES, getStageLabel, getGradeLabel } from '../../constants/education';
import { useAuth } from '../../context/AuthContext';
import { AppView } from '../../types';

interface LeaderboardViewProps {
  onNavigateView?: (view: AppView) => void;
  onOpenAuthModal?: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  onNavigateView,
}) => {
  const { currentUser } = useAuth();

  // Selected stage and grade
  const [selectedStage, setSelectedStage] = useState<string>('Secondary');
  const [selectedGrade, setSelectedGrade] = useState<string>('1');

  // Leaderboard data state
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Available grades for the currently selected stage
  const currentStageDef = EDUCATION_STAGES.find((s) => s.key === selectedStage) || EDUCATION_STAGES[1]; // fallback to Secondary

  // Fetch global leaderboard entries
  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await leaderboardApi.getLeaderboard({
        educationStage: selectedStage,
        grade: selectedGrade,
        page: currentPage,
        limit: 20,
      });

      let list: LeaderboardEntry[] = [];
      const raw = res?.data;
      if (Array.isArray(raw)) {
        list = raw;
      } else if (raw && typeof raw === 'object') {
        if (Array.isArray((raw as any).leaderboard)) {
          list = (raw as any).leaderboard;
        } else if (Array.isArray((raw as any).entries)) {
          list = (raw as any).entries;
        } else if (Array.isArray((raw as any).data)) {
          list = (raw as any).data;
        }
      } else if (Array.isArray((res as any)?.leaderboard)) {
        list = (res as any).leaderboard;
      }

      setEntries(list);
      setTotalResults(res?.results ?? list.length);
      if (res?.pagination?.totalPages) {
        setTotalPages(res.pagination.totalPages);
      } else {
        setTotalPages(Math.max(1, Math.ceil((res?.results ?? list.length) / 20)));
      }
    } catch (err: any) {
      console.error('Failed to load leaderboard:', err);
      setErrorMsg('تعذر تحميل بيانات لوحة الشرف حالياً. يرجى المحاولة مرة أخرى.');
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStage, selectedGrade, currentPage]);

  // Reload leaderboard whenever stage, grade, or page change
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // When changing stage, reset grade to the first grade of that stage & reset page
  const handleStageChange = (stageKey: string) => {
    setSelectedStage(stageKey);
    const def = EDUCATION_STAGES.find((s) => s.key === stageKey);
    if (def && def.grades.length > 0) {
      setSelectedGrade(def.grades[0].value);
    } else {
      setSelectedGrade('1');
    }
    setCurrentPage(1);
  };

  const handleGradeChange = (gradeVal: string) => {
    setSelectedGrade(gradeVal);
    setCurrentPage(1);
  };

  const safeEntries = Array.isArray(entries) ? entries : [];

  // Top 3 Podium items (if available)
  const top1 = safeEntries.find((e) => e.rank === 1) || safeEntries[0];
  const top2 = safeEntries.find((e) => e.rank === 2) || safeEntries[1];
  const top3 = safeEntries.find((e) => e.rank === 3) || safeEntries[2];

  return (
    <div className="container" style={{ padding: '2.5rem 1rem 5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* ── HERO BANNER (Admin Dedicated) ────────────────────────── */}
      <div
        className="glass-card"
        style={{
          padding: '2.5rem 2rem',
          borderRadius: '20px',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(16, 185, 129, 0.08) 50%, rgba(99, 102, 241, 0.08) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
        }}
      >
        <div style={{ position: 'absolute', top: '-25px', left: '-25px', opacity: 0.07, pointerEvents: 'none' }}>
          <Trophy size={260} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.9rem', borderRadius: '9999px', background: 'rgba(245, 158, 11, 0.18)', border: '1px solid rgba(245, 158, 11, 0.35)', color: '#F59E0B', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.85rem' }}>
              <Shield size={15} />
              <span>لوحة الإدارة والمدير العام • لوحة الشرف والتفوق الأكاديمي</span>
            </div>
            <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 900, color: 'var(--text-bright)', margin: 0, lineHeight: 1.2 }}>
              لوحة شرف وتصنيف أوائل الطلاب 🏆
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '680px', marginTop: '0.75rem', lineHeight: 1.6 }}>
              لوحة رقابية خاصة بالإدارة لمتابعة أداء الطلاب الأكثر تفوقاً وتحصيلاً للدرجات في الامتحانات، ورصد ترتيب المتصدرين حسب كل مرحلة وصف دراسي.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchLeaderboard}
            disabled={isLoading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', fontSize: '0.9rem' }}
          >
            <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
            تحديث الترتيب
          </button>
        </div>
      </div>

      {/* ── ADMIN STATS OVERVIEW CARDS ──────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <div className="glass-card" style={{ padding: '1.25rem 1.5rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} />
            </div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>إجمالي الطلاب المسجلين بالترتيب</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-bright)' }}>
            {totalResults} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>طالب</span>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem 1.5rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Crown size={16} />
            </div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>أعلى مجموع نقاط بالدفعة</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#F59E0B' }}>
            {top1 ? `${top1.totalScore} نقطة` : '—'}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem 1.5rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target size={16} />
            </div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>المتصدر الحالي</span>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-bright)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {top1?.student?.FullName || 'لا يوجد حتى الآن'}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem 1.5rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)', color: '#A78BFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={16} />
            </div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>المرحلة والصف</span>
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-bright)' }}>
            {getGradeLabel(selectedStage, selectedGrade)}
          </div>
        </div>
      </div>

      {/* ── STAGE & GRADE FILTER CONTROLS ───────────────────────── */}
      <div style={{ marginBottom: '2rem' }}>
        {/* Stage Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.6rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          {EDUCATION_STAGES.map((stage) => {
            const isSelected = selectedStage === stage.key;
            return (
              <button
                key={stage.key}
                type="button"
                onClick={() => handleStageChange(stage.key)}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  border: isSelected ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.08)',
                  background: isSelected ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.15))' : 'rgba(255,255,255,0.03)',
                  color: isSelected ? '#10B981' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                }}
              >
                <GraduationCap size={16} />
                {stage.label.split('(')[0].trim()}
              </button>
            );
          })}
        </div>

        {/* Grade Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>الصف الدراسي:</span>
          {currentStageDef.grades.map((grade) => {
            const isSelected = selectedGrade === grade.value;
            return (
              <button
                key={grade.value}
                type="button"
                onClick={() => handleGradeChange(grade.value)}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: '9999px',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  border: isSelected ? '1px solid #F59E0B' : '1px solid rgba(255,255,255,0.06)',
                  background: isSelected ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.02)',
                  color: isSelected ? '#F59E0B' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {grade.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── ERROR ALERT ────────────────────────────────────────── */}
      {errorMsg && (
        <div
          style={{
            padding: '1rem 1.25rem',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '2rem',
          }}
        >
          <AlertCircle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── LOADING SKELETON ───────────────────────────────────── */}
      {isLoading ? (
        <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={36} className="spin" style={{ margin: '0 auto 1.25rem', display: 'block', color: '#10B981' }} />
          <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-bright)' }}>جاري تحميل لوحة الشرف...</p>
          <p style={{ fontSize: '0.85rem', margin: 0 }}>نحسب الدرجات ونرتب الأوائل لدفعة {getGradeLabel(selectedStage, selectedGrade)}</p>
        </div>
      ) : safeEntries.length === 0 ? (
        /* ── EMPTY STATE ─────────────────────────────────────── */
        <div
          className="glass-card"
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            borderRadius: '20px',
            border: '1px dashed rgba(255,255,255,0.1)',
          }}
        >
          <Trophy size={56} style={{ margin: '0 auto 1.25rem', display: 'block', color: 'var(--text-muted)', opacity: 0.3 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.5rem' }}>
            لا توجد نتائج مسجلة لهذه الدفعة حتى الآن
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '450px', margin: '0 auto 1.5rem' }}>
            لم يقم طلاب هذه المرحلة ({getGradeLabel(selectedStage, selectedGrade)}) بإنهاء أي امتحانات مسجلة حتى الآن.
          </p>
        </div>
      ) : (
        <>
          {/* ── TOP 3 PODIUM SECTION (When page 1) ───────────────── */}
          {currentPage === 1 && safeEntries.length >= 1 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem',
                marginBottom: '3rem',
                alignItems: 'end',
              }}
            >
              {/* #2 Silver (2nd place) */}
              {top2 && (
                <div
                  className="glass-card"
                  style={{
                    padding: '1.75rem 1.25rem',
                    textAlign: 'center',
                    borderRadius: '16px',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    background: 'linear-gradient(180deg, rgba(148, 163, 184, 0.12) 0%, rgba(148, 163, 184, 0.02) 100%)',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #CBD5E1, #94A3B8)',
                      color: '#0F172A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '1.1rem',
                      margin: '0 auto 0.75rem',
                      boxShadow: '0 4px 12px rgba(148, 163, 184, 0.3)',
                    }}
                  >
                    2
                  </div>
                  <Medal size={28} color="#94A3B8" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                  <h4 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-bright)' }}>
                    {top2.student?.FullName || 'طالب متفوق'}
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>المركز الثاني</span>
                  <div style={{ marginTop: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.85rem', borderRadius: '9999px', background: 'rgba(148, 163, 184, 0.15)', color: '#CBD5E1', fontWeight: 800, fontSize: '0.95rem' }}>
                    <Star size={15} />
                    {top2.totalScore} نقطة
                  </div>
                </div>
              )}

              {/* #1 Gold (1st place) - Center & Elevated */}
              {top1 && (
                <div
                  className="glass-card"
                  style={{
                    padding: '2.25rem 1.5rem',
                    textAlign: 'center',
                    borderRadius: '20px',
                    border: '2px solid rgba(245, 158, 11, 0.5)',
                    background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.22) 0%, rgba(245, 158, 11, 0.04) 100%)',
                    position: 'relative',
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 30px rgba(245, 158, 11, 0.15)',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '-16px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                      color: '#000',
                      padding: '0.25rem 0.85rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      boxShadow: '0 4px 10px rgba(245, 158, 11, 0.4)',
                    }}
                  >
                    <Crown size={14} /> بطل الدفعة
                  </div>

                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
                      color: '#78350F',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '1.4rem',
                      margin: '0.5rem auto 0.75rem',
                      boxShadow: '0 6px 18px rgba(245, 158, 11, 0.4)',
                    }}
                  >
                    1
                  </div>
                  <Trophy size={34} color="#F59E0B" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                  <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-bright)' }}>
                    {top1.student?.FullName || 'طالب متميز'}
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: '#F59E0B', fontWeight: 700 }}>المركز الأول (المتصدر)</span>
                  <div style={{ marginTop: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 1.1rem', borderRadius: '9999px', background: 'rgba(245, 158, 11, 0.25)', color: '#FBBF24', fontWeight: 900, fontSize: '1.1rem' }}>
                    <Star size={17} />
                    {top1.totalScore} نقطة
                  </div>
                </div>
              )}

              {/* #3 Bronze (3rd place) */}
              {top3 && (
                <div
                  className="glass-card"
                  style={{
                    padding: '1.75rem 1.25rem',
                    textAlign: 'center',
                    borderRadius: '16px',
                    border: '1px solid rgba(217, 119, 6, 0.3)',
                    background: 'linear-gradient(180deg, rgba(217, 119, 6, 0.12) 0%, rgba(217, 119, 6, 0.02) 100%)',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #F97316, #C2410C)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '1.1rem',
                      margin: '0 auto 0.75rem',
                      boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                    }}
                  >
                    3
                  </div>
                  <Medal size={28} color="#F97316" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                  <h4 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-bright)' }}>
                    {top3.student?.FullName || 'طالب متفوق'}
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>المركز الثالث</span>
                  <div style={{ marginTop: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.85rem', borderRadius: '9999px', background: 'rgba(217, 119, 6, 0.15)', color: '#FB923C', fontWeight: 800, fontSize: '0.95rem' }}>
                    <Star size={15} />
                    {top3.totalScore} نقطة
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── FULL LEADERBOARD TABLE ───────────────────────────── */}
          <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} color="#10B981" />
                الترتيب العام للدفعة ({totalResults} طالب)
              </h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {getStageLabel(selectedStage)} - {getGradeLabel(selectedStage, selectedGrade)}
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <th style={{ padding: '0.75rem 1rem', width: '80px', textAlign: 'center' }}>الترتيب</th>
                    <th style={{ padding: '0.75rem 1rem' }}>اسم الطالب</th>
                    <th style={{ padding: '0.75rem 1rem' }}>الصف الدراسي</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>مجموع النقاط</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>تاريخ التسجيل</th>
                  </tr>
                </thead>
                <tbody>
                  {safeEntries.map((entry) => {
                    const isTop1 = entry.rank === 1;
                    const isTop2 = entry.rank === 2;
                    const isTop3 = entry.rank === 3;

                    return (
                      <tr
                        key={entry.student?._id || `${entry.rank}-${entry.totalScore}`}
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          background: isTop1 ? 'rgba(245, 158, 11, 0.04)' : undefined,
                          transition: 'background 0.15s ease',
                        }}
                      >
                        {/* Rank */}
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                          {isTop1 ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: '#F59E0B', color: '#000', fontWeight: 900, fontSize: '0.8rem' }}>
                              1
                            </span>
                          ) : isTop2 ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: '#94A3B8', color: '#000', fontWeight: 900, fontSize: '0.8rem' }}>
                              2
                            </span>
                          ) : isTop3 ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: '#F97316', color: '#fff', fontWeight: 900, fontSize: '0.8rem' }}>
                              3
                            </span>
                          ) : (
                            <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              #{entry.rank}
                            </span>
                          )}
                        </td>

                        {/* Student Name */}
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                background: isTop1 ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'rgba(255,255,255,0.08)',
                                color: isTop1 ? '#000' : 'var(--text-bright)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                              }}
                            >
                              {(entry.student?.FullName || 'ط')[0]}
                            </div>
                            <div style={{ fontWeight: 700, color: 'var(--text-bright)' }}>
                              {entry.student?.FullName || 'طالب'}
                            </div>
                          </div>
                        </td>

                        {/* Grade */}
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {getGradeLabel(selectedStage, selectedGrade)}
                          </span>
                        </td>

                        {/* Total Score */}
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, color: '#F59E0B', fontSize: '0.92rem' }}>
                            <Star size={14} />
                            {entry.totalScore}
                          </span>
                        </td>

                        {/* Achieved Date */}
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                          {entry.achievedAt ? new Date(entry.achievedAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}
                >
                  <ChevronRight size={14} /> الصفحة السابقة
                </button>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  صفحة {currentPage} من {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}
                >
                  الصفحة التالية <ChevronLeft size={14} />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
