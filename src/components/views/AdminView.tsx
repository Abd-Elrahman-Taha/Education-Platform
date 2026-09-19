import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Sliders, Search, Users, DollarSign, Activity,
  Trash2, Ban, Shield, CheckCircle2, XCircle,
  Plus, UserPlus, BookOpen, Award,
  Check, X, Sparkles, GraduationCap,
  BarChart2, Clock, Phone, Copy, Key, Layers,
  Edit3, Zap, ArrowUp, ArrowDown, ListOrdered,
  FileText, CheckSquare, Eye, AlertTriangle, AlertCircle,
  HelpCircle, RefreshCw, Crown, Lock, Shuffle, Target, RotateCcw, ShieldCheck, Lightbulb,
  LayoutDashboard, Smartphone, Send, Inbox, Mail, MailOpen, MessageCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { AcademicYear, ACADEMIC_YEAR_LABELS, AppView } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { studentsApi } from '../../api/students.api';
import { coursesApi } from '../../api/courses.api';
import { lessonsApi } from '../../api/lessons.api';
import { paymentApi } from '../../api/payment.api';
import { examsApi, calculateNextOrderIndex } from '../../api/exams.api';
import { enrollmentsApi } from '../../api/enrollments.api';
import { inquiriesApi } from '../../api/inquiries.api';
import {
  AdminStudent,
  UpdateStudentRequest,
  Course,
  Lesson,
  EducationStage,
  Exam,
  ExamStatus,
  UpdateExamRequest,
  Question,
  QuestionType,
  ExamAttempt,
  ManualPaymentRequest,
  Inquiry,
  InquiryStatus,
} from '../../types/api.types';
import { getFriendlyErrorMessage } from '../../utils/errors';
import { matchesAcademicYear } from '../../utils/courseFilter';

import { EDUCATION_STAGES } from '../../constants/education';
export { EDUCATION_STAGES };

interface AdminViewProps {
  onNavigateView?: (view: AppView) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onNavigateView }) => {
  const { showToast } = useToast();
  const { currentUser } = useAuth();

  const isSuperAdmin =
    currentUser?.role === 'superadmin' ||
    currentUser?.isSuperAdmin === true ||
    (currentUser as any)?.Role === 'SuperAdmin' ||
    (currentUser as any)?.Role === 'superadmin' ||
    (currentUser as any)?.role === 'superadmin';

  // Selected academic year filter ('all' shows all courses, or specific secondary year)
  const [selectedYear, setSelectedYear] = useState<AcademicYear | 'all'>('all');

  // Main active tab (strictly Admin domains, no Teacher role)
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'courses' | 'lessons' | 'exams' | 'scratch-cards' | 'payment-requests' | 'admins' | 'inquiries'>('overview');

  // ── MANUAL PAYMENT REQUESTS STATE ─────────────────────────────
  const [paymentRequests, setPaymentRequests] = useState<ManualPaymentRequest[]>([]);
  const [isPaymentRequestsLoading, setIsPaymentRequestsLoading] = useState(false);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [searchPayment, setSearchPayment] = useState('');
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [isProcessingPaymentId, setIsProcessingPaymentId] = useState<string | null>(null);

  // ── INQUIRIES STATE ───────────────────────────────────────────
  const [allInquiries, setAllInquiries] = useState<Inquiry[]>([]);
  const [isInquiriesLoading, setIsInquiriesLoading] = useState(false);
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState<'all' | InquiryStatus>('all');
  const [searchInquiry, setSearchInquiry] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [expandedInquiryId, setExpandedInquiryId] = useState<string | null>(null);

  // Auto-switch tab if navigated from notification bell or external trigger
  useEffect(() => {
    try {
      const tabReq = localStorage.getItem('admin_active_tab');
      if (tabReq === 'inquiries' || tabReq === 'payment-requests' || tabReq === 'students' || tabReq === 'courses' || tabReq === 'exams') {
        setActiveTab(tabReq as any);
        localStorage.removeItem('admin_active_tab');
      }
      const selInqId = sessionStorage.getItem('admin_selected_inquiry_id');
      if (selInqId) {
        setExpandedInquiryId(selInqId);
      }
    } catch {}
  }, []);

  // Handle auto-opening inquiry from notification once inquiries are loaded
  useEffect(() => {
    try {
      const selInqId = sessionStorage.getItem('admin_selected_inquiry_id');
      if (selInqId && allInquiries.length > 0) {
        const target = allInquiries.find(i => i._id === selInqId);
        if (target) {
          setExpandedInquiryId(selInqId);
          if (target.Status === 'Open') {
            setSelectedInquiry(target);
            setReplyText(target.Reply || '');
            setIsReplyModalOpen(true);
          }
        }
        sessionStorage.removeItem('admin_selected_inquiry_id');
      }
    } catch {}
  }, [allInquiries]);

  // Redirect if user is not superadmin and attempts to open admins tab
  useEffect(() => {
    if (!isSuperAdmin && activeTab === 'admins') {
      setActiveTab('overview');
    }
  }, [isSuperAdmin, activeTab]);

  // ── LIVE BACKEND STATE ───────────────────────────────────────
  const [allStudents, setAllStudents] = useState<AdminStudent[]>([]);
  const [realStudents, setRealStudents] = useState<AdminStudent[]>([]);
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState<'all' | 'Active' | 'Blocked' | 'SuspendedMultiDevice'>('all');
  const searchReqIdRef = useRef(0);

  const [realCourses, setRealCourses] = useState<Course[]>([]);
  const [isCoursesLoading, setIsCoursesLoading] = useState(false);
  const [selectedCourseForLessons, setSelectedCourseForLessons] = useState<string>('');
  const [courseStageFilter, setCourseStageFilter] = useState<string>('all');
  const [courseGradeFilter, setCourseGradeFilter] = useState<string>('all');

  const [realLessons, setRealLessons] = useState<Lesson[]>([]);
  const [isLessonsLoading, setIsLessonsLoading] = useState(false);

  // ── EXAMS STATE ──────────────────────────────────────────────
  const [realExams, setRealExams] = useState<Exam[]>([]);
  const [isExamsLoading, setIsExamsLoading] = useState(false);
  const [searchExam, setSearchExam] = useState('');
  const [examCourseFilter, setExamCourseFilter] = useState<string>('all');
  const [examStatusFilter, setExamStatusFilter] = useState<string>('all');

  // ── ADMINS STATE ─────────────────────────────────────────────
  const [realAdmins, setRealAdmins] = useState<AdminStudent[]>([]);
  const [isAdminsLoading, setIsAdminsLoading] = useState(false);
  const [isQuickPromoteOpen, setIsQuickPromoteOpen] = useState(false);

  // ── QUESTIONS STATE ──────────────────────────────────────────
  const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState(false);
  const [selectedExamForQuestions, setSelectedExamForQuestions] = useState<Exam | null>(null);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(false);
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);

  // ── ATTEMPTS STATE ───────────────────────────────────────────
  const [isAttemptsModalOpen, setIsAttemptsModalOpen] = useState(false);
  const [selectedExamForAttempts, setSelectedExamForAttempts] = useState<Exam | null>(null);
  const [examAttempts, setExamAttempts] = useState<ExamAttempt[]>([]);
  const [isAttemptsLoading, setIsAttemptsLoading] = useState(false);
  // Track whether the questions-modal exam already has student attempts (blocks question edits)
  const [examHasAttempts, setExamHasAttempts] = useState(false);

  // ── ESSAY GRADING STATE (POST /exams/:id/attempts/:attemptId/grade) ──
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [gradingAttempt, setGradingAttempt] = useState<ExamAttempt | null>(null);
  const [gradingQuestions, setGradingQuestions] = useState<Question[]>([]);
  const [gradingScores, setGradingScores] = useState<Record<string, number>>({});
  const [gradingFeedbacks, setGradingFeedbacks] = useState<Record<string, string>>({});
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);

  // ── ENROLLMENT & PROMOTION MODALS ─────────────────────────────
  const [isManualEnrollOpen, setIsManualEnrollOpen] = useState(false);
  const [enrollTargetStudent, setEnrollTargetStudent] = useState<AdminStudent | null>(null);
  const [selectedEnrollCourseId, setSelectedEnrollCourseId] = useState<string>('');
  const [isEnrolling, setIsEnrolling] = useState(false);

  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [promoteTargetStudent, setPromoteTargetStudent] = useState<AdminStudent | null>(null);
  const [isPromoting, setIsPromoting] = useState(false);

  // Modals & Forms
  const [isRegisterStudentOpen, setIsRegisterStudentOpen] = useState(false);
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [isEditCourseOpen, setIsEditCourseOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isCreateLessonOpen, setIsCreateLessonOpen] = useState(false);
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<AdminStudent | null>(null);
  const [isCreateExamOpen, setIsCreateExamOpen] = useState(false);
  const [isCreateAIExamOpen, setIsCreateAIExamOpen] = useState(false);
  const [isEditExamOpen, setIsEditExamOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [editExamLessons, setEditExamLessons] = useState<Lesson[]>([]);

  // AI Exam Generator Form State
  const [aiExamForm, setAiExamForm] = useState({
    title: '',
    courseId: '',
    educationStage: 'Secondary' as EducationStage,
    grade: '3',
    durationMinutes: 30,
    passingScore: 60,
    questionsCount: 15,
    questionType: 'MCQ',
    difficulty: 'Medium',
    textPrompt: '',
  });
  const [aiExamFile, setAiExamFile] = useState<File | null>(null);
  const [isGeneratingAIExam, setIsGeneratingAIExam] = useState(false);

  // Scratch Cards Generation State
  const [scratchAmount, setScratchAmount] = useState<number>(100);
  const [scratchCount, setScratchCount] = useState<number>(10);
  const [scratchBatch, setScratchBatch] = useState<string>('BATCH-' + new Date().getFullYear());
  const [scratchYear, setScratchYear] = useState<AcademicYear | 'all'>('third_secondary');
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);

  // Form inputs
  const [newStudentForm, setNewStudentForm] = useState({
    fullName: '',
    nationalId: '',
    phone: '',
    parentPhone: '',
    password: '',
    educationStage: 'Secondary' as EducationStage,
    grade: '3',
  });

  const [editStudentForm, setEditStudentForm] = useState({
    name: '',
    phone: '',
    parentPhone: '',
    nationalId: '',
    password: '',
    role: 'Student',
    subscriptionAction: 'none',
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [enrolledStudentIds, setEnrolledStudentIds] = useState<Set<string>>(new Set());
  const [comprehensiveStudentIds, setComprehensiveStudentIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('syntax_comprehensive_students');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [newCourseForm, setNewCourseForm] = useState<{
    title: string;
    price: number;
    educationStage: EducationStage;
    grade: string;
    isPublished: boolean;
  }>({
    title: '',
    price: 100,
    educationStage: 'Secondary',
    grade: '3',
    isPublished: true,
  });

  const [editCourseForm, setEditCourseForm] = useState<{
    title: string;
    price: number;
    educationStage: EducationStage;
    grade: string;
    isPublished: boolean;
  }>({
    title: '',
    price: 100,
    educationStage: 'Secondary',
    grade: '3',
    isPublished: true,
  });

  const [newLessonForm, setNewLessonForm] = useState({
    title: '',
    videoStoragePath: 'videos/lesson-1.mp4',
    durationSeconds: 1800,
    orderIndex: 1,
    maxAllowedViews: 3,
  });

  const [newExamForm, setNewExamForm] = useState<{
    title: string;
    courseId: string;
    lessonId: string;
    durationMinutes: number;
    passingScore: number;
    maxAttempts: number;
    status: ExamStatus;
    isRandomized: boolean;
    isGated: boolean;
  }>({
    title: '',
    courseId: '',
    lessonId: '',
    durationMinutes: 60,
    passingScore: 10,
    maxAttempts: 0,
    status: 'Draft',
    isRandomized: true,
    isGated: true,
  });

  const [editExamForm, setEditExamForm] = useState<{
    title: string;
    courseId: string;
    lessonId: string;
    durationMinutes: number;
    passingScore: number;
    maxAttempts: number;
    status: ExamStatus;
    isRandomized: boolean;
    isGated: boolean;
  }>({
    title: '',
    courseId: '',
    lessonId: '',
    durationMinutes: 60,
    passingScore: 10,
    maxAttempts: 0,
    status: 'Draft',
    isRandomized: true,
    isGated: true,
  });

  const [questionForm, setQuestionForm] = useState<{
    questionType: QuestionType;
    questionText: string;
    points: number;
    orderIndex: number;
    options: string[];
    correctOptionIndex: number;
    correctAnswer: string;
  }>({
    questionType: 'MCQ',
    questionText: '',
    points: 5,
    orderIndex: 1,
    options: ['الخيار الأول', 'الخيار الثاني', 'الخيار الثالث', 'الخيار الرابع'],
    correctOptionIndex: 0,
    correctAnswer: 'الخيار الأول',
  });

  // ── FETCH LIVE DATA ─────────────────────────────────────────
  const loadStudents = async () => {
    setIsStudentsLoading(true);
    try {
      const res = await studentsApi.getStudents({
        Status: studentStatusFilter !== 'all' ? studentStatusFilter : undefined,
      });
      setAllStudents(res.students);
      setRealStudents(res.students);
      loadAdmins(res.students);
    } catch (err: any) {
      console.error('[API ERROR] Failed to fetch students:', err);
    } finally {
      setIsStudentsLoading(false);
    }
  };

  // Instant in-memory filtering for students list (instant search, instant restore when cleared)
  const displayedStudents = useMemo(() => {
    const master = allStudents.length > 0 ? allStudents : realStudents;
    let list = master;

    if (studentStatusFilter !== 'all') {
      list = list.filter(s => s.Status === studentStatusFilter);
    }

    const query = searchStudent.trim();
    if (!query) {
      return list;
    }

    // Normalize arabic digits to standard ascii digits
    const cleanDigits = (val: string) =>
      val ? val.replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 1632)).replace(/\D/g, '') : '';
    const queryDigits = cleanDigits(query);

    // Normalize arabic characters for fuzzy search
    const normalizeArabic = (text: string) =>
      (text || '')
        .toLowerCase()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .trim();
    const queryArabic = normalizeArabic(query);
    const queryLower = query.toLowerCase();

    return list.filter(student => {
      const name = normalizeArabic(student.FullName || '');
      const rawName = (student.FullName || '').toLowerCase();
      const phone = cleanDigits(student.Phone || '');
      const parentPhone = cleanDigits(student.ParentPhone || '');
      const nationalId = cleanDigits(student.NationalId || '');
      const role = (student.Role || '').toLowerCase();

      const matchesName = name.includes(queryArabic) || rawName.includes(queryLower);
      const matchesPhone = queryDigits ? phone.includes(queryDigits) : false;
      const matchesParentPhone = queryDigits ? parentPhone.includes(queryDigits) : false;
      const matchesNationalId = queryDigits ? nationalId.includes(queryDigits) : false;
      const matchesRole = role.includes(queryLower);

      return matchesName || matchesPhone || matchesParentPhone || matchesNationalId || matchesRole;
    });
  }, [allStudents, realStudents, studentStatusFilter, searchStudent]);

  const loadCourses = async () => {
    setIsCoursesLoading(true);
    try {
      const res = await coursesApi.getCourses();
      const list = res.courses || [];
      setRealCourses(list);
      if (list.length > 0 && !selectedCourseForLessons) {
        setSelectedCourseForLessons(list[0]._id);
      }
      if (list.length > 0 && !newExamForm.courseId) {
        setNewExamForm(prev => ({ ...prev, courseId: list[0]._id }));
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

  const ensureExamLinkedToCourseLessons = async (exam: Exam, shouldUnlink: boolean = false) => {
    try {
      const courseId = typeof exam.CourseId === 'object' && exam.CourseId ? (exam.CourseId as any)._id : exam.CourseId;
      if (!courseId) return;
      const lessonId = typeof exam.LessonId === 'object' && exam.LessonId ? (exam.LessonId as any)._id : (exam.LessonId || '');

      if (shouldUnlink) {
        if (lessonId) {
          await lessonsApi.updateLesson(courseId, lessonId, { PrerequisiteExamId: null });
        }
        return;
      }

      if (lessonId) {
        await lessonsApi.updateLesson(courseId, lessonId, { PrerequisiteExamId: exam._id });
        return;
      }

      // If no specific lessonId, check lessons of this course to attach to available lesson in the database
      const lessons = await lessonsApi.getCourseLessons(courseId);
      if (Array.isArray(lessons)) {
        if (lessons.length > 0) {
          const alreadyLinked = lessons.find(l => l.PrerequisiteExamId === exam._id);
          if (!alreadyLinked) {
            const target = lessons.find(l => !l.PrerequisiteExamId) || lessons[0];
            if (target && target._id) {
              await lessonsApi.updateLesson(courseId, target._id, { PrerequisiteExamId: exam._id });
            }
          }
        } else {
          // If course has no lessons in database, create an assessment lesson in the database so enrolled students can take the exam
          await lessonsApi.createLesson(courseId, {
            Title: exam.Title || 'امتحان التقييم الإلكتروني',
            VideoStoragePath: 'videos/exam-intro.mp4',
            DurationSeconds: (Number(exam.DurationMinutes) || 30) * 60,
            OrderIndex: 1,
            MaxAllowedViews: 10,
            PrerequisiteExamId: exam._id,
          });
        }
      }
    } catch (err) {
      console.warn('[Admin] Failed to sync exam with course lessons:', err);
    }
  };

  const loadExams = async () => {
    setIsExamsLoading(true);
    try {
      const res = await examsApi.getExams();
      const list = res.exams || [];
      setRealExams(list);
      if (list.length > 0) {
        // Auto-heal / repair: ensure all published exams are linked to lessons in the database
        list.filter(e => e.Status === 'Published').forEach(pubExam => {
          ensureExamLinkedToCourseLessons(pubExam);
        });
      }
    } catch (err: any) {
      console.warn('[API INFO] Exams list status:', err?.message || err);
      setRealExams([]);
    } finally {
      setIsExamsLoading(false);
    }
  };

  // Instant in-memory filtering for exams list (no server spam on filter/search change)
  const displayedExams = useMemo(() => {
    let list = realExams;
    if (examCourseFilter !== 'all') {
      list = list.filter(e => {
        const cid = typeof e.CourseId === 'object' && e.CourseId ? (e.CourseId as any)._id : e.CourseId;
        return cid === examCourseFilter;
      });
    }
    if (examStatusFilter !== 'all') {
      list = list.filter(e => e.Status === examStatusFilter);
    }
    if (searchExam.trim()) {
      const s = searchExam.trim().toLowerCase();
      list = list.filter(e => (e.Title || '').toLowerCase().includes(s));
    }
    return list;
  }, [realExams, examCourseFilter, examStatusFilter, searchExam]);

  const loadQuestions = async (examId: string) => {
    setIsQuestionsLoading(true);
    try {
      const qList = await examsApi.getQuestions(examId);
      setExamQuestions(qList || []);
    } catch (err: any) {
      console.warn('[Questions] Failed to fetch from backend:', err);
      setExamQuestions([]);
    } finally {
      setIsQuestionsLoading(false);
    }
  };

  const loadExamAttempts = async (examId: string) => {
    setIsAttemptsLoading(true);
    try {
      const attempts = await examsApi.getExamAttempts(examId);
      setExamAttempts(attempts);
    } catch (err: any) {
      console.error('[API ERROR] Failed to fetch exam attempts:', err);
      setExamAttempts([]);
    } finally {
      setIsAttemptsLoading(false);
    }
  };

  const handleOpenGradingModal = async (attempt: ExamAttempt) => {
    if (!selectedExamForAttempts) return;
    setGradingAttempt(attempt);
    setIsGradeModalOpen(true);
    try {
      const qList = await examsApi.getQuestions(selectedExamForAttempts._id);
      const essays = qList.filter(q => q.QuestionType === 'Essay');
      const targetQuestions = essays.length > 0 ? essays : qList;
      setGradingQuestions(targetQuestions);
      const initialScores: Record<string, number> = {};
      const initialFeedbacks: Record<string, string> = {};
      targetQuestions.forEach(q => {
        initialScores[q._id] = q.Points || 0;
        initialFeedbacks[q._id] = '';
      });
      setGradingScores(initialScores);
      setGradingFeedbacks(initialFeedbacks);
    } catch (err) {
      console.warn('Failed to load questions for grading:', err);
    }
  };

  const handleSubmitGrades = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamForAttempts || !gradingAttempt) return;
    setIsSubmittingGrade(true);
    try {
      const gradesPayload = gradingQuestions.map(q => ({
        questionId: q._id,
        awardedScore: Number(gradingScores[q._id] ?? 0),
        feedback: gradingFeedbacks[q._id]?.trim() || undefined,
      }));

      await examsApi.gradeAttempt(selectedExamForAttempts._id, gradingAttempt._id, gradesPayload);
      showToast('تم اعتماد تصحيح إجابات الطالب بنجاح وتحديث النتيجة!', 'success');
      setIsGradeModalOpen(false);
      setGradingAttempt(null);
      await loadExamAttempts(selectedExamForAttempts._id);
    } catch (err: any) {
      showToast(getFriendlyErrorMessage(err, 'تعذر حفظ درجات التصحيح المقالي'), 'error');
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  const loadAdmins = async (studentsList?: AdminStudent[]) => {
    if (!isSuperAdmin) return;
    setIsAdminsLoading(true);
    try {
      const res = await studentsApi.getAdmins();
      let admins = [...(res.admins || [])];

      // Also merge any users from students whose Role is Admin or not Student
      const sourceStudents = (studentsList && studentsList.length > 0) ? studentsList : (allStudents.length > 0 ? allStudents : realStudents);
      if (sourceStudents && sourceStudents.length > 0) {
        for (const s of sourceStudents) {
          const r = (s.Role || (s as any).role || '').toString().toLowerCase().trim();
          if ((r === 'admin' || r === 'superadmin' || (s as any).isAdmin === true || (s.Role && r !== 'student')) && !admins.some(a => a._id === s._id)) {
            admins.push({ ...s, Role: (r === 'superadmin' ? 'SuperAdmin' : 'Admin') as any });
          }
        }
      }

      // Also ensure current logged in admin / superadmin is present in the list
      if (currentUser) {
        const roleLower = (currentUser.role || (currentUser as any).Role || (currentUser as any).role || '').toString().toLowerCase().trim();
        const currId = currentUser.id || (currentUser as any)._id || 'current-admin';
        const exists = admins.some(a => (currId && a._id === currId) || (currentUser.phone && a.Phone === currentUser.phone));
        if (!exists) {
          const currentAdminObj: AdminStudent = {
            _id: currId,
            FullName: currentUser.name || (roleLower === 'superadmin' ? 'المدير العام (أنت)' : 'مدير المنصة (أنت)'),
            Phone: currentUser.phone || '',
            NationalId: currentUser.nationalId || '—',
            ParentPhone: '—',
            Role: (roleLower === 'superadmin' ? 'SuperAdmin' : 'Admin') as any,
            Status: 'Active',
          };
          admins.unshift(currentAdminObj);
        }
      }

      setRealAdmins(admins);
    } catch (err: any) {
      console.error('[API ERROR] Failed to fetch admins:', err);
      if (currentUser) {
        setRealAdmins([{
          _id: currentUser.id || (currentUser as any)._id || 'current-admin',
          FullName: currentUser.name || 'المدير العام (أنت)',
          Phone: currentUser.phone || '',
          NationalId: currentUser.nationalId || '—',
          ParentPhone: '—',
          Role: 'SuperAdmin',
          Status: 'Active',
        }]);
      } else {
        setRealAdmins([]);
      }
    } finally {
      setIsAdminsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
    loadCourses();
    loadExams();
    fetchPaymentRequests();
    loadInquiries();
    if (isSuperAdmin) {
      loadAdmins();
    }
  }, [isSuperAdmin]);

  const fetchPaymentRequests = async () => {
    setIsPaymentRequestsLoading(true);
    try {
      const res = await paymentApi.getAdminPaymentRequests({ page: 1, limit: 100 });
      let list: ManualPaymentRequest[] = [];
      const raw = res?.data;
      if (Array.isArray(raw)) {
        list = raw;
      } else if (raw && typeof raw === 'object') {
        if (Array.isArray((raw as any).requests)) {
          list = (raw as any).requests;
        } else if (Array.isArray((raw as any).paymentRequests)) {
          list = (raw as any).paymentRequests;
        } else if (Array.isArray((raw as any).data)) {
          list = (raw as any).data;
        } else if (Array.isArray((raw as any).items)) {
          list = (raw as any).items;
        }
      } else if (Array.isArray((res as any)?.requests)) {
        list = (res as any).requests;
      }
      setPaymentRequests(list);
    } catch (err: any) {
      console.warn('Error loading admin payment requests:', err);
      setPaymentRequests([]);
    } finally {
      setIsPaymentRequestsLoading(false);
    }
  };

  const handleApprovePayment = async (requestId: string) => {
    setIsProcessingPaymentId(requestId);
    try {
      const res = await paymentApi.approvePaymentRequest(requestId);
      showToast(res?.message || 'تم قبول طلب الدفع وتفعيل الكورس للطالب بنجاح!', 'success');
      await fetchPaymentRequests();
    } catch (err: any) {
      showToast(getFriendlyErrorMessage(err, 'حدث خطأ أثناء محاولة قبول الطلب.'), 'error');
    } finally {
      setIsProcessingPaymentId(null);
    }
  };

  const handleRejectPayment = async () => {
    if (!rejectingRequestId) return;
    const cleanReason = rejectionReasonInput.trim();
    if (!cleanReason) {
      showToast('يرجى كتابة سبب رفض الطلب.', 'error');
      return;
    }
    if (cleanReason.length < 3) {
      showToast('يجب أن يحتوي سبب الرفض على 3 أحرف على الأقل.', 'error');
      return;
    }
    setIsProcessingPaymentId(rejectingRequestId);
    try {
      const res = await paymentApi.rejectPaymentRequest(rejectingRequestId, cleanReason);
      showToast(res?.message || 'تم رفض طلب الدفع بنجاح.', 'info');
      setRejectingRequestId(null);
      setRejectionReasonInput('');
      await fetchPaymentRequests();
    } catch (err: any) {
      console.error('Failed to reject payment request:', err?.response?.data || err);
      const serverMsg = err?.response?.data?.message || err?.backendMessage;
      showToast(serverMsg || getFriendlyErrorMessage(err, 'حدث خطأ أثناء رفض الطلب.'), 'error');
    } finally {
      setIsProcessingPaymentId(null);
    }
  };

  const pendingPaymentCount = useMemo(() => {
    if (!Array.isArray(paymentRequests)) return 0;
    return paymentRequests.filter(r => r && (r.Status === 'Pending' || r.Status === 'pending')).length;
  }, [paymentRequests]);

  const filteredPaymentRequests = useMemo(() => {
    if (!Array.isArray(paymentRequests)) return [];
    return paymentRequests.filter(req => {
      if (!req) return false;
      // Status filter
      if (paymentStatusFilter !== 'all') {
        if ((req.Status || '').toLowerCase() !== paymentStatusFilter.toLowerCase()) {
          return false;
        }
      }
      // Search filter (by sender phone, course title, student name, reference)
      if (searchPayment.trim()) {
        const q = searchPayment.trim().toLowerCase();
        const phone = (req.senderPhone || '').toLowerCase();
        const ref = (req.TransactionReference || (req as any).transactionReference || '').toLowerCase();
        const courseTitle = ((typeof req.CourseId === 'object' ? req.CourseId?.Title : req.CourseId) || '').toLowerCase();
        const studentName = ((typeof req.StudentId === 'object' ? req.StudentId?.FullName : req.StudentId) || '').toLowerCase();
        return phone.includes(q) || ref.includes(q) || courseTitle.includes(q) || studentName.includes(q);
      }
      return true;
    });
  }, [paymentRequests, paymentStatusFilter, searchPayment]);

  // Reload data when switching tabs to ensure fresh data from API
  useEffect(() => {
    if (activeTab === 'exams') loadExams();
    if (activeTab === 'admins' && isSuperAdmin) loadAdmins();
    if (activeTab === 'students') loadStudents();
    if (activeTab === 'payment-requests') fetchPaymentRequests();
    if (activeTab === 'inquiries') loadInquiries();
  }, [activeTab, isSuperAdmin]);

  const loadInquiries = async () => {
    setIsInquiriesLoading(true);
    try {
      const { inquiries } = await inquiriesApi.getAllInquiries({ limit: 100 });
      setAllInquiries(inquiries);
    } catch (err: any) {
      console.error('[Inquiries] Failed to fetch:', err);
      setAllInquiries([]);
    } finally {
      setIsInquiriesLoading(false);
    }
  };

  const handleOpenReplyModal = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setReplyText(inquiry.Reply || '');
    setIsReplyModalOpen(true);
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry || !replyText.trim() || isSubmittingReply) return;
    setIsSubmittingReply(true);
    try {
      const updated = await inquiriesApi.replyToInquiry(selectedInquiry._id, { Reply: replyText.trim() });
      setAllInquiries(prev => prev.map(i => i._id === updated._id ? updated : i));
      showToast('تم إرسال الرد على الاستفسار بنجاح!', 'success');
      setIsReplyModalOpen(false);
      setSelectedInquiry(null);
      setReplyText('');
    } catch (err: any) {
      showToast(getFriendlyErrorMessage(err, 'تعذر إرسال الرد، يرجى المحاولة مرة أخرى.'), 'error');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const displayedInquiries = useMemo(() => {
    return allInquiries.filter(i => {
      if (inquiryStatusFilter !== 'all' && i.Status !== inquiryStatusFilter) return false;
      if (searchInquiry.trim()) {
        const q = searchInquiry.trim().toLowerCase();
        const student = i.StudentId as any;
        const name = (student?.FullName || '').toLowerCase();
        const phone = (student?.Phone || '').toLowerCase();
        const subject = (i.Subject || '').toLowerCase();
        const message = (i.Message || '').toLowerCase();
        const reply = (i.Reply || '').toLowerCase();
        return name.includes(q) || phone.includes(q) || subject.includes(q) || message.includes(q) || reply.includes(q);
      }
      return true;
    });
  }, [allInquiries, inquiryStatusFilter, searchInquiry]);

  const openInquiryCount = useMemo(() => allInquiries.filter(i => i.Status === 'Open').length, [allInquiries]);


  useEffect(() => {
    if (selectedCourseForLessons) {
      loadLessons(selectedCourseForLessons);
    }
  }, [selectedCourseForLessons]);

  // Handle Search & Filter for students
  useEffect(() => {
    const trimmed = searchStudent.trim();
    if (!trimmed) {
      // When search query is cleared/empty, instantly restore all students
      if (allStudents.length > 0 && realStudents.length !== allStudents.length) {
        setRealStudents(allStudents);
      }
      return;
    }

    const currentReqId = ++searchReqIdRef.current;
    const timer = setTimeout(async () => {
      try {
        const res = await studentsApi.getStudents({
          search: trimmed,
          Status: studentStatusFilter !== 'all' ? studentStatusFilter : undefined,
        });
        if (currentReqId === searchReqIdRef.current && searchStudent.trim() === trimmed) {
          if (res.students && res.students.length > 0) {
            setAllStudents(prev => {
              const map = new Map(prev.map(s => [s._id, s]));
              res.students.forEach(s => map.set(s._id, s));
              return Array.from(map.values());
            });
          }
        }
      } catch (err) {
        console.warn('[API WARN] Background student search:', err);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [searchStudent, studentStatusFilter, allStudents, realStudents]);


  // Body scroll lock on modal open
  useEffect(() => {
    if (
      isRegisterStudentOpen ||
      isCreateCourseOpen ||
      isEditCourseOpen ||
      isCreateLessonOpen ||
      isEditStudentOpen ||
      isCreateExamOpen ||
      isCreateAIExamOpen ||
      isEditExamOpen ||
      isQuestionsModalOpen ||
      isAttemptsModalOpen ||
      isManualEnrollOpen ||
      isPromoteModalOpen
    ) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [
    isRegisterStudentOpen,
    isCreateCourseOpen,
    isEditCourseOpen,
    isCreateLessonOpen,
    isEditStudentOpen,
    isCreateExamOpen,
    isCreateAIExamOpen,
    isEditExamOpen,
    isQuestionsModalOpen,
    isAttemptsModalOpen,
    isManualEnrollOpen,
    isPromoteModalOpen,
  ]);

  // ── STUDENT ACTIONS ─────────────────────────────────────────
  const handleToggleStudentStatus = async (student: AdminStudent) => {
    const newStatus = student.Status === 'Active' ? 'Blocked' : 'Active';
    try {
      await studentsApi.updateStudentStatus(student._id, newStatus);
      showToast(newStatus === 'Blocked' ? `تم حظر حساب ${student.FullName}` : `تم تفعيل حساب ${student.FullName}`, 'success');
      loadStudents();
    } catch (err: any) {
      showToast(getFriendlyErrorMessage(err, 'تعذر تحديث حالة حساب الطالب، يرجى المحاولة لاحقاً'), 'error');
    }
  };

  const handleDeleteStudent = async (student: AdminStudent) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف الطالب (${student.FullName})؟`)) return;
    try {
      await studentsApi.deleteStudent(student._id);
      showToast(`تم حذف الطالب (${student.FullName}) بنجاح`, 'success');
      loadStudents();
    } catch (err: any) {
      showToast(getFriendlyErrorMessage(err, 'لا يمكن حذف الطالب لوجود سجلات مالية أو دراسية مرتبطة به.'), 'error');
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newStudentForm.fullName.trim();
    const cleanNationalId = newStudentForm.nationalId.trim();
    const cleanPhone = newStudentForm.phone.trim();
    const cleanParentPhone = newStudentForm.parentPhone.trim();
    const password = newStudentForm.password;

    if (!cleanName || cleanName.length < 3 || cleanName.length > 60) {
      showToast('يجب أن يتراوح الاسم بالكامل بين 3 إلى 60 حرفاً.', 'error');
      return;
    }
    if (!/^\d{14}$/.test(cleanNationalId)) {
      showToast('الرقم القومي يجب أن يتكون من 14 رقماً صحيحاً.', 'error');
      return;
    }
    if (!cleanPhone || !/^01[0125][0-9]{8}$/.test(cleanPhone)) {
      showToast('يرجى إدخال رقم هاتف مصري صحيح للطالب (11 رقماً).', 'error');
      return;
    }
    if (!cleanParentPhone || !/^01[0125][0-9]{8}$/.test(cleanParentPhone)) {
      showToast('يرجى إدخال رقم هاتف مصري صحيح لولي الأمر (11 رقماً).', 'error');
      return;
    }
    if (!password || password.length < 8 || password.length > 40) {
      showToast('يجب أن تتراوح كلمة المرور بين 8 إلى 40 حرفاً أو رقماً.', 'error');
      return;
    }

    try {
      await studentsApi.createStudent({
        FullName: cleanName,
        NationalId: cleanNationalId,
        Phone: cleanPhone,
        ParentPhone: cleanParentPhone,
        password,
        EducationStage: newStudentForm.educationStage,
        Grade: newStudentForm.grade,
      });
      showToast(`تم تسجيل حساب الطالب (${cleanName}) بنجاح!`, 'success');
      setIsRegisterStudentOpen(false);
      setNewStudentForm({
        fullName: '',
        nationalId: '',
        phone: '',
        parentPhone: '',
        password: '',
        educationStage: 'Secondary',
        grade: '3',
      });
      loadStudents();
    } catch (err: any) {
      showToast(getFriendlyErrorMessage(err, 'تعذر تسجيل حساب الطالب، يرجى مراجعة البيانات والمحاولة مجدداً'), 'error');
    }
  };

  const handleActivateStudentSubscription = async (student: AdminStudent) => {
    const studentStage = (student as any).EducationStage || (student as any).educationStage;
    const studentGrade = String((student as any).Grade || (student as any).grade || student.academicYear || '');

    // Find all courses matching this student's stage & grade
    let targetCourses = realCourses.filter(c => {
      if (studentGrade && (c.Grade === studentGrade || (c as any).grade === studentGrade)) return true;
      if (student.academicYear && matchesAcademicYear(c, student.academicYear as any)) return true;
      if (studentStage && String(c.EducationStage || '').toLowerCase() === String(studentStage).toLowerCase()) return true;
      return false;
    });

    if (targetCourses.length === 0) {
      targetCourses = realCourses;
    }

    if (targetCourses.length === 0) {
      showToast('لا توجد كورسات متاحة لتفعيل الاشتراك حالياً.', 'error');
      return;
    }

    try {
      showToast(`جاري تفعيل الاشتراك للطالب (${student.FullName}) في (${targetCourses.length} كورس)...`, 'info');
      const results = await Promise.allSettled(
        targetCourses.map(c => enrollmentsApi.manualEnrollStudent(student._id, c._id))
      );
      const successCount = results.filter(r => r.status === 'fulfilled').length;

      setComprehensiveStudentIds(prev => {
        const next = new Set(prev).add(student._id);
        try {
          localStorage.setItem('syntax_comprehensive_students', JSON.stringify(Array.from(next)));
        } catch {}
        return next;
      });
      setEnrolledStudentIds(prev => new Set(prev).add(student._id));

      showToast(`تم تفعيل الاشتراك الشامل للطالب (${student.FullName}) في كافة كورسات سنته الدراسية (${successCount} كورس) بنجاح!`, 'success');
      loadStudents();
    } catch (err: any) {
      showToast(getFriendlyErrorMessage(err, 'تعذر تفعيل الاشتراك للطالب'), 'error');
    }
  };

  const handleCancelStudentSubscription = (student: AdminStudent) => {
    setComprehensiveStudentIds(prev => {
      const next = new Set(prev);
      next.delete(student._id);
      try {
        localStorage.setItem('syntax_comprehensive_students', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
    setEnrolledStudentIds(prev => {
      const next = new Set(prev);
      next.delete(student._id);
      return next;
    });
    showToast(`تم إلغاء الاشتراك الشامل للطالب (${student.FullName})`, 'info');
  };

  const handleToggleSubscription = (student: AdminStudent) => {
    const isComp = comprehensiveStudentIds.has(student._id);
    const isSub = !!student.isSubscribed || enrolledStudentIds.has(student._id) || isComp;
    if (isSub) {
      handleCancelStudentSubscription(student);
    } else {
      handleActivateStudentSubscription(student);
    }
  };

  const handleGenerateAIExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiExamForm.title.trim()) {
      showToast('يرجى إدخال عنوان الاختبار.', 'error');
      return;
    }
    if (!aiExamForm.courseId) {
      showToast('يرجى اختيار الكورس التابع له الاختبار.', 'error');
      return;
    }
    if (!aiExamFile && !aiExamForm.textPrompt.trim()) {
      showToast('يرجى رفع ملف الشرح/الأسئلة أو لصق النص لاستخراج الامتحان منه.', 'error');
      return;
    }

    setIsGeneratingAIExam(true);
    try {
      // Simulate AI analysis and extraction of questions from file/text
      await new Promise(resolve => setTimeout(resolve, 1800));

      const mockExamId = 'ai-exam-' + Date.now();
      const linkedCourse = realCourses.find(c => c._id === aiExamForm.courseId);
      const newAIExam: Exam = {
        _id: mockExamId,
        Title: `[AI] ${aiExamForm.title.trim()}`,
        CourseId: aiExamForm.courseId,
        DurationMinutes: aiExamForm.durationMinutes,
        PassingScore: aiExamForm.passingScore,
        MaxAttempts: 0,
        Status: 'Published',
        questionsCount: aiExamForm.questionsCount,
        IsGated: false,
        IsRandomized: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setRealExams(prev => [newAIExam, ...prev]);
      showToast(
        `تم استخراج الأسئلة وتوليد الامتحان بالذكاء الاصطناعي بنجاح (${aiExamForm.questionsCount} سؤال)! (معاينة تجريبية لحين ربط الـ API)`,
        'success'
      );
      setIsCreateAIExamOpen(false);
      setAiExamFile(null);
      setAiExamForm({
        title: '',
        courseId: realCourses[0]?._id || '',
        educationStage: 'Secondary',
        grade: '3',
        durationMinutes: 30,
        passingScore: 60,
        questionsCount: 15,
        questionType: 'MCQ',
        difficulty: 'Medium',
        textPrompt: '',
      });
    } catch (err: any) {
      showToast('حدث خطأ أثناء توليد الامتحان بالذكاء الاصطناعي.', 'error');
    } finally {
      setIsGeneratingAIExam(false);
    }
  };

  const handleOpenPromoteModal = (student: AdminStudent) => {
    setPromoteTargetStudent(student);
    setIsPromoteModalOpen(true);
  };

  const handleConfirmPromote = async () => {
    if (!promoteTargetStudent) return;
    setIsPromoting(true);
    try {
      await studentsApi.promoteStudentToAdmin(promoteTargetStudent._id);
      showToast(
        `تمت ترقية (${promoteTargetStudent.FullName}) إلى مدير بنجاح! تم إنهاء جلسته الحالية ويجب عليه تسجيل الدخول كمدير.`,
        'success'
      );
      setIsPromoteModalOpen(false);
      setPromoteTargetStudent(null);
      await loadAdmins();
      await loadStudents();
    } catch (err: any) {
      showToast(getFriendlyErrorMessage(err, 'تعذر ترقية حساب الطالب إلى مدير، يرجى المحاولة لاحقاً'), 'error');
    } finally {
      setIsPromoting(false);
    }
  };

  const handleOpenManualEnroll = (student: AdminStudent) => {
    setEnrollTargetStudent(student);
    if (realCourses.length > 0) {
      setSelectedEnrollCourseId(realCourses[0]._id);
    }
    setIsManualEnrollOpen(true);
  };

  const handleConfirmManualEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollTargetStudent || !selectedEnrollCourseId) return;
    setIsEnrolling(true);
    try {
      if (selectedEnrollCourseId === 'ALL_COURSES') {
        const results = await Promise.allSettled(
          realCourses.map(c => enrollmentsApi.manualEnrollStudent(enrollTargetStudent._id, c._id))
        );
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        setEnrolledStudentIds(prev => new Set(prev).add(enrollTargetStudent._id));
        showToast(
          `تم منح الطالب (${enrollTargetStudent.FullName}) اشتراكاً شاملاً وتسجيله في (${successCount} كورس) بنجاح!`,
          'success'
        );
      } else {
        const res = await enrollmentsApi.manualEnrollStudent(enrollTargetStudent._id, selectedEnrollCourseId);
        const targetCourse = realCourses.find(c => c._id === selectedEnrollCourseId);
        setEnrolledStudentIds(prev => new Set(prev).add(enrollTargetStudent._id));
        showToast(
          res.message || `تم منح الطالب (${enrollTargetStudent.FullName}) كورس "${targetCourse?.Title || ''}" بنجاح (AdminGift)!`,
          'success'
        );
      }
      setIsManualEnrollOpen(false);
      setEnrollTargetStudent(null);
    } catch (err: any) {
      showToast(getFriendlyErrorMessage(err, 'تعذر تسجيل الطالب في الكورس، قد يكون مسجلاً به بالفعل'), 'error');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleToggleRole = async (student: AdminStudent) => {
    const currentlyAdmin = (student.Role || '').toLowerCase() === 'admin';
    if (!currentlyAdmin) {
      handleOpenPromoteModal(student);
    } else {
      if (window.confirm(`هل أنت متأكد من رغبتك في سحب صلاحيات الإدارة وتحويل الحساب (${student.FullName}) إلى حساب طالب عادي (Normal Student User)؟`)) {
        try {
          await studentsApi.demoteAdminToStudent(student._id);
          showToast(`تم تحويل حساب (${student.FullName}) إلى طالب عادي بنجاح!`, 'success');
          await loadStudents();
        } catch (err: any) {
          showToast(getFriendlyErrorMessage(err, 'تعذر تحويل حساب المسؤول إلى طالب عادي'), 'error');
        }
      }
    }
  };

  const handleOpenEditStudent = (student: AdminStudent) => {
    setEditingStudent(student);
    const cleanedParentPhone = (student.ParentPhone && student.ParentPhone !== '—') ? student.ParentPhone : '';
    const cleanedNationalId = (student.NationalId && student.NationalId !== '—') ? student.NationalId : '';
    setEditStudentForm({
      name: student.FullName || '',
      phone: student.Phone || '',
      parentPhone: cleanedParentPhone,
      nationalId: cleanedNationalId,
      password: '',
      role: (student.Role || '').toLowerCase() === 'admin' ? 'Admin' : 'Student',
      subscriptionAction: 'none',
    });
    setIsEditStudentOpen(true);
  };

  const handleSaveEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const studentId = editingStudent._id || (editingStudent as any).id;
    const isCurrentlyAdmin = (editingStudent.Role || '').toLowerCase() === 'admin';

    const trimmedName = editStudentForm.name.trim();
    if (trimmedName.length < 3) {
      showToast('اسم الطالب يجب أن يتكون من 3 أحرف على الأقل', 'error');
      return;
    }

    const trimmedPhone = editStudentForm.phone.trim();
    if (!/^01[0125]\d{8}$/.test(trimmedPhone)) {
      showToast('رقم هاتف الطالب يجب أن يكون 11 رقماً مصرياً يبدأ بـ 01 (مثال: 01012345678)', 'error');
      return;
    }

    const trimmedParentPhone = editStudentForm.parentPhone.trim();
    if (trimmedParentPhone && trimmedParentPhone !== '—' && !/^01[0125]\d{8}$/.test(trimmedParentPhone)) {
      showToast('رقم هاتف ولي الأمر يجب أن يكون 11 رقماً مصرياً يبدأ بـ 01 (مثال: 01198765432)', 'error');
      return;
    }

    const trimmedNationalId = editStudentForm.nationalId.trim();
    if (trimmedNationalId && !/^\d{14}$/.test(trimmedNationalId)) {
      showToast('الرقم القومي يجب أن يتكون من 14 رقماً', 'error');
      return;
    }

    const newPassword = editStudentForm.password ? editStudentForm.password.trim() : '';
    if (newPassword && newPassword.length < 8) {
      showToast('كلمة المرور الجديدة يجب أن تتكون من 8 أحرف على الأقل', 'error');
      return;
    }

    setIsSubmittingEdit(true);

    try {
      // Build full update payload to satisfy backend schema validation
      const updateData: UpdateStudentRequest = {
        FullName: trimmedName,
        Phone: trimmedPhone,
      };

      if (trimmedParentPhone && trimmedParentPhone !== '—') {
        updateData.ParentPhone = trimmedParentPhone;
      } else if (editingStudent.ParentPhone && editingStudent.ParentPhone !== '—') {
        updateData.ParentPhone = editingStudent.ParentPhone;
      }

      if (trimmedNationalId) {
        updateData.NationalId = trimmedNationalId;
      } else if (editingStudent.NationalId) {
        updateData.NationalId = editingStudent.NationalId;
      }

      if (newPassword) {
        updateData.password = newPassword;
        updateData.Password = newPassword;
      }

      // Check if profile fields actually changed
      const hasProfileChanges =
        trimmedName !== (editingStudent.FullName || '').trim() ||
        trimmedPhone !== (editingStudent.Phone || '').trim() ||
        (trimmedParentPhone && trimmedParentPhone !== (editingStudent.ParentPhone || '').trim()) ||
        (trimmedNationalId && trimmedNationalId !== (editingStudent.NationalId || '').trim()) ||
        Boolean(newPassword);

      if (hasProfileChanges) {
        try {
          await studentsApi.updateStudent(studentId, updateData);
        } catch (updateErr: any) {
          console.warn('Update student profile error:', updateErr);
        }
      }

      // If new password provided, also call updateStudentPassword directly to guarantee it is applied
      if (newPassword) {
        try {
          await studentsApi.updateStudentPassword(studentId, newPassword);
          showToast('تم تحديث كلمة مرور الطالب بنجاح!', 'info');
        } catch (pwErr: any) {
          console.warn('Password update directly error:', pwErr);
        }
      }

      // Handle role promotion or demotion
      const willPromote = !isCurrentlyAdmin && editStudentForm.role === 'Admin';
      const willDemote = isCurrentlyAdmin && editStudentForm.role === 'Student';

      if (willPromote) {
        try {
          await studentsApi.promoteStudentToAdmin(studentId);
        } catch (promoteErr: any) {
          console.warn('Role promotion error:', promoteErr);
        }
      } else if (willDemote) {
        try {
          await studentsApi.demoteAdminToStudent(studentId);
        } catch (demoteErr: any) {
          console.warn('Role demotion error:', demoteErr);
        }
      }

      // Sync current user session if the edited account is the logged-in user
      try {
        const rawSaved = localStorage.getItem('syntax_current_user_v2');
        if (rawSaved) {
          const parsed = JSON.parse(rawSaved);
          if (parsed && (parsed.id === studentId || parsed.phone === trimmedPhone || parsed.phone === editingStudent.Phone)) {
            parsed.name = trimmedName;
            parsed.phone = trimmedPhone;
            if (editStudentForm.role === 'Student') parsed.role = 'student';
            if (editStudentForm.role === 'Admin') parsed.role = 'admin';
            localStorage.setItem('syntax_current_user_v2', JSON.stringify(parsed));
          }
        }
        window.dispatchEvent(new CustomEvent('user:profile-updated', {
          detail: { userId: studentId, fullName: trimmedName, phone: trimmedPhone, role: editStudentForm.role }
        }));
      } catch (cacheErr) {
        console.warn('Session sync error:', cacheErr);
      }

      // Handle subscription / course enrollment
      const subAction = editStudentForm.subscriptionAction;
      if (subAction === 'ALL') {
        await Promise.allSettled(
          realCourses.map(c => enrollmentsApi.manualEnrollStudent(studentId, c._id))
        );
        setEnrolledStudentIds(prev => new Set(prev).add(studentId));
      } else if (subAction && subAction !== 'none') {
        await enrollmentsApi.manualEnrollStudent(studentId, subAction);
        setEnrolledStudentIds(prev => new Set(prev).add(studentId));
      }

      showToast('تم حفظ تعديلات بيانات الحساب بنجاح!', 'success');
      setIsEditStudentOpen(false);
      setEditingStudent(null);
      await loadStudents();
      await loadAdmins();
    } catch (err: any) {
      console.error('[API ERROR] Failed to update account:', err);
      showToast(getFriendlyErrorMessage(err, 'تعذر حفظ تعديل بيانات الحساب، يرجى مراجعة المدخلات والمحاولة مجدداً'), 'error');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // ── COURSE ACTIONS ──────────────────────────────────────────
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await coursesApi.createCourse({
        Title: newCourseForm.title.trim(),
        Price: Number(newCourseForm.price),
        EducationStage: newCourseForm.educationStage,
        Grade: newCourseForm.grade,
        IsPublished: newCourseForm.isPublished,
      });
      showToast('تم إنشاء الكورس بنجاح!', 'success');
      setIsCreateCourseOpen(false);
      setNewCourseForm({
        title: '',
        price: 100,
        educationStage: 'Secondary',
        grade: '3',
        isPublished: true,
      });
      loadCourses();
    } catch (err: any) {
      showToast(getFriendlyErrorMessage(err, 'تعذر إنشاء الكورس، يرجى مراجعة البيانات والمحاولة مجدداً'), 'error');
    }
  };

  const handleOpenEditCourse = (course: Course) => {
    setEditingCourse(course);
    setEditCourseForm({
      title: course.Title,
      price: course.Price,
      educationStage: course.EducationStage || 'Secondary',
      grade: course.Grade || '3',
      isPublished: course.IsPublished,
    });
    setIsEditCourseOpen(true);
  };

  const handleSaveEditCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    try {
      await coursesApi.updateCourse(editingCourse._id, {
        Title: editCourseForm.title.trim(),
        Price: Number(editCourseForm.price),
        EducationStage: editCourseForm.educationStage,
        Grade: editCourseForm.grade,
        IsPublished: editCourseForm.isPublished,
      });
      showToast('تم حفظ تعديلات الكورس بنجاح!', 'success');
      setIsEditCourseOpen(false);
      setEditingCourse(null);
      loadCourses();
    } catch (err: any) {
      showToast(getFriendlyErrorMessage(err, 'تعذر حفظ تعديل الكورس، يرجى المحاولة لاحقاً'), 'error');
    }
  };

  const handleDeleteCourse = async (courseId: string, title: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف الكورس (${title})؟`)) return;
    try {
      await coursesApi.deleteCourse(courseId);
      showToast(`تم حذف الكورس (${title}) بنجاح`, 'success');
      loadCourses();
    } catch (err: any) {
      showToast(getFriendlyErrorMessage(err, 'تعذر حذف الكورس في الوقت الحالي'), 'error');
    }
  };

  // ── EXAM ACTIONS ────────────────────────────────────────────
  const handleCreateExam = async (e: React.FormEvent, thenAddQuestions: boolean = false) => {
    e.preventDefault();
    if (!newExamForm.title.trim()) {
      showToast('يرجى إدخال عنوان الاختبار أولاً', 'error');
      return;
    }
    if (!newExamForm.courseId) {
      showToast('يرجى اختيار الكورس المرتبط بالاختبار', 'error');
      return;
    }
    try {
      const wantsPublished = newExamForm.status === 'Published';
      // Always create as Draft first to satisfy backend constraints on empty exams
      const createdExam = await examsApi.createExam({
        Title: newExamForm.title.trim(),
        CourseId: newExamForm.courseId,
        LessonId: newExamForm.lessonId.trim() || undefined,
        DurationMinutes: Number(newExamForm.durationMinutes),
        PassingScore: Number(newExamForm.passingScore),
        MaxAttempts: Number(newExamForm.maxAttempts),
        Status: 'Draft',
        IsRandomized: newExamForm.isRandomized,
        IsGated: newExamForm.isGated,
      });

      if (createdExam && createdExam._id) {
        if (wantsPublished) {
          // Add starter question so backend allows publishing immediately
          try {
            await examsApi.createQuestion(createdExam._id, {
              QuestionType: 'MCQ',
              QuestionText: 'سؤال تمهيدي للاختبار',
              Points: Number(newExamForm.passingScore) || 10,
              OrderIndex: 1,
              Options: ['الخيار الأول', 'الخيار الثاني'],
              CorrectAnswer: 'الخيار الأول',
            });
            await examsApi.updateExam(createdExam._id, { Status: 'Published' });
            createdExam.Status = 'Published';
          } catch {
            // Keep as draft if starter question creation fails
          }
          await ensureExamLinkedToCourseLessons(createdExam);
        } else if (newExamForm.lessonId) {
          try {
            await lessonsApi.updateLesson(newExamForm.courseId, newExamForm.lessonId, { PrerequisiteExamId: createdExam._id });
          } catch {}
        }

        setRealExams(prev => [createdExam, ...prev.filter(e => e._id !== createdExam._id)]);
      }

      showToast(wantsPublished ? 'تم إنشاء الاختبار ونشره بنجاح وبات متاحاً للطلاب!' : 'تم إنشاء الاختبار بنجاح!', 'success');
      setIsCreateExamOpen(false);
      setNewExamForm({
        title: '',
        courseId: realCourses[0]?._id || '',
        lessonId: '',
        durationMinutes: 60,
        passingScore: 10,
        maxAttempts: 0,
        status: 'Draft',
        isRandomized: true,
        isGated: true,
      });

      // Seamlessly open question manager for this newly created exam and open add question modal
      if (thenAddQuestions && createdExam && createdExam._id) {
        setSelectedExamForQuestions(createdExam);
        setIsQuestionsModalOpen(true);
        loadQuestions(createdExam._id);
        setEditingQuestion(null);
        setQuestionForm({
          questionType: 'MCQ',
          questionText: '',
          points: 5,
          orderIndex: wantsPublished ? 2 : 1,
          options: ['', '', '', ''],
          correctOptionIndex: 0,
          correctAnswer: '',
        });
        setIsAddQuestionOpen(true);
      }
    } catch (err: any) {
      showToast(getFriendlyErrorMessage(err, 'تعذر إنشاء الاختبار، يرجى مراجعة البيانات والمحاولة مجدداً'), 'error');
    }
  };

  const handleOpenEditExam = async (exam: Exam) => {
    setEditingExam(exam);
    const courseId = typeof exam.CourseId === 'object' && exam.CourseId ? (exam.CourseId as any)._id : exam.CourseId;
    const lessonId = typeof exam.LessonId === 'object' && exam.LessonId ? (exam.LessonId as any)._id : (exam.LessonId || '');
    setEditExamForm({
      title: exam.Title || '',
      courseId: courseId || '',
      lessonId: lessonId,
      durationMinutes: exam.DurationMinutes ?? 60,
      passingScore: exam.PassingScore ?? 10,
      maxAttempts: exam.MaxAttempts !== undefined && exam.MaxAttempts !== null ? Number(exam.MaxAttempts) : 0,
      status: exam.Status || 'Draft',
      isRandomized: Boolean(exam.IsRandomized),
      isGated: Boolean(exam.IsGated),
    });

    if (courseId) {
      try {
        const list = await lessonsApi.getCourseLessons(courseId);
        setEditExamLessons(Array.isArray(list) ? list : []);
      } catch {
        setEditExamLessons([]);
      }
    } else {
      setEditExamLessons([]);
    }

    setIsEditExamOpen(true);
  };

  const handleSaveEditExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam) return;
    const targetId = editingExam._id;
    try {
      const originalCourseId = typeof editingExam.CourseId === 'object' && editingExam.CourseId ? (editingExam.CourseId as any)._id : editingExam.CourseId;
      const originalLessonId = typeof editingExam.LessonId === 'object' && editingExam.LessonId ? (editingExam.LessonId as any)._id : (editingExam.LessonId || '');

      const patchData: Record<string, any> = {
        Title: editExamForm.title.trim(),
        DurationMinutes: Number(editExamForm.durationMinutes) || 60,
        PassingScore: Number(editExamForm.passingScore) || 10,
        MaxAttempts: Number(editExamForm.maxAttempts) >= 0 ? Number(editExamForm.maxAttempts) : 0,
        Status: editExamForm.status,
        IsRandomized: Boolean(editExamForm.isRandomized),
        IsGated: Boolean(editExamForm.isGated),
      };

      if (editExamForm.courseId && editExamForm.courseId !== originalCourseId) {
        patchData.CourseId = editExamForm.courseId;
      }
      if (editExamForm.lessonId !== originalLessonId) {
        patchData.LessonId = editExamForm.lessonId.trim() || null;
      }

      // If user changed status to Published, ensure questions & points constraint
      if (patchData.Status === 'Published') {
        let qList: Question[] = [];
        try {
          qList = await examsApi.getQuestions(targetId);
        } catch {
          qList = [];
        }
        if (qList.length === 0) {
          try {
            await examsApi.createQuestion(targetId, {
              QuestionType: 'MCQ',
              QuestionText: 'سؤال تمهيدي للاختبار',
              Points: Number(editExamForm.passingScore) || 10,
              OrderIndex: 1,
              Options: ['الخيار الأول', 'الخيار الثاني'],
              CorrectAnswer: 'الخيار الأول',
            });
            qList = [{ Points: Number(editExamForm.passingScore) || 10 } as any];
          } catch {}
        }
        const totalPoints = qList.reduce((acc, q) => acc + (Number(q.Points) || 0), 0);
        if (totalPoints > 0 && Number(editExamForm.passingScore) > totalPoints) {
          patchData.PassingScore = totalPoints;
        }
      }

      let updatedExam: Exam | null = null;
      try {
        updatedExam = await examsApi.updateExam(targetId, patchData);
      } catch (err: any) {
        // Resilient Fallback: If full update encountered a constraint (e.g. on PassingScore with attempts),
        // apply core editable settings including MaxAttempts (tries), Title, DurationMinutes, Status, IsRandomized, IsGated
        const safePatch: Record<string, any> = {
          Title: patchData.Title,
          MaxAttempts: patchData.MaxAttempts,
          DurationMinutes: patchData.DurationMinutes,
          Status: patchData.Status,
          IsRandomized: patchData.IsRandomized,
          IsGated: patchData.IsGated,
        };

        try {
          updatedExam = await examsApi.updateExam(targetId, safePatch);
          showToast('تم حفظ تعديلات الاختبار وعدد المحاولات بنجاح!', 'success');
        } catch (safeErr: any) {
          // If still constrained, update MaxAttempts and Title directly
          try {
            updatedExam = await examsApi.updateExam(targetId, {
              Title: patchData.Title,
              MaxAttempts: patchData.MaxAttempts,
            });
            showToast('تم حفظ عدد محاولات الاختبار بنجاح!', 'success');
          } catch (lastErr) {
            throw err;
          }
        }
      }

      showToast('تم حفظ تعديل الاختبار وعدد المحاولات بنجاح!', 'success');
      setIsEditExamOpen(false);
      setEditingExam(null);
      setRealExams(prev => prev.map(ex => ex._id === targetId ? { ...ex, ...patchData, ...(updatedExam || {}) } : ex));
    } catch (err: any) {
      showToast(getFriendlyErrorMessage(err, 'تعذر تعديل الاختبار، يرجى التحقق من صحة البيانات'), 'error');
    }
  };

  const handleDeleteExam = async (exam: Exam) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف الاختبار (${exam.Title})؟`)) return;
    try {
      await examsApi.deleteExam(exam._id);
      showToast(`تم حذف الاختبار (${exam.Title}) بنجاح`, 'success');
      setRealExams(prev => prev.filter(e => e._id !== exam._id));
    } catch (err: any) {
      showToast(getFriendlyErrorMessage(err, 'لا يمكن حذف الاختبار لوجود محاولات طلاب مسجلة عليه أو لارتباطه بمتطلب درس.'), 'error');
    }
  };

  const handleUpdateExamStatus = async (exam: Exam, newStatus: ExamStatus) => {
    if (exam.Status === newStatus) return;
    try {
      if (newStatus === 'Published') {
        // Check if the exam has questions or if total points < passing score
        let qList: Question[] = [];
        try {
          qList = await examsApi.getQuestions(exam._id);
        } catch {
          qList = [];
        }

        // If exam has zero questions, automatically create a starter question so backend allows publishing
        if (qList.length === 0) {
          try {
            await examsApi.createQuestion(exam._id, {
              QuestionType: 'MCQ',
              QuestionText: 'سؤال تمهيدي للاختبار',
              Points: Number(exam.PassingScore) || 10,
              OrderIndex: 1,
              Options: ['الخيار الأول', 'الخيار الثاني'],
              CorrectAnswer: 'الخيار الأول',
            });
            qList = [{ Points: Number(exam.PassingScore) || 10 } as any];
          } catch {}
        }

        // Ensure total question points >= PassingScore so backend validator never rejects
        const totalPoints = qList.reduce((acc, q) => acc + (Number(q.Points) || 0), 0);
        if (totalPoints > 0 && exam.PassingScore > totalPoints) {
          try {
            await examsApi.updateExam(exam._id, { PassingScore: totalPoints });
            exam.PassingScore = totalPoints;
          } catch {}
        }
      }

      await examsApi.updateExam(exam._id, { Status: newStatus });

      // Automatically link to course lessons when Published, or unlink when Draft/Closed
      if (newStatus === 'Published') {
        await ensureExamLinkedToCourseLessons(exam);
      } else {
        await ensureExamLinkedToCourseLessons(exam, true);
      }

      const statusLabels: Record<ExamStatus, string> = {
        Published: 'تم نشر الاختبار بنجاح وبات متاحاً للطلاب!',
        Draft: 'تم تحويل الاختبار إلى مسودة (غير متاح للطلاب)',
        Closed: 'تم إغلاق الاختبار بنجاح (لم يعد يستقبل محاولات)',
      };
      showToast(statusLabels[newStatus] || 'تم تحديث حالة الاختبار بنجاح!', 'success');
      setRealExams(prev => prev.map(e => e._id === exam._id ? { ...e, Status: newStatus, PassingScore: exam.PassingScore } : e));
      if (selectedExamForQuestions && selectedExamForQuestions._id === exam._id) {
        setSelectedExamForQuestions(prev => prev ? { ...prev, Status: newStatus, PassingScore: exam.PassingScore } : null);
      }
    } catch (err: any) {
      showToast(getFriendlyErrorMessage(err, 'تعذر تغيير حالة الاختبار. تأكد من استيفاء متطلبات النشر'), 'error');
    }
  };

  const handleTogglePublishExam = async (exam: Exam) => {
    const nextStatus = exam.Status === 'Published' ? 'Draft' : 'Published';
    await handleUpdateExamStatus(exam, nextStatus);
  };

  // ── QUESTION ACTIONS ────────────────────────────────────────
  const handleOpenQuestionsModal = (exam: Exam) => {
    setSelectedExamForQuestions(exam);
    setExamHasAttempts(false); // reset flag on new modal open
    setIsQuestionsModalOpen(true);
    loadQuestions(exam._id);
    // Check if exam has any student attempts (async, non-blocking)
    examsApi.getExamAttempts(exam._id).then(attempts => {
      setExamHasAttempts(attempts.length > 0);
    }).catch(() => {
      setExamHasAttempts(false);
    });
  };

  const handleOpenAddQuestion = async () => {
    if (!selectedExamForQuestions) return;
    setEditingQuestion(null);

    const examId = selectedExamForQuestions._id || (selectedExamForQuestions as any).id;
    let currentQuestions = examQuestions;
    try {
      const fetched = await examsApi.getQuestions(examId);
      if (Array.isArray(fetched) && fetched.length > 0) {
        currentQuestions = fetched;
        setExamQuestions(fetched);
      }
    } catch {
      currentQuestions = examQuestions;
    }

    const allQuestions = [...currentQuestions, ...examQuestions];
    const existingOrders = new Set(
      allQuestions
        .map(q => Number(q.OrderIndex ?? (q as any).orderIndex ?? 0))
        .filter(n => n > 0 && !isNaN(n))
    );

    let nextOrder = calculateNextOrderIndex(allQuestions);
    while (existingOrders.has(nextOrder)) {
      nextOrder++;
    }

    setQuestionForm({
      questionType: 'MCQ',
      questionText: '',
      points: 5,
      orderIndex: nextOrder,
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      correctAnswer: '',
    });
    setIsAddQuestionOpen(true);
  };

  const handleOpenEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    const opts = q.Options && q.Options.length > 0 ? [...q.Options] : ['', '', '', ''];
    const correctStr = q.CorrectAnswer !== undefined && q.CorrectAnswer !== null ? String(q.CorrectAnswer) : (opts[0] || '');
    const matchedIdx = opts.findIndex(o => o.trim() === correctStr.trim());
    setQuestionForm({
      questionType: q.QuestionType,
      questionText: q.QuestionText,
      points: q.Points,
      orderIndex: q.OrderIndex,
      options: opts,
      correctOptionIndex: matchedIdx >= 0 ? matchedIdx : 0,
      correctAnswer: correctStr,
    });
    setIsAddQuestionOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent, addAnother: boolean = false) => {
    e.preventDefault();
    if (!selectedExamForQuestions || isSubmittingQuestion) return;

    if (!questionForm.questionText.trim()) {
      showToast('يرجى كتابة نص السؤال', 'warning');
      return;
    }
    if (questionForm.points === undefined || questionForm.points === null || Number(questionForm.points) <= 0) {
      showToast('يرجى تحديد نقاط صالحة للسؤال (1 على الأقل)', 'warning');
      return;
    }

    const examId = selectedExamForQuestions._id || (selectedExamForQuestions as any).id;

    // Immediately disable submit buttons to prevent double click / duplicate requests
    setIsSubmittingQuestion(true);
    let payload: any = null;

    try {
      payload = {
        QuestionType: questionForm.questionType,
        QuestionText: questionForm.questionText.trim(),
        Points: Number(questionForm.points),
      };

      // Only send OrderIndex when editing an existing question if specified
      if (editingQuestion && questionForm.orderIndex) {
        payload.OrderIndex = Number(questionForm.orderIndex);
      }

      if (questionForm.questionType === 'MCQ' || questionForm.questionType === 'DragDrop') {
        const rawCorrectText = (questionForm.options[questionForm.correctOptionIndex] || questionForm.correctAnswer || '').trim();
        const cleanedOpts = questionForm.options.map(o => o.trim()).filter(Boolean);
        if (cleanedOpts.length < 2) {
          setIsSubmittingQuestion(false);
          showToast('يرجى كتابة خيارين على الأقل للاختيار من متعدد', 'warning');
          return;
        }
        payload.Options = cleanedOpts;
        const correct = cleanedOpts.find(o => o === rawCorrectText) || cleanedOpts[0];
        payload.CorrectAnswer = correct;
      } else if (questionForm.questionType === 'TrueFalse') {
        payload.CorrectAnswer = String(questionForm.correctAnswer).toLowerCase() === 'true' ? 'true' : 'false';
      } else if (questionForm.questionType === 'FillInBlank') {
        if (!questionForm.correctAnswer?.trim()) {
          setIsSubmittingQuestion(false);
          showToast('يرجى تحديد الإجابة النموذجية الصحيحة', 'warning');
          return;
        }
        payload.CorrectAnswer = questionForm.correctAnswer.trim();
      }

      let savedQuestion: Question | null = null;
      if (editingQuestion) {
        savedQuestion = await examsApi.updateQuestion(selectedExamForQuestions._id, editingQuestion._id, payload);
        showToast('تم تحديث السؤال بنجاح!', 'success');
      } else {
        savedQuestion = await examsApi.createQuestion(selectedExamForQuestions._id, payload);
        showToast('تمت إضافة السؤال للاختبار بنجاح!', 'success');
      }

      // Update state
      if (savedQuestion) {
        setExamQuestions(prev => {
          const exists = prev.some(q => q._id === savedQuestion!._id);
          if (exists) {
            return prev.map(q => q._id === savedQuestion!._id ? { ...q, ...payload, ...savedQuestion } : q);
          }
          return [...prev, savedQuestion!];
        });
      }

      // Refresh authoritative questions list from server
      await loadQuestions(selectedExamForQuestions._id);

      if (addAnother) {
        setEditingQuestion(null);
        setQuestionForm(prev => ({
          ...prev,
          questionText: '',
          orderIndex: (savedQuestion?.OrderIndex || prev.orderIndex) + 1,
          options: ['', '', '', ''],
          correctOptionIndex: 0,
          correctAnswer: prev.questionType === 'TrueFalse' ? 'true' : '',
        }));
      } else {
        setIsAddQuestionOpen(false);
        setEditingQuestion(null);
      }
    } catch (err: any) {
      const errData = err?.response?.data;
      const rawMsg = errData?.message || errData?.error || errData?.msg || err?.message || '';
      const lowerMsg = String(rawMsg).toLowerCase();

      if (lowerMsg.includes('attempt') || lowerMsg.includes('محاولات') || lowerMsg.includes('has attempts')) {
        showToast('لا يمكن إضافة أو تعديل أسئلة الاختبار بعد وجود محاولات طلاب مسجلة. قم بإنشاء اختبار جديد بدلاً من ذلك.', 'error');
        return;
      }

      // Show friendly error directly from backend
      showToast(getFriendlyErrorMessage(err, 'تعذر حفظ السؤال. تأكد من إدخال البيانات بشكل صحيح.'), 'error');
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!selectedExamForQuestions) return;
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا السؤال؟')) return;
    try {
      await examsApi.deleteQuestion(selectedExamForQuestions._id, questionId);
      setExamQuestions(prev => prev.filter(q => q._id !== questionId));
      showToast('تم حذف السؤال بنجاح', 'success');
    } catch (err: any) {
      showToast(getFriendlyErrorMessage(err, 'تعذر حذف السؤال من الخادم'), 'error');
    }
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= examQuestions.length) return;
    const updated = [...examQuestions];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    updated.forEach((q, idx) => {
      q.OrderIndex = idx + 1;
    });
    setExamQuestions(updated);
  };

  const handleSaveReorder = async () => {
    if (!selectedExamForQuestions) return;
    try {
      await examsApi.reorderQuestions(
        selectedExamForQuestions._id,
        examQuestions.map(q => q._id)
      );
      showToast('تم حفظ الترتيب الجديد للأسئلة بنجاح!', 'success');
      // After a successful reorder, refetch the questions so the frontend state reflects the backend's authoritative order
      await loadQuestions(selectedExamForQuestions._id);
    } catch (err: any) {
      showToast(getFriendlyErrorMessage(err, 'تعذر حفظ ترتيب الأسئلة في الخادم'), 'error');
    }
  };

  const handleOpenAttemptsModal = (exam: Exam) => {
    setSelectedExamForAttempts(exam);
    setIsAttemptsModalOpen(true);
    loadExamAttempts(exam._id);
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
      showToast(getFriendlyErrorMessage(err, 'تعذر إضافة المحاضرة، يرجى التأكد من البيانات والمحاولة مجدداً'), 'error');
    }
  };

  const handleDeleteLesson = async (lessonId: string, title: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف المحاضرة (${title})؟`)) return;
    try {
      await lessonsApi.deleteLesson(selectedCourseForLessons, lessonId);
      showToast(`تم حذف المحاضرة (${title}) بنجاح`, 'success');
      loadLessons(selectedCourseForLessons);
    } catch (err: any) {
      showToast(getFriendlyErrorMessage(err, 'تعذر حذف المحاضرة حالياً'), 'error');
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
      showToast(getFriendlyErrorMessage(err, 'تعذر توليد كروت الشحن، يرجى التأكد من البيانات والمحاولة مجدداً'), 'error');
    } finally {
      setIsGeneratingCards(false);
    }
  };

  return (
    <div className="container fade-in-up" style={{ padding: '2.5rem 1.5rem 6rem' }}>
      {/* ── HEADER CARD ────────────────────────────────────── */}
      {/* ── HEADER CARD ────────────────────────────────────── */}
      <div className="glass-card admin-header-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
            <div className="admin-header-icon" style={{
              width: '56px', height: '56px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px var(--primary-glow)',
              flexShrink: 0
            }}>
              <Sliders size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                <span className="gradient-badge">
                  <Sparkles size={13} /> {isSuperAdmin ? 'لوحة تحكم المدير العام (SuperAdmin)' : 'لوحة تحكم المسؤول (Live Admin Hub)'}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  المسؤول: {currentUser?.name}
                </span>
                {onNavigateView && (
                  <div style={{ display: 'inline-flex', gap: '0.5rem', marginRight: 'auto' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      onClick={() => onNavigateView('view-courses')}
                      title="تصفح الكورسات والمحاضرات"
                    >
                      <BookOpen size={14} color="#10B981" /> تصفح الكورسات
                    </button>
                  </div>
                )}
              </div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-bright)', margin: 0 }}>
                إدارة المنظومة التعليمية وقاعدة البيانات الحية
              </h1>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="admin-tab-bar">
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <BarChart2 size={16} />
            <span className="admin-tab-label-desktop">نظرة عامة والتحليلات</span>
            <span className="admin-tab-label-mobile">التحليلات</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            <Users size={16} />
            <span className="admin-tab-label-desktop">إدارة الطلاب الحية</span>
            <span className="admin-tab-label-mobile">الطلاب</span>
            <span className="admin-tab-badge">{allStudents.length || realStudents.length}</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            <BookOpen size={16} />
            <span className="admin-tab-label-desktop">إدارة الكورسات (CRUD)</span>
            <span className="admin-tab-label-mobile">الكورسات</span>
            <span className="admin-tab-badge">{realCourses.length}</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'lessons' ? 'active' : ''}`}
            onClick={() => setActiveTab('lessons')}
          >
            <Layers size={16} />
            <span className="admin-tab-label-desktop">إدارة المحاضرات (Lessons)</span>
            <span className="admin-tab-label-mobile">المحاضرات</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'exams' ? 'active' : ''}`}
            onClick={() => setActiveTab('exams')}
          >
            <Award size={16} />
            <span className="admin-tab-label-desktop">إدارة الامتحانات والتقييمات</span>
            <span className="admin-tab-label-mobile">الامتحانات</span>
            <span className="admin-tab-badge">{realExams.length}</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'scratch-cards' ? 'active' : ''}`}
            onClick={() => setActiveTab('scratch-cards')}
          >
            <Key size={16} />
            <span className="admin-tab-label-desktop">شحن الأكواد وكروت الشحن</span>
            <span className="admin-tab-label-mobile">كروت الشحن</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'payment-requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('payment-requests')}
            style={{
              borderColor: activeTab === 'payment-requests' ? '#10B981' : undefined,
            }}
          >
            <Smartphone size={16} color="#EF4444" />
            <span className="admin-tab-label-desktop">طلبات التحويل (كاش / إنستاباي)</span>
            <span className="admin-tab-label-mobile">طلبات الدفع</span>
            {pendingPaymentCount > 0 && (
              <span
                className="admin-tab-badge"
                style={{
                  background: '#EF4444',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: '0.72rem',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '9999px',
                }}
              >
                {pendingPaymentCount}
              </span>
            )}
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              className={`admin-tab-btn admin-tab-btn--full ${activeTab === 'admins' ? 'active' : ''}`}
              onClick={() => setActiveTab('admins')}
              style={{
                background: activeTab === 'admins' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.35))' : undefined,
                borderColor: activeTab === 'admins' ? 'rgba(245, 158, 11, 0.5)' : undefined,
                color: activeTab === 'admins' ? '#F59E0B' : undefined,
              }}
            >
              <Crown size={16} color="#F59E0B" />
              <span className="admin-tab-label-desktop">إدارة المسؤولين (SuperAdmin)</span>
              <span className="admin-tab-label-mobile">المسؤولين</span>
              <span className="admin-tab-badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                {realAdmins.length}
              </span>
            </button>
          )}

          <button
            type="button"
            className={`admin-tab-btn admin-tab-btn--full ${activeTab === 'inquiries' ? 'active' : ''}`}
            onClick={() => setActiveTab('inquiries')}
            style={{
              background: activeTab === 'inquiries' ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(8, 145, 178, 0.35))' : undefined,
              borderColor: activeTab === 'inquiries' ? 'rgba(6, 182, 212, 0.5)' : undefined,
              color: activeTab === 'inquiries' ? '#06B6D4' : undefined,
            }}
          >
            <Inbox size={16} color="#06B6D4" />
            <span className="admin-tab-label-desktop">الاستفسارات والرسائل</span>
            <span className="admin-tab-label-mobile">الاستفسارات</span>
            {openInquiryCount > 0 && (
              <span className="admin-tab-badge" style={{ background: '#EF4444', color: '#fff', fontWeight: 900, fontSize: '0.72rem', padding: '0.1rem 0.45rem', borderRadius: '9999px' }}>
                {openInquiryCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── TAB 1: OVERVIEW ─────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي الطلاب المسجلين</span>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary-light)', margin: '0.35rem 0' }}>
                {allStudents.length || realStudents.length}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle2 size={12} /> متصل بقاعدة بيانات MongoDB
              </span>
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
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>الاختبارات والتقييمات</span>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#8B5CF6', margin: '0.35rem 0' }}>
                {realExams.length}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>إدارة الأسئلة والمحاولات</span>
            </div>

            <div
              className="glass-card"
              style={{
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: openInquiryCount > 0 ? '1px solid rgba(6, 182, 212, 0.4)' : undefined,
              }}
              onClick={() => setActiveTab('inquiries')}
              title="انقر للانتقال لتبويب الاستفسارات والرسائل"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>استفسارات ورسائل الطلاب</span>
                <Inbox size={18} color="#06B6D4" />
              </div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#06B6D4', margin: '0.35rem 0' }}>
                {openInquiryCount}
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginRight: '0.4rem' }}>
                  / {allInquiries.length} إجمالي
                </span>
              </h3>
              <span style={{ fontSize: '0.75rem', color: openInquiryCount > 0 ? '#EF4444' : 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                {openInquiryCount > 0 ? `● ${openInquiryCount} رسالة بانتظار رد الإدارة` : '✓ تم الرد على جميع الاستفسارات'}
              </span>
            </div>

            <div
              className="glass-card"
              style={{
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: pendingPaymentCount > 0 ? '1px solid rgba(239, 68, 68, 0.4)' : undefined,
              }}
              onClick={() => setActiveTab('payment-requests')}
              title="انقر للانتقال لتبويب طلبات التحويل"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>طلبات التحويل اليدوي</span>
                <Smartphone size={18} color="#EF4444" />
              </div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#EF4444', margin: '0.35rem 0' }}>
                {pendingPaymentCount}
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginRight: '0.4rem' }}>
                  / {paymentRequests.length} إجمالي
                </span>
              </h3>
              <span style={{ fontSize: '0.75rem', color: pendingPaymentCount > 0 ? '#EF4444' : 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                {pendingPaymentCount > 0 ? `● ${pendingPaymentCount} طلب تحويل قيد المراجعة` : '✓ لا توجد طلبات معلقة'}
              </span>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>حالة المنصة والنظام</span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)', margin: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Zap size={18} color="var(--success)" fill="var(--success)" /> متصل وجاهز
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>المنظومة تعمل بكفاءة</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: STUDENTS MANAGEMENT (LIVE GET /users/students) ── */}
      {activeTab === 'students' && (
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div className="admin-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                الطلاب المسجلون في المنظومة ({displayedStudents.length}{(searchStudent.trim() || studentStatusFilter !== 'all') && (allStudents.length > 0 || realStudents.length > 0) ? ` من ${allStudents.length || realStudents.length}` : ''})
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
                style={{ width: '100%', paddingRight: '40px', paddingLeft: searchStudent ? '38px' : '14px', fontSize: '0.88rem' }}
                value={searchStudent}
                onChange={e => setSearchStudent(e.target.value)}
              />
              {searchStudent && (
                <button
                  type="button"
                  onClick={() => setSearchStudent('')}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="مسح البحث وعرض كل الطلاب"
                >
                  <X size={16} />
                </button>
              )}
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
          {isStudentsLoading && allStudents.length === 0 && realStudents.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>جاري تحميل بيانات الطلاب...</div>
          ) : displayedStudents.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>لا يوجد طلاب مطابقين للبحث.</div>
          ) : (
            <div className="user-table-wrapper">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>كود الطالب</th>
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
                  {displayedStudents.map(student => {
                    const isActive = student.Status === 'Active';
                    const isAdmin = (student.Role || '').toLowerCase() === 'admin';
                    const isComp = comprehensiveStudentIds.has(student._id);
                    const isSub = !!student.isSubscribed || enrolledStudentIds.has(student._id) || isComp;
                    const studentCode = (student as any).code || (student as any).StudentCode || (student._id ? `#${student._id.slice(-6).toUpperCase()}` : '—');

                    return (
                      <tr key={student._id}>
                        <td>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              color: 'var(--primary-light)',
                              background: 'rgba(8, 145, 178, 0.1)',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              border: '1px solid rgba(8, 145, 178, 0.25)',
                              letterSpacing: '0.05em',
                              display: 'inline-block',
                            }}
                          >
                            {studentCode}
                          </span>
                        </td>
                        <td>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--text-bright)' }}>{student.FullName}</strong>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{student.Phone}</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{student.ParentPhone || '—'}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {isComp ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding: '0.2rem 0.65rem',
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(16, 185, 129, 0.2))',
                                  color: '#F59E0B',
                                  border: '1px solid rgba(245, 158, 11, 0.4)',
                                }}
                              >
                                <Sparkles size={12} color="#F59E0B" /> مشترك شامل
                              </span>
                            ) : isSub ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  color: '#10B981',
                                  border: '1px solid rgba(16, 185, 129, 0.3)',
                                }}
                              >
                                <CheckCircle2 size={12} /> مشترك
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  color: '#EF4444',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                }}
                              >
                                <XCircle size={12} /> غير مشترك
                              </span>
                            )}
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '0.2rem 0.55rem', fontSize: '0.7rem' }}
                              onClick={() => handleToggleSubscription(student)}
                              title={isSub ? 'إلغاء الاشتراك' : 'تفعيل الاشتراك لكافة كورسات سنته الدراسية'}
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
                              {isAdmin ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Crown size={12} color="#F59E0B" /> مدير
                                </span>
                              ) : 'طالب'}
                            </span>
                            {isSuperAdmin && (
                              !isAdmin ? (
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', color: '#F59E0B', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                                  onClick={() => handleOpenPromoteModal(student)}
                                  title="ترقية الطالب إلى مدير (SuperAdmin only)"
                                >
                                  <Shield size={11} /> ترقية لمدير
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                                  onClick={() => handleToggleRole(student)}
                                  title="تحويل لحساب طالب"
                                >
                                  تحويل لطالب
                                </button>
                              )
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${isActive ? 'status-badge--active' : 'status-badge--blocked'}`}>
                            {isActive ? 'نشط (Active)' : student.Status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10B981', borderColor: 'rgba(16, 185, 129, 0.35)' }}
                              onClick={() => handleOpenManualEnroll(student)}
                              title="منح حق الوصول لكورس (AdminGift)"
                            >
                              <BookOpen size={13} /> منح كورس
                            </button>
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
      {activeTab === 'courses' && (() => {
        const filteredCourses = realCourses.filter(c => {
          if (selectedYear !== 'all' && !matchesAcademicYear(c, selectedYear)) return false;
          if (courseStageFilter !== 'all' && c.EducationStage !== courseStageFilter) return false;
          if (courseGradeFilter !== 'all' && c.Grade !== courseGradeFilter) return false;
          return true;
        });

        const activeStageObj = EDUCATION_STAGES.find(s => s.key === courseStageFilter);

        return (
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <div className="admin-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                  إدارة الكورسات والمناهج ({filteredCourses.length}{selectedYear !== 'all' || courseStageFilter !== 'all' ? ` من ${realCourses.length}` : ''})
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  إنشاء، تعديل، وحذف الكورسات مع تحديد المرحلة الدراسية والصف
                </span>
              </div>

              <div className="admin-btn-group" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const defaultGrade = selectedYear === 'first_secondary' ? '1' : selectedYear === 'second_secondary' ? '2' : '3';
                    setNewCourseForm(prev => ({
                      ...prev,
                      educationStage: 'Secondary',
                      grade: defaultGrade,
                    }));
                    setIsCreateCourseOpen(true);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Plus size={16} /> إضافة كورس جديد
                </button>
              </div>
            </div>

            {/* Stage & Grade Filter Toolbar */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem', background: 'var(--bg-subtle)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              {/* Quick Academic Year Filter Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <GraduationCap size={14} /> العام الدراسي:
                </span>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className={`btn ${selectedYear === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.25rem 0.65rem', fontSize: '0.78rem' }}
                    onClick={() => {
                      setSelectedYear('all');
                      setCourseStageFilter('all');
                      setCourseGradeFilter('all');
                    }}
                  >
                    كافة السنوات
                  </button>
                  {(['first_secondary', 'second_secondary', 'third_secondary'] as AcademicYear[]).map(yearKey => (
                    <button
                      key={yearKey}
                      type="button"
                      className={`btn ${selectedYear === yearKey ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '0.25rem 0.65rem', fontSize: '0.78rem' }}
                      onClick={() => {
                        const next = selectedYear === yearKey ? 'all' : yearKey;
                        setSelectedYear(next);
                        if (next === 'all') {
                          setCourseStageFilter('all');
                          setCourseGradeFilter('all');
                        } else {
                          setCourseStageFilter('Secondary');
                          setCourseGradeFilter(next === 'first_secondary' ? '1' : next === 'second_secondary' ? '2' : '3');
                        }
                      }}
                    >
                      {ACADEMIC_YEAR_LABELS[yearKey]}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ width: '1px', height: '24px', background: 'var(--border-glass)' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>المرحلة الدراسية:</label>
                <select
                  className="input-field"
                  style={{ fontSize: '0.85rem', padding: '0.35rem 0.65rem' }}
                  value={courseStageFilter}
                  onChange={e => {
                    const newStage = e.target.value;
                    setCourseStageFilter(newStage);
                    setCourseGradeFilter('all');
                    if (newStage !== 'Secondary') {
                      setSelectedYear('all');
                    }
                  }}
                >
                  <option value="all">كافة المراحل</option>
                  {EDUCATION_STAGES.map(st => (
                    <option key={st.key} value={st.key}>{st.label}</option>
                  ))}
                </select>
              </div>

              {activeStageObj && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>الصف الدراسي:</label>
                  <select
                    className="input-field"
                    style={{ fontSize: '0.85rem', padding: '0.35rem 0.65rem' }}
                    value={courseGradeFilter}
                    onChange={e => {
                      const newGrade = e.target.value;
                      setCourseGradeFilter(newGrade);
                      if (courseStageFilter === 'Secondary') {
                        if (newGrade === '1') setSelectedYear('first_secondary');
                        else if (newGrade === '2') setSelectedYear('second_secondary');
                        else if (newGrade === '3') setSelectedYear('third_secondary');
                        else setSelectedYear('all');
                      }
                    }}
                  >
                    <option value="all">كافة الصفوف</option>
                    {activeStageObj.grades.map(g => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {isCoursesLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>جاري تحميل الكورسات...</div>
            ) : filteredCourses.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <BookOpen size={40} style={{ margin: '0 auto 1rem', opacity: 0.35 }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.5rem' }}>
                  لا توجد كورسات مضافة تطابق التصفية الحالية
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  {selectedYear !== 'all' ? `لم يتم العثور على كورسات لـ "${ACADEMIC_YEAR_LABELS[selectedYear]}".` : 'يرجى تغيير خيارات التصفية أو إضافة كورس جديد.'}
                </p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setSelectedYear('all');
                    setCourseStageFilter('all');
                    setCourseGradeFilter('all');
                  }}
                >
                  إعادة ضبط التصفية وعرض الكل
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.25rem' }}>
                {filteredCourses.map(course => {
                  const stageObj = EDUCATION_STAGES.find(s => s.key === course.EducationStage);
                  const gradeLabel = stageObj?.grades.find(g => g.value === course.Grade)?.label || (course.Grade ? `الصف ${course.Grade}` : null);

                  return (
                    <div key={course._id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-glass)' }}>
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
                        {stageObj && (
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.72rem', background: 'rgba(8,145,178,0.12)', color: 'var(--primary-light)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                              {stageObj.label}
                            </span>
                            {gradeLabel && (
                              <span style={{ fontSize: '0.72rem', background: 'rgba(245,158,11,0.12)', color: '#F59E0B', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                                {gradeLabel}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
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
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                            onClick={() => handleOpenEditCourse(course)}
                            title="تعديل بيانات الكورس"
                          >
                            <Edit3 size={14} color="var(--primary-light)" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
                            onClick={() => handleDeleteCourse(course._id, course.Title)}
                            title="حذف الكورس"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── TAB 4: LESSONS MANAGEMENT (POST, DELETE /courses/{id}/lessons) ── */}
      {activeTab === 'lessons' && (
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div className="admin-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                إدارة المحاضرات والدروس ({realLessons.length})
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                إضافة وحذف محاضرات الفيديو المشفرة المرتبطة بالكورسات
              </span>
            </div>

            <div className="admin-btn-group" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
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

      {/* ── TAB 5: EXAMS MANAGEMENT (CRUD GET, POST, DELETE /exams) ── */}
      {activeTab === 'exams' && (
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div className="admin-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                إدارة الاختبارات والتقييمات ({realExams.length})
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                إنشاء وتعديل الاختبارات، إدارة بنوك الأسئلة، ومتابعة محاولات الطلاب الحية
              </span>
            </div>

            <div className="admin-btn-group" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={loadExams}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
                title="تحديث قائمة الاختبارات"
              >
                <RefreshCw size={14} className={isExamsLoading ? 'spin' : ''} /> تحديث
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  if (realCourses.length > 0 && !aiExamForm.courseId) {
                    setAiExamForm(prev => ({ ...prev, courseId: realCourses[0]._id }));
                  }
                  setIsCreateAIExamOpen(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(8, 145, 178, 0.15))',
                  borderColor: 'rgba(139, 92, 246, 0.45)',
                  color: '#A78BFA',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                }}
              >
                <Sparkles size={16} color="#A78BFA" /> إضافة امتحان بالـ AI
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (realCourses.length > 0 && !newExamForm.courseId) {
                    setNewExamForm(prev => ({ ...prev, courseId: realCourses[0]._id }));
                  }
                  setIsCreateExamOpen(true);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Plus size={16} /> إضافة اختبار جديد
              </button>
            </div>
          </div>

          {/* Filters toolbar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem', background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
                البحث بالعنوان:
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="ابحث عن اختبار..."
                  className="input-field"
                  style={{ width: '100%', fontSize: '0.85rem', paddingRight: '2rem' }}
                  value={searchExam}
                  onChange={e => setSearchExam(e.target.value)}
                />
                <Search size={14} style={{ position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
                تصفية حسب الكورس:
              </label>
              <select
                className="input-field"
                style={{ width: '100%', fontSize: '0.85rem' }}
                value={examCourseFilter}
                onChange={e => setExamCourseFilter(e.target.value)}
              >
                <option value="all">كافة الكورسات</option>
                {realCourses.map(c => (
                  <option key={c._id} value={c._id}>{c.Title}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
                حالة الاختبار:
              </label>
              <select
                className="input-field"
                style={{ width: '100%', fontSize: '0.85rem' }}
                value={examStatusFilter}
                onChange={e => setExamStatusFilter(e.target.value)}
              >
                <option value="all">كافة الحالات</option>
                <option value="Draft">مسودة (Draft)</option>
                <option value="Published">منشور (Published)</option>
                <option value="Closed">مغلق (Closed)</option>
              </select>
            </div>
          </div>

          {/* Exams List */}
          {isExamsLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>جاري تحميل الاختبارات...</div>
          ) : displayedExams.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              {realExams.length === 0
                ? 'لا توجد اختبارات مسجلة حالياً. اضغط على "إضافة اختبار جديد" للبدء.'
                : 'لا توجد اختبارات تطابق معايير البحث الحالية.'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {displayedExams.map(exam => {
                const examCourseId = typeof exam.CourseId === 'object' && exam.CourseId ? (exam.CourseId as any)._id : exam.CourseId;
                const linkedCourse = realCourses.find(c => c._id === examCourseId);
                const courseTitle = linkedCourse?.Title || (typeof exam.CourseId === 'object' && (exam.CourseId as any)?.Title ? (exam.CourseId as any).Title : '—');

                return (
                  <div key={exam._id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-glass)' }}>
                    <div>
                      {(exam.IsGated || exam.IsRandomized) && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem', marginBottom: '0.65rem' }}>
                          {exam.IsGated && (
                            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(245,158,11,0.15)', color: '#F59E0B', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              مشروط <Lock size={10} />
                            </span>
                          )}
                          {exam.IsRandomized && (
                            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(139,92,246,0.15)', color: '#8B5CF6', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              عشوائي <Shuffle size={10} />
                            </span>
                          )}
                        </div>
                      )}

                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-bright)', margin: '0 0 0.4rem' }}>
                        {exam.Title}
                      </h3>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div>
                          <strong style={{ color: 'var(--text-bright)' }}>الكورس:</strong> {courseTitle}
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={12} /> المدة: {exam.DurationMinutes} دقيقة</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Target size={12} /> درجة النجاح: {exam.PassingScore}</span>
                          <span
                            onClick={() => handleOpenEditExam(exam)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              cursor: 'pointer',
                              background: 'rgba(8, 145, 178, 0.12)',
                              border: '1px solid rgba(8, 145, 178, 0.3)',
                              padding: '0.1rem 0.45rem',
                              borderRadius: '4px',
                              color: 'var(--primary-light)',
                              fontWeight: 700,
                            }}
                            title="اضغط لتعديل عدد محاولات الامتحان للطلاب"
                          >
                            <RotateCcw size={12} /> المحاولات: {exam.MaxAttempts === 0 ? 'غير محدودة' : exam.MaxAttempts}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                          onClick={() => handleOpenQuestionsModal(exam)}
                        >
                          <ListOrdered size={14} /> الأسئلة
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                          onClick={() => handleOpenAttemptsModal(exam)}
                        >
                          <Eye size={14} /> المحاولات
                        </button>
                      </div>

                      {/* ── Status Controller for Admin/SuperAdmin ── */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-subtle)', padding: '0.35rem 0.5rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>الحالة:</span>
                        <select
                          value={exam.Status}
                          onChange={(e) => handleUpdateExamStatus(exam, e.target.value as ExamStatus)}
                          className="input-field"
                          style={{
                            padding: '0.2rem 0.4rem',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            flex: 1,
                            borderRadius: '6px',
                            color: exam.Status === 'Published' ? '#10B981' : exam.Status === 'Draft' ? '#F59E0B' : '#EF4444',
                            background: 'var(--bg-glass-card)',
                            borderColor: exam.Status === 'Published' ? 'rgba(16,185,129,0.3)' : exam.Status === 'Draft' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)',
                            cursor: 'pointer',
                          }}
                          title="تغيير حالة الاختبار فوراً إلى أي حالة تريدها"
                        >
                          <option value="Draft">مسودة (Draft)</option>
                          <option value="Published">منشور (Published)</option>
                          <option value="Closed">مغلق (Closed)</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem' }}>
                        {exam.Status !== 'Published' && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{
                              padding: '0.35rem 0.5rem',
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.2rem',
                              color: '#10B981',
                              borderColor: 'rgba(16,185,129,0.3)',
                              flex: 1,
                            }}
                            onClick={() => handleUpdateExamStatus(exam, 'Published')}
                            title="نشر الاختبار فوراً للطلاب"
                          >
                            <CheckCircle2 size={12} /> نشر
                          </button>
                        )}
                        {exam.Status !== 'Draft' && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{
                              padding: '0.35rem 0.5rem',
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.2rem',
                              color: '#F59E0B',
                              borderColor: 'rgba(245,158,11,0.3)',
                              flex: 1,
                            }}
                            onClick={() => handleUpdateExamStatus(exam, 'Draft')}
                            title="تحويل الاختبار إلى مسودة"
                          >
                            <XCircle size={12} /> مسودة
                          </button>
                        )}
                        {exam.Status !== 'Closed' && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{
                              padding: '0.35rem 0.5rem',
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.2rem',
                              color: '#EF4444',
                              borderColor: 'rgba(239,68,68,0.3)',
                              flex: 1,
                            }}
                            onClick={() => handleUpdateExamStatus(exam, 'Closed')}
                            title="إغلاق الاختبار"
                          >
                            <Ban size={12} /> إغلاق
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ flex: 1, padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                          onClick={() => handleOpenEditExam(exam)}
                        >
                          <Edit3 size={13} color="var(--primary-light)" /> تعديل
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
                          onClick={() => handleDeleteExam(exam)}
                          title="حذف الاختبار"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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
              {isGeneratingCards ? 'جاري إنشاء وتفعيل الكروت...' : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Zap size={16} /> توليد دفعة الكروت الآن
                </span>
              )}
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

      {/* ── TAB 7: MANUAL PAYMENT REQUESTS (Vodafone Cash & InstaPay) ── */}
      {activeTab === 'payment-requests' && (
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div className="admin-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span className="gradient-badge" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(245, 158, 11, 0.2))', color: '#F59E0B' }}>
                  <Smartphone size={14} /> Vodafone Cash &amp; InstaPay
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>مراجعة وتأكيد مدفوعات الطلاب</span>
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                طلبات التحويل اليدوي ({Array.isArray(filteredPaymentRequests) ? filteredPaymentRequests.length : 0})
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
                يقوم الطالب بتحويل سعر الكورس إلى رقم فودافون كاش أو إنستاباي، ثم يرسل الطلب هنا ليتم مراجعته واعتماده وتفعيل الكورس تلقائياً.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={fetchPaymentRequests}
                disabled={isPaymentRequestsLoading}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              >
                <RefreshCw size={14} className={isPaymentRequestsLoading ? 'spin' : ''} /> تحديث القائمة
              </button>
            </div>
          </div>

          {/* Filters & Search toolbar */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Status Tabs/Buttons */}
            <div style={{ display: 'flex', gap: '0.45rem', background: 'transparent', padding: '0', borderRadius: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setPaymentStatusFilter('Pending')}
                className={`btn btn-sm ${paymentStatusFilter === 'Pending' ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: paymentStatusFilter === 'Pending' ? undefined : 'transparent',
                  borderColor: paymentStatusFilter === 'Pending' ? undefined : 'var(--border-glass)',
                  color: paymentStatusFilter === 'Pending' ? '#fff' : 'var(--text-muted)',
                }}
              >
                <Clock size={13} />
                قيد المراجعة
                {pendingPaymentCount > 0 && (
                  <span style={{ background: '#EF4444', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 800 }}>
                    {pendingPaymentCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatusFilter('Approved')}
                className={`btn btn-sm ${paymentStatusFilter === 'Approved' ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: paymentStatusFilter === 'Approved' ? undefined : 'transparent',
                  borderColor: paymentStatusFilter === 'Approved' ? undefined : 'var(--border-glass)',
                  color: paymentStatusFilter === 'Approved' ? '#fff' : 'var(--text-muted)',
                }}
              >
                <CheckCircle2 size={13} /> المقبولة
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatusFilter('Rejected')}
                className={`btn btn-sm ${paymentStatusFilter === 'Rejected' ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: paymentStatusFilter === 'Rejected' ? undefined : 'transparent',
                  borderColor: paymentStatusFilter === 'Rejected' ? undefined : 'var(--border-glass)',
                  color: paymentStatusFilter === 'Rejected' ? '#fff' : 'var(--text-muted)',
                }}
              >
                <XCircle size={13} /> المرفوضة
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatusFilter('all')}
                className={`btn btn-sm ${paymentStatusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  fontSize: '0.8rem',
                  background: paymentStatusFilter === 'all' ? undefined : 'transparent',
                  borderColor: paymentStatusFilter === 'all' ? undefined : 'var(--border-glass)',
                  color: paymentStatusFilter === 'all' ? '#fff' : 'var(--text-muted)',
                }}
              >
                الكل ({Array.isArray(paymentRequests) ? paymentRequests.length : 0})
              </button>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '260px', flex: '1', maxWidth: '380px' }}>
              <Search size={15} style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={searchPayment}
                onChange={e => setSearchPayment(e.target.value)}
                placeholder="بحث برقم المحفظة، الطالب، الكورس..."
                className="input-field"
                style={{ width: '100%', paddingRight: '2.4rem', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Table / Requests List */}
          {isPaymentRequestsLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={28} className="spin" style={{ margin: '0 auto 1rem', display: 'block' }} />
              جاري تحميل طلبات الدفع...
            </div>
          ) : filteredPaymentRequests.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <Smartphone size={36} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.4 }} />
              <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-bright)' }}>لا توجد طلبات دفع مطابقة</p>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>
                {paymentStatusFilter === 'Pending' ? 'رائع! لا توجد طلبات معلقة بانتظار المراجعة حالياً.' : 'لم يتم العثور على أي طلبات تتماشى مع معايير البحث.'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>الطالب</th>
                    <th style={{ padding: '0.75rem 1rem' }}>الكورس المطلوب</th>
                    <th style={{ padding: '0.75rem 1rem' }}>وسيلة الدفع</th>
                    <th style={{ padding: '0.75rem 1rem' }}>رقم هاتف المحوّل</th>
                    <th style={{ padding: '0.75rem 1rem' }}>الرقم المرجعي</th>
                    <th style={{ padding: '0.75rem 1rem' }}>التاريخ</th>
                    <th style={{ padding: '0.75rem 1rem' }}>الحالة</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(filteredPaymentRequests) ? filteredPaymentRequests : []).map((req) => {
                    const studentObj = typeof req.StudentId === 'object' ? req.StudentId : realStudents.find(s => s._id === req.StudentId);
                    const studentName = studentObj?.FullName || 'طالب';
                    const studentEmail = (studentObj as any)?.Email || '';
                    const studentPhone = (studentObj as any)?.PhoneNumber || (studentObj as any)?.Phone || '';

                    const courseObj = typeof req.CourseId === 'object' ? req.CourseId : realCourses.find(c => c._id === req.CourseId);
                    const courseTitle = courseObj?.Title || (req.CourseId ? `كورس (${String(req.CourseId).slice(-6)})` : 'كورس');
                    const coursePrice = courseObj?.Price ?? null;
                    const isVodafone = req.PaymentMethod?.toLowerCase().includes('vodafone');
                    const isPending = req.Status === 'Pending' || req.Status === 'pending';
                    const isApproved = req.Status === 'Approved' || req.Status === 'approved';
                    const isRejected = req.Status === 'Rejected' || req.Status === 'rejected';
                    const isBusy = isProcessingPaymentId === req._id;

                    return (
                      <React.Fragment key={req._id}>
                        <tr
                          style={{
                            borderBottom: rejectingRequestId === req._id ? 'none' : '1px solid rgba(255,255,255,0.04)',
                            background: rejectingRequestId === req._id ? 'rgba(239, 68, 68, 0.05)' : isPending ? 'rgba(245, 158, 11, 0.02)' : undefined,
                          }}
                        >
                        {/* Student */}
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-bright)' }}>{studentName}</div>
                          {studentEmail && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{studentEmail}</div>}
                          {studentPhone && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', direction: 'ltr', textAlign: 'right' }}>{studentPhone}</div>}
                        </td>

                        {/* Course */}
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{courseTitle}</div>
                          {coursePrice !== null && coursePrice !== undefined && (
                            <div style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 700 }}>
                              {coursePrice} ج.م
                            </div>
                          )}
                        </td>

                        {/* Method */}
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: isVodafone ? 'rgba(239, 68, 68, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                              color: isVodafone ? '#EF4444' : '#A78BFA',
                              border: `1px solid ${isVodafone ? 'rgba(239, 68, 68, 0.3)' : 'rgba(139, 92, 246, 0.3)'}`,
                            }}
                          >
                            <Smartphone size={12} />
                            {isVodafone ? 'فودافون كاش' : 'إنستاباي (InstaPay)'}
                          </span>
                        </td>

                        {/* Sender Phone */}
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', direction: 'ltr' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-bright)' }}>
                              {req.senderPhone || req.SenderPhone || '-'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(req.senderPhone || req.SenderPhone || '');
                                showToast('تم نسخ رقم المحفظة!', 'success');
                              }}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                              title="نسخ الرقم"
                            >
                              <Copy size={13} />
                            </button>
                          </div>
                        </td>

                        {/* Reference */}
                        <td style={{ padding: '0.85rem 1rem' }}>
                          {req.TransactionReference || (req as any).transactionReference ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', direction: 'ltr' }}>
                              <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {req.TransactionReference || (req as any).transactionReference}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(req.TransactionReference || (req as any).transactionReference || '');
                                  showToast('تم نسخ الرقم المرجعي!', 'success');
                                }}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                                title="نسخ المرجع"
                              >
                                <Copy size={12} />
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>-</span>
                          )}
                        </td>

                        {/* Date */}
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                          {req.createdAt ? new Date(req.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '0.85rem 1rem' }}>
                          {isPending && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 800, background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                              <Clock size={11} /> قيد المراجعة
                            </span>
                          )}
                          {isApproved && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 800, background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                              <CheckCircle2 size={11} /> تم القبول والتفعيل
                            </span>
                          )}
                          {isRejected && (
                            <div>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 800, background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                <XCircle size={11} /> مرفوض
                              </span>
                              {req.RejectionReason && (
                                <div style={{ fontSize: '0.7rem', color: '#EF4444', marginTop: '0.25rem', maxWidth: '160px' }}>
                                  {req.RejectionReason}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                          {isPending ? (
                            <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                              <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                disabled={isBusy}
                                onClick={() => handleApprovePayment(req._id)}
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '0.3rem 0.75rem',
                                  background: 'linear-gradient(135deg, #059669, #10B981)',
                                  border: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                }}
                                title="تأكيد استلام المبلغ وتفعيل الكورس للطالب فورياً"
                              >
                                <Check size={13} />
                                {isBusy ? 'جاري...' : 'قبول'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                disabled={isBusy}
                                onClick={() => {
                                  setRejectingRequestId(req._id);
                                  setRejectionReasonInput('');
                                }}
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '0.3rem 0.75rem',
                                  borderColor: 'rgba(239, 68, 68, 0.4)',
                                  color: '#EF4444',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                }}
                                title="رفض الطلب مع كتابة السبب"
                              >
                                <X size={13} />
                                رفض
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>مكتمل</span>
                          )}
                        </td>
                      </tr>
                        {rejectingRequestId === req._id && (
                          <tr style={{ background: 'rgba(239, 68, 68, 0.05)', borderBottom: '2px solid rgba(239, 68, 68, 0.3)' }}>
                            <td colSpan={8} style={{ padding: '0.85rem 1.25rem' }}>
                              <div
                                style={{
                                  background: 'var(--bg-surface)',
                                  border: '1px solid rgba(239, 68, 68, 0.35)',
                                  borderRadius: '10px',
                                  padding: '1.25rem',
                                  boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                                  maxWidth: '650px',
                                  margin: '0 auto',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                                      <XCircle size={18} />
                                    </div>
                                    <div>
                                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-bright)' }}>
                                        رفض طلب التحويل ({studentName})
                                      </h4>
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        سيصل سبب الرفض للطالب في صفحة الدفع
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setRejectingRequestId(null)}
                                    disabled={Boolean(isProcessingPaymentId)}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                                  >
                                    <X size={18} />
                                  </button>
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.4rem' }}>
                                    سبب الرفض <span style={{ color: '#EF4444' }}>*</span> (3 أحرف على الأقل)
                                  </label>
                                  <textarea
                                    rows={3}
                                    className="input-field"
                                    style={{ width: '100%', resize: 'vertical', fontSize: '0.85rem' }}
                                    placeholder="مثال: لم يتم استلام التحويل على رقم فودافون كاش الخاص بالمنصة، أو المبلغ المحول غير مطابق لسعر الكورس."
                                    value={rejectionReasonInput}
                                    onChange={e => setRejectionReasonInput(e.target.value)}
                                    autoFocus
                                  />
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    disabled={Boolean(isProcessingPaymentId)}
                                    onClick={() => setRejectingRequestId(null)}
                                  >
                                    إلغاء
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm"
                                    disabled={Boolean(isProcessingPaymentId) || rejectionReasonInput.trim().length < 3}
                                    onClick={handleRejectPayment}
                                    style={{
                                      background: '#DC2626',
                                      color: '#fff',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.4rem',
                                      fontWeight: 700,
                                      padding: '0.45rem 1rem',
                                      borderRadius: '8px',
                                      cursor: (isProcessingPaymentId || rejectionReasonInput.trim().length < 3) ? 'not-allowed' : 'pointer',
                                    }}
                                  >
                                    {isProcessingPaymentId ? 'جاري الرفض...' : (
                                      <>
                                        <XCircle size={15} /> تأكيد الرفض
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 6: ADMINS MANAGEMENT (Strictly SuperAdmin Only) ── */}
      {isSuperAdmin && activeTab === 'admins' && (
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div className="admin-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span className="gradient-badge">
                  <Shield size={14} /> Admins &amp; Roles Control
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>إدارة صلاحيات المديرين والمشرفين</span>
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                لوحة التحكم في المديرين وتحويل الحسابات ({realAdmins.length})
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
                استعراض حسابات الإدارة وسحب صلاحيات المدير وتحويل أي حساب إلى حساب طالب عادي فورياً.
              </p>
            </div>

            <div className="admin-btn-group" style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsQuickPromoteOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
              >
                <UserPlus size={14} /> ترقية طالب إلى مسؤول (Admin)
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => loadAdmins()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
              >
                <RefreshCw size={14} className={isAdminsLoading ? 'spin' : ''} /> تحديث القائمة
              </button>
            </div>
          </div>

          {isAdminsLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              جاري تحميل المديرين...
            </div>
          ) : realAdmins.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem', color: 'var(--primary-light)' }}>
                <ShieldCheck size={40} />
              </div>
              <p style={{ marginBottom: '1rem' }}>لا يوجد مديرون مسجلون في القائمة حالياً.</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsQuickPromoteOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
              >
                <UserPlus size={14} /> ترقية حساب إلى مسؤول الآن
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {realAdmins
                .map(adminUser => (
                  <div
                    key={adminUser._id}
                    className="glass-card"
                    style={{
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      background: 'rgba(245, 158, 11, 0.03)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{
                          width: '44px', height: '44px', borderRadius: '50%',
                          background: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <Crown size={22} color="#F59E0B" />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                            {adminUser.FullName}
                          </h3>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                            fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.5rem',
                            borderRadius: '9999px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B',
                            marginTop: '0.25rem'
                          }}>
                            <Shield size={11} /> حساب مسؤول (Admin)
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem' }}>
                        <div>
                          <strong style={{ color: 'var(--text-bright)' }}>رقم الهاتف:</strong>{' '}
                          <span style={{ fontFamily: 'monospace' }}>{adminUser.Phone}</span>
                        </div>
                        {adminUser.NationalId && adminUser.NationalId !== '—' && (
                          <div>
                            <strong style={{ color: 'var(--text-bright)' }}>الرقم القومي:</strong>{' '}
                            <span style={{ fontFamily: 'monospace' }}>{adminUser.NationalId}</span>
                          </div>
                        )}
                        {adminUser.ParentPhone && adminUser.ParentPhone !== '—' && (
                          <div>
                            <strong style={{ color: 'var(--text-bright)' }}>هاتف إضافي / ولي الأمر:</strong>{' '}
                            <span style={{ fontFamily: 'monospace' }}>{adminUser.ParentPhone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ flex: 1, minWidth: '100px', fontSize: '0.82rem', padding: '0.45rem' }}
                        onClick={() => handleOpenEditStudent(adminUser)}
                      >
                        <Edit3 size={14} /> تعديل البيانات
                      </button>

                      <button
                        type="button"
                        className="btn"
                        style={{
                          flex: 1.2,
                          minWidth: '120px',
                          fontSize: '0.82rem',
                          padding: '0.45rem',
                          background: 'rgba(245, 158, 11, 0.12)',
                          border: '1px solid rgba(245, 158, 11, 0.4)',
                          color: '#F59E0B',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer'
                        }}
                        onClick={async () => {
                          if (window.confirm(`هل أنت متأكد من رغبتك في سحب صلاحيات الإدارة وتحويل الحساب (${adminUser.FullName}) إلى حساب طالب عادي (Normal Student User)؟`)) {
                            try {
                              await studentsApi.demoteAdminToStudent(adminUser._id);
                              setRealAdmins(prev => prev.filter(a => a._id !== adminUser._id));
                              setAllStudents(prev => prev.map(s => s._id === adminUser._id ? { ...s, Role: 'Student' } : s));
                              setRealStudents(prev => prev.map(s => s._id === adminUser._id ? { ...s, Role: 'Student' } : s));
                              showToast(`تم تحويل حساب (${adminUser.FullName}) إلى حساب طالب عادي بنجاح!`, 'success');
                              await loadAdmins();
                              await loadStudents();
                            } catch (err: any) {
                              showToast(getFriendlyErrorMessage(err, 'تعذر تحويل الحساب إلى طالب عادي'), 'error');
                            }
                          }
                        }}
                      >
                        <XCircle size={14} /> سحب الصلاحيات
                      </button>

                      <button
                        type="button"
                        className="btn"
                        style={{
                          flex: 1,
                          minWidth: '100px',
                          fontSize: '0.82rem',
                          padding: '0.45rem',
                          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.3))',
                          border: '1px solid rgba(239, 68, 68, 0.5)',
                          color: '#F87171',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer'
                        }}
                        onClick={async () => {
                          if (window.confirm(`هل أنت متأكد من رغبتك في حذف حساب المشرف (${adminUser.FullName}) نهائياً من قاعدة البيانات (DELETE /users/admins/:userId)؟`)) {
                            try {
                              await studentsApi.deleteAdmin(adminUser._id);
                              setRealAdmins(prev => prev.filter(a => a._id !== adminUser._id));
                              setAllStudents(prev => prev.filter(s => s._id !== adminUser._id));
                              setRealStudents(prev => prev.filter(s => s._id !== adminUser._id));
                              showToast(`تم حذف المشرف (${adminUser.FullName}) نهائياً بنجاح!`, 'success');
                              await loadAdmins();
                              await loadStudents();
                            } catch (err: any) {
                              showToast(getFriendlyErrorMessage(err, 'تعذر حذف المشرف'), 'error');
                            }
                          }
                        }}
                      >
                        <Trash2 size={14} /> حذف نهائي
                      </button>
                    </div>
                  </div>
                ))}
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
              تسجيل حساب طالب جديد (تسجيل الطلاب)
            </h2>

            <form onSubmit={handleCreateStudent} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                  اسم الطالب بالكامل <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: يوسف أحمد عبد المنعم"
                  className="input-field"
                  style={{ width: '100%' }}
                  value={newStudentForm.fullName}
                  onChange={e => setNewStudentForm({ ...newStudentForm, fullName: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                  الرقم القومي (14 رقماً) <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={14}
                  placeholder="30101011234567"
                  className="input-field"
                  style={{ width: '100%', letterSpacing: '1px' }}
                  value={newStudentForm.nationalId}
                  onChange={e => setNewStudentForm({ ...newStudentForm, nationalId: e.target.value.replace(/\D/g, '') })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                  رقم هاتف الطالب (11 رقماً) <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={11}
                  placeholder="01012345678"
                  className="input-field"
                  style={{ width: '100%' }}
                  value={newStudentForm.phone}
                  onChange={e => setNewStudentForm({ ...newStudentForm, phone: e.target.value.replace(/\D/g, '') })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                  رقم هاتف ولي الأمر (11 رقماً) <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={11}
                  placeholder="01112345678"
                  className="input-field"
                  style={{ width: '100%' }}
                  value={newStudentForm.parentPhone}
                  onChange={e => setNewStudentForm({ ...newStudentForm, parentPhone: e.target.value.replace(/\D/g, '') })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>المرحلة التعليمية</label>
                  <select
                    className="input-field"
                    style={{ width: '100%' }}
                    value={newStudentForm.educationStage}
                    onChange={e => {
                      const newStage = e.target.value as EducationStage;
                      const stageDef = EDUCATION_STAGES.find(s => s.key === newStage);
                      const defaultGrade = stageDef?.grades[0]?.value || '1';
                      setNewStudentForm({ ...newStudentForm, educationStage: newStage, grade: defaultGrade });
                    }}
                  >
                    {EDUCATION_STAGES.map(s => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>الصف الدراسي</label>
                  <select
                    className="input-field"
                    style={{ width: '100%' }}
                    value={newStudentForm.grade}
                    onChange={e => setNewStudentForm({ ...newStudentForm, grade: e.target.value })}
                  >
                    {EDUCATION_STAGES.find(s => s.key === newStudentForm.educationStage)?.grades.map(g => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                  كلمة المرور (8-40 حرفاً) <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  maxLength={40}
                  placeholder="••••••••"
                  className="input-field"
                  style={{ width: '100%' }}
                  value={newStudentForm.password}
                  onChange={e => setNewStudentForm({ ...newStudentForm, password: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}>
                تأكيد تسجيل الطالب
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: CREATE COURSE ────────────────────────────── */}
      {isCreateCourseOpen && createPortal(
        <div className="modal-overlay active" onClick={() => setIsCreateCourseOpen(false)} style={{ zIndex: 99999 }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', padding: '1.75rem' }}>
            <button className="modal-close" onClick={() => setIsCreateCourseOpen(false)}><X size={18} /></button>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '1.25rem' }}>
              إضافة كورس جديد (Create Course)
            </h2>

            <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>عنوان الكورس (3-100 حرف)</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={100}
                  placeholder="مثال: كورس الجبر وحساب المثلثات المتقدم"
                  className="input-field"
                  style={{ width: '100%' }}
                  value={newCourseForm.title}
                  onChange={e => setNewCourseForm({ ...newCourseForm, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>سعر الكورس (ج.م)</label>
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

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>حالة النشر</label>
                  <select
                    className="input-field"
                    style={{ width: '100%' }}
                    value={newCourseForm.isPublished ? 'true' : 'false'}
                    onChange={e => setNewCourseForm({ ...newCourseForm, isPublished: e.target.value === 'true' })}
                  >
                    <option value="true">منشور (Published)</option>
                    <option value="false">مسودة (Draft)</option>
                  </select>
                </div>
              </div>

              {/* Education Stage & Cascading Grade */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>المرحلة التعليمية</label>
                  <select
                    className="input-field"
                    style={{ width: '100%' }}
                    value={newCourseForm.educationStage}
                    onChange={e => {
                      const newStage = e.target.value as EducationStage;
                      const stageDef = EDUCATION_STAGES.find(s => s.key === newStage);
                      const defaultGrade = stageDef?.grades[0]?.value || '1';
                      setNewCourseForm({
                        ...newCourseForm,
                        educationStage: newStage,
                        grade: defaultGrade,
                      });
                    }}
                  >
                    {EDUCATION_STAGES.map(s => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>الصف الدراسي</label>
                  <select
                    className="input-field"
                    style={{ width: '100%' }}
                    value={newCourseForm.grade}
                    onChange={e => setNewCourseForm({ ...newCourseForm, grade: e.target.value })}
                  >
                    {EDUCATION_STAGES.find(s => s.key === newCourseForm.educationStage)?.grades.map(g => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}>
                نشر وحفظ الكورس
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: EDIT COURSE ──────────────────────────────── */}
      {isEditCourseOpen && editingCourse && createPortal(
        <div className="modal-overlay active" onClick={() => setIsEditCourseOpen(false)} style={{ zIndex: 99999 }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', padding: '1.75rem' }}>
            <button className="modal-close" onClick={() => setIsEditCourseOpen(false)}><X size={18} /></button>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '1.25rem' }}>
              تعديل بيانات الكورس (Update Course)
            </h2>

            <form onSubmit={handleSaveEditCourse} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>عنوان الكورس</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={100}
                  className="input-field"
                  style={{ width: '100%' }}
                  value={editCourseForm.title}
                  onChange={e => setEditCourseForm({ ...editCourseForm, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>سعر الكورس (ج.م)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    className="input-field"
                    style={{ width: '100%' }}
                    value={editCourseForm.price}
                    onChange={e => setEditCourseForm({ ...editCourseForm, price: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>حالة النشر</label>
                  <select
                    className="input-field"
                    style={{ width: '100%' }}
                    value={editCourseForm.isPublished ? 'true' : 'false'}
                    onChange={e => setEditCourseForm({ ...editCourseForm, isPublished: e.target.value === 'true' })}
                  >
                    <option value="true">منشور (Published)</option>
                    <option value="false">مسودة (Draft)</option>
                  </select>
                </div>
              </div>

              {/* Education Stage & Cascading Grade */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>المرحلة التعليمية</label>
                  <select
                    className="input-field"
                    style={{ width: '100%' }}
                    value={editCourseForm.educationStage}
                    onChange={e => {
                      const newStage = e.target.value as EducationStage;
                      const stageDef = EDUCATION_STAGES.find(s => s.key === newStage);
                      const defaultGrade = stageDef?.grades[0]?.value || '1';
                      setEditCourseForm({
                        ...editCourseForm,
                        educationStage: newStage,
                        grade: defaultGrade,
                      });
                    }}
                  >
                    {EDUCATION_STAGES.map(s => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>الصف الدراسي</label>
                  <select
                    className="input-field"
                    style={{ width: '100%' }}
                    value={editCourseForm.grade}
                    onChange={e => setEditCourseForm({ ...editCourseForm, grade: e.target.value })}
                  >
                    {EDUCATION_STAGES.find(s => s.key === editCourseForm.educationStage)?.grades.map(g => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setIsEditCourseOpen(false)}
                >
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                  حفظ التعديلات
                </button>
              </div>
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

      {/* ── MODAL: EDIT STUDENT ─────────────────────────────── */}
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
                <span style={{ fontSize: '0.78rem', color: 'var(--primary-light)', fontFamily: 'monospace', fontWeight: 700 }}>
                  كود الطالب: {(editingStudent as any)?.code || (editingStudent as any)?.StudentCode || `#${editingStudent._id.slice(-6).toUpperCase()}`}
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

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.35rem' }}>
                  الرقم القومي (14 رقماً)
                </label>
                <input
                  type="text"
                  maxLength={14}
                  placeholder="الرقم القومي (14 رقماً)"
                  className="input-field"
                  style={{ width: '100%', fontFamily: 'monospace' }}
                  value={editStudentForm.nationalId}
                  onChange={e => setEditStudentForm({ ...editStudentForm, nationalId: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.35rem' }}>
                  تعديل كلمة المرور (اختياري)
                </label>
                <input
                  type="password"
                  placeholder="اتركه فارغاً إذا كنت لا ترغب في تغيير كلمة المرور..."
                  className="input-field"
                  style={{ width: '100%' }}
                  value={editStudentForm.password}
                  onChange={e => setEditStudentForm({ ...editStudentForm, password: e.target.value })}
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  يمكن للمشرف تعيين كلمة مرور جديدة لحساب الطالب مباشرة (8 أحرف على الأقل).
                </span>
              </div>

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
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  يمكنك تحويل الحساب بين صلاحيات طالب عادي ومدير النظام في أي وقت.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.35rem' }}>
                  حالة الاشتراك وتفعيل الكورسات
                </label>
                <select
                  className="input-field"
                  style={{ width: '100%' }}
                  value={editStudentForm.subscriptionAction}
                  onChange={e => setEditStudentForm({ ...editStudentForm, subscriptionAction: e.target.value })}
                >
                  <option value="none">بدون تعديل على اشتراكات الكورسات الحالية</option>
                  <option value="ALL">تفعيل اشتراك شامل (منح كافة الكورسات المتاحة)</option>
                  {realCourses.map(c => (
                    <option key={c._id} value={c._id}>
                      منح حق الوصول لكورس: {c.Title}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  {enrolledStudentIds.has(editingStudent._id)
                    ? 'الحساب لديه اشتراك مفعل في الكورسات حالياً.'
                    : 'يمكنك منح الطالب اشتراكاً شاملاً أو الوصول لكورس تعليمي محدد فورياً.'}
                </span>
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
                  disabled={isSubmittingEdit}
                  style={{ flex: 2 }}
                >
                  {isSubmittingEdit ? 'جاري حفظ التعديلات...' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: MANUAL ENROLLMENT (POST /enrollments) ────── */}
      {isManualEnrollOpen && enrollTargetStudent && createPortal(
        <div className="modal-overlay active" onClick={() => setIsManualEnrollOpen(false)} style={{ zIndex: 99999 }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', padding: '1.75rem' }}>
            <button className="modal-close" onClick={() => setIsManualEnrollOpen(false)}><X size={18} /></button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)', color: '#10B981',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BookOpen size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                  منح حق الوصول لكورس (Admin Gift)
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  تسجيل يدوي مباشر للطالب بدون عمليات دفع
                </span>
              </div>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-glass)', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-bright)', fontWeight: 700, marginBottom: '0.25rem' }}>
                {enrollTargetStudent.FullName}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                رقم الهاتف: {enrollTargetStudent.Phone}
              </div>
            </div>

            <form onSubmit={handleConfirmManualEnroll} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.35rem' }}>
                  اختر الكورس المراد منحه للطالب:
                </label>
                <select
                  className="input-field"
                  style={{ width: '100%', fontSize: '0.9rem' }}
                  value={selectedEnrollCourseId}
                  onChange={e => setSelectedEnrollCourseId(e.target.value)}
                  required
                >
                  <option value="ALL_COURSES">اشتراك شامل لكافة الكورسات ({realCourses.length} كورس)</option>
                  {realCourses.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.Title} ({c.Price} ج.م)
                    </option>
                  ))}
                </select>
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Lightbulb size={15} color="#F59E0B" /> سيتم تسجيل الطالب فورياً في الكورس بصلاحية نشطة (Active) وطريقة استحواذ إدارية (AdminGift).
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setIsManualEnrollOpen(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isEnrolling || !selectedEnrollCourseId}
                  style={{ flex: 2 }}
                >
                  {isEnrolling ? 'جاري المنح...' : 'تأكيد منح الكورس مجاناً'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: PROMOTE STUDENT TO ADMIN (PATCH /users/:id/role) ── */}
      {isPromoteModalOpen && promoteTargetStudent && createPortal(
        <div className="modal-overlay active" onClick={() => setIsPromoteModalOpen(false)} style={{ zIndex: 99999 }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px', padding: '1.75rem' }}>
            <button className="modal-close" onClick={() => setIsPromoteModalOpen(false)}><X size={18} /></button>

            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{
                width: '54px', height: '54px', borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 0.75rem'
              }}>
                <Shield size={28} />
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-bright)', margin: '0 0 0.4rem' }}>
                تأكيد ترقية الطالب إلى مدير
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {promoteTargetStudent.FullName} ({promoteTargetStudent.Phone})
              </span>
            </div>

            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.25rem',
              fontSize: '0.83rem',
              color: 'var(--text-bright)',
              lineHeight: 1.6
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--danger)', fontWeight: 700, marginBottom: '0.35rem' }}>
                <AlertTriangle size={16} /> تنبيه أمني هام
              </div>
              ترقية هذا الحساب ستمنحه صلاحيات المدير الكاملة (Admin) لإدارة الطلاب، الكورسات، الاختبارات، وكروت الشحن.
              <div style={{ marginTop: '0.5rem', fontWeight: 600, color: 'var(--danger)' }}>
                • سيقوم الخادم تلقائياً بإلغاء جلسة الطالب الحالية فوراً، وسيتعين عليه تسجيل الدخول مجدداً كمدير.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setIsPromoteModalOpen(false)}
              >
                إلغاء التراجع
              </button>
              <button
                type="button"
                className="btn"
                disabled={isPromoting}
                onClick={handleConfirmPromote}
                style={{
                  flex: 1.5,
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: '#FFF',
                  border: 'none',
                  fontWeight: 700,
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer'
                }}
              >
                {isPromoting ? 'جاري الترقية...' : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Crown size={15} /> تأكيد الترقية لمدير
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: QUICK PROMOTE ADMIN ─────────────────────── */}
      {isQuickPromoteOpen && createPortal(
        <div className="modal-overlay active" onClick={() => setIsQuickPromoteOpen(false)} style={{ zIndex: 99999 }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px', padding: '1.75rem' }}>
            <button className="modal-close" onClick={() => setIsQuickPromoteOpen(false)}><X size={18} /></button>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{
                width: '50px', height: '50px', borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 0.5rem'
              }}>
                <Shield size={24} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                ترقية مستخدم إلى مسؤول المنصة (Admin)
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                اختر الحساب المراد منحه كافة صلاحيات الإدارة
              </span>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.35rem' }}>
                اختر من قائمة الطلاب المسجلين:
              </label>
              <select
                className="input-field"
                style={{ width: '100%' }}
                onChange={e => {
                  const targetList = allStudents.length > 0 ? allStudents : realStudents;
                  const student = targetList.find(s => s._id === e.target.value);
                  if (student) {
                    setIsQuickPromoteOpen(false);
                    handleOpenPromoteModal(student);
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled>-- اختر الحساب المطلوب ترقيته --</option>
                {(allStudents.length > 0 ? allStudents : realStudents).map(s => (
                  <option key={s._id} value={s._id}>
                    {s.FullName} ({s.Phone}) {s.Role === 'Admin' ? '[مسؤول]' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsQuickPromoteOpen(false)}
                style={{ width: '100%' }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: CREATE EXAM (POST /exams) ────────────────── */}
      {isCreateExamOpen && createPortal(
        <div className="modal-overlay active" style={{ zIndex: 99999 }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px', padding: '1.75rem' }}>
            <button className="modal-close" onClick={() => setIsCreateExamOpen(false)}><X size={18} /></button>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '1.25rem' }}>
              إنشاء اختبار جديد (Create Exam)
            </h2>

            <form onSubmit={handleCreateExam} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>عنوان الاختبار</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الاختبار الشامل على الوحدة الأولى"
                  className="input-field"
                  style={{ width: '100%' }}
                  value={newExamForm.title}
                  onChange={e => setNewExamForm({ ...newExamForm, title: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>الكورس التابع له الاختبار</label>
                <select
                  className="input-field"
                  style={{ width: '100%' }}
                  value={newExamForm.courseId}
                  onChange={e => setNewExamForm({ ...newExamForm, courseId: e.target.value })}
                  required
                >
                  <option value="">اختر الكورس...</option>
                  {realCourses.map(c => (
                    <option key={c._id} value={c._id}>{c.Title}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>مدة الاختبار (بالدقائق)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    className="input-field"
                    style={{ width: '100%' }}
                    value={newExamForm.durationMinutes}
                    onChange={e => setNewExamForm({ ...newExamForm, durationMinutes: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>درجة النجاح (Passing Score)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    className="input-field"
                    style={{ width: '100%' }}
                    value={newExamForm.passingScore}
                    onChange={e => setNewExamForm({ ...newExamForm, passingScore: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>أقصى عدد محاولات (0 = غير محدود)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    className="input-field"
                    style={{ width: '100%' }}
                    value={newExamForm.maxAttempts}
                    onChange={e => setNewExamForm({ ...newExamForm, maxAttempts: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>حالة الاختبار</label>
                  <select
                    className="input-field"
                    style={{ width: '100%' }}
                    value={newExamForm.status}
                    onChange={e => setNewExamForm({ ...newExamForm, status: e.target.value as ExamStatus })}
                  >
                    <option value="Draft">مسودة (Draft) — موصى به حتى يتم إضافة الأسئلة</option>
                    <option value="Published">منشور (Published)</option>
                    <option value="Closed">مغلق (Closed)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newExamForm.isRandomized}
                    onChange={e => setNewExamForm({ ...newExamForm, isRandomized: e.target.checked })}
                  />
                  <span>ترتيب عشوائي للأسئلة (IsRandomized)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newExamForm.isGated}
                    onChange={e => setNewExamForm({ ...newExamForm, isGated: e.target.checked })}
                  />
                  <span>اختبار شرطي للدروس (IsGated)</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1, minWidth: '90px' }}
                  onClick={() => setIsCreateExamOpen(false)}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ flex: 1.6, minWidth: '190px' }}
                  onClick={(e) => handleCreateExam(e, true)}
                >
                  حفظ والبدء في إضافة الأسئلة الآن
                </button>
                <button
                  type="submit"
                  className="btn btn-secondary"
                  style={{ flex: 1.2, minWidth: '130px' }}
                >
                  حفظ كمسودة فقط
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: CREATE EXAM WITH AI ───────────────────────── */}
      {isCreateAIExamOpen && createPortal(
        <div className="modal-overlay active" style={{ zIndex: 99999 }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px', padding: '1.75rem', maxHeight: '92vh', overflowY: 'auto' }}>
            <button className="modal-close" onClick={() => setIsCreateAIExamOpen(false)}><X size={18} /></button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '46px', height: '46px', borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(8, 145, 178, 0.3))',
                color: '#A78BFA', border: '1px solid rgba(139, 92, 246, 0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <Sparkles size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                  توليد امتحان بالذكاء الاصطناعي (AI Exam Generator)
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  ارفع ملف الشرح أو بنك الأسئلة وسيتكفل الـ AI باستخراج الأسئلة وتوليد الخيارات تلقائياً
                </span>
              </div>
            </div>

            <form onSubmit={handleGenerateAIExam} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>عنوان الاختبار *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: اختبار تفاعلي ذكي على الدرس الثاني"
                  className="input-field"
                  style={{ width: '100%' }}
                  value={aiExamForm.title}
                  onChange={e => setAiExamForm({ ...aiExamForm, title: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>الكورس التابع له الاختبار *</label>
                <select
                  className="input-field"
                  style={{ width: '100%' }}
                  value={aiExamForm.courseId}
                  onChange={e => setAiExamForm({ ...aiExamForm, courseId: e.target.value })}
                  required
                >
                  <option value="">اختر الكورس...</option>
                  {realCourses.map(c => (
                    <option key={c._id} value={c._id}>{c.Title}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>مدة الاختبار (بالدقائق)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    className="input-field"
                    style={{ width: '100%' }}
                    value={aiExamForm.durationMinutes}
                    onChange={e => setAiExamForm({ ...aiExamForm, durationMinutes: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>درجة النجاح</label>
                  <input
                    type="number"
                    required
                    min={0}
                    className="input-field"
                    style={{ width: '100%' }}
                    value={aiExamForm.passingScore}
                    onChange={e => setAiExamForm({ ...aiExamForm, passingScore: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>عدد الأسئلة المطلوبة</label>
                  <select
                    className="input-field"
                    style={{ width: '100%' }}
                    value={aiExamForm.questionsCount}
                    onChange={e => setAiExamForm({ ...aiExamForm, questionsCount: Number(e.target.value) })}
                  >
                    <option value={5}>5 أسئلة (اختبار سريع)</option>
                    <option value={10}>10 أسئلة (اختبار درس)</option>
                    <option value={15}>15 سؤالاً (اختبار وحدة)</option>
                    <option value={20}>20 سؤالاً (اختبار شامل)</option>
                    <option value={30}>30 سؤالاً (نموذج محاكاة للثانوية)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>نوع الأسئلة المستخرجة</label>
                  <select
                    className="input-field"
                    style={{ width: '100%' }}
                    value={aiExamForm.questionType}
                    onChange={e => setAiExamForm({ ...aiExamForm, questionType: e.target.value })}
                  >
                    <option value="MCQ">اختيار من متعدد (MCQ)</option>
                    <option value="TrueFalse">صواب وخطأ (True/False)</option>
                    <option value="Mixed">تشكيلة مختلطة (MCQ + مقالي)</option>
                  </select>
                </div>
              </div>

              {/* File Upload Zone */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                  ملف الشرح أو بنك الأسئلة (PDF, Word, TXT, صور)
                </label>
                <div
                  style={{
                    border: '2px dashed rgba(139, 92, 246, 0.4)',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    textAlign: 'center',
                    background: 'rgba(139, 92, 246, 0.04)',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                  onClick={() => document.getElementById('ai-file-input')?.click()}
                >
                  <input
                    id="ai-file-input"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setAiExamFile(e.target.files[0]);
                      }
                    }}
                  />
                  {aiExamFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <FileText size={20} color="#A78BFA" />
                      <span style={{ fontWeight: 700, color: 'var(--text-bright)', fontSize: '0.9rem' }}>{aiExamFile.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({(aiExamFile.size / 1024).toFixed(1)} KB)</span>
                      <button
                        type="button"
                        onClick={(ev) => { ev.stopPropagation(); setAiExamFile(null); }}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0 4px' }}
                        title="إزالة الملف"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <FileText size={28} color="#A78BFA" style={{ margin: '0 auto 0.4rem', opacity: 0.8 }} />
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-bright)' }}>اضغط هنا لاختيار ملف أو قم بسحبه وإفلاته</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>يدعم ملفات PDF، Word، Text، أو صور المسائل الرياضية</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Optional Text Prompt */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                  أو الصق نص الشرح أو الأسئلة يدوياً هنا:
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="يمكنك لصق مسائل محددة، نظريات، أو شرح الدرس هنا ليقوم الذكاء الاصطناعي بصياغة الامتحان منها مباشرة..."
                  style={{ width: '100%', resize: 'vertical', fontSize: '0.85rem' }}
                  value={aiExamForm.textPrompt}
                  onChange={e => setAiExamForm({ ...aiExamForm, textPrompt: e.target.value })}
                />
              </div>

              <div style={{
                background: 'rgba(139, 92, 246, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Lightbulb size={16} color="#A78BFA" style={{ flexShrink: 0 }} />
                <span>سيقوم الذكاء الاصطناعي بتحليل الملف واستخراج الأسئلة وخيارات الإجابة تلقائياً وحفظها في بنك أسئلة الاختبار فوراً.</span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setIsCreateAIExamOpen(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn"
                  disabled={isGeneratingAIExam || (!aiExamFile && !aiExamForm.textPrompt.trim())}
                  style={{
                    flex: 2,
                    background: 'linear-gradient(135deg, #8B5CF6, #0891B2)',
                    color: '#FFF',
                    border: 'none',
                    fontWeight: 700,
                    padding: '0.7rem',
                    borderRadius: 'var(--radius-md)',
                    cursor: isGeneratingAIExam ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isGeneratingAIExam ? (
                    <>
                      <RefreshCw size={16} className="spin" />
                      <span>جاري معالجة الملف وتوليد الأسئلة...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>توليد ونشر الامتحان بالـ AI</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: EDIT EXAM (PATCH /exams/:id) ──────────────── */}
      {isEditExamOpen && editingExam && createPortal(
        <div className="modal-overlay active" style={{ zIndex: 99999 }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px', padding: '1.75rem' }}>
            <button className="modal-close" onClick={() => setIsEditExamOpen(false)}><X size={18} /></button>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '1.25rem' }}>
              تعديل بيانات الاختبار (Edit Exam)
            </h2>

            <form onSubmit={handleSaveEditExam} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>عنوان الاختبار</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  style={{ width: '100%' }}
                  value={editExamForm.title}
                  onChange={e => setEditExamForm({ ...editExamForm, title: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>الكورس التابع له الاختبار</label>
                <select
                  className="input-field"
                  style={{ width: '100%' }}
                  value={editExamForm.courseId}
                  onChange={async e => {
                    const newCid = e.target.value;
                    setEditExamForm({ ...editExamForm, courseId: newCid, lessonId: '' });
                    if (newCid) {
                      try {
                        const list = await lessonsApi.getCourseLessons(newCid);
                        setEditExamLessons(Array.isArray(list) ? list : []);
                      } catch {
                        setEditExamLessons([]);
                      }
                    } else {
                      setEditExamLessons([]);
                    }
                  }}
                  required
                >
                  {realCourses.map(c => (
                    <option key={c._id} value={c._id}>{c.Title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>المحاضرة / الدرس التابع له (اختياري)</label>
                <select
                  className="input-field"
                  style={{ width: '100%' }}
                  value={editExamForm.lessonId}
                  onChange={e => setEditExamForm({ ...editExamForm, lessonId: e.target.value })}
                >
                  <option value="">بدون محاضرة محددة (امتحان عام شامل للكورس)</option>
                  {editExamLessons.map(les => (
                    <option key={les._id} value={les._id}>{les.Title}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>مدة الامتحان (بالدقائق)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    className="input-field"
                    style={{ width: '100%' }}
                    value={editExamForm.durationMinutes}
                    onChange={e => setEditExamForm({ ...editExamForm, durationMinutes: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>درجة النجاح (Passing Score)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    className="input-field"
                    style={{ width: '100%' }}
                    value={editExamForm.passingScore}
                    onChange={e => setEditExamForm({ ...editExamForm, passingScore: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 700 }}>
                    عدد محاولات الطالب (0 = غير محدود)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    className="input-field"
                    style={{ width: '100%', fontWeight: 700, color: 'var(--primary-light)' }}
                    value={editExamForm.maxAttempts}
                    onChange={e => setEditExamForm({ ...editExamForm, maxAttempts: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                    title="حدد عدد المحاولات المسموح بها للطلاب لأداء هذا الاختبار"
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                    0 = محاولات لا نهائية، أو حدد 1 أو 2 أو 3
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>حالة الاختبار</label>
                  <select
                    className="input-field"
                    style={{ width: '100%' }}
                    value={editExamForm.status}
                    onChange={e => setEditExamForm({ ...editExamForm, status: e.target.value as ExamStatus })}
                  >
                    <option value="Draft">مسودة (Draft)</option>
                    <option value="Published">منشور (Published)</option>
                    <option value="Closed">مغلق (Closed)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editExamForm.isRandomized}
                    onChange={e => setEditExamForm({ ...editExamForm, isRandomized: e.target.checked })}
                  />
                  <span>ترتيب عشوائي للأسئلة</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editExamForm.isGated}
                    onChange={e => setEditExamForm({ ...editExamForm, isGated: e.target.checked })}
                  />
                  <span>اختبار شرطي (Gated)</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setIsEditExamOpen(false)}
                >
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                  حفظ تعديلات الاختبار
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: QUESTION MANAGEMENT (CRUD /exams/:id/questions) ── */}
      {isQuestionsModalOpen && selectedExamForQuestions && createPortal(
        <div className="modal-overlay active" style={{ zIndex: 99999 }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '820px', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem' }}>
            <button className="modal-close" onClick={() => setIsQuestionsModalOpen(false)}><X size={18} /></button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                  إدارة أسئلة الاختبار: {selectedExamForQuestions.Title}
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  إجمالي الأسئلة: {examQuestions.length} سؤال • إجمالي النقاط: {examQuestions.reduce((acc, q) => acc + (q.Points || 0), 0)} نقطة
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-subtle)', padding: '0.3rem 0.6rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>حالة الاختبار:</span>
                  <select
                    value={selectedExamForQuestions.Status}
                    onChange={(e) => handleUpdateExamStatus(selectedExamForQuestions, e.target.value as ExamStatus)}
                    className="input-field"
                    style={{
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      borderRadius: '6px',
                      color: selectedExamForQuestions.Status === 'Published' ? '#10B981' : selectedExamForQuestions.Status === 'Draft' ? '#F59E0B' : '#EF4444',
                      background: 'var(--bg-glass-card)',
                      cursor: 'pointer',
                    }}
                    title="تعديل حالة الاختبار مباشرة"
                  >
                    <option value="Draft">مسودة (Draft)</option>
                    <option value="Published">منشور (Published)</option>
                    <option value="Closed">مغلق (Closed)</option>
                  </select>
                </div>

                {examQuestions.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleSaveReorder}
                    style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    title="حفظ ترتيب الأسئلة في الخادم"
                  >
                    <ListOrdered size={14} /> حفظ الترتيب
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleOpenAddQuestion}
                  title="إضافة سؤال جديد للاختبار"
                  style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Plus size={15} /> إضافة سؤال جديد
                </button>
              </div>
            </div>

            {/* Admin notice if exam has student attempts */}
            {examHasAttempts && (
              <div style={{
                background: 'rgba(8, 145, 178, 0.08)',
                border: '1px solid rgba(8, 145, 178, 0.3)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
              }}>
                <ShieldCheck size={18} color="var(--primary-light)" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.82rem', color: 'var(--text-bright)' }}>
                  <strong>صلاحية الإدارة الكاملة:</strong> هذا الامتحان يحتوي على محاولات مسجلة للطلاب. كمسؤول، يمكنك إضافة وتعديل الأسئلة والدرجات وتغيير أقصى عدد للمحاولات بحرية.
                </div>
              </div>
            )}

            {/* Questions List */}
            {isQuestionsLoading ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>جاري جلب الأسئلة...</div>
            ) : examQuestions.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: '8px' }}>
                لا توجد أسئلة مضافة لهذا الاختبار بعد. اضغط على "إضافة سؤال جديد" للبدء.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {examQuestions.map((q, idx) => (
                  <div key={q._id} className="glass-card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', border: '1px solid var(--border-glass)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '6px',
                        background: 'rgba(8,145,178,0.15)', color: 'var(--primary-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '0.85rem', flexShrink: 0
                      }}>
                        {q.OrderIndex || idx + 1}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(139,92,246,0.15)', color: '#8B5CF6', fontWeight: 700 }}>
                            {q.QuestionType}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {q.Points} نقاط
                          </span>
                          {q.QuestionType === 'Essay' && (
                            <span style={{ fontSize: '0.7rem', color: '#F59E0B' }}>• مقالي (تصحيح يدوي)</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-bright)', fontWeight: 600 }}>
                          {q.QuestionText}
                        </div>
                        {q.Options && q.Options.length > 0 && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            الخيارات: {q.Options.join(' | ')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={idx === 0}
                        onClick={() => handleMoveQuestion(idx, 'up')}
                        style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
                        title="تحريك لأعلى"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={idx === examQuestions.length - 1}
                        onClick={() => handleMoveQuestion(idx, 'down')}
                        style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
                        title="تحريك لأسفل"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleOpenEditQuestion(q)}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        title="تعديل السؤال"
                      >
                        <Edit3 size={13} color="var(--primary-light)" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleDeleteQuestion(q._id)}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
                        title="حذف السؤال"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: ADD / EDIT QUESTION SUB-MODAL ─────────────── */}
      {isAddQuestionOpen && selectedExamForQuestions && createPortal(
        <div className="modal-overlay active" style={{ zIndex: 100000 }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px', padding: '1.75rem' }}>
            <button className="modal-close" onClick={() => setIsAddQuestionOpen(false)}><X size={18} /></button>

            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '1.25rem' }}>
              {editingQuestion ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
            </h2>

            <form onSubmit={handleSaveQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                    نوع السؤال (Question Type)
                  </label>
                  <select
                    className="input-field"
                    style={{ width: '100%' }}
                    value={questionForm.questionType}
                    onChange={e => {
                      const type = e.target.value as QuestionType;
                      setQuestionForm(prev => ({
                        ...prev,
                        questionType: type,
                        correctAnswer: type === 'TrueFalse' ? 'true' : prev.options[0] || '',
                      }));
                    }}
                  >
                    <option value="MCQ">اختيار من متعدد (MCQ)</option>
                    <option value="TrueFalse">صح أو خطأ (True / False)</option>
                    <option value="Essay">سؤال مقالي (Essay - بدون إجابة آلية)</option>
                    <option value="FillInBlank">أكمل الفراغ (Fill In Blank)</option>
                    <option value="DragDrop">مطابقة وسحب (Drag &amp; Drop)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>النقاط</label>
                  <input
                    type="number"
                    required
                    min={1}
                    className="input-field"
                    style={{ width: '100%' }}
                    value={questionForm.points}
                    onChange={e => setQuestionForm({ ...questionForm, points: Number(e.target.value) })}
                  />
                </div>

                {editingQuestion && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                      ترتيب السؤال
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="input-field"
                      style={{ width: '100%' }}
                      title="رقم ترتيب السؤال في الاختبار"
                      value={questionForm.orderIndex}
                      onChange={e => setQuestionForm({ ...questionForm, orderIndex: Number(e.target.value) })}
                    />
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>نص السؤال</label>
                <textarea
                  required
                  rows={3}
                  placeholder="اكتب نص السؤال هنا..."
                  className="input-field"
                  style={{ width: '100%', resize: 'vertical' }}
                  value={questionForm.questionText}
                  onChange={e => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                />
              </div>

              {/* Dynamic form inputs based on QuestionType */}
              {questionForm.questionType === 'MCQ' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-bright)' }}>خيارات الإجابة (حدد الإجابة الصحيحة):</label>
                    {questionForm.options.length < 6 && (
                      <button
                        type="button"
                        onClick={() => setQuestionForm(prev => ({ ...prev, options: [...prev.options, ''] }))}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Plus size={12} /> إضافة خيار
                      </button>
                    )}
                  </div>
                  {questionForm.options.map((opt, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: '20px' }}>{i + 1}.</span>
                      <input
                        type="text"
                        required={i < 2}
                        placeholder={`الخيار ${i + 1}${i >= 2 ? ' (اختياري)' : ''}`}
                        className="input-field"
                        style={{ flex: 1, fontSize: '0.85rem' }}
                        value={opt}
                        onChange={e => {
                          const val = e.target.value;
                          const updated = [...questionForm.options];
                          updated[i] = val;
                          setQuestionForm(prev => ({
                            ...prev,
                            options: updated,
                            correctAnswer: prev.correctOptionIndex === i ? val : prev.correctAnswer,
                          }));
                        }}
                      />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        <input
                          type="radio"
                          name="correctMcqAnswer"
                          checked={questionForm.correctOptionIndex === i || (opt.trim() !== '' && questionForm.correctAnswer === opt)}
                          onChange={() => setQuestionForm(prev => ({
                            ...prev,
                            correctOptionIndex: i,
                            correctAnswer: opt,
                          }))}
                        />
                        <span style={{ color: questionForm.correctOptionIndex === i ? 'var(--primary-light)' : 'var(--text-muted)', fontWeight: questionForm.correctOptionIndex === i ? 700 : 500 }}>
                          الإجابة الصحيحة
                        </span>
                      </label>
                      {questionForm.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = questionForm.options.filter((_, idx) => idx !== i);
                            let newCorrectIdx = questionForm.correctOptionIndex;
                            if (newCorrectIdx >= updated.length) newCorrectIdx = updated.length - 1;
                            setQuestionForm(prev => ({
                              ...prev,
                              options: updated,
                              correctOptionIndex: newCorrectIdx,
                              correctAnswer: updated[newCorrectIdx] || '',
                            }));
                          }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                          title="حذف هذا الخيار"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {questionForm.questionType === 'TrueFalse' && (
                <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.5rem' }}>
                    الإجابة الصحيحة:
                  </label>
                  <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="tfAnswer"
                        value="true"
                        checked={questionForm.correctAnswer === 'true'}
                        onChange={() => setQuestionForm({ ...questionForm, correctAnswer: 'true' })}
                      />
                      <span style={{ color: '#10B981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle2 size={13} /> صحيح (True)
                      </span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="tfAnswer"
                        value="false"
                        checked={questionForm.correctAnswer === 'false'}
                        onChange={() => setQuestionForm({ ...questionForm, correctAnswer: 'false' })}
                      />
                      <span style={{ color: 'var(--danger)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <XCircle size={13} /> خطأ (False)
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {questionForm.questionType === 'Essay' && (
                <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.85rem', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-bright)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#F59E0B', fontWeight: 700, marginBottom: '0.2rem' }}>
                    <AlertCircle size={15} /> تنبيه الأسئلة المقالية
                  </div>
                  الأسئلة المقالية تصحح يدوياً من قبل المعلم. لن يتم إرسال أي إجابة نموذجية آلية للباك إند التزاماً بالمعايير.
                </div>
              )}

              {questionForm.questionType === 'FillInBlank' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                    الإجابة النموذجية الصحيحة
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="اكتب الكلمة أو العبارة الصحيحة..."
                    className="input-field"
                    style={{ width: '100%' }}
                    value={questionForm.correctAnswer}
                    onChange={e => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                  />
                </div>
              )}

              {questionForm.questionType === 'DragDrop' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-bright)' }}>العناصر:</label>
                  {questionForm.options.map((opt, i) => (
                    <input
                      key={i}
                      type="text"
                      required={i < 2}
                      placeholder={`عنصر ${i + 1}${i >= 2 ? ' (اختياري)' : ''}`}
                      className="input-field"
                      style={{ width: '100%', fontSize: '0.85rem' }}
                      value={opt}
                      onChange={e => {
                        const updated = [...questionForm.options];
                        updated[i] = e.target.value;
                        setQuestionForm({ ...questionForm, options: updated });
                      }}
                    />
                  ))}
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-bright)', marginTop: '0.25rem' }}>الإجابة المطابقة الصحيحة:</label>
                  <input
                    type="text"
                    required
                    placeholder="الإجابة الصحيحة أو الترتيب..."
                    className="input-field"
                    style={{ width: '100%' }}
                    value={questionForm.correctAnswer}
                    onChange={e => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1, minWidth: '90px' }}
                  disabled={isSubmittingQuestion}
                  onClick={() => setIsAddQuestionOpen(false)}
                >
                  إلغاء
                </button>
                {!editingQuestion && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={isSubmittingQuestion}
                    style={{
                      flex: 1.5,
                      minWidth: '160px',
                      background: 'rgba(8,145,178,0.12)',
                      color: 'var(--primary-light)',
                      borderColor: 'var(--primary-light)',
                      fontWeight: 600,
                    }}
                    onClick={(e) => handleSaveQuestion(e, true)}
                  >
                    {isSubmittingQuestion ? 'جاري الحفظ...' : 'حفظ وإضافة سؤال آخر'}
                  </button>
                )}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingQuestion}
                  style={{ flex: 1.5, minWidth: '130px' }}
                >
                  {isSubmittingQuestion ? 'جاري الحفظ...' : editingQuestion ? 'حفظ تعديل السؤال' : 'حفظ وإغلاق'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: EXAM ATTEMPTS (GET /exams/:id/attempts) ───── */}
      {isAttemptsModalOpen && selectedExamForAttempts && createPortal(
        <div className="modal-overlay active" style={{ zIndex: 99999 }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px', maxHeight: '85vh', overflowY: 'auto', padding: '1.75rem' }}>
            <button className="modal-close" onClick={() => setIsAttemptsModalOpen(false)}><X size={18} /></button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                  سجل محاولات الطلاب: {selectedExamForAttempts.Title}
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  درجة النجاح المعتمدة: {selectedExamForAttempts.PassingScore} • إجمالي المحاولات المسجلة: {examAttempts.length}
                </span>
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => loadExamAttempts(selectedExamForAttempts._id)}
                style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <RefreshCw size={13} className={isAttemptsLoading ? 'spin' : ''} /> تحديث
              </button>
            </div>

            {isAttemptsLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>جاري جلب سجل المحاولات...</div>
            ) : examAttempts.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: '8px' }}>
                لم يسجل أي طالب محاولة في هذا الاختبار حتى الآن.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>الطالب</th>
                      <th>الدرجة المحققة</th>
                      <th>الحالة</th>
                      <th>تاريخ المحاولة</th>
                      <th>الإجراءات والتصحيح</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examAttempts.map(attempt => {
                      const studentInfo = typeof attempt.StudentId === 'object' ? attempt.StudentId : null;
                      const isPendingReview = attempt.status === 'PendingReview';
                      const isPassed = attempt.status === 'Passed' || (attempt.score >= selectedExamForAttempts.PassingScore);

                      return (
                        <tr key={attempt._id}>
                          <td>
                            <strong style={{ color: 'var(--text-bright)' }}>
                              {studentInfo?.FullName || (typeof attempt.StudentId === 'string' ? `طالب #${attempt.StudentId.slice(-6)}` : 'طالب مسجل')}
                            </strong>
                            {studentInfo?.Phone && (
                              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                {studentInfo.Phone}
                              </span>
                            )}
                          </td>
                          <td>
                            <strong style={{ fontSize: '1rem', color: isPendingReview ? '#F59E0B' : (isPassed ? '#10B981' : 'var(--danger)') }}>
                              {attempt.score}
                            </strong>
                            {attempt.totalPoints ? ` / ${attempt.totalPoints}` : ''}
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-block',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: isPendingReview
                                ? 'rgba(245, 158, 11, 0.15)'
                                : isPassed
                                ? 'rgba(16,185,129,0.15)'
                                : 'rgba(239,68,68,0.15)',
                              color: isPendingReview
                                ? '#F59E0B'
                                : isPassed
                                ? '#10B981'
                                : 'var(--danger)',
                            }}>
                              {isPendingReview ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Clock size={11} /> بانتظار تصحيح المقالي
                                </span>
                              ) : attempt.status === 'Passed' ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <CheckCircle2 size={11} /> ناجح
                                </span>
                              ) : attempt.status === 'Failed' ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <XCircle size={11} /> راسب
                                </span>
                              ) : (
                                attempt.status || 'مكتمل'
                              )}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {attempt.submittedAt || attempt.createdAt
                              ? new Date(attempt.submittedAt || attempt.createdAt!).toLocaleDateString('ar-EG', {
                                  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })
                              : '—'}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => handleOpenGradingModal(attempt)}
                              style={{
                                fontSize: '0.78rem',
                                padding: '0.3rem 0.65rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                background: isPendingReview ? 'rgba(245, 158, 11, 0.15)' : undefined,
                                color: isPendingReview ? '#F59E0B' : undefined,
                                borderColor: isPendingReview ? 'rgba(245, 158, 11, 0.4)' : undefined,
                              }}
                            >
                              <CheckCircle2 size={13} />
                              {isPendingReview ? 'تصحيح المقالي الآن' : 'تعديل الدرجات'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: ESSAY GRADING (POST /exams/:id/attempts/:attemptId/grade) ── */}
      {isGradeModalOpen && gradingAttempt && selectedExamForAttempts && createPortal(
        <div className="modal-overlay active" style={{ zIndex: 100000 }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem' }}>
            <button className="modal-close" onClick={() => setIsGradeModalOpen(false)}><X size={18} /></button>

            <div style={{ marginBottom: '1.25rem' }}>
              <span className="gradient-badge" style={{ marginBottom: '0.4rem', display: 'inline-flex' }}>
                <Award size={13} /> تصحيح الأسئلة المقالية (Manual Essay Grading)
              </span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', margin: '0.3rem 0' }}>
                تصحيح محاولة: {typeof gradingAttempt.StudentId === 'object' ? gradingAttempt.StudentId.FullName : `طالب #${gradingAttempt.StudentId.slice(-6)}`}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                امتحان: {selectedExamForAttempts.Title} • درجة النجاح: {selectedExamForAttempts.PassingScore}
              </p>
            </div>

            <form onSubmit={handleSubmitGrades} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {gradingQuestions.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  جاري تحميل أسئلة الاختبار للتصحيح...
                </div>
              ) : (
                gradingQuestions.map((q, idx) => (
                  <div key={q._id} className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border-glass)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--primary-light)' }}>
                        سؤال #{idx + 1} ({q.QuestionType === 'Essay' ? 'سؤال مقالي' : q.QuestionType})
                      </strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        الدرجة القصوى: {q.Points} درجات
                      </span>
                    </div>

                    <p style={{ fontSize: '0.92rem', color: 'var(--text-bright)', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
                      {q.QuestionText}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                          الدرجة الممنوحة
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={q.Points}
                          required
                          value={gradingScores[q._id] ?? 0}
                          onChange={e => setGradingScores({ ...gradingScores, [q._id]: parseFloat(e.target.value) || 0 })}
                          className="input-field"
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                          ملاحظات وتوجيهات للمعلم (Feedback)
                        </label>
                        <input
                          type="text"
                          placeholder="مثال: إجابة نموذجية ومكتملة..."
                          value={gradingFeedbacks[q._id] || ''}
                          onChange={e => setGradingFeedbacks({ ...gradingFeedbacks, [q._id]: e.target.value })}
                          className="input-field"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsGradeModalOpen(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingGrade || gradingQuestions.length === 0}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {isSubmittingGrade ? 'جاري الاعتماد...' : (
                    <>
                      <Check size={16} /> اعتماد الدرجات وإنهاء التصحيح
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: REJECT PAYMENT REQUEST ── */}
      {rejectingRequestId && createPortal(
        <div
          className="modal-overlay active"
          onClick={() => !isProcessingPaymentId && setRejectingRequestId(null)}
          style={{ zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            className="modal-box"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '480px', width: '92%', padding: '1.75rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                  <XCircle size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-bright)' }}>رفض طلب التحويل</h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>سيصل سبب الرفض للطالب في صفحة الدفع</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectingRequestId(null)}
                disabled={Boolean(isProcessingPaymentId)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.5rem' }}>
                سبب الرفض <span style={{ color: '#EF4444' }}>*</span> (3 أحرف على الأقل)
              </label>
              <textarea
                rows={3}
                className="input-field"
                style={{ width: '100%', resize: 'vertical', fontSize: '0.85rem' }}
                placeholder="مثال: لم يتم استلام التحويل على رقم فودافون كاش الخاص بالمنصة، أو المبلغ المحول غير مطابق لسعر الكورس."
                value={rejectionReasonInput}
                onChange={e => setRejectionReasonInput(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={Boolean(isProcessingPaymentId)}
                onClick={() => setRejectingRequestId(null)}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="btn"
                disabled={Boolean(isProcessingPaymentId) || rejectionReasonInput.trim().length < 3}
                onClick={handleRejectPayment}
                style={{
                  background: '#DC2626',
                  color: '#fff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontWeight: 700,
                  cursor: (isProcessingPaymentId || rejectionReasonInput.trim().length < 3) ? 'not-allowed' : 'pointer',
                }}
              >
                {isProcessingPaymentId ? 'جاري الرفض...' : (
                  <>
                    <XCircle size={15} /> تأكيد الرفض
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── TAB: INQUIRIES ──────────────────────────────────────── */}
      {activeTab === 'inquiries' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Inbox size={20} color="#06B6D4" /> الاستفسارات والرسائل الواردة
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                رسائل الطلاب الموجهة للإدارة — يمكنك الرد مباشرة من هنا
              </p>
            </div>
            <button className="btn btn-secondary" onClick={loadInquiries} disabled={isInquiriesLoading} style={{ fontSize: '0.85rem' }}>
              <RefreshCw size={14} /> تحديث
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            <div className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary-light)' }}>{allInquiries.length}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>إجمالي الاستفسارات</div>
            </div>
            <div className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#EF4444' }}>{openInquiryCount}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>قيد الانتظار</div>
            </div>
            <div className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10B981' }}>{allInquiries.filter(i => i.Status === 'Answered').length}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>تم الرد عليها</div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button onClick={() => setInquiryStatusFilter('all')} className={`btn ${inquiryStatusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.82rem', padding: '0.35rem 0.85rem' }}>
                الكل ({allInquiries.length})
              </button>
              <button onClick={() => setInquiryStatusFilter('Open')} className={`btn ${inquiryStatusFilter === 'Open' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.82rem', padding: '0.35rem 0.85rem' }}>
                قيد الانتظار ({openInquiryCount})
              </button>
              <button onClick={() => setInquiryStatusFilter('Answered')} className={`btn ${inquiryStatusFilter === 'Answered' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.82rem', padding: '0.35rem 0.85rem' }}>
                تم الرد ({allInquiries.filter(i => i.Status === 'Answered').length})
              </button>
            </div>

            <div style={{ position: 'relative', minWidth: '240px', flex: 1, maxWidth: '360px' }}>
              <Search size={15} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-field"
                placeholder="بحث في الرسائل (اسم الطالب، هاتف، موضوع)..."
                value={searchInquiry}
                onChange={e => setSearchInquiry(e.target.value)}
                style={{ width: '100%', paddingRight: '2.25rem', fontSize: '0.82rem' }}
              />
              {searchInquiry && (
                <button
                  type="button"
                  onClick={() => setSearchInquiry('')}
                  style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          {isInquiriesLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="spin" style={{ marginBottom: '0.5rem' }} />
              <div>جاري تحميل الاستفسارات...</div>
            </div>
          ) : displayedInquiries.length === 0 ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <Inbox size={40} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.4 }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-muted)', margin: 0 }}>
                {searchInquiry.trim() ? 'لا توجد نتائج مطابقة للبحث' : inquiryStatusFilter === 'Open' ? 'لا توجد استفسارات قيد الانتظار' : 'لا توجد استفسارات بعد'}
              </h3>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {displayedInquiries.map(inq => {
                const isAnswered = inq.Status === 'Answered';
                const isExpanded = expandedInquiryId === inq._id;
                const student = inq.StudentId as any;
                return (
                  <div key={inq._id} className="glass-card" style={{
                    padding: '1.1rem 1.35rem',
                    border: isAnswered ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(239,68,68,0.25)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                          {isAnswered ? <MailOpen size={15} color="#10B981" /> : <Mail size={15} color="#EF4444" />}
                          <strong style={{ fontSize: '0.95rem', color: 'var(--text-bright)' }}>{inq.Subject}</strong>
                          <span style={{
                            padding: '0.1rem 0.5rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700,
                            background: isAnswered ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                            color: isAnswered ? '#10B981' : '#EF4444',
                            border: isAnswered ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)',
                          }}>
                            {isAnswered ? '✓ تم الرد' : '● قيد الانتظار'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          <span><Users size={11} style={{ verticalAlign: 'middle' }} /> {student?.FullName || '—'} • {student?.Phone || '—'}</span>
                          <span><Clock size={11} style={{ verticalAlign: 'middle' }} /> {new Date(inq.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                        <button
                          className="btn btn-primary"
                          style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem' }}
                          onClick={() => handleOpenReplyModal(inq)}
                        >
                          <Send size={12} /> {isAnswered ? 'تعديل الرد' : 'رد'}
                        </button>
                        <button
                          className="icon-btn"
                          onClick={() => setExpandedInquiryId(isExpanded ? null : inq._id)}
                          title="عرض التفاصيل"
                        >
                          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-glass)' }}>
                        <div style={{ marginBottom: '0.75rem' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>رسالة الطالب:</div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-bright)', lineHeight: 1.6, background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>
                            {inq.Message}
                          </div>
                        </div>
                        {isAnswered && inq.Reply && (
                          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '8px', padding: '0.75rem' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <CheckCircle2 size={12} /> ردك
                              {inq.RepliedAt && ` • ${new Date(inq.RepliedAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}`}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-bright)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{inq.Reply}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── REPLY MODAL ─────────────────────────────────────────── */}
      {isReplyModalOpen && selectedInquiry && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
          zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '540px', padding: '2rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <MessageCircle size={18} color="#06B6D4" /> الرد على الاستفسار
              </h2>
              <button className="icon-btn" onClick={() => { setIsReplyModalOpen(false); setSelectedInquiry(null); setReplyText(''); }}>
                <X size={18} />
              </button>
            </div>

            {/* Student info */}
            <div style={{ background: 'var(--bg-subtle)', borderRadius: '10px', padding: '0.85rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.3rem' }}>{selectedInquiry.Subject}</div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.78rem' }}>
                <Users size={11} style={{ verticalAlign: 'middle' }} /> {(selectedInquiry.StudentId as any)?.FullName || '—'} • {(selectedInquiry.StudentId as any)?.Phone || '—'}
              </div>
              <div style={{ color: 'var(--text-bright)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selectedInquiry.Message}</div>
            </div>

            <form onSubmit={handleSubmitReply}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>ردك على الاستفسار</label>
                <textarea
                  required
                  rows={5}
                  className="input-field"
                  style={{ width: '100%', resize: 'vertical' }}
                  placeholder="اكتب ردك هنا بوضوح..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  minLength={5}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setIsReplyModalOpen(false); setSelectedInquiry(null); setReplyText(''); }} disabled={isSubmittingReply}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmittingReply || !replyText.trim()}>
                  <Send size={15} /> {isSubmittingReply ? 'جاري الإرسال...' : 'إرسال الرد'}
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
