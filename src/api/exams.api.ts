import { apiClient } from './axios';
import {
  Exam,
  CreateExamRequest,
  UpdateExamRequest,
  ExamsListResponse,
  Question,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  ExamAttempt,
  ExamAttemptsResponse,
  StartExamResponse,
  SubmitExamRequest,
  SubmitExamResponse,
  ExamWarningResponse,
  GradeItem,
  GradeAttemptResponse,
  FileUploadResponse,
} from '../types/api.types';

export interface ExamQueryParams {
  page?: number;
  limit?: number;
  CourseId?: string;
  Status?: string;
  search?: string;
}

export const examsApi = {
  // ── Admin Exam CRUD ──────────────────────────────────────────────
  /**
   * List all exams with optional filters (CourseId, Status, search, pagination).
   */
  getExams: async (params?: ExamQueryParams): Promise<{ exams: Exam[]; total: number; totalPages: number }> => {
    const response = await apiClient.get<ExamsListResponse>('/exams', { params });
    const raw = response.data as any;

    let examsList: Exam[] = Array.isArray(raw?.data?.exams)
      ? raw.data.exams
      : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.exams)
      ? raw.exams
      : Array.isArray(raw)
      ? raw
      : [];

    if (params) {
      if (params.CourseId && params.CourseId !== 'all') {
        examsList = examsList.filter(e => {
          const cid = typeof e.CourseId === 'object' && e.CourseId ? (e.CourseId as any)._id : e.CourseId;
          return cid === params.CourseId;
        });
      }
      if (params.Status && params.Status !== 'all') {
        examsList = examsList.filter(e => e.Status === params.Status);
      }
      if (params.search && params.search.trim()) {
        const s = params.search.trim().toLowerCase();
        examsList = examsList.filter(e => (e.Title || '').toLowerCase().includes(s));
      }
    }

    const pagination = raw?.pagination || { total: examsList.length, totalPages: 1, page: 1, limit: 50 };

    return {
      exams: examsList,
      total: pagination.total || examsList.length,
      totalPages: pagination.totalPages || 1,
    };
  },

  /**
   * Get single exam by ID (Admin only).
   */
  getExamById: async (examId: string): Promise<Exam> => {
    const response = await apiClient.get<any>(`/exams/${examId}`);
    const raw = response.data;
    return raw?.data?.exam || raw?.exam || raw?.data || raw;
  },

  /**
   * Create a new exam (Admin only).
   */
  createExam: async (data: CreateExamRequest): Promise<Exam> => {
    const cleanPayload: Record<string, any> = {
      Title: data.Title.trim(),
      CourseId: data.CourseId,
      DurationMinutes: Number(data.DurationMinutes) || 60,
      PassingScore: Number(data.PassingScore) || 10,
      MaxAttempts: Number(data.MaxAttempts) || 0,
      Status: data.Status || 'Draft',
      IsRandomized: Boolean(data.IsRandomized),
      IsGated: Boolean(data.IsGated),
    };
    if (data.LessonId && typeof data.LessonId === 'string' && data.LessonId.trim()) {
      cleanPayload.LessonId = data.LessonId.trim();
    }

    const response = await apiClient.post<any>('/exams', cleanPayload);
    const raw = response.data;
    return raw?.data?.exam || raw?.exam || raw?.data || raw;
  },

  /**
   * Update exam fields (Admin only).
   */
  updateExam: async (examId: string, data: UpdateExamRequest): Promise<Exam> => {
    const cleanPayload: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined && v !== null && v !== '') {
        cleanPayload[k] = v;
      }
    }
    const response = await apiClient.patch<any>(`/exams/${examId}`, cleanPayload);
    const raw = response.data;
    return raw?.data?.exam || raw?.exam || raw?.data || raw;
  },

  /**
   * Delete an exam (Admin only).
   */
  deleteExam: async (examId: string): Promise<void> => {
    await apiClient.delete(`/exams/${examId}`);
  },

  // ── Admin Question CRUD & Reorder ───────────────────────────────
  /**
   * List all questions belonging to an exam.
   */
  getQuestions: async (examId: string): Promise<Question[]> => {
    const response = await apiClient.get<any>(`/exams/${examId}/questions`);
    const raw = response.data as any;
    const list = Array.isArray(raw?.data?.questions)
      ? raw.data.questions
      : Array.isArray(raw?.questions)
      ? raw.questions
      : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw)
      ? raw
      : [];

    return list.map((q: any) => ({
      ...q,
      OrderIndex: Number(q.OrderIndex ?? q.orderIndex ?? q.order ?? 0),
      Points: Number(q.Points ?? q.points ?? 0),
    }));
  },

  /**
   * Create a question inside an exam (Admin only).
   * Note: CorrectAnswer is NEVER sent for Essay questions.
   * Includes automated collision resolution for OrderIndex duplicate key errors.
   */
  createQuestion: async (examId: string, data: CreateQuestionRequest): Promise<Question> => {
    const payload = { ...data };
    if (payload.QuestionType === 'Essay') {
      delete payload.CorrectAnswer;
      delete payload.Options;
    } else if (payload.QuestionType === 'TrueFalse' || payload.QuestionType === 'FillInBlank') {
      delete payload.Options;
    }

    try {
      const response = await apiClient.post<any>(`/exams/${examId}/questions`, payload);
      const raw = response.data;
      return raw?.data?.question || raw?.question || raw?.data || raw;
    } catch (err: any) {
      const rawErr =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.response?.data?.msg ||
        (typeof err?.response?.data === 'string' ? err?.response?.data : '') ||
        err?.message ||
        '';
      const errMsg = String(rawErr).toLowerCase();

      const isDuplicateOrder =
        errMsg.includes('orderindex') ||
        errMsg.includes('duplicate key') ||
        errMsg.includes('e11000') ||
        errMsg.includes('already exists') ||
        errMsg.includes('مكرر');

      if (isDuplicateOrder) {
        console.warn(`[Exams API] OrderIndex collision detected on exam ${examId}. Auto-resolving OrderIndex...`);
        try {
          const freshQuestions = await examsApi.getQuestions(examId);
          const existingOrders = new Set(
            freshQuestions.map(q => Number(q.OrderIndex ?? (q as any).orderIndex ?? 0))
          );
          let safeOrder = Math.max(0, ...Array.from(existingOrders)) + 1;
          while (existingOrders.has(safeOrder)) {
            safeOrder++;
          }
          payload.OrderIndex = safeOrder;
          const retryResponse = await apiClient.post<any>(`/exams/${examId}/questions`, payload);
          const retryRaw = retryResponse.data;
          return retryRaw?.data?.question || retryRaw?.question || retryRaw?.data || retryRaw;
        } catch (retryErr: any) {
          // Last resort fallback: unique timestamp integer
          try {
            payload.OrderIndex = Math.floor(Date.now() / 1000) % 100000 + 100;
            const fallbackResponse = await apiClient.post<any>(`/exams/${examId}/questions`, payload);
            const fallbackRaw = fallbackResponse.data;
            return fallbackRaw?.data?.question || fallbackRaw?.question || fallbackRaw?.data || fallbackRaw;
          } catch {
            throw retryErr;
          }
        }
      }

      throw err;
    }
  },

  /**
   * Update question fields (Admin only).
   * Note: CorrectAnswer is NEVER sent for Essay questions.
   */
  updateQuestion: async (
    examId: string,
    questionId: string,
    data: UpdateQuestionRequest
  ): Promise<Question> => {
    const payload = { ...data };
    if (payload.QuestionType === 'Essay') {
      delete payload.CorrectAnswer;
      delete payload.Options;
    } else if (payload.QuestionType === 'TrueFalse' || payload.QuestionType === 'FillInBlank') {
      delete payload.Options;
    }
    try {
      const response = await apiClient.patch<any>(`/exams/${examId}/questions/${questionId}`, payload);
      const raw = response.data;
      return raw?.data?.question || raw?.question || raw?.data || raw;
    } catch (err: any) {
      const rawErr =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.response?.data?.msg ||
        (typeof err?.response?.data === 'string' ? err?.response?.data : '') ||
        err?.message ||
        '';
      const errMsg = String(rawErr).toLowerCase();

      const isDuplicateOrder =
        errMsg.includes('orderindex') ||
        errMsg.includes('duplicate key') ||
        errMsg.includes('e11000') ||
        errMsg.includes('already exists') ||
        errMsg.includes('مكرر');

      if (isDuplicateOrder && payload.OrderIndex !== undefined) {
        try {
          const freshQuestions = await examsApi.getQuestions(examId);
          const existingOrders = new Set(
            freshQuestions
              .filter(q => q._id !== questionId)
              .map(q => Number(q.OrderIndex ?? (q as any).orderIndex ?? 0))
          );
          let safeOrder = Math.max(0, ...Array.from(existingOrders)) + 1;
          while (existingOrders.has(safeOrder)) {
            safeOrder++;
          }
          payload.OrderIndex = safeOrder;
          const retryResponse = await apiClient.patch<any>(`/exams/${examId}/questions/${questionId}`, payload);
          const retryRaw = retryResponse.data;
          return retryRaw?.data?.question || retryRaw?.question || retryRaw?.data || retryRaw;
        } catch {
          throw err;
        }
      }
      throw err;
    }
  },

  /**
   * Delete a question from an exam (Admin only).
   */
  deleteQuestion: async (examId: string, questionId: string): Promise<void> => {
    await apiClient.delete(`/exams/${examId}/questions/${questionId}`);
  },

  /**
   * Reorder questions inside an exam (Admin only).
   */
  reorderQuestions: async (examId: string, questionIds: string[]): Promise<void> => {
    await apiClient.put(`/exams/${examId}/questions/reorder`, { questionIds });
  },

  // ── Attempt History ──────────────────────────────────────────────
  /**
   * Admin: Get all student attempts for a specific exam.
   */
  getExamAttempts: async (examId: string): Promise<ExamAttempt[]> => {
    try {
      const response = await apiClient.get<ExamAttemptsResponse>(`/exams/${examId}/attempts`);
      const raw = response.data as any;
      return Array.isArray(raw?.data?.attempts)
        ? raw.data.attempts
        : Array.isArray(raw?.attempts)
        ? raw.attempts
        : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw)
        ? raw
        : [];
    } catch (err) {
      console.warn(`[Exams API] getExamAttempts for ${examId} returned error:`, err);
      return [];
    }
  },

  /**
   * Student: Get my attempt history for an exam.
   */
  getMyExamAttempts: async (examId: string): Promise<ExamAttempt[]> => {
    try {
      const response = await apiClient.get<ExamAttemptsResponse>(`/exams/${examId}/attempts/my`);
      const raw = response.data as any;
      return Array.isArray(raw?.data?.attempts)
        ? raw.data.attempts
        : Array.isArray(raw?.attempts)
        ? raw.attempts
        : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw)
        ? raw
        : [];
    } catch (err) {
      console.warn(`[Exams API] getMyExamAttempts for ${examId} returned error:`, err);
      return [];
    }
  },

  // ── Student Exam Execution (Existing) ────────────────────────────
  /**
   * Start an exam session by Exam ID (from Lesson.PrerequisiteExamId).
   * Note: Backend never sends CorrectAnswer; frontend must not expect it.
   */
  startExam: async (examId: string): Promise<StartExamResponse> => {
    const response = await apiClient.post<StartExamResponse>(`/exams/${examId}/start`);
    return response.data;
  },

  /**
   * Submit exam answers.
   * Score and passing status are determined strictly by the backend.
   */
  submitExam: async (
    examId: string,
    data: SubmitExamRequest
  ): Promise<SubmitExamResponse> => {
    const response = await apiClient.post<SubmitExamResponse>(
      `/exams/${examId}/submit`,
      data
    );
    return response.data;
  },

  // ── Anti-Cheating Warnings ───────────────────────────────────────
  /**
   * Register a cheating warning. 3rd warning auto-submits.
   * Backend route: POST /api/v1/exams/:id/warning
   */
  registerWarning: async (examId: string): Promise<ExamWarningResponse> => {
    const response = await apiClient.post<any>(`/exams/${examId}/warning`);
    const raw = response.data;
    return raw?.data || raw;
  },

  // ── Manual Attempt Grading (Admin / SuperAdmin) ──────────────────
  /**
   * Manually grade essay questions for an attempt.
   * Transitions PendingReview to Passed or Failed once fully graded.
   * Backend route: POST /api/v1/exams/:id/attempts/:attemptId/grade
   */
  gradeAttempt: async (
    examId: string,
    attemptId: string,
    grades: GradeItem[]
  ): Promise<GradeAttemptResponse> => {
    const response = await apiClient.post<any>(`/exams/${examId}/attempts/${attemptId}/grade`, {
      grades,
    });
    const raw = response.data;
    return raw?.data || raw;
  },

  // ── File Upload (QuestionImage / EssayImage) ─────────────────────
  /**
   * Upload an image for question or essay answer via multipart/form-data.
   * Backend route: POST /api/v1/files
   */
  uploadFile: async (file: File, purpose: 'QuestionImage' | 'EssayImage'): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', purpose);
    const response = await apiClient.post<any>('/files', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const raw = response.data;
    return raw?.data || raw;
  },

  getFileUrl: (fileKey: string): string => {
    return `${apiClient.defaults.baseURL || 'https://edc-platform.vercel.app/api/v1'}/files/${fileKey}`;
  },
};
