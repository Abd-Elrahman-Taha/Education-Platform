import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Sliders, Search, Users, DollarSign, Activity,
  Trash2, Ban, Shield, CheckCircle2, XCircle,
  Plus, UserPlus, BookOpen, Award,
  Check, X, Sparkles, GraduationCap,
  BarChart2, Clock, Phone, Copy, Key, Layers,
  Edit3, Zap
} from 'lucide-react';
import { AcademicYear, ACADEMIC_YEAR_LABELS } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { studentsApi } from '../../api/students.api';
import { coursesApi } from '../../api/courses.api';
import { lessonsApi } from '../../api/lessons.api';
import { paymentApi } from '../../api/payment.api';
import { AdminStudent, Course, Lesson } from '../../types/api.types';

export const AdminView: React.FC = () => {
  const { showToast } = useToast();
  const { currentUser } = useAuth();

  // Selected academic year
  const [selectedYear, setSelectedYear] = useState<AcademicYear>('third_secondary');

  // Main active tab (strictly Admin domains, no Teacher role)
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'courses' | 'lessons' | 'scratch-cards'>('overview');

  // ── LIVE BACKEND STATE ───────────────────────────────────────
  const [realStudents, setRealStudents] = useState<AdminStudent[]>([]);
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState<'all' | 'Active' | 'Blocked' | 'SuspendedMultiDevice'>('all');

  const [realCourses, setRealCourses] = useState<Course[]>([]);
  const [isCoursesLoading, setIsCoursesLoading] = useState(false);
  const [selectedCourseForLessons, setSelectedCourseForLessons] = useState<string>('');

  const [realLessons, setRealLessons] = useState<Lesson[]>([]);
  const [isLessonsLoading, setIsLessonsLoading] = useState(false);

  // Modals & Forms
  const [isRegisterStudentOpen, setIsRegisterStudentOpen] = useState(false);
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [isCreateLessonOpen, setIsCreateLessonOpen] = useState(false);
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<AdminStudent | null>(null);

  // Scratch Cards Generation State
  const [scratchAmount, setScratchAmount] = useState<number>(100);
  const [scratchCount, setScratchCount] = useState<number>(10);
  const [scratchBatch, setScratchBatch] = useState<string>('BATCH-' + new Date().getFullYear());
  const [scratchYear, setScratchYear] = useState<AcademicYear | 'all'>('third_secondary');
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);

  // Form inputs
  const [newStudentForm, setNewStudentForm] = useState({
    name: '',
    phone: '',
    parentPhone: '',
    password: 'Password123',
  });

  const [editStudentForm, setEditStudentForm] = useState({
    name: '',
    phone: '',
    parentPhone: '',
    role: 'Student',
    isSubscribed: false,
  });

  const [newCourseForm, setNewCourseForm] = useState({
    title: '',
    price: 100,
    isPublished: true,
  });

  const [newLessonForm, setNewLessonForm] = useState({
    title: '',
    videoStoragePath: 'videos/lesson-1.mp4',
    durationSeconds: 1800,
    orderIndex: 1,
    maxAllowedViews: 3,
  });

  // ── FETCH LIVE DATA ─────────────────────────────────────────
  const loadStudents = async () => {
    setIsStudentsLoading(true);
    try {
      const res = await studentsApi.getStudents({
        search: searchStudent.trim() || undefined,
        Status: studentStatusFilter !== 'all' ? studentStatusFilter : undefined,
      });
      setRealStudents(res.students);
    } catch (err: any) {
      console.error('[API ERROR] Failed to fetch students:', err);
    } finally {
      setIsStudentsLoading(false);
    }
  };

  const loadCourses = async () => {
    setIsCoursesLoading(true);
    try {
      const res = await coursesApi.getCourses();
      const list = res.courses || [];
      setRealCourses(list);
      if (list.length > 0 && !selectedCourseForLessons) {
        setSelectedCourseForLessons(list[0]._id);
      }
    } catch (err: any) {
      console.error('[API ERROR] Failed to fetch courses:', err);
    } finally {
      setIsCoursesLoading(false);
    }
  };

  const loadLessons = async (courseId: string) => {
    if (!courseId) return;
    setIsLessonsLoading(true);
    try {
      const list = await lessonsApi.getCourseLessons(courseId);
      setRealLessons(list);
    } catch (err: any) {
      console.error('[API ERROR] Failed to fetch lessons:', err);
      setRealLessons([]);
    } finally {
      setIsLessonsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseForLessons) {
      loadLessons(selectedCourseForLessons);
    }
  }, [selectedCourseForLessons]);

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadStudents();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchStudent, studentStatusFilter]);

  // Body scroll lock on modal open
  useEffect(() => {
    if (isRegisterStudentOpen || isCreateCourseOpen || isCreateLessonOpen || isEditStudentOpen) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [isRegisterStudentOpen, isCreateCourseOpen, isCreateLessonOpen, isEditStudentOpen]);

  // ── STUDENT ACTIONS ─────────────────────────────────────────
  const handleToggleStudentStatus = async (student: AdminStudent) => {
    const newStatus = student.Status === 'Active' ? 'Blocked' : 'Active';
    try {
      await studentsApi.updateStudentStatus(student._id, newStatus);
      showToast(newStatus === 'Blocked' ? `تم حظر حساب ${student.FullName}` : `تم تفعيل حساب ${student.FullName}`, 'success');
      loadStudents();
    } catch (err: any) {
      showToast(err?.message || 'فشل في تحديث حالة الطالب', 'error');
    }
  };

  const handleDeleteStudent = async (student: AdminStudent) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف الطالب (${student.FullName})؟`)) return;
    try {
      await studentsApi.deleteStudent(student._id);
      showToast(`تم حذف الطالب (${student.FullName}) بنجاح`, 'success');
      loadStudents();
    } catch (err: any) {
      showToast(err?.message || 'لا يمكن حذف الطالب لوجود سجلات مالية أو دراسية مرتبطة به.', 'error');
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await studentsApi.createStudent({
        FullName: newStudentForm.name.trim(),
        Phone: newStudentForm.phone.trim(),
        ParentPhone: newStudentForm.parentPhone.trim() || undefined,
        password: newStudentForm.password,
      });
      showToast(`تم إنشاء حساب الطالب (${newStudentForm.name}) بنجاح!`, 'success');
      setIsRegisterStudentOpen(false);
      setNewStudentForm({ name: '', phone: '', parentPhone: '', password: 'Password123' });
      loadStudents();
    } catch (err: any) {
      showToast(err?.message || 'فشل في إنشاء الطالب', 'error');
    }
  };

  const handleToggleSubscription = async (student: AdminStudent) => {
    const subRaw = localStorage.getItem(`account_subscription_${student.Phone}`) || localStorage.getItem(`account_subscription_${student._id}`);
    const currentlySubscribed = student.isSubscribed ?? (subRaw ? JSON.parse(subRaw).isSubscribed : false);
    const nextSubscribed = !currentlySubscribed;

    const subData = {
      isSubscribed: nextSubscribed,
      subscribedYear: selectedYear || 'third_secondary',
      plan: nextSubscribed ? 'باقة التفوق' : 'غير مشترك',
      updatedAt: new Date().toISOString(),
    };
    if (student.Phone) {
      localStorage.setItem(`account_subscription_${student.Phone.trim()}`, JSON.stringify(subData));
    }
    localStorage.setItem(`account_subscription_${student._id}`, JSON.stringify(subData));

    try {
      await studentsApi.updateStudent(student._id, { isSubscribed: nextSubscribed });
    } catch {}

    setRealStudents(prev =>
      prev.map(s => (s._id === student._id ? { ...s, isSubscribed: nextSubscribed } : s))
    );

    showToast(
      nextSubscribed
        ? `تم تفعيل اشتراك الطالب (${student.FullName}) بنجاح!`
        : `تم إلغاء اشتراك الطالب (${student.FullName}) بنجاح.`,
      'success'
    );
  };

  const handleToggleRole = async (student: AdminStudent) => {
    const roleRaw = localStorage.getItem(`account_role_${student.Phone}`) || localStorage.getItem(`account_role_${student._id}`) || student.Role || 'Student';
    const currentlyAdmin = (roleRaw || '').toLowerCase() === 'admin';
    const newRole = currentlyAdmin ? 'Student' : 'Admin';

    if (student.Phone) {
      localStorage.setItem(`account_role_${student.Phone.trim()}`, newRole.toLowerCase());
    }
    localStorage.setItem(`account_role_${student._id}`, newRole.toLowerCase());

    try {
      await studentsApi.updateStudentRole(student._id, newRole);
    } catch {}

    setRealStudents(prev =>
      prev.map(s => (s._id === student._id ? { ...s, Role: newRole } : s))
    );

    showToast(
      newRole === 'Admin'
        ? `تمت ترقية (${student.FullName}) إلى مدير بنجاح! التعديل نافذ وسيتفعل عند تسجيل دخوله.`
        : `تم تحويل (${student.FullName}) إلى حساب طالب بنجاح.`,
      'success'
    );
  };

  const handleOpenEditStudent = (student: AdminStudent) => {
    const roleRaw = localStorage.getItem(`account_role_${student.Phone}`) || localStorage.getItem(`account_role_${student._id}`) || student.Role || 'Student';
    const subRaw = localStorage.getItem(`account_subscription_${student.Phone}`) || localStorage.getItem(`account_subscription_${student._id}`);
    const isSubscribed = student.isSubscribed ?? (subRaw ? JSON.parse(subRaw).isSubscribed : false);

    setEditingStudent(student);
    setEditStudentForm({
      name: student.FullName,
      phone: student.Phone,
      parentPhone: student.ParentPhone || '',
      role: roleRaw.toLowerCase() === 'admin' ? 'Admin' : 'Student',
      isSubscribed: !!isSubscribed,
    });
    setIsEditStudentOpen(true);
  };

  const handleSaveEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      await studentsApi.updateStudent(editingStudent._id, {
        FullName: editStudentForm.name.trim(),
        Phone: editStudentForm.phone.trim(),
        ParentPhone: editStudentForm.parentPhone.trim() || undefined,
        Role: editStudentForm.role,
        role: editStudentForm.role,
        isSubscribed: editStudentForm.isSubscribed,
      });

      // Persist updated name
      if (editStudentForm.name.trim()) {
        localStorage.setItem(`user_fullname_${editStudentForm.phone.trim()}`, editStudentForm.name.trim());
      }

      // Persist updated role
      localStorage.setItem(`account_role_${editStudentForm.phone.trim()}`, editStudentForm.role.toLowerCase());
      localStorage.setItem(`account_role_${editingStudent._id}`, editStudentForm.role.toLowerCase());

      // Persist updated subscription
      const subData = {
        isSubscribed: editStudentForm.isSubscribed,
        subscribedYear: selectedYear || 'third_secondary',
        plan: editStudentForm.isSubscribed ? 'باقة التفوق' : 'غير مشترك',
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(`account_subscription_${editStudentForm.phone.trim()}`, JSON.stringify(subData));
      localStorage.setItem(`account_subscription_${editingStudent._id}`, JSON.stringify(subData));

      // Update local state live
      setRealStudents(prev =>
        prev.map(s =>
          s._id === editingStudent._id
            ? {
                ...s,
                FullName: editStudentForm.name.trim(),
                Phone: editStudentForm.phone.trim(),
                ParentPhone: editStudentForm.parentPhone.trim() || undefined,
                Role: editStudentForm.role,
                isSubscribed: editStudentForm.isSubscribed,
              }
            : s
        )
      );

      showToast('تم حفظ تعديلات بيانات الطالب ورقم الهاتف بنجاح!', 'success');
      setIsEditStudentOpen(false);
      setEditingStudent(null);
    } catch (err: any) {
      showToast(err?.message || 'فشل في حفظ تعديل بيانات الطالب', 'error');
    }
  };

  // ── COURSE ACTIONS ──────────────────────────────────────────
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await coursesApi.createCourse({
        Title: newCourseForm.title.trim(),
        Price: Number(newCourseForm.price),
        IsPublished: newCourseForm.isPublished,
      });
      showToast('تم إنشاء الكورس بنجاح!', 'success');
      setIsCreateCourseOpen(false);
      setNewCourseForm({ title: '', price: 100, isPublished: true });
      loadCourses();
    } catch (err: any) {
      showToast(err?.message || 'فشل في إنشاء الكورس', 'error');
    }
  };

  const handleDeleteCourse = async (courseId: string, title: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف الكورس (${title})؟`)) return;
    try {
      await coursesApi.deleteCourse(courseId);
      showToast(`تم حذف الكورس (${title}) بنجاح`, 'success');
      loadCourses();
    } catch (err: any) {
      showToast(err?.message || 'فشل في حذف الكورس', 'error');
    }
  };

  // ── LESSON ACTIONS ──────────────────────────────────────────
  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForLessons) {
      showToast('يرجى اختيار الكورس أولاً', 'error');
      return;
    }
    try {
      await lessonsApi.createLesson(selectedCourseForLessons, {
        Title: newLessonForm.title.trim(),
        VideoStoragePath: newLessonForm.videoStoragePath.trim(),
        DurationSeconds: Number(newLessonForm.durationSeconds),
        OrderIndex: Number(newLessonForm.orderIndex),
        MaxAllowedViews: Number(newLessonForm.maxAllowedViews),
      });
      showToast('تمت إضافة المحاضرة بنجاح!', 'success');
      setIsCreateLessonOpen(false);
      setNewLessonForm({ title: '', videoStoragePath: 'videos/lesson-1.mp4', durationSeconds: 1800, orderIndex: realLessons.length + 1, maxAllowedViews: 3 });
      loadLessons(selectedCourseForLessons);
    } catch (err: any) {
      showToast(err?.message || 'فشل في إضافة المحاضرة', 'error');
    }
  };

  const handleDeleteLesson = async (lessonId: string, title: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف المحاضرة (${title})؟`)) return;
    try {
      await lessonsApi.deleteLesson(selectedCourseForLessons, lessonId);
      showToast(`تم حذف المحاضرة (${title}) بنجاح`, 'success');
      loadLessons(selectedCourseForLessons);
    } catch (err: any) {
      showToast(err?.message || 'فشل في حذف المحاضرة', 'error');
    }
  };

  // ── SCRATCH CARD GENERATION ─────────────────────────────────
  const handleGenerateCards = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingCards(true);
    try {
      const res = await paymentApi.generateScratchCards({
        Amount: Number(scratchAmount),
        Count: Number(scratchCount),
        BatchNumber: scratchBatch.trim(),
        academicYear: scratchYear !== 'all' ? scratchYear : undefined,
        AcademicYear: scratchYear !== 'all' ? scratchYear : undefined,
      });
      setGeneratedCodes(res.rawCodes || []);
      const yearLabel = scratchYear !== 'all' ? `لـ ${ACADEMIC_YEAR_LABELS[scratchYear]}` : 'لكافة المراحل';
      showToast(`تم توليد ${res.insertedCount} كارت شحن بنجاح ${yearLabel}!`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'فشل في توليد كروت الشحن', 'error');
    } finally {
      setIsGeneratingCards(false);
    }
  };

  return (
    <div className="container fade-in-up" style={{ padding: '2.5rem 1.5rem 6rem' }}>
      {/* ── HEADER CARD ────────────────────────────────────── */}
      <div className="glass-card admin-header-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
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
                  <Sparkles size={13} /> لوحة تحكم المسؤول (Live Admin Hub)
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  المسؤول: {currentUser?.name}
                </span>
              </div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-bright)', margin: 0 }}>
                إدارة المنظومة التعليمية وقاعدة البيانات الحية
              </h1>
            </div>
          </div>

          {/* Academic Year Selector */}
          <div className="year-selector-wrap">
            <span className="year-selector-label">
              <GraduationCap size={15} /> العام الدراسي:
            </span>
            <div className="year-pill-group">
              {(['first_secondary', 'second_secondary', 'third_secondary'] as AcademicYear[]).map(yearKey => (
                <button
                  key={yearKey}
                  type="button"
                  className={`year-pill-btn ${selectedYear === yearKey ? 'active' : ''}`}
                  onClick={() => setSelectedYear(yearKey)}
                >
                  {selectedYear === yearKey && <Check size={13} />}
                  {ACADEMIC_YEAR_LABELS[yearKey]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="admin-tab-bar" style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <BarChart2 size={16} />
            <span>نظرة عامة والتحليلات</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            <Users size={16} />
            <span>إدارة الطلاب الحية</span>
            <span className="admin-tab-badge">{realStudents.length}</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            <BookOpen size={16} />
            <span>إدارة الكورسات (CRUD)</span>
            <span className="admin-tab-badge">{realCourses.length}</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'lessons' ? 'active' : ''}`}
            onClick={() => setActiveTab('lessons')}
          >
            <Layers size={16} />
            <span>إدارة المحاضرات (Lessons)</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'scratch-cards' ? 'active' : ''}`}
            onClick={() => setActiveTab('scratch-cards')}
          >
            <Key size={16} />
            <span>توليد كروت الشحن (Scratch Cards)</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: OVERVIEW ─────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي الطلاب المسجلين</span>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary-light)', margin: '0.35rem 0' }}>
                {realStudents.length}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>✓ متصل بقاعدة بيانات MongoDB</span>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>الكورسات المنشورة</span>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10B981', margin: '0.35rem 0' }}>
                {realCourses.length}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>جاهزة للتسجيل والاشتراك</span>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>المحاضرات النشطة</span>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent)', margin: '0.35rem 0' }}>
                {realLessons.length}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>مزودة بالحماية وHeartbeat</span>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>حالة خادم الـ API</span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)', margin: '0.5rem 0' }}>
                متصل وجاهز ⚡
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>edc-platform.vercel.app</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: STUDENTS MANAGEMENT (LIVE GET /users/students) ── */}
      {activeTab === 'students' && (
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                الطلاب المسجلون في المنظومة ({realStudents.length})
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                إدارة كاملة لحسابات الطلاب، تفعيل الحسابات، الحظر، والحذف الآمن
              </span>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsRegisterStudentOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <UserPlus size={16} /> تسجيل طالب جديد
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-field"
                placeholder="بحث بالاسم أو رقم الهاتف..."
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
              <option value="Active">حساب نشط (Active)</option>
              <option value="Blocked">حساب محظور (Blocked)</option>
              <option value="SuspendedMultiDevice">معلق لتعدد الأجهزة</option>
            </select>
          </div>

          {/* Students Table */}
          {isStudentsLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>جاري جلب بيانات الطلاب من الخادم...</div>
          ) : realStudents.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>لا يوجد طلاب مطابقين للبحث.</div>
          ) : (
            <div className="user-table-wrapper">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>اسم الطالب</th>
                    <th>الهاتف</th>
                    <th>هاتف ولي الأمر</th>
                    <th>الاشتراك</th>
                    <th>الدور</th>
                    <th>الحالة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {realStudents.map(student => {
                    const isActive = student.Status === 'Active';
                    const roleRaw = localStorage.getItem(`account_role_${student.Phone}`) || localStorage.getItem(`account_role_${student._id}`) || student.Role || 'Student';
                    const isAdmin = (roleRaw || '').toLowerCase() === 'admin';
                    const subRaw = localStorage.getItem(`account_subscription_${student.Phone}`) || localStorage.getItem(`account_subscription_${student._id}`);
                    const isSub = student.isSubscribed ?? (subRaw ? JSON.parse(subRaw).isSubscribed : false);

                    return (
                      <tr key={student._id}>
                        <td>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--text-bright)' }}>{student.FullName}</strong>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{student.Phone}</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{student.ParentPhone || '—'}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: isSub ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: isSub ? '#10B981' : '#EF4444',
                                border: `1px solid ${isSub ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                              }}
                            >
                              {isSub ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                              {isSub ? 'مشترك' : 'غير مشترك'}
                            </span>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                              onClick={() => handleToggleSubscription(student)}
                              title={isSub ? 'إلغاء الاشتراك' : 'تفعيل الاشتراك'}
                            >
                              {isSub ? 'إلغاء' : <><Zap size={11} color="#F59E0B" /> تفعيل</>}
                            </button>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: isAdmin ? 'rgba(245, 158, 11, 0.15)' : 'rgba(8, 145, 178, 0.15)',
                                color: isAdmin ? '#F59E0B' : 'var(--primary-light)',
                                border: `1px solid ${isAdmin ? 'rgba(245, 158, 11, 0.3)' : 'rgba(8, 145, 178, 0.3)'}`,
                              }}
                            >
                              {isAdmin ? 'مدير 👑' : 'طالب'}
                            </span>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                              onClick={() => handleToggleRole(student)}
                              title={isAdmin ? 'تحويل لحساب طالب' : 'ترقية لحساب مدير'}
                            >
                              {isAdmin ? 'تحويل لطالب' : 'ترقية لمدير'}
                            </button>
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${isActive ? 'status-badge--active' : 'status-badge--blocked'}`}>
                            {isActive ? 'نشط (Active)' : student.Status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                              onClick={() => handleOpenEditStudent(student)}
                              title="تعديل بيانات الطالب ورقم الهاتف"
                            >
                              <Edit3 size={13} color="var(--primary-light)" /> تعديل
                            </button>
                            <button
                              type="button"
                              className={`btn ${isActive ? 'btn-secondary' : 'btn-primary'}`}
                              style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                              onClick={() => handleToggleStudentStatus(student)}
                            >
                              {isActive ? <><Ban size={13} color="var(--danger)" /> حظر</> : <><CheckCircle2 size={13} color="#10B981" /> تفعيل</>}
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
                              onClick={() => handleDeleteStudent(student)}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: COURSES MANAGEMENT (POST, PUT, DELETE /courses) ── */}
      {activeTab === 'courses' && (
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                إدارة الكورسات والمناهج ({realCourses.length})
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                إنشاء، تعديل، وحذف الكورسات مباشرة عبر الـ REST API
              </span>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsCreateCourseOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Plus size={16} /> إضافة كورس جديد
            </button>
          </div>

          {isCoursesLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>جاري تحميل الكورسات...</div>
          ) : realCourses.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد كورسات مضافة حتى الآن.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {realCourses.map(course => (
                <div key={course._id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span className={`status-badge ${course.IsPublished ? 'status-badge--active' : 'status-badge--blocked'}`}>
                        {course.IsPublished ? 'منشور' : 'مسودة'}
                      </span>
                      <strong style={{ fontSize: '1.1rem', color: '#10B981' }}>{course.Price} ج.م</strong>
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-bright)', margin: '0.25rem 0 0.5rem' }}>
                      {course.Title}
                    </h3>
                  </div>

                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                      onClick={() => {
                        setSelectedCourseForLessons(course._id);
                        setActiveTab('lessons');
                      }}
                    >
                      إدارة المحاضرات
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
                      onClick={() => handleDeleteCourse(course._id, course.Title)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: LESSONS MANAGEMENT (POST, DELETE /courses/{id}/lessons) ── */}
      {activeTab === 'lessons' && (
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                إدارة المحاضرات والدروس ({realLessons.length})
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                إضافة وحذف محاضرات الفيديو المشفرة المرتبطة بالكورسات
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <select
                className="input-field"
                style={{ fontSize: '0.85rem' }}
                value={selectedCourseForLessons}
                onChange={e => setSelectedCourseForLessons(e.target.value)}
              >
                {realCourses.map(c => (
                  <option key={c._id} value={c._id}>{c.Title}</option>
                ))}
              </select>

              <button
                type="button"
                className="btn btn-primary"
                disabled={!selectedCourseForLessons}
                onClick={() => setIsCreateLessonOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
              >
                <Plus size={16} /> إضافة محاضرة
              </button>
            </div>
          </div>

          {isLessonsLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>جاري جلب المحاضرات...</div>
          ) : realLessons.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد محاضرات في هذا الكورس بعد.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {realLessons.map((les, idx) => (
                <div key={les._id} className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'rgba(8,145,178,0.15)', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                      {les.OrderIndex || idx + 1}
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-bright)', display: 'block' }}>{les.Title}</strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        المدة: {les.DurationSeconds ? `${Math.round(les.DurationSeconds / 60)} دقيقة` : '—'} • المشاهدات المسموحة: {les.MaxAllowedViews || 3}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
                    onClick={() => handleDeleteLesson(les._id, les.Title)}
                  >
                    <Trash2 size={14} /> حذف
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 5: SCRATCH CARDS GENERATION ─────────────────── */}
      {activeTab === 'scratch-cards' && (
        <div className="glass-card" style={{ padding: '2rem', maxWidth: '680px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(234, 179, 8, 0.15)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 0.75rem',
            }}>
              <Key size={28} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
              توليد كروت الشحن (Generate Scratch Cards)
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              إنشاء دفعة جديدة من أكواد كروت الشحن بقيمة نقدية محددة لشحن محافظ الطلاب
            </p>
          </div>

          <form onSubmit={handleGenerateCards} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  قيمة الكارت (Amount بالجنيه):
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  className="input-field"
                  style={{ width: '100%' }}
                  value={scratchAmount}
                  onChange={e => setScratchAmount(Number(e.target.value))}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  عدد الكروت (Count من 1 إلى 500):
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={500}
                  className="input-field"
                  style={{ width: '100%' }}
                  value={scratchCount}
                  onChange={e => setScratchCount(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                الصف الدراسي (المرحلة التعليمية المستهدفة):
              </label>
              <select
                className="input-field"
                style={{ width: '100%', fontSize: '0.9rem' }}
                value={scratchYear}
                onChange={e => {
                  const val = e.target.value as AcademicYear | 'all';
                  setScratchYear(val);
                  const suffix = val === 'first_secondary' ? '-SEC1' : val === 'second_secondary' ? '-SEC2' : val === 'third_secondary' ? '-SEC3' : '';
                  setScratchBatch(`BATCH-${new Date().getFullYear()}${suffix}`);
                }}
              >
                <option value="third_secondary">الصف الثالث الثانوي (الثانوية العامة)</option>
                <option value="second_secondary">الصف الثاني الثانوي</option>
                <option value="first_secondary">الصف الأول الثانوي</option>
                <option value="all">جميع الصفوف (عام لكافة المراحل)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                رقم الدفعة (Batch Number):
              </label>
              <input
                type="text"
                required
                className="input-field"
                style={{ width: '100%' }}
                value={scratchBatch}
                onChange={e => setScratchBatch(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isGeneratingCards}
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.92rem' }}
            >
              {isGeneratingCards ? 'جاري توليد الكروت وحفظها في السيرفر...' : '⚡ توليد دفعة الكروت الآن'}
            </button>
          </form>

          {/* Generated Raw Codes Output */}
          {generatedCodes.length > 0 && (
            <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <strong style={{ fontSize: '0.88rem', color: 'var(--text-bright)' }}>
                  الأكواد المولدة حديثاً ({generatedCodes.length} كارت):
                </strong>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCodes.join('\n'));
                    showToast('تم نسخ جميع الأكواد للحافظة!', 'success');
                  }}
                >
                  <Copy size={13} /> نسخ الأكواد
                </button>
              </div>

              <div style={{ maxHeight: '200px', overflowY: 'auto', background: '#000', padding: '0.75rem', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.82rem', color: '#10B981', direction: 'ltr' }}>
                {generatedCodes.map((code, idx) => (
                  <div key={idx}>{code}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: CREATE STUDENT ───────────────────────────── */}
      {isRegisterStudentOpen && createPortal(
        <div className="modal-overlay active" onClick={() => setIsRegisterStudentOpen(false)} style={{ zIndex: 99999 }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', padding: '1.75rem' }}>
            <button className="modal-close" onClick={() => setIsRegisterStudentOpen(false)}><X size={18} /></button>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '1.25rem' }}>
              تسجيل حساب طالب جديد (Admin Create)
            </h2>

            <form onSubmit={handleCreateStudent} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>اسم الطالب بالكامل</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: يوسف أحمد عبد المنعم"
                  className="input-field"
                  style={{ width: '100%' }}
                  value={newStudentForm.name}
                  onChange={e => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>رقم هاتف الطالب (11 رقماً)</label>
                <input
                  type="tel"
                  required
                  maxLength={11}
                  placeholder="01012345678"
                  className="input-field"
                  style={{ width: '100%' }}
                  value={newStudentForm.phone}
                  onChange={e => setNewStudentForm({ ...newStudentForm, phone: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>رقم هاتف ولي الأمر (اختياري)</label>
                <input
                  type="tel"
                  maxLength={11}
                  placeholder="01112345678"
                  className="input-field"
                  style={{ width: '100%' }}
                  value={newStudentForm.parentPhone}
                  onChange={e => setNewStudentForm({ ...newStudentForm, parentPhone: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}>
                تأكيد إنشاء الحساب
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: CREATE COURSE ────────────────────────────── */}
      {isCreateCourseOpen && createPortal(
        <div className="modal-overlay active" onClick={() => setIsCreateCourseOpen(false)} style={{ zIndex: 99999 }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', padding: '1.75rem' }}>
            <button className="modal-close" onClick={() => setIsCreateCourseOpen(false)}><X size={18} /></button>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '1.25rem' }}>
              إضافة كورس جديد (Create Course)
            </h2>

            <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>عنوان الكورس</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: كورس الرياضيات المتقدمة"
                  className="input-field"
                  style={{ width: '100%' }}
                  value={newCourseForm.title}
                  onChange={e => setNewCourseForm({ ...newCourseForm, title: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>سعر الكورس (جنيه مصري)</label>
                <input
                  type="number"
                  required
                  min={0}
                  className="input-field"
                  style={{ width: '100%' }}
                  value={newCourseForm.price}
                  onChange={e => setNewCourseForm({ ...newCourseForm, price: Number(e.target.value) })}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}>
                نشر الكورس
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: CREATE LESSON ────────────────────────────── */}
      {isCreateLessonOpen && createPortal(
        <div className="modal-overlay active" onClick={() => setIsCreateLessonOpen(false)} style={{ zIndex: 99999 }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', padding: '1.75rem' }}>
            <button className="modal-close" onClick={() => setIsCreateLessonOpen(false)}><X size={18} /></button>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '1.25rem' }}>
              إضافة محاضرة جديدة إلى الكورس
            </h2>

            <form onSubmit={handleCreateLesson} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>عنوان المحاضرة (3-100 حرف)</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={100}
                  placeholder="مثال: مقدمة في الدوال والمعادلات"
                  className="input-field"
                  style={{ width: '100%' }}
                  value={newLessonForm.title}
                  onChange={e => setNewLessonForm({ ...newLessonForm, title: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>مسار تخزين الفيديو (VideoStoragePath)</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  style={{ width: '100%' }}
                  value={newLessonForm.videoStoragePath}
                  onChange={e => setNewLessonForm({ ...newLessonForm, videoStoragePath: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>المدة بالثواني</label>
                  <input
                    type="number"
                    required
                    min={1}
                    className="input-field"
                    style={{ width: '100%' }}
                    value={newLessonForm.durationSeconds}
                    onChange={e => setNewLessonForm({ ...newLessonForm, durationSeconds: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>ترتيب الدرس (OrderIndex)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    className="input-field"
                    style={{ width: '100%' }}
                    value={newLessonForm.orderIndex}
                    onChange={e => setNewLessonForm({ ...newLessonForm, orderIndex: Number(e.target.value) })}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}>
                تأكيد إضافة المحاضرة
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: EDIT STUDENT (PHONE, ROLE, SUBSCRIPTION, NAME) ── */}
      {isEditStudentOpen && editingStudent && createPortal(
        <div className="modal-overlay active" onClick={() => setIsEditStudentOpen(false)} style={{ zIndex: 99999 }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', padding: '1.75rem' }}>
            <button className="modal-close" onClick={() => setIsEditStudentOpen(false)}><X size={18} /></button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(8, 145, 178, 0.15)',
                color: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Edit3 size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                  تعديل بيانات الطالب
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  كود الطالب: #{editingStudent._id.slice(-6)}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveEditStudent} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.35rem' }}>
                  اسم الطالب الكامل
                </label>
                <input
                  type="text"
                  required
                  placeholder="اسم الطالب..."
                  className="input-field"
                  style={{ width: '100%' }}
                  value={editStudentForm.name}
                  onChange={e => setEditStudentForm({ ...editStudentForm, name: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.35rem' }}>
                  رقم هاتف الطالب (تسجيل الدخول)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="مثال: 01012345678"
                  className="input-field"
                  style={{ width: '100%', fontFamily: 'monospace' }}
                  value={editStudentForm.phone}
                  onChange={e => setEditStudentForm({ ...editStudentForm, phone: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.35rem' }}>
                  رقم هاتف ولي الأمر
                </label>
                <input
                  type="tel"
                  placeholder="مثال: 01198765432"
                  className="input-field"
                  style={{ width: '100%', fontFamily: 'monospace' }}
                  value={editStudentForm.parentPhone}
                  onChange={e => setEditStudentForm({ ...editStudentForm, parentPhone: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.35rem' }}>
                    الدور (Role)
                  </label>
                  <select
                    className="input-field"
                    style={{ width: '100%' }}
                    value={editStudentForm.role}
                    onChange={e => setEditStudentForm({ ...editStudentForm, role: e.target.value })}
                  >
                    <option value="Student">طالب (Student)</option>
                    <option value="Admin">مدير (Admin)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.35rem' }}>
                    حالة الاشتراك
                  </label>
                  <select
                    className="input-field"
                    style={{ width: '100%' }}
                    value={editStudentForm.isSubscribed ? 'true' : 'false'}
                    onChange={e => setEditStudentForm({ ...editStudentForm, isSubscribed: e.target.value === 'true' })}
                  >
                    <option value="true">اشتراك مفعل ✓</option>
                    <option value="false">غير مشترك ✗</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setIsEditStudentOpen(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
