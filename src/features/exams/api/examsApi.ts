import { examsApi as backendExamsApi } from '../../../api/exams.api';
import { enrollmentsApi } from '../../../api/enrollments.api';
import { lessonsApi } from '../../../api/lessons.api';
import { ApiResponse } from '../../../api/client';
import { ExamRecord, ExamStats } from '../../../types';

// In-memory cache & deduplication to prevent repeated parallel scans
let cachedExamsList: any[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache
let inFlightDiscovery: Promise<any[]> | null = null;

export function invalidateExamsDiscoveryCache() {
  cachedExamsList = null;
  cacheTimestamp = 0;
}

async function getStudentOrAdminExams(): Promise<any[]> {
  const now = Date.now();
  if (cachedExamsList && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedExamsList;
  }
  if (inFlightDiscovery) {
    return inFlightDiscovery;
  }

  inFlightDiscovery = (async () => {
    const examsList: any[] = [];
    const seen = new Set<string>();

    try {
      // 1. Discover exams via student's enrolled courses and lessons concurrently
      const enrollments = await enrollmentsApi.getMyCourses().catch(() => []);
      const courseIds: string[] = (enrollments || [])
        .map((e: any) => {
          const cid = typeof e.CourseId === 'object' && e.CourseId ? e.CourseId._id : e.CourseId;
          return cid || e._id;
        })
        .filter(Boolean);

      // Fetch lessons for all courses in parallel
      const courseLessonsResults = await Promise.allSettled(
        courseIds.map(async (cId) => {
          const lessons = await lessonsApi.getCourseLessons(cId);
          return { cId, lessons: Array.isArray(lessons) ? lessons : [] };
        })
      );

      // Flatten lessons across all courses
      const lessonsToQuery: { cId: string; lesson: any }[] = [];
      for (const res of courseLessonsResults) {
        if (res.status === 'fulfilled') {
          for (const l of res.value.lessons) {
            lessonsToQuery.push({ cId: res.value.cId, lesson: l });
          }
        }
      }

      // Fetch lesson exams in parallel
      await Promise.allSettled(
        lessonsToQuery.map(async ({ cId, lesson }) => {
          try {
            const lExams = await lessonsApi.getLessonExams(cId, lesson._id);
            if (Array.isArray(lExams)) {
              for (const lx of lExams) {
                if (lx?._id && !seen.has(lx._id)) {
                  seen.add(lx._id);
                  examsList.push({ ...lx, CourseId: cId });
                }
              }
            }
          } catch {}

          if (lesson.PrerequisiteExamId && !seen.has(lesson.PrerequisiteExamId)) {
            seen.add(lesson.PrerequisiteExamId);
            examsList.push({ _id: lesson.PrerequisiteExamId, Title: lesson.Title, CourseId: cId });
          }
        })
      );
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

    cachedExamsList = examsList;
    cacheTimestamp = Date.now();
    return examsList;
  })().finally(() => {
    inFlightDiscovery = null;
  });

  return inFlightDiscovery;
}

export const examsApi = {
  getExamHistory: async (): Promise<ApiResponse<ExamRecord[]>> => {
    try {
      const examsList = await getStudentOrAdminExams();
      const historyRecords: ExamRecord[] = [];

      const results = await Promise.allSettled(
        examsList.slice(0, 50).map(async exam => {
          try {
            const myAttempts = await backendExamsApi.getMyExamAttempts(exam._id);
            return (myAttempts || []).map(att => {
              const isPassed = att.status === 'Passed' || att.score >= att.passingScore;
              const percentage = att.totalPoints && att.totalPoints > 0
                ? Math.round((att.score / att.totalPoints) * 100)
                : Math.round(att.score || 0);

              const record: ExamRecord = {
                id: att._id,
                examId: exam._id,
                lessonId: exam.CourseId || 'course-lesson',
                lessonTitle: exam.Title,
                date: att.submittedAt ? att.submittedAt.slice(0, 10) : (att.createdAt ? att.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10)),
                score: att.score ?? 0,
                totalQuestions: att.totalPoints || 10,
                percentage,
                isPassed,
                durationSpent: '20 دقيقة',
                details: [],
              };
              return record;
            });
          } catch {
            return [];
          }
        })
      );

      for (const res of results) {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          historyRecords.push(...res.value);
        }
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

      // Query attempts concurrently
      const attemptsResults = await Promise.allSettled(
        examsList.slice(0, 20).map(exam => backendExamsApi.getMyExamAttempts(exam._id))
      );

      for (const res of attemptsResults) {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          for (const att of res.value) {
            totalAttempts++;
            const isPassed = att.status === 'Passed' || att.score >= att.passingScore;
            if (isPassed) passedCount++;
            else failedCount++;

            const score = att.score || 0;
            if (score > highestScore) highestScore = score;
            totalScoreSum += score;
          }
        }
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
