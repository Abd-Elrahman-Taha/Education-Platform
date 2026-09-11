import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '../api/courses.api';
import { lessonsApi } from '../api/lessons.api';
import { enrollmentsApi } from '../api/enrollments.api';
import { useAuth } from '../context/AuthContext';

export function useCourseDetails(courseId?: string) {
  const { currentUser } = useAuth();
  const isAdminOrTeacher = currentUser?.role === 'admin' || currentUser?.role === 'superadmin' || currentUser?.role === 'teacher';

  const courseQuery = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesApi.getCourseById(courseId!),
    enabled: !!courseId,
  });

  const enrollmentsQuery = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => enrollmentsApi.getMyCourses(),
    enabled: !!currentUser && !isAdminOrTeacher,
  });

  const isEnrolledViaList = !!enrollmentsQuery.data?.some((e) => {
    const id = typeof e.CourseId === 'object' && e.CourseId ? e.CourseId._id : (e.CourseId as unknown as string);
    return id === courseId;
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

  const isEnrolled =
    isAdminOrTeacher ||
    isEnrolledViaList ||
    (lessonsQuery.data !== null && lessonsQuery.data !== undefined && !lessonsQuery.isError);

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
