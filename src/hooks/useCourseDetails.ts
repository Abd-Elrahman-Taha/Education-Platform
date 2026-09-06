import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '../api/courses.api';
import { lessonsApi } from '../api/lessons.api';

export function useCourseDetails(courseId?: string) {
  const courseQuery = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesApi.getCourseById(courseId!),
    enabled: !!courseId,
  });

  const lessonsQuery = useQuery({
    queryKey: ['course-lessons', courseId],
    queryFn: async () => {
      try {
        return await lessonsApi.getCourseLessons(courseId!);
      } catch (err: any) {
        // 403 indicates student is not enrolled
        if (err?.isForbidden || err?.status === 403) {
          return null; // not enrolled
        }
        throw err;
      }
    },
    enabled: !!courseId,
    retry: false,
  });

  const isEnrolled = lessonsQuery.data !== null && lessonsQuery.data !== undefined;

  return {
    course: courseQuery.data,
    lessons: Array.isArray(lessonsQuery.data) ? lessonsQuery.data : [],
    isEnrolled,
    isLoading: courseQuery.isLoading || lessonsQuery.isLoading,
    isCourseError: courseQuery.isError,
    courseError: courseQuery.error as any,
    lessonsError: lessonsQuery.error as any,
    refetchLessons: lessonsQuery.refetch,
    refetchCourse: courseQuery.refetch,
  };
}
