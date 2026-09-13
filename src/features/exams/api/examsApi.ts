import { examsApi as backendExamsApi } from '../../../api/exams.api';
import { enrollmentsApi } from '../../../api/enrollments.api';
import { lessonsApi } from '../../../api/lessons.api';
import { ApiResponse } from '../../../api/client';
import { ExamRecord, ExamStats } from '../../../types';

async function getStudentOrAdminExams(): Promise<any[]> {
  const examsList: any[] = [];
  const seen = new Set<string>();

  // 1. Discover exams via student's enrolled courses and lessons
  try {
    const enrollments = await enrollmentsApi.getMyCourses();
    const courseIds = (enrollments || [])
      .map((e: any) => {
        const cid = typeof e.CourseId === 'object' && e.CourseId ? e.CourseId._id : e.CourseId;
        return cid || e._id;
      })
      .filter(Boolean);

    for (const cId of courseIds) {
      try {
        const lessons = await lessonsApi.getCourseLessons(cId);
        if (Array.isArray(lessons)) {
          for (const l of lessons) {
            try {
              const lExams = await lessonsApi.getLessonExams(cId, l._id);
              if (Array.isArray(lExams)) {
                for (const lx of lExams) {
                  if (lx?._id && !seen.has(lx._id)) {
                    seen.add(lx._id);
                    examsList.push({ ...lx, CourseId: cId });
                  }
                }
              }
            } catch {}

            if (l.PrerequisiteExamId && !seen.has(l.PrerequisiteExamId)) {
              seen.add(l.PrerequisiteExamId);
              examsList.push({ _id: l.PrerequisiteExamId, Title: l.Title, CourseId: cId });
            }
          }
        }
      } catch {}
    }
  } catch {}

  // 2. If nothing found or if admin, fallback to getExams
  if (examsList.length === 0) {
    try {
      const examsRes = await backendExamsApi.getExams({ limit: 50 });
      for (const e of examsRes.exams || []) {
        if (e?._id && !seen.has(e._id)) {
          seen.add(e._id);
          examsList.push(e);
        }
      }
    } catch {}
  }

  return examsList;
}

export const examsApi = {
  getExamHistory: async (): Promise<ApiResponse<ExamRecord[]>> => {
    try {
      const examsList = await getStudentOrAdminExams();
      const historyRecords: ExamRecord[] = [];

      for (const exam of examsList.slice(0, 15)) {
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
      const examsList = await getStudentOrAdminExams();
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
