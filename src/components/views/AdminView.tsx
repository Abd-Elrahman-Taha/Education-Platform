import React, { useState } from 'react';
import {
  Sliders, Search, Users, TrendingUp, DollarSign, Activity,
  Edit2, Trash2, Ban, Shield, ShieldOff, CheckCircle2, XCircle,
  ArrowUp, ArrowDown, UserCheck, Plus, UserPlus, BookOpen, Award,
  Eye, EyeOff, Check, X, Filter, Sparkles, GraduationCap, ChevronRight,
  Layers, Lock, Unlock, Settings, BarChart2, Star, Clock, Calendar,
  FileText, CheckSquare, RefreshCw
} from 'lucide-react';
import {
  AcademicYear, ACADEMIC_YEAR_LABELS, StudentProfile, Lesson, User,
  TeacherPermission, PERMISSION_LABELS, Package
} from '../../types';
import { mockDB } from '../../services/db';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const AdminView: React.FC = () => {
  const { showToast } = useToast();
  const { currentUser } = useAuth();

  // Selected academic year for scoping EVERYTHING in the dashboard
  const [selectedYear, setSelectedYear] = useState<AcademicYear>('third_secondary');

  // Main active tab
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'lessons' | 'exams' | 'teachers'>('overview');

  // Local state initialized from db
  const [students, setStudents] = useState<StudentProfile[]>(() => mockDB.getStudents());
  const [lessons, setLessons] = useState<Lesson[]>(() => mockDB.getLessons(undefined, true));
  const [teachers, setTeachers] = useState<User[]>(() => mockDB.getTeachers());
  const [packages, setPackages] = useState<Package[]>(() => mockDB.getPackages());

  // Search and filters for student list
  const [searchStudent, setSearchStudent] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [studentAccessFilter, setStudentAccessFilter] = useState<'all' | 'with_access' | 'no_access'>('all');

  // Modals state
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<StudentProfile | null>(null);
  const [isRegisterStudentOpen, setIsRegisterStudentOpen] = useState(false);
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
  const [isTeacherPermissionsModalOpen, setIsTeacherPermissionsModalOpen] = useState<User | null>(null);

  // New student form state
  const [newStudentForm, setNewStudentForm] = useState({
    name: '',
    phone: '',
    parentPhone: '',
    nationalId: '',
    code: '',
    email: '',
    packageId: 'pkg-3',
  });

  // New lesson form state
  const [newLessonForm, setNewLessonForm] = useState({
    title: '',
    subtitle: '',
    subject: 'التفاضل والتكامل',
    description: '',
    duration: '1:30:00',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    pdfTitle: 'ملزمة المحاضرة الجديدة.pdf',
    pdfUrl: 'https://www.w3.org/W3C/DesignIssues/Overview.html',
    isPublished: true,
  });

  // ── SCOPED DATA BY ACADEMIC YEAR ──────────────────────────────
  const scopedStudents = students.filter(s => s.academicYear === selectedYear);
  const scopedLessons = lessons.filter(l => l.academicYear === selectedYear);
  const scopedPackages = packages.filter(p => p.academicYear === selectedYear);
  const topStudents = [...scopedStudents]
    .filter(s => s.status === 'active')
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 5);

  // Filtered students in Student tab
  const filteredStudents = scopedStudents.filter(s => {
    const q = searchStudent.toLowerCase();
    const matchQ = !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.phone.includes(q);
    const matchStatus = studentStatusFilter === 'all' || s.status === studentStatusFilter;
    const matchAccess = studentAccessFilter === 'all' || (studentAccessFilter === 'with_access' ? s.hasAccess : !s.hasAccess);
    return matchQ && matchStatus && matchAccess;
  });

  // Overview stats calculation
  const totalStudents = scopedStudents.length;
  const activeStudents = scopedStudents.filter(s => s.status === 'active').length;
  const studentsWithAccess = scopedStudents.filter(s => s.hasAccess).length;
  const studentsWithoutAccess = totalStudents - studentsWithAccess;
  const totalLessonsCount = scopedLessons.length;
  const publishedLessonsCount = scopedLessons.filter(l => l.isPublished).length;
  const avgScore = Math.round(scopedStudents.reduce((acc, s) => acc + s.averageScore, 0) / (totalStudents || 1)) || 0;

  // ── ACTIONS ──────────────────────────────────────────────────

  const handleToggleLessonPublish = (lessonId: string) => {
    const updated = mockDB.toggleLessonPublish(lessonId);
    setLessons(prev => prev.map(l => (l.id === lessonId ? updated : l)));
    showToast(updated.isPublished ? `تم نشر "${updated.title}" للطلاب` : `تم إخفاء "${updated.title}" من قائمة الطلاب`, 'info');
  };

  const handleDeleteLesson = (lessonId: string) => {
    mockDB.deleteLesson(lessonId);
    setLessons(prev => prev.filter(l => l.id !== lessonId));
    showToast('تم حذف المحاضرة بنجاح', 'danger');
  };

  const handleToggleStudentStatus = (studentId: string) => {
    const s = students.find(x => x.id === studentId);
    if (!s) return;
    const newStatus = s.status === 'active' ? 'blocked' : 'active';
    const updated = mockDB.updateStudent(studentId, { status: newStatus });
    setStudents(prev => prev.map(x => (x.id === studentId ? updated : x)));
    if (selectedStudentForModal && selectedStudentForModal.id === studentId) {
      setSelectedStudentForModal(updated);
    }
    showToast(newStatus === 'blocked' ? `تم حظر حساب ${s.name}` : `تم تفعيل حساب ${s.name}`, newStatus === 'blocked' ? 'warning' : 'success');
  };

  const handleAssignLessonToStudent = (studentId: string, lessonId: string, isAssigned: boolean) => {
    const updated = mockDB.assignLessonToStudent(studentId, lessonId, isAssigned);
    setStudents(prev => prev.map(s => (s.id === studentId ? updated : s)));
    if (selectedStudentForModal && selectedStudentForModal.id === studentId) {
      setSelectedStudentForModal(updated);
    }
    showToast(isAssigned ? 'تم منح الطالب صلاحية الوصول للمحاضرة' : 'تم سحب صلاحية المحاضرة من الطالب', 'info');
  };

  const handleAssignPackageToStudent = (studentId: string, packageId: string) => {
    const updated = mockDB.assignPackageToStudent(studentId, packageId);
    setStudents(prev => prev.map(s => (s.id === studentId ? updated : s)));
    if (selectedStudentForModal && selectedStudentForModal.id === studentId) {
      setSelectedStudentForModal(updated);
    }
    showToast(`تم تعيين الباقة (${updated.packageName}) للطالب بنجاح`, 'success');
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentForm.name || !newStudentForm.phone) return;

    const code = newStudentForm.code || `CODE-${Math.floor(10000 + Math.random() * 90000)}`;
    const nationalId = newStudentForm.nationalId || `3050${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const selPkg = packages.find(p => p.id === newStudentForm.packageId);

    const created = mockDB.addStudent({
      name: newStudentForm.name,
      code,
      nationalId,
      email: newStudentForm.email || `student_${Date.now()}@edulearn.com`,
      phone: newStudentForm.phone,
      parentPhone: newStudentForm.parentPhone || newStudentForm.phone,
      academicYear: selectedYear,
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
      packageId: selPkg?.id,
      packageName: selPkg?.name || 'بدون اشتراك',
      hasAccess: !!selPkg,
      assignedLessonIds: selPkg?.includedLessonIds || [],
      averageScore: 90,
      attendanceRate: 100,
    });

    setStudents(prev => [created, ...prev]);
    setIsRegisterStudentOpen(false);
    setNewStudentForm({ name: '', phone: '', parentPhone: '', nationalId: '', code: '', email: '', packageId: 'pkg-3' });
    showToast(`تم تسجيل الطالب (${created.name}) بالكود: ${created.code}`, 'success');
  };

  const handleCreateLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonForm.title) return;

    const created = mockDB.addLesson({
      title: newLessonForm.title,
      subtitle: newLessonForm.subtitle || 'شرح وتطبيقات عملية',
      subject: newLessonForm.subject,
      description: newLessonForm.description || 'شرح شامل للمحاضرة مع حل المسائل.',
      duration: newLessonForm.duration,
      order: scopedLessons.length + 1,
      academicYear: selectedYear,
      isPublished: newLessonForm.isPublished,
      isLocked: false,
      videoUrl: newLessonForm.videoUrl,
      pdfUrl: newLessonForm.pdfUrl,
      pdfTitle: newLessonForm.pdfTitle,
      homework: {
        id: `hw-${Date.now()}`,
        title: `واجب ${newLessonForm.title}`,
        description: 'حل التدريبات المرفقة.',
        dueDate: '2026-08-30',
        isSubmitted: false,
        questions: [],
      },
      exam: {
        id: `exam-${Date.now()}`,
        title: `اختبار ${newLessonForm.title}`,
        durationMinutes: 20,
        passingScorePercentage: 60,
        isPublished: newLessonForm.isPublished,
        questions: [],
      },
    });

    setLessons(prev => [...prev, created]);
    setIsAddLessonOpen(false);
    setNewLessonForm({ title: '', subtitle: '', subject: 'التفاضل والتكامل', description: '', duration: '1:30:00', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', pdfTitle: 'ملزمة المحاضرة الجديدة.pdf', pdfUrl: 'https://www.w3.org/W3C/DesignIssues/Overview.html', isPublished: true });
    showToast(`تمت إضافة المحاضرة "${created.title}" بنجاح`, 'success');
  };

  const handleToggleTeacherPermission = (teacherId: string, perm: TeacherPermission) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return;
    const currentPerms = teacher.permissions || [];
    const nextPerms = currentPerms.includes(perm)
      ? currentPerms.filter(p => p !== perm)
      : [...currentPerms, perm];

    const updated = mockDB.updateTeacherPermissions(teacherId, nextPerms);
    setTeachers(prev => prev.map(t => (t.id === teacherId ? updated : t)));
    setIsTeacherPermissionsModalOpen(updated);
    showToast('تم تحديث صلاحيات المعلم بنجاح', 'success');
  };

  return (
    <div className="container fade-in-up" style={{ padding: '2.5rem 1.5rem 6rem' }}>
      {/* ── HEADER CARD WITH POLISHED YEAR SWITCHER & TAB BAR ── */}
      <div className="glass-card admin-header-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          {/* Left Title & Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '56px', height: '56px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px var(--primary-glow)',
              flexShrink: 0
            }}>
              <Sliders size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                <span className="gradient-badge">
                  <Sparkles size={13} /> لوحة الإدارة والتحكم الموحدة (Admin & Teacher Hub)
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  المستخدم: {currentUser?.name}
                </span>
              </div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-bright)', margin: 0 }}>
                إدارة الطلاب والمحتوى والصلاحيات
              </h1>
            </div>
          </div>

          {/* Right: Modern Segmented Control for Academic Year */}
          <div className="year-selector-wrap">
            <span className="year-selector-label">
              <GraduationCap size={15} /> السنة الدراسية المستهدفة:
            </span>
            <div className="year-pill-group">
              {(['first_secondary', 'second_secondary', 'third_secondary'] as AcademicYear[]).map(yearKey => {
                const isActive = selectedYear === yearKey;
                return (
                  <button
                    key={yearKey}
                    type="button"
                    className={`year-pill-btn ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedYear(yearKey);
                      showToast(`تم التبديل إلى: ${ACADEMIC_YEAR_LABELS[yearKey]}`, 'info');
                    }}
                  >
                    {isActive && <Check size={13} />}
                    {ACADEMIC_YEAR_LABELS[yearKey]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Navigation Switcher */}
        <div className="admin-tab-bar">
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <BarChart2 size={16} />
            <span>نظرة عامة والإحصائيات</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            <Users size={16} />
            <span>إدارة الطلاب</span>
            <span className="admin-tab-badge">{scopedStudents.length}</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'lessons' ? 'active' : ''}`}
            onClick={() => setActiveTab('lessons')}
          >
            <BookOpen size={16} />
            <span>إدارة الدروس والنشر</span>
            <span className="admin-tab-badge">{scopedLessons.length}</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'exams' ? 'active' : ''}`}
            onClick={() => setActiveTab('exams')}
          >
            <Award size={16} />
            <span>الامتحانات والتقييمات</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'teachers' ? 'active' : ''}`}
            onClick={() => setActiveTab('teachers')}
          >
            <Shield size={16} />
            <span>المعلمون والصلاحيات</span>
            <span className="admin-tab-badge">{teachers.length}</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: OVERVIEW & TOP STUDENTS (Requirements #12 & #13) ── */}
      {activeTab === 'overview' && (
        <div>
          {/* Overview Cards Scoped to Year */}
          <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div className="glass-card admin-stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="admin-stat-icon" style={{ background: 'rgba(8,145,178,0.15)', color: 'var(--primary-light)' }}>
                  <Users size={24} />
                </div>
                <span className="gradient-badge" style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem' }}>
                  {ACADEMIC_YEAR_LABELS[selectedYear]}
                </span>
              </div>
              <div className="admin-stat-value">{totalStudents} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>طلاب</span></div>
              <div className="admin-stat-label">إجمالي الطلاب المسجلين</div>
            </div>

            <div className="glass-card admin-stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="admin-stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                  <CheckCircle2 size={24} />
                </div>
                <span className="admin-stat-delta up">
                  <ArrowUp size={13} /> {Math.round((studentsWithAccess / (totalStudents || 1)) * 100)}%
                </span>
              </div>
              <div className="admin-stat-value" style={{ color: '#10B981' }}>{studentsWithAccess}</div>
              <div className="admin-stat-label">الطلاب المشتركون بالباقات</div>
            </div>

            <div className="glass-card admin-stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="admin-stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                  <Activity size={24} />
                </div>
                <span className="admin-stat-delta down" style={{ color: '#F59E0B' }}>
                  بدون اشتراك
                </span>
              </div>
              <div className="admin-stat-value" style={{ color: '#F59E0B' }}>{studentsWithoutAccess}</div>
              <div className="admin-stat-label">طلاب بحاجة لتفعيل باقة</div>
            </div>

            <div className="glass-card admin-stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="admin-stat-icon" style={{ background: 'rgba(34,211,238,0.15)', color: 'var(--primary-light)' }}>
                  <BookOpen size={24} />
                </div>
                <span className="admin-stat-delta up">
                  {publishedLessonsCount} منشور
                </span>
              </div>
              <div className="admin-stat-value">{publishedLessonsCount} / {totalLessonsCount}</div>
              <div className="admin-stat-label">المحاضرات المتاحة للطلاب</div>
            </div>

            <div className="glass-card admin-stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="admin-stat-icon" style={{ background: 'rgba(139,92,246,0.15)', color: '#8B5CF6' }}>
                  <TrendingUp size={24} />
                </div>
                <span className="admin-stat-delta up" style={{ color: '#8B5CF6' }}>
                  معدل ممتاز
                </span>
              </div>
              <div className="admin-stat-value" style={{ color: '#8B5CF6' }}>{avgScore}%</div>
              <div className="admin-stat-label">متوسط تحصيل الطلاب</div>
            </div>
          </div>

          {/* Top Performing Students Table (Requirement #13) */}
          <div className="glass-card" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award size={22} color="#F59E0B" /> أوائل الطلاب المتفوقين (Top Performing Students)
                </h2>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  ترتيب الطلاب حسب متوسط درجات الاختبارات التراكمية في {ACADEMIC_YEAR_LABELS[selectedYear]}
                </span>
              </div>
              <span className="gradient-badge">
                {topStudents.length} طلاب متصدرين
              </span>
            </div>

            <div className="user-table-wrapper">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>الترتيب</th>
                    <th>اسم الطالب</th>
                    <th>كود الطالب</th>
                    <th>السنة الدراسية</th>
                    <th>المعدل التراكمي</th>
                    <th>نسبة الحضور</th>
                    <th>الباقة المفعلة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {topStudents.map((st, index) => (
                    <tr key={st.id}>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: '30px', height: '30px', borderRadius: '50%',
                          background: index === 0 ? 'linear-gradient(135deg, #F59E0B, #D97706)' : index === 1 ? 'linear-gradient(135deg, #94A3B8, #64748B)' : index === 2 ? 'linear-gradient(135deg, #B45309, #78350F)' : 'rgba(255,255,255,0.08)',
                          color: '#FFF',
                          fontWeight: 900, fontSize: '0.88rem',
                          boxShadow: index === 0 ? '0 2px 10px rgba(245,158,11,0.4)' : 'none'
                        }}>
                          {index + 1}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img src={st.avatar} alt={st.name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-glass)' }} />
                          <strong style={{ fontSize: '0.92rem', color: 'var(--text-bright)' }}>{st.name}</strong>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--primary-light)', fontWeight: 700 }}>{st.code}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{ACADEMIC_YEAR_LABELS[st.academicYear]}</td>
                      <td>
                        <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#10B981' }}>{st.averageScore}%</span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-bright)' }}>{st.attendanceRate}%</td>
                      <td>
                        <span className="gradient-badge" style={{ fontSize: '0.75rem' }}>{st.packageName || 'باقة شاملة'}</span>
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
                          onClick={() => setSelectedStudentForModal(st)}
                        >
                          <Eye size={14} /> عرض الملف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: STUDENT MANAGEMENT (Requirements #14, #15, #16, #17) ── */}
      {activeTab === 'students' && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                إدارة طلاب {ACADEMIC_YEAR_LABELS[selectedYear]} ({filteredStudents.length})
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                البحث، تفعيل الباقات، تعيين المحاضرات، ومتابعة الأداء الأكاديمي
              </p>
            </div>

            <button className="btn btn-primary" onClick={() => setIsRegisterStudentOpen(true)}>
              <UserPlus size={16} /> تسجيل طالب جديد
            </button>
          </div>

          {/* Search & Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-field"
                placeholder="بحث بالاسم، الكود، أو رقم الهاتف..."
                style={{ width: '100%', paddingRight: '40px', fontSize: '0.88rem' }}
                value={searchStudent}
                onChange={e => setSearchStudent(e.target.value)}
              />
            </div>

            <select
              className="input-field"
              style={{ fontSize: '0.85rem', width: 'auto' }}
              value={studentStatusFilter}
              onChange={e => setStudentStatusFilter(e.target.value as any)}
            >
              <option value="all">جميع الحالات</option>
              <option value="active">حساب نشط (Active)</option>
              <option value="blocked">حساب محظور (Blocked)</option>
            </select>

            <select
              className="input-field"
              style={{ fontSize: '0.85rem', width: 'auto' }}
              value={studentAccessFilter}
              onChange={e => setStudentAccessFilter(e.target.value as any)}
            >
              <option value="all">جميع الاشتراكات</option>
              <option value="with_access">مشترك بالباقة</option>
              <option value="no_access">بدون اشتراك</option>
            </select>
          </div>

          {/* Students Table */}
          <div className="user-table-wrapper">
            <table className="user-table">
              <thead>
                <tr>
                  <th>الطالب</th>
                  <th>كود الطالب</th>
                  <th>الرقم القومي</th>
                  <th>الهاتف</th>
                  <th>هاتف ولي الأمر</th>
                  <th>الباقة</th>
                  <th>الحالة</th>
                  <th>المعدل</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <img src={student.avatar} alt={student.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-bright)' }}>{student.name}</strong>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--primary-light)', fontWeight: 700 }}>{student.code}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{student.nationalId}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{student.phone}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{student.parentPhone}</td>
                    <td>
                      <span className={`status-badge ${student.hasAccess ? 'status-badge--active' : 'status-badge--blocked'}`}>
                        {student.packageName || 'بدون باقة'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-badge--${student.status}`}>
                        {student.status === 'active' ? 'نشط' : 'محظور'}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#10B981', fontSize: '0.95rem' }}>{student.averageScore}%</strong>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          className="action-btn"
                          title="عرض الملف وتعيين الدروس والباقات"
                          style={{ background: 'rgba(8,145,178,0.15)', color: 'var(--primary-light)' }}
                          onClick={() => setSelectedStudentForModal(student)}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className={`action-btn ${student.status === 'active' ? 'btn-warning' : 'btn-secondary'}`}
                          title={student.status === 'active' ? 'حظر الطالب' : 'تفعيل الحساب'}
                          onClick={() => handleToggleStudentStatus(student.id)}
                        >
                          <Ban size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: LESSONS MANAGEMENT (Requirement #18) ───── */}
      {activeTab === 'lessons' && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                إدارة دروس ومحاضرات {ACADEMIC_YEAR_LABELS[selectedYear]} ({scopedLessons.length})
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                التحكم في نشر الدروس (Published / Hidden)، رفع ملفات PDF والمذكرات، وإدارة الامتحانات
              </p>
            </div>

            <button className="btn btn-primary" onClick={() => setIsAddLessonOpen(true)}>
              <Plus size={16} /> رفع وإضافة محاضرة جديدة
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {scopedLessons.map((les, index) => (
              <div
                key={les.id}
                className="glass-card"
                style={{
                  padding: '1.5rem 1.75rem',
                  borderLeft: `5px solid ${les.isPublished ? 'var(--primary-light)' : '#F59E0B'}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-light)' }}>
                      محاضرة #{index + 1}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      • {les.duration}
                    </span>
                    <span
                      style={{
                        padding: '0.2rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: les.isPublished ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                        color: les.isPublished ? '#10B981' : '#F59E0B',
                        border: `1px solid ${les.isPublished ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                      }}
                    >
                      {les.isPublished ? 'منشور للطلاب (Published)' : 'مخفي / مسودة (Hidden)'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                    {les.title}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0.25rem 0 0' }}>
                    {les.subtitle}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    className={`btn ${les.isPublished ? 'btn-secondary' : 'btn-primary'}`}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    onClick={() => handleToggleLessonPublish(les.id)}
                  >
                    {les.isPublished ? <><EyeOff size={15} /> إخفاء الدرس</> : <><Eye size={15} /> نشر الدرس للطلاب</>}
                  </button>
                  <button
                    className="action-btn btn-danger"
                    title="حذف المحاضرة"
                    style={{ padding: '0.5rem' }}
                    onClick={() => handleDeleteLesson(les.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: EXAMS MANAGEMENT ────────────────────────── */}
      {activeTab === 'exams' && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                إدارة امتحانات {ACADEMIC_YEAR_LABELS[selectedYear]}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                امتحانات البابل شيت المرتبطة بنظام فتح الدروس والتقييم الأكاديمي
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => showToast('إضافة اختبار جديد...', 'info')}>
              <Plus size={16} /> إنشاء اختبار جديد
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {scopedLessons.map(l => (
              <div key={l.id} className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                    {l.exam.title}
                  </h3>
                  <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    <span>المدة: {l.exam.durationMinutes} دقيقة</span>
                    <span>درجة النجاح: {l.exam.passingScorePercentage}%</span>
                    <span>الدرس التابع: {l.title}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }} onClick={() => showToast(`تعديل أسئلة ${l.exam.title}`, 'info')}>
                    <Edit2 size={14} /> تعديل الأسئلة
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 5: TEACHERS & PERMISSIONS (Requirements #6 & #7) ── */}
      {activeTab === 'teachers' && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                إدارة المعلمين وتحديد الصلاحيات (Teacher Management & Permissions)
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                يستطيع الأدمن تحديد الصلاحيات الدقيقة لكل معلم في المنظومة التعليمية
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => showToast('إضافة معلم جديد للمنظومة', 'info')}>
              <Plus size={16} /> إضافة معلم جديد
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {teachers.map(teacher => (
              <div key={teacher.id} className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                    <img src={teacher.avatar} alt={teacher.name} style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-light)' }} />
                    <div>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--text-bright)', display: 'block' }}>{teacher.name}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{teacher.email} • {teacher.phone}</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-light)', display: 'block', marginBottom: '0.5rem' }}>
                      الصلاحيات الممنوحة ({teacher.permissions?.length || 0}):
                    </span>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {teacher.permissions?.slice(0, 4).map(p => (
                        <span key={p} style={{ background: 'rgba(8,145,178,0.12)', border: '1px solid rgba(8,145,178,0.25)', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--primary-light)' }}>
                          {PERMISSION_LABELS[p]?.label || p}
                        </span>
                      ))}
                      {(teacher.permissions?.length || 0) > 4 && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          +{(teacher.permissions?.length || 0) - 4} صلاحيات أخرى
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', padding: '0.6rem', fontSize: '0.88rem' }}
                  onClick={() => setIsTeacherPermissionsModalOpen(teacher)}
                >
                  <Settings size={16} /> تعديل وإدارة الصلاحيات
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL: STUDENT DETAILED PROFILE & ASSIGNMENTS (Requirements #15, #16, #17) ── */}
      {selectedStudentForModal && (
        <div className="modal-overlay active" onClick={() => setSelectedStudentForModal(null)}>
          <div className="modal-box" style={{ maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedStudentForModal(null)}><X size={18} /></button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <img src={selectedStudentForModal.avatar} alt={selectedStudentForModal.name} style={{ width: '64px', height: '64px', borderRadius: '50%', border: '3px solid var(--primary-light)', objectFit: 'cover' }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-bright)', margin: 0 }}>
                    {selectedStudentForModal.name}
                  </h2>
                  <span className={`status-badge status-badge--${selectedStudentForModal.status}`}>
                    {selectedStudentForModal.status === 'active' ? 'نشط' : 'محظور'}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  كود: #{selectedStudentForModal.code} • الرقم القومي: {selectedStudentForModal.nationalId} • {ACADEMIC_YEAR_LABELS[selectedStudentForModal.academicYear]}
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>المعدل التراكمي</span>
                <strong style={{ display: 'block', fontSize: '1.4rem', color: '#10B981' }}>{selectedStudentForModal.averageScore}%</strong>
              </div>
              <div className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>نسبة الحضور</span>
                <strong style={{ display: 'block', fontSize: '1.4rem', color: 'var(--primary-light)' }}>{selectedStudentForModal.attendanceRate}%</strong>
              </div>
              <div className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>المحاضرات المتاحة</span>
                <strong style={{ display: 'block', fontSize: '1.4rem', color: 'var(--text-bright)' }}>{selectedStudentForModal.assignedLessonIds.length}</strong>
              </div>
            </div>

            {/* SECTION: ASSIGN PACKAGES (Requirement #17) */}
            <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Layers size={16} color="var(--primary-light)" /> تعيين الباقة للطالب (Assign Package)
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                اختيار باقة اشتراك يحدث تلقائياً جميع الدروس المتاحة للطالب وفق محتوى الباقة.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {scopedPackages.map(pkg => {
                  const isCur = selectedStudentForModal.packageId === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      onClick={() => handleAssignPackageToStudent(selectedStudentForModal.id, pkg.id)}
                      style={{
                        padding: '0.5rem 0.85rem',
                        borderRadius: '8px',
                        border: isCur ? '2px solid #10B981' : '1px solid var(--border-glass)',
                        background: isCur ? 'rgba(16,185,129,0.15)' : 'var(--bg-glass-card)',
                        color: isCur ? '#10B981' : 'var(--text-muted)',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {pkg.name} ({pkg.price} ج.م) {isCur && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION: ASSIGN SPECIFIC LESSONS (Requirement #16) */}
            <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BookOpen size={16} color="var(--primary-light)" /> تعيين الدروس والمحاضرات الفردية (Assign Lessons)
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                حدد المحاضرات التي يستطيع الطالب فتحها ومشاهدتها:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {scopedLessons.map(les => {
                  const isAssigned = selectedStudentForModal.assignedLessonIds.includes(les.id);
                  return (
                    <div
                      key={les.id}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '0.65rem 0.9rem', borderRadius: '8px',
                        background: isAssigned ? 'rgba(8,145,178,0.12)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isAssigned ? 'rgba(8,145,178,0.3)' : 'var(--border-glass)'}`,
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-bright)' }}>{les.title}</strong>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>{les.duration}</span>
                      </div>

                      <button
                        className={`btn ${isAssigned ? 'btn-secondary' : 'btn-primary'}`}
                        style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
                        onClick={() => handleAssignLessonToStudent(selectedStudentForModal.id, les.id, !isAssigned)}
                      >
                        {isAssigned ? <><Check size={14} color="#10B981" /> متاح للطالب (Assigned)</> : <><Plus size={14} /> تعيين وإتاحة (Not Assigned)</>}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ textAlign: 'left' }}>
              <button className="btn btn-primary" onClick={() => setSelectedStudentForModal(null)}>
                حفظ وإغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: TEACHER PERMISSIONS (Requirement #7) ──────── */}
      {isTeacherPermissionsModalOpen && (
        <div className="modal-overlay active" onClick={() => setIsTeacherPermissionsModalOpen(null)}>
          <div className="modal-box" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsTeacherPermissionsModalOpen(null)}><X size={18} /></button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <img src={isTeacherPermissionsModalOpen.avatar} alt={isTeacherPermissionsModalOpen.name} style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                  صلاحيات المعلم: {isTeacherPermissionsModalOpen.name}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>تحديد مهام وصلاحيات الوصول في لوحة التحكم</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '380px', overflowY: 'auto', paddingRight: '0.35rem', marginBottom: '1.5rem' }}>
              {(Object.keys(PERMISSION_LABELS) as TeacherPermission[]).map(perm => {
                const info = PERMISSION_LABELS[perm];
                const isEnabled = isTeacherPermissionsModalOpen.permissions?.includes(perm);
                return (
                  <div
                    key={perm}
                    onClick={() => handleToggleTeacherPermission(isTeacherPermissionsModalOpen.id, perm)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.75rem 1rem', borderRadius: '8px',
                      background: isEnabled ? 'rgba(8,145,178,0.12)' : 'var(--bg-glass-card)',
                      border: `1px solid ${isEnabled ? 'var(--primary-light)' : 'var(--border-glass)'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--text-bright)', display: 'block' }}>{info.label}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{info.desc}</span>
                    </div>

                    <div style={{
                      width: '24px', height: '24px', borderRadius: '6px',
                      background: isEnabled ? 'var(--primary-light)' : 'rgba(255,255,255,0.08)',
                      color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {isEnabled && <Check size={16} />}
                    </div>
                  </div>
                );
              })}
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setIsTeacherPermissionsModalOpen(null)}>
              حفظ الصلاحيات
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: REGISTER STUDENT ────────────────────────── */}
      {isRegisterStudentOpen && (
        <div className="modal-overlay active" onClick={() => setIsRegisterStudentOpen(false)}>
          <div className="modal-box" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsRegisterStudentOpen(false)}><X size={18} /></button>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '1rem' }}>
              تسجيل طالب جديد في {ACADEMIC_YEAR_LABELS[selectedYear]}
            </h3>

            <form onSubmit={handleCreateStudent} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>اسم الطالب بالكامل</label>
                <input type="text" required placeholder="مثال: يوسف أحمد محمود" className="input-field" style={{ width: '100%' }} value={newStudentForm.name} onChange={e => setNewStudentForm({ ...newStudentForm, name: e.target.value })} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>رقم هاتف الطالب</label>
                <input type="tel" required placeholder="01012345678" className="input-field" style={{ width: '100%' }} value={newStudentForm.phone} onChange={e => setNewStudentForm({ ...newStudentForm, phone: e.target.value })} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>رقم هاتف ولي الأمر</label>
                <input type="tel" placeholder="01198765432" className="input-field" style={{ width: '100%' }} value={newStudentForm.parentPhone} onChange={e => setNewStudentForm({ ...newStudentForm, parentPhone: e.target.value })} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>الرقم القومي للطالب (14 رقم)</label>
                <input type="text" placeholder="30501011234567" className="input-field" style={{ width: '100%' }} value={newStudentForm.nationalId} onChange={e => setNewStudentForm({ ...newStudentForm, nationalId: e.target.value })} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>باقة الاشتراك المبدئية</label>
                <select className="input-field" style={{ width: '100%' }} value={newStudentForm.packageId} onChange={e => setNewStudentForm({ ...newStudentForm, packageId: e.target.value })}>
                  {scopedPackages.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.price} ج.م)</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                تأكيد تسجيل الطالب
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD LESSON ──────────────────────────────── */}
      {isAddLessonOpen && (
        <div className="modal-overlay active" onClick={() => setIsAddLessonOpen(false)}>
          <div className="modal-box" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsAddLessonOpen(false)}><X size={18} /></button>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '1rem' }}>
              إضافة محاضرة جديدة إلى {ACADEMIC_YEAR_LABELS[selectedYear]}
            </h3>

            <form onSubmit={handleCreateLesson} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>عنوان المحاضرة</label>
                <input type="text" required placeholder="مثال: المحاضرة 5: تفاضل الدوال اللوغاريتمية" className="input-field" style={{ width: '100%' }} value={newLessonForm.title} onChange={e => setNewLessonForm({ ...newLessonForm, title: e.target.value })} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>العنوان الفرعي</label>
                <input type="text" placeholder="قواعد الاشتقاق والتمارين التطبيقية" className="input-field" style={{ width: '100%' }} value={newLessonForm.subtitle} onChange={e => setNewLessonForm({ ...newLessonForm, subtitle: e.target.value })} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>الفرع والمادة</label>
                <select className="input-field" style={{ width: '100%' }} value={newLessonForm.subject} onChange={e => setNewLessonForm({ ...newLessonForm, subject: e.target.value })}>
                  <option value="التفاضل والتكامل">التفاضل والتكامل</option>
                  <option value="الهندسة الفراغية">الهندسة الفراغية</option>
                  <option value="الجبر وحساب المثلثات">الجبر وحساب المثلثات</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>المدة الزمنية</label>
                <input type="text" placeholder="1:45:00" className="input-field" style={{ width: '100%' }} value={newLessonForm.duration} onChange={e => setNewLessonForm({ ...newLessonForm, duration: e.target.value })} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                <input
                  type="checkbox"
                  id="publishCheck"
                  checked={newLessonForm.isPublished}
                  onChange={e => setNewLessonForm({ ...newLessonForm, isPublished: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="publishCheck" style={{ fontSize: '0.85rem', color: 'var(--text-bright)', cursor: 'pointer' }}>
                  نشر المحاضرة فوراً للطلاب (Published)
                </label>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                رفع وإضافة المحاضرة
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
