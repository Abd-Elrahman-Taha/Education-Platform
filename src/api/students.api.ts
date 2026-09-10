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
    let cleanParams = params ? { ...params } : undefined;
    if (cleanParams && typeof cleanParams.search === 'string' && !cleanParams.search.trim()) {
      delete cleanParams.search;
    }
    const response = await apiClient.get<StudentsListResponse>('/users/students', { params: cleanParams });
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
   * Update student profile fields (Admin only).
   * Backend Swagger Contract: PATCH /users/students/:userId
   * Allowed fields: FullName, Phone, ParentPhone, NationalId
   */
  updateStudent: async (userId: string, data: UpdateStudentRequest): Promise<AdminStudent> => {
    const cleanPayload: Record<string, any> = {};
    if (data.FullName && typeof data.FullName === 'string' && data.FullName.trim()) {
      cleanPayload.FullName = data.FullName.trim();
    }
    if (data.Phone && typeof data.Phone === 'string' && data.Phone.trim()) {
      cleanPayload.Phone = data.Phone.trim();
    }
    if (data.ParentPhone && typeof data.ParentPhone === 'string' && data.ParentPhone.trim() && data.ParentPhone.trim() !== '—') {
      cleanPayload.ParentPhone = data.ParentPhone.trim();
    }
    if (data.NationalId && typeof data.NationalId === 'string' && data.NationalId.trim()) {
      cleanPayload.NationalId = data.NationalId.trim();
    }

    if (Object.keys(cleanPayload).length === 0) {
      return {} as AdminStudent;
    }

    const response = await apiClient.patch<{ status: string; data: { student: AdminStudent } }>(
      `/users/students/${userId}`,
      cleanPayload
    );
    return response.data?.data?.student || (response.data as any)?.student || response.data;
  },

  /**
   * Promote Student to Admin (Admin-only).
   * Backend endpoint: PATCH /users/:userId/role with { Role: "Admin" }.
   * Note: The target user's active session is invalidated by the backend.
   */
  promoteStudentToAdmin: async (userId: string): Promise<any> => {
    const response = await apiClient.patch(`/users/${userId}/role`, { Role: 'Admin' });
    return response.data;
  },

  /**
   * Demote Admin to normal Student user (Admin-only).
   * Backend endpoint: PATCH /users/:userId/role with { Role: "Student" }.
   */
  demoteAdminToStudent: async (userId: string): Promise<any> => {
    const response = await apiClient.patch(`/users/${userId}/role`, { Role: 'Student' });
    return response.data;
  },

  /**
   * Update student / admin role (Admin-only).
   */
  updateStudentRole: async (userId: string, role: 'Admin' | 'Student' | string): Promise<any> => {
    const targetRole = role.toLowerCase() === 'admin' ? 'Admin' : 'Student';
    const response = await apiClient.patch(`/users/${userId}/role`, { Role: targetRole });
    return response.data;
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

  /**
   * Get all admin users (Admin-only).
   * Backend endpoint: GET /users/admins
   * Returns all users with Role === 'Admin'.
   */
  getAdmins: async (): Promise<{ admins: AdminStudent[]; total: number }> => {
    const response = await apiClient.get<any>('/users/admins');
    const raw = response.data;
    // Handle multiple possible response shapes
    const adminsList: AdminStudent[] = Array.isArray(raw?.data?.admins)
      ? raw.data.admins
      : Array.isArray(raw?.data?.users)
      ? raw.data.users
      : Array.isArray(raw?.admins)
      ? raw.admins
      : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw)
      ? raw
      : [];
    return {
      admins: adminsList,
      total: raw?.pagination?.total ?? raw?.results ?? adminsList.length,
    };
  },
};
