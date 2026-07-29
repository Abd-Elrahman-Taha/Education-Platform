import { fakeApiCall, ApiResponse } from '../../../api/client';
import { mockDB } from '../../../services/db';
import { Lesson, LessonHomework, ExamRecord } from '../../../types';

export const lessonsApi = {
  getLessons: (): Promise<ApiResponse<Lesson[]>> => {
    return fakeApiCall(() => mockDB.getLessons());
  },

  getLessonById: (id: string): Promise<ApiResponse<Lesson>> => {
    return fakeApiCall(() => {
      const lesson = mockDB.getLessonById(id);
      if (!lesson) throw new Error('Lesson not found');
      return lesson;
    });
  },

  submitHomework: (lessonId: string, answers: Record<number, string>): Promise<ApiResponse<LessonHomework>> => {
    return fakeApiCall(() => mockDB.submitHomework(lessonId, answers));
  },

  submitLessonExam: (
    lessonId: string,
    answers: Record<number, string>,
    timeSpent: string
  ): Promise<ApiResponse<{ examRecord: ExamRecord; unlockedNextLesson: boolean }>> => {
    return fakeApiCall(() => mockDB.submitLessonExam(lessonId, answers, timeSpent));
  },

  submitFeedback: (lessonId: string, rating: number, comment: string): Promise<ApiResponse<void>> => {
    return fakeApiCall(() => mockDB.submitLessonFeedback(lessonId, rating, comment));
  },
};
