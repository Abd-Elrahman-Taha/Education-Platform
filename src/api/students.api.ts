import { apiClient } from './axios';
import {
  AdminStudent,
  StudentsListResponse,
  CreateStudentRequest,
  UpdateStudentRequest,
  UpdateStudentStatusRequest,
} from '../types/api.types';

export interface StudentQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  Status?: string;
}

export const studentsApi = {
  /**
   * List students with search, sorting, and status filter (Admin only).
   */
  getStudents: async (params?: StudentQueryParams): Promise<{ students: AdminStudent[]; total: number; totalPages: number }> => {
    const response = await apiClient.get<StudentsListResponse>('/users/students', { params });
    const students = response.data?.data?.students || [];
    const pagination = response.data?.pagination || { total: students.length, totalPages: 1 };
    return {
      students,
      total: pagination.total,
      totalPages: pagination.totalPages,
    };
  },

  /**
   * Get specific student by ID (Admin only).
   */
  getStudentById: async (userId: string): Promise<AdminStudent> => {
    const response = await apiClient.get<{ status: string; data: { student: AdminStudent } }>(
      `/users/students/${userId}`
    );
    return response.data?.data?.student;
  },

  /**
   * Create a new student (Admin only).
   */
  createStudent: async (data: CreateStudentRequest): Promise<AdminStudent> => {
    const response = await apiClient.post<{ status: string; data: { student: AdminStudent } }>(
      '/users/students',
      data
    );
    return response.data?.data?.student;
  },

  /**
   * Update student profile fields (Admin only). Do NOT send Role, Status, or password.
   */
  updateStudent: async (userId: string, data: UpdateStudentRequest): Promise<AdminStudent> => {
    const response = await apiClient.patch<{ status: string; data: { student: AdminStudent } }>(
      `/users/students/${userId}`,
      data
    );
    return response.data?.data?.student;
  },

  /**
   * Update student status (Active, SuspendedMultiDevice, Blocked).
   */
  updateStudentStatus: async (
    userId: string,
    status: 'Active' | 'SuspendedMultiDevice' | 'Blocked'
  ): Promise<{ status: string; message?: string }> => {
    const response = await apiClient.patch<{ status: string; message?: string }>(
      `/users/${userId}/status`,
      { status }
    );
    return response.data;
  },

  /**
   * Delete student (safe hard deletion). Fails with 400 if student has protected history.
   */
  deleteStudent: async (userId: string): Promise<void> => {
    await apiClient.delete(`/users/students/${userId}`);
  },
};
