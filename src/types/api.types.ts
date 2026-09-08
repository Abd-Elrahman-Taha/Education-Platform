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
export interface Course {
  _id: string;
  Title: string;
  Description?: string;
  TeacherId?: string;
  Price: number;
  IsPublished: boolean;
  Thumbnail?: string;
  createdAt?: string;
  updatedAt?: string;
  LessonsCount?: number;
}

export interface CreateCourseRequest {
  Title: string;
  Price: number;
  IsPublished: boolean;
}

export interface UpdateCourseRequest {
  Title?: string;
  Price?: number;
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
  AcquisitionMethod: 'Purchase' | 'ScratchCard' | 'AdminGrant' | string;
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

// ── Admin Student Management ──────────────────────────────────────────────
export interface AdminStudent {
  _id: string;
  FullName: string;
  Phone: string;
  ParentPhone?: string;
  Role: 'Student' | string;
  Status: 'Active' | 'SuspendedMultiDevice' | 'Blocked' | string;
  WalletBalance?: number;
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
