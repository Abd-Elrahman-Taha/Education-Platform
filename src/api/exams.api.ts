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
    let cleanParams = params ? { ...params } : undefined;
    if (cleanParams && typeof cleanParams.search === 'string' && !cleanParams.search.trim()) {
      delete cleanParams.search;
    }
    const response = await apiClient.get<ExamsListResponse>('/exams', { params: cleanParams });
    const raw = response.data;
    const examsList: Exam[] = raw?.data?.exams || raw?.exams || (Array.isArray(raw) ? raw : []);
    const pagination = raw?.pagination || { total: examsList.length, totalPages: 1, page: 1, limit: 50 };
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
    const response = await apiClient.get<any>(`/exams/${examId}`);
    return response.data?.data?.exam || response.data?.exam || response.data;
  },

  /**
   * Create a new exam (Admin only).
   */
  createExam: async (data: CreateExamRequest): Promise<Exam> => {
    const response = await apiClient.post<any>('/exams', data);
    return response.data?.data?.exam || response.data?.exam || response.data;
  },

  /**
   * Update exam fields (Admin only).
   */
  updateExam: async (examId: string, data: UpdateExamRequest): Promise<Exam> => {
    const response = await apiClient.patch<any>(`/exams/${examId}`, data);
    return response.data?.data?.exam || response.data?.exam || response.data;
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
    const raw = response.data;
    return raw?.data?.questions || raw?.questions || (Array.isArray(raw) ? raw : []);
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
    return response.data?.data?.question || response.data?.question || response.data;
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
    return response.data?.data?.question || response.data?.question || response.data;
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
    const raw = response.data;
    return raw?.data?.attempts || raw?.attempts || (Array.isArray(raw) ? raw : []);
  },

  /**
   * Student: Get my attempt history for an exam.
   */
  getMyExamAttempts: async (examId: string): Promise<ExamAttempt[]> => {
    const response = await apiClient.get<ExamAttemptsResponse>(`/exams/${examId}/attempts/my`);
    const raw = response.data;
    return raw?.data?.attempts || raw?.attempts || (Array.isArray(raw) ? raw : []);
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
