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
    let examsList: Exam[] = [];
    let pagination = { total: 0, totalPages: 1, page: 1, limit: 50 };

    try {
      let cleanParams: Record<string, any> | undefined = undefined;
      if (params) {
        const cleaned: Record<string, any> = {};
        for (const [k, v] of Object.entries(params)) {
          if (v !== undefined && v !== null && v !== '' && v !== 'all') {
            cleaned[k] = v;
          }
        }
        if (Object.keys(cleaned).length > 0) {
          cleanParams = cleaned;
        }
      }

      let response;
      try {
        response = await apiClient.get<ExamsListResponse>('/exams', { params: cleanParams });
      } catch (firstErr: any) {
        // If backend returns 500 or error with query params, retry clean without params
        if (cleanParams) {
          response = await apiClient.get<ExamsListResponse>('/exams');
        } else {
          throw firstErr;
        }
      }

      const raw = response.data as any;
      examsList = Array.isArray(raw?.data?.exams)
        ? raw.data.exams
        : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.exams)
        ? raw.exams
        : Array.isArray(raw)
        ? raw
        : [];

      pagination = raw?.pagination || { total: examsList.length, totalPages: 1, page: 1, limit: 50 };

      // Update cached exams with live API data
      if (examsList.length > 0) {
        try {
          const stored = localStorage.getItem('api_cached_exams');
          const cached: Exam[] = stored ? JSON.parse(stored) : [];
          const merged = [...examsList];
          for (const c of cached) {
            if (!merged.some(m => m._id === c._id)) {
              merged.push(c);
            }
          }
          localStorage.setItem('api_cached_exams', JSON.stringify(merged));
        } catch {}
      }
    } catch (apiErr: any) {
      console.warn('[Exams API] Live /exams endpoint returned error, recovering from persistent cache:', apiErr);
      try {
        const stored = localStorage.getItem('api_cached_exams');
        if (stored) {
          examsList = JSON.parse(stored);
          pagination = { total: examsList.length, totalPages: 1, page: 1, limit: 50 };
        }
      } catch {}
    }

    // Safeguard: if API returned empty array (or 500), load from cached API exams
    if (examsList.length === 0) {
      try {
        const stored = localStorage.getItem('api_cached_exams');
        if (stored) {
          examsList = JSON.parse(stored);
          pagination = { total: examsList.length, totalPages: 1, page: 1, limit: 50 };
        }
      } catch {}
    }

    return {
      exams: examsList,
      total: pagination.total,
      totalPages: pagination.totalPages,
    };
  },

  /**
   * Get single exam by ID.
   */
  getExamById: async (examId: string): Promise<Exam> => {
    try {
      const response = await apiClient.get<any>(`/exams/${examId}`);
      const raw = response.data;
      return raw?.data?.exam || raw?.exam || raw?.data || raw;
    } catch (err) {
      // Check cached exams
      const stored = localStorage.getItem('api_cached_exams');
      if (stored) {
        const list: Exam[] = JSON.parse(stored);
        const match = list.find(e => e._id === examId);
        if (match) return match;
      }
      throw err;
    }
  },

  /**
   * Create a new exam (Admin only).
   */
  createExam: async (data: CreateExamRequest): Promise<Exam> => {
    // Sanitize payload strictly according to Swagger
    const cleanPayload: Record<string, any> = {
      Title: data.Title.trim(),
      CourseId: data.CourseId,
      DurationMinutes: Number(data.DurationMinutes) || 60,
      PassingScore: Number(data.PassingScore) || 10,
      MaxAttempts: Number(data.MaxAttempts) || 0,
      Status: data.Status || 'Published',
      IsRandomized: Boolean(data.IsRandomized),
      IsGated: Boolean(data.IsGated),
    };
    if (data.LessonId && typeof data.LessonId === 'string' && data.LessonId.trim()) {
      cleanPayload.LessonId = data.LessonId.trim();
    }

    const response = await apiClient.post<any>('/exams', cleanPayload);
    const raw = response.data;
    const createdExam = raw?.data?.exam || raw?.exam || raw?.data || raw;

    // Immediately persist created exam in localStorage cache
    if (createdExam) {
      try {
        const stored = localStorage.getItem('api_cached_exams');
        const list: Exam[] = stored ? JSON.parse(stored) : [];
        const updated = [createdExam, ...list.filter(e => e._id !== createdExam._id)];
        localStorage.setItem('api_cached_exams', JSON.stringify(updated));
      } catch {}
    }

    return createdExam;
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
    const updatedExam = raw?.data?.exam || raw?.exam || raw?.data || raw;

    try {
      const stored = localStorage.getItem('api_cached_exams');
      if (stored) {
        const list: Exam[] = JSON.parse(stored);
        const updated = list.map(e => e._id === examId ? { ...e, ...updatedExam } : e);
        localStorage.setItem('api_cached_exams', JSON.stringify(updated));
      }
    } catch {}

    return updatedExam;
  },

  /**
   * Delete an exam (Admin only).
   */
  deleteExam: async (examId: string): Promise<void> => {
    try {
      await apiClient.delete(`/exams/${examId}`);
    } finally {
      try {
        const stored = localStorage.getItem('api_cached_exams');
        if (stored) {
          const list: Exam[] = JSON.parse(stored);
          localStorage.setItem('api_cached_exams', JSON.stringify(list.filter(e => e._id !== examId)));
        }
      } catch {}
    }
  },

  // ── Admin Question CRUD & Reorder ───────────────────────────────
  /**
   * List all questions belonging to an exam.
   */
  getQuestions: async (examId: string): Promise<Question[]> => {
    const response = await apiClient.get<any>(`/exams/${examId}/questions`);
    const raw = response.data as any;
    return Array.isArray(raw?.data?.questions)
      ? raw.data.questions
      : Array.isArray(raw?.questions)
      ? raw.questions
      : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw)
      ? raw
      : [];
  },

  /**
   * Create a question inside an exam (Admin only).
   * Note: CorrectAnswer is NEVER sent for Essay questions.
   */
  createQuestion: async (examId: string, data: CreateQuestionRequest): Promise<Question> => {
    const payload = { ...data };
    if (payload.QuestionType === 'Essay') {
      delete payload.CorrectAnswer;
    }
    const response = await apiClient.post<any>(`/exams/${examId}/questions`, payload);
    const raw = response.data;
    return raw?.data?.question || raw?.question || raw?.data || raw;
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
    }
    const response = await apiClient.patch<any>(`/exams/${examId}/questions/${questionId}`, payload);
    const raw = response.data;
    return raw?.data?.question || raw?.question || raw?.data || raw;
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
  },

  /**
   * Student: Get my attempt history for an exam.
   */
  getMyExamAttempts: async (examId: string): Promise<ExamAttempt[]> => {
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
};
