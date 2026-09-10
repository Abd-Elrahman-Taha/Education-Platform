import { examsApi as backendExamsApi } from '../../../api/exams.api';
import { ApiResponse } from '../../../api/client';
import { ExamRecord, ExamStats } from '../../../types';

export const examsApi = {
  getExamHistory: async (): Promise<ApiResponse<ExamRecord[]>> => {
    try {
      const examsRes = await backendExamsApi.getExams({ limit: 50 });
      const examsList = examsRes.exams || [];
      const historyRecords: ExamRecord[] = [];

      for (const exam of examsList.slice(0, 10)) {
        try {
          const myAttempts = await backendExamsApi.getMyExamAttempts(exam._id);
          for (const att of myAttempts) {
            const isPassed = att.status === 'Passed' || att.score >= att.passingScore;
            const percentage = att.totalPoints && att.totalPoints > 0
              ? Math.round((att.score / att.totalPoints) * 100)
              : Math.round(att.score || 0);

            historyRecords.push({
              id: att._id,
              lessonId: exam.CourseId || 'course-lesson',
              lessonTitle: exam.Title,
              date: att.submittedAt ? att.submittedAt.slice(0, 10) : (att.createdAt ? att.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10)),
              score: att.score ?? 0,
              totalQuestions: att.totalPoints || 10,
              percentage,
              isPassed,
              durationSpent: '20 دقيقة',
              details: [],
            });
          }
        } catch {}
      }

      return {
        data: historyRecords,
        status: 200,
        message: 'Success',
      };
    } catch {
      return {
        data: [],
        status: 200,
        message: 'Success',
      };
    }
  },

  getExamStats: async (): Promise<ApiResponse<ExamStats>> => {
    try {
      const examsRes = await backendExamsApi.getExams({ limit: 50 });
      const examsList = examsRes.exams || [];
      let totalAttempts = 0;
      let passedCount = 0;
      let failedCount = 0;
      let totalScoreSum = 0;
      let highestScore = 0;

      for (const exam of examsList.slice(0, 10)) {
        try {
          const myAttempts = await backendExamsApi.getMyExamAttempts(exam._id);
          for (const att of myAttempts) {
            totalAttempts++;
            const isPassed = att.status === 'Passed' || att.score >= att.passingScore;
            if (isPassed) passedCount++;
            else failedCount++;

            const score = att.score || 0;
            if (score > highestScore) highestScore = score;
            totalScoreSum += score;
          }
        } catch {}
      }

      const avg = totalAttempts > 0 ? Math.round(totalScoreSum / totalAttempts) : 0;
      const passRate = totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0;

      return {
        data: {
          totalAttempted: totalAttempts,
          passedCount,
          failedCount,
          averageScore: avg,
          highestScore,
          overallPassRate: passRate,
        },
        status: 200,
        message: 'Success',
      };
    } catch {
      return {
        data: {
          totalAttempted: 0,
          passedCount: 0,
          failedCount: 0,
          averageScore: 0,
          highestScore: 0,
          overallPassRate: 0,
        },
        status: 200,
        message: 'Success',
      };
    }
  },
};
