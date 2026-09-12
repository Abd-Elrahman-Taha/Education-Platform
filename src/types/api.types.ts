/**
 * Strict TypeScript models matching the LMS REST API specification exactly.
 * Case-sensitive property names match backend responses directly.
 */

// ── Common & Error ────────────────────────────────────────────────────────
export interface ApiErrorResponse {
  status?: 'error' | 'fail' | string;
  success?: boolean;
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Auth ──────────────────────────────────────────────────────────────────
export interface SignupRequest {
  FullName: string;
  NationalId: string;
  Phone: string;
  ParentPhone: string;
  password: string;
}

export interface SigninRequest {
  Phone: string;
  password: string;
  device_uuid: string;
}

export interface AuthResponse {
  message: string;
  token?: string;
  user?: {
    id?: string;
    _id?: string;
    FullName?: string;
    Phone?: string;
    Role?: 'Student' | 'Admin' | string;
    role?: 'Student' | 'Admin' | string;
  };
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

// ── Courses ───────────────────────────────────────────────────────────────
export type EducationStage = 'Primary' | 'Preparatory' | 'Secondary' | 'University';

export interface Course {
  _id: string;
  Title: string;
  Description?: string;
  TeacherId?: string;
  Price: number;
  EducationStage?: EducationStage;
  Grade?: string;
  IsPublished: boolean;
  Thumbnail?: string;
  createdAt?: string;
  updatedAt?: string;
  LessonsCount?: number;
}

export interface CreateCourseRequest {
  Title: string;
  Price: number;
  EducationStage: EducationStage;
  Grade: string;
  IsPublished?: boolean;
}

export interface UpdateCourseRequest {
  Title?: string;
  Price?: number;
  EducationStage?: EducationStage;
  Grade?: string;
  IsPublished?: boolean;
}

export interface CourseQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  fields?: string;
  search?: string;
  Title?: string;
  Price?: number;
  EducationStage?: EducationStage;
  Grade?: string;
  IsPublished?: boolean;
}

export interface CoursesResponse {
  status?: string;
  results?: number;
  courses?: Course[];
  data?: {
    courses?: Course[];
    course?: Course;
  };
  pagination: PaginationMeta;
}

// ── Lessons ───────────────────────────────────────────────────────────────
export interface Lesson {
  _id: string;
  CourseId?: string;
  Title: string;
  Description?: string;
  VideoStoragePath?: string;
  VideoUrl?: string;
  DurationSeconds?: number;
  DurationMinutes?: number;
  Order?: number;
  OrderIndex?: number;
  PrerequisiteExamId?: string | null;
  MaxAllowedViews?: number;
  IsLocked?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLessonRequest {
  Title: string;
  VideoStoragePath: string;
  DurationSeconds: number;
  OrderIndex: number;
  PrerequisiteExamId?: string | null;
  MaxAllowedViews?: number;
}

export interface UpdateLessonRequest {
  Title?: string;
  VideoStoragePath?: string;
  DurationSeconds?: number;
  OrderIndex?: number;
  PrerequisiteExamId?: string | null;
  MaxAllowedViews?: number;
}

export interface LessonQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  fields?: string;
  search?: string;
  Title?: string;
  OrderIndex?: number;
}

// ── Enrollments ("My Courses") ────────────────────────────────────────────
export interface EnrollmentCourse {
  _id: string;
  Title: string;
  Price: number;
  IsPublished: boolean;
  createdAt?: string;
}

export interface Enrollment {
  _id: string;
  StudentId: string;
  CourseId: EnrollmentCourse;
  Status: 'Active' | 'Expired' | string;
  AcquisitionMethod: 'Purchase' | 'ScratchCard' | 'AdminGift' | 'AdminGrant' | string;
  createdAt: string;
  updatedAt: string;
}

export interface MyCoursesResponse {
  status: string;
  results: number;
  pagination?: PaginationMeta;
  data: {
    enrollments: Enrollment[];
  };
}

export interface ManualEnrollmentRequest {
  StudentId: string;
  CourseId: string;
}

export interface ManualEnrollmentResponse {
  message: string;
  data?: {
    enrollment: {
      _id?: string;
      StudentId: string;
      CourseId: string;
      Status: 'Active' | string;
      AcquisitionMethod: 'AdminGift' | string;
      createdAt?: string;
      updatedAt?: string;
    };
  };
}

export interface PromoteUserRoleRequest {
  Role: 'Admin';
}

// ── Admin Student Management ──────────────────────────────────────────────
export interface AdminStudent {
  _id: string;
  FullName: string;
  NationalId?: string;
  Phone: string;
  ParentPhone?: string;
  Role: 'Student' | 'Admin' | string;
  Status: 'Active' | 'SuspendedMultiDevice' | 'Blocked' | string;
  WalletBalance?: number;
  isSubscribed?: boolean;
  subscribedYear?: string;
  academicYear?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentsListResponse {
  status: string;
  results: number;
  pagination: PaginationMeta;
  data: {
    students: AdminStudent[];
  };
}

export interface CreateStudentRequest {
  FullName: string;
  Phone: string;
  ParentPhone?: string;
  password: string;
}

export interface UpdateStudentRequest {
  FullName?: string;
  Phone?: string;
  ParentPhone?: string;
  NationalId?: string;
}

export interface UpdateStudentStatusRequest {
  status: 'Active' | 'SuspendedMultiDevice' | 'Blocked';
}

// ── Videos & Watermark ────────────────────────────────────────────────────
export interface WatermarkTokenResponse {
  status: 'success' | string;
  watermarkToken: string;
}

export interface HeartbeatRequest {
  watchedSeconds: number;
  videoToken: string;
}

export interface HeartbeatProgress {
  WatchedSeconds: number;
  ViewCount: number;
  IsLocked: boolean;
}

export interface HeartbeatResponse {
  status: string;
  message: string;
  progress: HeartbeatProgress;
}

// ── Exams ─────────────────────────────────────────────────────────────────
export type ExamStatus = 'Draft' | 'Published' | 'Closed';

export interface Exam {
  _id: string;
  Title: string;
  CourseId: string;
  LessonId?: string | null;
  DurationMinutes: number;
  PassingScore: number;
  MaxAttempts: number;
  Status: ExamStatus;
  IsRandomized: boolean;
  IsGated: boolean;
  questionsCount?: number;
  attemptsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateExamRequest {
  Title: string;
  CourseId: string;
  LessonId?: string;
  DurationMinutes: number;
  PassingScore: number;
  MaxAttempts: number;
  Status: ExamStatus;
  IsRandomized: boolean;
  IsGated: boolean;
}

export interface UpdateExamRequest {
  Title?: string;
  CourseId?: string;
  LessonId?: string | null;
  DurationMinutes?: number;
  PassingScore?: number;
  MaxAttempts?: number;
  Status?: ExamStatus;
  IsRandomized?: boolean;
  IsGated?: boolean;
}

export interface ExamsListResponse {
  status?: string;
  results?: number;
  pagination?: PaginationMeta;
  exams?: Exam[];
  data?: {
    exams?: Exam[];
    exam?: Exam;
  };
}

export type QuestionType = 'MCQ' | 'TrueFalse' | 'Essay' | 'FillInBlank' | 'DragDrop';

export interface Question {
  _id: string;
  ExamId: string;
  QuestionType: QuestionType;
  QuestionText: string;
  Points: number;
  OrderIndex: number;
  Options?: string[];
  CorrectAnswer?: any; // Admin only - NEVER sent or exposed for Student
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateQuestionRequest {
  QuestionType: QuestionType;
  QuestionText: string;
  Points: number;
  OrderIndex?: number;
  Options?: string[];
  CorrectAnswer?: any; // NEVER sent for Essay questions
}

export interface UpdateQuestionRequest {
  QuestionType?: QuestionType;
  QuestionText?: string;
  Points?: number;
  OrderIndex?: number;
  Options?: string[];
  CorrectAnswer?: any;
}

export interface ReorderQuestionsRequest {
  questionIds: string[];
}

export interface ExamAttempt {
  _id: string;
  ExamId: string;
  StudentId: string | { _id: string; FullName?: string; Phone?: string };
  score: number;
  totalPoints?: number;
  status: 'Passed' | 'Failed' | 'PendingReview' | 'AutoSubmitted' | string;
  passingScore: number;
  startedAt?: string;
  submittedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExamAttemptsResponse {
  status?: string;
  results?: number;
  attempts?: ExamAttempt[];
  data?: {
    attempts?: ExamAttempt[];
  };
}

export interface ExamInfo {
  _id: string;
  Title: string;
  DurationMinutes: number;
}

export interface ExamQuestion {
  _id: string;
  ExamId?: string;
  QuestionType: string;
  QuestionText: string;
  Options: string[];
  Points: number;
}

export interface StartExamResponse {
  message?: string;
  exam?: ExamInfo;
  attemptId?: string;
  questions?: ExamQuestion[];
  data?: {
    exam: ExamInfo;
    attemptId: string;
    questions: ExamQuestion[];
  };
}

export interface ExamAnswer {
  questionId: string;
  answer: string;
}

export interface SubmitExamRequest {
  answers: ExamAnswer[];
}

export interface SubmitExamResponse {
  message?: string;
  score?: number;
  totalPoints?: number;
  status?: 'Passed' | 'Failed' | 'PendingReview' | 'AutoSubmitted' | string;
  passingScore?: number;
  data?: {
    score: number;
    status: 'Passed' | 'Failed' | 'PendingReview' | 'AutoSubmitted' | string;
    passingScore?: number;
  };
}

export interface ExamWarningResponse {
  status: 'InProgress' | 'AutoSubmitted' | 'PendingReview' | string;
  warningCount: number;
  autoSubmitted: boolean;
}

export interface GradeItem {
  questionId: string;
  awardedScore: number;
  feedback?: string;
}

export interface GradeAttemptRequest {
  grades: GradeItem[];
}

export interface GradeAttemptResponse {
  status: 'Passed' | 'Failed' | 'PendingReview' | string;
  score: number;
  isFinalized: boolean;
}

export interface FileUploadResponse {
  FileKey: string;
  Purpose: 'QuestionImage' | 'EssayImage' | string;
}

export interface AdminUser {
  _id: string;
  FullName: string;
  Phone: string;
  Role: 'Admin' | 'SuperAdmin' | string;
  NationalId?: string;
  ParentPhone?: string;
  Status?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Payment & Scratch Cards ───────────────────────────────────────────────
export interface CheckoutRequest {
  courseId: string;
  gateway: 'MockEgyptian' | string;
}

export interface CheckoutResponse {
  message: string;
  paymentUrl: string;
  orderId: string;
}

export interface GenerateScratchCardsRequest {
  Amount: number;
  Count: number;
  BatchNumber: string;
  academicYear?: string;
  AcademicYear?: string;
  Grade?: string;
}

export interface GenerateScratchCardsResponse {
  message: string;
  BatchNumber: string;
  Amount: number;
  insertedCount: number;
  rawCodes: string[];
}

export interface ScratchCardRequest {
  code: string;
}

export interface ScratchCardResponse {
  message?: string;
  creditedAmount: number;
  newWalletBalance: number;
  card?: {
    _id: string;
    BatchNumber: string;
    IsRedeemed: boolean;
    RedeemedAt?: string;
  };
}

// ── Parent Portal Types (POST /parent-portal/lookup) ─────────
export interface ParentPortalLookupRequest {
  nationalId: string; // Exactly 14 digits
  phone: string;      // Egyptian phone 11 digits (starts with 01)
}

export interface ParentPortalExamAttempt {
  attemptNumber: number;
  score: number;
  status: 'Passed' | 'Failed' | 'AutoSubmitted' | string;
}

export interface ParentPortalExam {
  examId: string;
  title: string;
  attempts: ParentPortalExamAttempt[];
}

export interface ParentPortalCourseProgress {
  viewedLessons: number;
  totalLessons: number;
  percentage: number;
}

export interface ParentPortalCourse {
  courseId: string;
  title: string;
  progress: ParentPortalCourseProgress;
  exams: ParentPortalExam[];
}

export interface ParentPortalStudent {
  fullName: string;
}

export interface ParentPortalLookupData {
  student: ParentPortalStudent;
  courses: ParentPortalCourse[];
}

export interface ParentPortalLookupResponse {
  status: string;
  data: ParentPortalLookupData;
}

