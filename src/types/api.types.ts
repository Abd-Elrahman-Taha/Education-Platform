/**
 * Strict TypeScript models matching the LMS REST API specification exactly.
 * Case-sensitive property names match backend responses directly.
 */

// ── Common & Error ────────────────────────────────────────────────────────
export interface ApiErrorResponse {
  status?: 'error' | 'fail' | string;
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
  Phone: string;
  password: string;
  ParentPhone?: string;
}

export interface SigninRequest {
  Phone: string;
  password: string;
  device_uuid: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user?: {
    id?: string;
    _id?: string;
    FullName?: string;
    Phone?: string;
    role?: 'Student' | 'Teacher' | 'Admin' | string;
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
  Price: number;
  IsPublished?: boolean;
  Thumbnail?: string;
  createdAt?: string;
  updatedAt?: string;
  LessonsCount?: number;
}

export interface CourseQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  fields?: string;
  search?: string;
}

export interface CoursesResponse {
  courses?: Course[];
  data?: Course[];
  pagination: PaginationMeta;
}

// ── Lessons ───────────────────────────────────────────────────────────────
export interface Lesson {
  _id: string;
  Title: string;
  Description?: string;
  DurationMinutes?: number;
  Order?: number;
  VideoUrl?: string;
  PrerequisiteExamId?: string | null;
  IsLocked?: boolean;
  CourseId?: string;
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
  QuestionType: string;
  QuestionText: string;
  Options: string[];
  Points: number;
  // NOTE: Backend never sends CorrectAnswer; do not add client-side
}

export interface StartExamResponse {
  exam: ExamInfo;
  attemptId: string;
  questions: ExamQuestion[];
}

export interface ExamAnswer {
  questionId: string;
  answer: string;
}

export interface SubmitExamRequest {
  answers: ExamAnswer[];
}

export type ExamResultStatus = 'Passed' | 'Failed' | 'PendingReview' | 'AutoSubmitted' | string;

export interface SubmitExamResponse {
  status: ExamResultStatus;
  score: number;
  passingScore?: number;
  totalPoints?: number;
  attemptId?: string;
  message?: string;
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

export interface ScratchCardRequest {
  code: string;
}

export interface ScratchCardResponse {
  message?: string;
  creditedAmount: number;
  newWalletBalance: number;
}
