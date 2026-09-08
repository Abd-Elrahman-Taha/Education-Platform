import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '../api/courses.api';
import { Course, CourseQueryParams } from '../types/api.types';

export function useCourses(initialParams?: CourseQueryParams) {
  const [params, setParams] = useState<CourseQueryParams>({
    page: initialParams?.page || 1,
    limit: initialParams?.limit || 12,
    sort: initialParams?.sort || '-createdAt',
    search: initialParams?.search || '',
  });

  const query = useQuery({
    queryKey: ['courses', params],
    queryFn: () => coursesApi.getCourses(params),
    placeholderData: (previousData) => previousData,
  });

  const handlePageChange = (newPage: number) => {
    setParams((prev) => ({ ...prev, page: newPage }));
  };

  const handleSearchChange = (search: string) => {
    setParams((prev) => ({ ...prev, search, page: 1 }));
  };

  const handleSortChange = (sort: string) => {
    setParams((prev) => ({ ...prev, sort, page: 1 }));
  };

  const rawList = query.data?.courses || query.data?.data?.courses;
  const coursesList: Course[] = Array.isArray(rawList) ? rawList : [];

  return {
    courses: coursesList,
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error as any,
    params,
    setParams,
    handlePageChange,
    handleSearchChange,
    handleSortChange,
    refetch: query.refetch,
  };
}
