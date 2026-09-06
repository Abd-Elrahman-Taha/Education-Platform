import { apiClient } from './axios';
import {
  StartExamResponse,
  SubmitExamRequest,
  SubmitExamResponse,
} from '../types/api.types';

export const examsApi = {
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
