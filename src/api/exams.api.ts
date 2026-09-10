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
    let raw: any = null;

    // First attempt: GET /exams (clean)
    try {
      const response = await apiClient.get<ExamsListResponse>('/exams');
      raw = response.data;
    } catch (firstErr: any) {
      // Second attempt: GET /exams with pagination parameters (in case backend expects integer page/limit)
      try {
        const response = await apiClient.get<ExamsListResponse>('/exams', { params: { page: 1, limit: 50 } });
        raw = response.data;
      } catch (secondErr: any) {
        console.warn('[Exams API] Backend /exams returned error, reading registry cache:', secondErr?.message || firstErr?.message);
      }
    }

    let examsList: Exam[] = Array.isArray(raw?.data?.exams)
      ? raw.data.exams
      : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.exams)
      ? raw.exams
      : Array.isArray(raw)
      ? raw
      : [];

    // Fallback or merge with local registry
    try {
      const storedRaw = localStorage.getItem('platform_exams_registry');
      const storedExams: Exam[] = storedRaw ? JSON.parse(storedRaw) : [];
      if (examsList.length === 0 && storedExams.length > 0) {
        examsList = storedExams;
      } else if (examsList.length > 0) {
        // Merge: keep all server exams, plus any local exams created recently that server hasn't populated yet
        const serverIds = new Set(examsList.map(e => e._id));
        const missingLocals = storedExams.filter(e => !serverIds.has(e._id));
        examsList = [...missingLocals, ...examsList];
        localStorage.setItem('platform_exams_registry', JSON.stringify(examsList));
      }
    } catch {}

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
      total: examsList.length,
      totalPages: pagination.totalPages || 1,
    };
  },

  /**
   * Get single exam by ID (Admin only).
   */
  getExamById: async (examId: string): Promise<Exam> => {
    try {
      const response = await apiClient.get<any>(`/exams/${examId}`);
      const raw = response.data;
      return raw?.data?.exam || raw?.exam || raw?.data || raw;
    } catch (err) {
      try {
        const storedRaw = localStorage.getItem('platform_exams_registry');
        if (storedRaw) {
          const stored: Exam[] = JSON.parse(storedRaw);
          const found = stored.find(e => e._id === examId);
          if (found) return found;
        }
      } catch {}
      throw err;
    }
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
    const created: Exam = raw?.data?.exam || raw?.exam || raw?.data || raw || {
      _id: `exam-${Date.now()}`,
      ...cleanPayload,
      CreatedAt: new Date().toISOString(),
    };

    // Immediately persist in platform_exams_registry
    try {
      const storedRaw = localStorage.getItem('platform_exams_registry');
      const list: Exam[] = storedRaw ? JSON.parse(storedRaw) : [];
      const updated = [created, ...list.filter(e => e._id !== created._id)];
      localStorage.setItem('platform_exams_registry', JSON.stringify(updated));
    } catch {}

    return created;
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
    const updated: Exam = raw?.data?.exam || raw?.exam || raw?.data || raw;

    // Immediately update in platform_exams_registry
    try {
      const storedRaw = localStorage.getItem('platform_exams_registry');
      if (storedRaw) {
        const list: Exam[] = JSON.parse(storedRaw);
        const nextList = list.map(e => e._id === examId ? { ...e, ...cleanPayload, ...(updated || {}) } : e);
        localStorage.setItem('platform_exams_registry', JSON.stringify(nextList));
      }
    } catch {}

    return updated;
  },

  /**
   * Delete an exam (Admin only).
   */
  deleteExam: async (examId: string): Promise<void> => {
    await apiClient.delete(`/exams/${examId}`);
    try {
      const storedRaw = localStorage.getItem('platform_exams_registry');
      if (storedRaw) {
        const list: Exam[] = JSON.parse(storedRaw);
        const nextList = list.filter(e => e._id !== examId);
        localStorage.setItem('platform_exams_registry', JSON.stringify(nextList));
      }
    } catch {}
  },

  // ── Admin Question CRUD & Reorder ───────────────────────────────
  /**
   * List all questions belonging to an exam.
   */
  getQuestions: async (examId: string): Promise<Question[]> => {
    try {
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
    } catch (err) {
      console.warn(`[Exams API] getQuestions for ${examId} returned error:`, err);
      return [];
    }
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
};
