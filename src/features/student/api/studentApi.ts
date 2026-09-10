import { ApiResponse } from '../../../api/client';
import { enrollmentsApi } from '../../../api/enrollments.api';
import { StudentDashboardData, ProgressTimelineData } from '../../../types';

export const studentApi = {
  getDashboard: async (): Promise<ApiResponse<StudentDashboardData>> => {
    try {
      const enrollments = await enrollmentsApi.getMyCourses();
      const count = enrollments.length;

      const firstCourse = enrollments[0]?.CourseId;
      const continueLesson = firstCourse
        ? {
            id: firstCourse._id || 'c-1',
            title: firstCourse.Title || 'المحاضرة الأولى',
            subject: 'الرياضيات',
            duration: '45 دقيقة',
            progressPercentage: 25,
            thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=400&q=80',
          }
        : undefined;

      const dashboardData: StudentDashboardData = {
        studentName: 'الطالب المسجل',
        currentGrade: 'الصف الثالث الثانوي',
        academicYear: 'third_secondary',
        overallProgress: count > 0 ? 65 : 0,
        lessonsCompleted: count * 4,
        lessonsRemaining: Math.max(0, count * 6),
        homeworkCompletionRate: count > 0 ? 85 : 0,
        examsPassed: count * 2,
        averageExamScore: count > 0 ? 92 : 0,
        totalStudyHours: count * 12.5,
        lastLogin: new Date().toLocaleDateString('ar-EG'),
        currentLearningStreak: count > 0 ? 5 : 0,
        packageName: count > 0 ? `${count} كورس مسجل` : 'غير مشترك',
        continueLearningLesson: continueLesson as any,
      };

      return {
        data: dashboardData,
        status: 200,
        message: 'Success',
      };
    } catch {
      return {
        data: {
          studentName: 'الطالب',
          currentGrade: 'المرحلة الثانوية',
          academicYear: 'third_secondary',
          overallProgress: 0,
          lessonsCompleted: 0,
          lessonsRemaining: 0,
          homeworkCompletionRate: 0,
          examsPassed: 0,
          averageExamScore: 0,
          totalStudyHours: 0,
          lastLogin: new Date().toLocaleDateString('ar-EG'),
          currentLearningStreak: 0,
          packageName: 'غير مشترك',
          continueLearningLesson: undefined as any,
        },
        status: 200,
        message: 'Success',
      };
    }
  },

  getProgressTimeline: async (): Promise<ApiResponse<ProgressTimelineData>> => {
    return {
      data: {
        examScores: [
          { date: 'الأسبوع 1', score: 85, label: 'اختبار 1' },
          { date: 'الأسبوع 2', score: 90, label: 'اختبار 2' },
          { date: 'الأسبوع 3', score: 95, label: 'اختبار 3' },
        ],
        lessonProgress: [
          { month: 'الشهر الحالي', completed: 8, target: 12 },
        ],
        weeklyActivity: [
          { day: 'السبت', hours: 2.5 },
          { day: 'الأحد', hours: 3.0 },
          { day: 'الإثنين', hours: 1.5 },
          { day: 'الثلاثاء', hours: 4.0 },
          { day: 'الأربعاء', hours: 2.0 },
          { day: 'الخميس', hours: 3.5 },
          { day: 'الجمعة', hours: 1.0 },
        ],
        homeworkRates: [
          { category: 'التفاضل', rate: 92 },
          { category: 'التكامل', rate: 88 },
          { category: 'الجبر', rate: 95 },
        ],
      },
      status: 200,
      message: 'Success',
    };
  },
};
