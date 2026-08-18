export type UserRole = 'student' | 'admin' | 'teacher' | 'parent';

export type AcademicYear = 'first_secondary' | 'second_secondary' | 'third_secondary';

export const ACADEMIC_YEAR_LABELS: Record<AcademicYear, string> = {
  first_secondary: 'الصف الأول الثانوي',
  second_secondary: 'الصف الثاني الثانوي',
  third_secondary: 'الصف الثالث الثانوي',
};

export type TeacherPermission =
  | 'view_students'
  | 'view_reports'
  | 'upload_lessons'
  | 'edit_lessons'
  | 'publish_lessons'
  | 'upload_exams'
  | 'edit_exams'
  | 'publish_exams'
  | 'assign_lessons'
  | 'assign_packages'
  | 'view_payments'
  | 'manage_students'
  | 'manage_teachers';

export const PERMISSION_LABELS: Record<TeacherPermission, { label: string; desc: string }> = {
  view_students: { label: 'عرض قائمة الطلاب', desc: 'إمكانية استعراض الطلاب والبحث والتصفية' },
  view_reports: { label: 'عرض تقارير الطلاب', desc: 'الاطلاع على درجات ومنحنيات أداء الطلاب' },
  upload_lessons: { label: 'رفع وإضافة الدروس', desc: 'إضافة محاضرات وفيديوهات وملفات جديدة' },
  edit_lessons: { label: 'تعديل الدروس', desc: 'تعديل بيانات الدروس ومحتواها' },
  publish_lessons: { label: 'نشر وإخفاء الدروس', desc: 'التحكم في ظهور أو إخفاء الدروس للطلاب' },
  upload_exams: { label: 'إضافة الامتحانات', desc: 'إنشاء امتحانات واختبارات بابل شيت' },
  edit_exams: { label: 'تعديل الامتحانات', desc: 'تعديل الأسئلة والأوقات ونسب النجاح' },
  publish_exams: { label: 'نشر وإخفاء الامتحانات', desc: 'التحكم في نشر الامتحانات وتفعيلها' },
  assign_lessons: { label: 'تعيين الدروس للطلاب', desc: 'إتاحة دروس محددة لطالب معين أو سحبها' },
  assign_packages: { label: 'تعيين الباقات', desc: 'تفعيل وتغيير باقات الاشتراك للطلاب' },
  view_payments: { label: 'عرض حالة الاشتراكات والمدفوعات', desc: 'معرفة الطلاب المشتركين وغير المشتركين' },
  manage_students: { label: 'إدارة الطلاب (إضافة/تعديل/حظر)', desc: 'تسجيل طلاب جدد وتعديل بياناتهم وحظرهم' },
  manage_teachers: { label: 'إدارة المعلمين وتعديل الصلاحيات', desc: 'إضافة معلمين وتحديد صلاحياتهم' },
};

export type AppView =
  | 'view-landing'
  | 'view-student-dashboard'
  | 'view-drm-player'
  | 'view-assessment'
  | 'view-parent-portal'
  | 'view-community'
  | 'view-admin'
  | 'view-faq'
  | 'view-homework'
  | 'view-pdfs'
  | 'view-live'
  | 'view-ai'
  | 'view-teacher-inbox'
  | 'view-subject-calculus'
  | 'view-subject-geometry';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: 'active' | 'blocked' | 'inactive';
  avatar: string;
  registrationDate: string;
  academicYear?: AcademicYear;
  permissions?: TeacherPermission[];
}

export interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  academicYear: AcademicYear;
  includedLessonIds: string[];
}

export interface StudentProfile {
  id: string;
  code: string;
  nationalId: string;
  name: string;
  email: string;
  phone: string;
  parentPhone: string;
  academicYear: AcademicYear;
  status: 'active' | 'blocked';
  avatar: string;
  packageId?: string;
  packageName?: string;
  hasAccess: boolean;
  assignedLessonIds: string[];
  averageScore: number;
  attendanceRate: number;
  registrationDate: string;
  examResults: {
    examId: string;
    examTitle: string;
    date: string;
    score: number;
    total: number;
    percentage: number;
    isPassed: boolean;
  }[];
}

export interface Course {
  id: string;
  title: string;
  category: string;
  level: string;
  instructor: {
    name: string;
    avatar: string;
    role: string;
  };
  duration: string;
  lessonsCount: number;
  examsCount: number;
  rating: number;
  studentsCount: number;
  price: string;
  image: string;
  tag: string;
}

export interface Question {
  id: number;
  text: string;
  options: { key: string; label: string }[];
  correctAnswer: string;
  explanation: string;
}

export interface CommunityPost {
  id: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  timeAgo: string;
  subject: string;
  title: string;
  content: string;
  upvotes: number;
  repliesCount: number;
  isSolved: boolean;
}

export interface RosterStudent {
  id: string;
  code: string;
  nationalId?: string;
  name: string;
  phone: string;
  parentPhone: string;
  grade: string;
  academicYear?: AcademicYear;
  attendance: string;
  averageScore: number;
  status: 'active' | 'blocked';
  packageName?: string;
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  codeSnippet?: string;
  timestamp: string;
}

// ── DOMAIN TYPES ──────────────────────────────────────────

export interface StudentDashboardData {
  studentName: string;
  currentGrade: string;
  academicYear: AcademicYear;
  overallProgress: number; // percentage e.g. 78
  lessonsCompleted: number;
  lessonsRemaining: number;
  homeworkCompletionRate: number; // percentage e.g. 92
  examsPassed: number;
  averageExamScore: number; // percentage e.g. 88
  totalStudyHours: number; // e.g. 42.5
  lastLogin: string;
  currentLearningStreak: number; // days e.g. 7
  packageName: string;
  continueLearningLesson: {
    id: string;
    title: string;
    subject: string;
    duration: string;
    progressPercentage: number;
    thumbnail: string;
  };
}

export interface ProgressTimelineData {
  examScores: { date: string; score: number; label: string }[];
  lessonProgress: { month: string; completed: number; target: number }[];
  weeklyActivity: { day: string; hours: number }[];
  homeworkRates: { category: string; rate: number }[];
  subjectGrades?: { subject: string; score: number; maxScore: number }[];
}

export interface HomeworkQuestion {
  id: number;
  text: string;
  options: { key: string; label: string }[];
  correctAnswer: string;
  explanation: string;
}

export interface LessonHomework {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  isSubmitted: boolean;
  score?: number;
  questions: HomeworkQuestion[];
}

export interface LessonExam {
  id: string;
  title: string;
  durationMinutes: number;
  passingScorePercentage: number; // e.g. 60
  isPublished?: boolean;
  questions: Question[];
}

export interface LessonFeedback {
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  subject: string;
  description: string;
  duration: string;
  order: number;
  academicYear: AcademicYear;
  isPublished: boolean;
  isLocked: boolean;
  prerequisiteLessonId?: string;
  prerequisiteExamTitle?: string;
  videoUrl: string;
  pdfUrl: string;
  pdfTitle: string;
  homework: LessonHomework;
  exam: LessonExam;
  userExamPassed?: boolean;
  userExamScore?: number;
  userFeedback?: LessonFeedback;
}

export interface ExamRecordDetail {
  questionId: number;
  questionText: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

export interface ExamRecord {
  id: string;
  lessonId: string;
  lessonTitle: string;
  academicYear?: AcademicYear;
  date: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  isPassed: boolean;
  durationSpent: string;
  details: ExamRecordDetail[];
}

export interface ExamStats {
  totalAttempted: number;
  passedCount: number;
  failedCount: number;
  averageScore: number;
  highestScore: number;
  overallPassRate: number;
}

export interface TeacherMessage {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  lessonId: string;
  lessonTitle: string;
  text: string;
  attachmentUrl?: string;
  timestamp: string;
  isRead: boolean;
  reply?: string;
  replyTimestamp?: string;
}

export interface SystemNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'teacher_reply' | 'student_question' | 'exam_pass' | 'lesson_unlock';
  timestamp: string;
  isRead: boolean;
  link?: string;
}
