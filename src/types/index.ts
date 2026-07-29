export type UserRole = 'student' | 'parent' | 'admin' | 'teacher';

export type AppView =
  | 'view-landing'
  | 'view-student-dashboard'
  | 'view-drm-player'
  | 'view-assessment'
  | 'view-parent-portal'
  | 'view-community'
  | 'view-admin'
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
  name: string;
  phone: string;
  parentPhone: string;
  grade: string;
  attendance: string;
  averageScore: number;
  status: 'active' | 'blocked';
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  codeSnippet?: string;
  timestamp: string;
}

// ── NEW DOMAIN TYPES ──────────────────────────────────────────

export interface StudentDashboardData {
  studentName: string;
  currentGrade: string;
  overallProgress: number; // percentage e.g. 78
  lessonsCompleted: number;
  lessonsRemaining: number;
  homeworkCompletionRate: number; // percentage e.g. 92
  examsPassed: number;
  averageExamScore: number; // percentage e.g. 88
  totalStudyHours: number; // e.g. 42.5
  lastLogin: string;
  currentLearningStreak: number; // days e.g. 7
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
