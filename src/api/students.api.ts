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
    const queryParams: Record<string, any> = { limit: 500 };
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.sort) queryParams.sort = params.sort;
    if (params?.search && params.search.trim()) queryParams.search = params.search.trim();
    if (params?.Status && params.Status !== 'all') queryParams.Status = params.Status;

    const response = await apiClient.get<StudentsListResponse>('/users/students', { params: queryParams });
    const students = response.data?.data?.students || (response.data as any)?.students || [];
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
  /**
   * Promote Student to Admin (Admin-only).
   * Backend endpoint: PATCH /users/:userId/role with { Role: "Admin" }.
   * Note: The target user's active session is invalidated by the backend.
   */
  promoteStudentToAdmin: async (userId: string, _studentData?: Partial<AdminStudent>): Promise<any> => {
    const response = await apiClient.patch(`/users/${userId}/role`, { Role: 'Admin' });
    return response.data;
  },

  /**
   * Demote Admin to normal Student user (SuperAdmin only).
   * Backend endpoint: DELETE /users/admins/:userId (official) or PATCH /users/:userId/role.
   */
  demoteAdminToStudent: async (userId: string): Promise<any> => {
    try {
      const response = await apiClient.delete(`/users/admins/${userId}`);
      return response.data || { success: true };
    } catch {
      const response = await apiClient.patch(`/users/${userId}/role`, { Role: 'Student' });
      return response.data;
    }
  },

  /**
   * Update student / admin role (Admin-only).
   */
  updateStudentRole: async (userId: string, role: 'Admin' | 'Student' | string, studentData?: Partial<AdminStudent>): Promise<any> => {
    const targetRole = role.toLowerCase() === 'admin' ? 'Admin' : 'Student';
    if (targetRole === 'Admin') {
      return studentsApi.promoteStudentToAdmin(userId, studentData);
    } else {
      return studentsApi.demoteAdminToStudent(userId);
    }
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
   * Get all admin users (SuperAdmin endpoint: GET /users/admins or filtered from /users/students).
   */
  getAdmins: async (): Promise<{ admins: AdminStudent[]; total: number }> => {
    // 1. Try direct call to /users/admins
    try {
      const response = await apiClient.get<any>('/users/admins');
      const raw = response.data;
      const list: AdminStudent[] = Array.isArray(raw?.data?.admins)
        ? raw.data.admins
        : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.admins)
        ? raw.admins
        : Array.isArray(raw)
        ? raw
        : [];
      if (list.length > 0) {
        return {
          admins: list,
          total: list.length,
        };
      }
    } catch (err) {
      // Endpoint may not exist on backend, fall back to /users/students
    }

    // 2. Query /users/students and extract admin roles
    try {
      const response = await apiClient.get<StudentsListResponse>('/users/students', { params: { limit: 100, page: 1 } });
      const raw = response.data as any;
      const list: AdminStudent[] = Array.isArray(raw?.data?.students)
        ? raw.data.students
        : Array.isArray(raw?.data?.users)
        ? raw.data.users
        : Array.isArray(raw?.students)
        ? raw.students
        : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw)
        ? raw
        : [];

      const adminMap = new Map<string, AdminStudent>();
      for (const u of list) {
        const r = (u.Role || (u as any).role || '').toString().toLowerCase().trim();
        if (r === 'admin' || r === 'superadmin' || (u as any).isAdmin === true || (u.Role && u.Role !== 'Student')) {
          if (u && u._id) {
            adminMap.set(u._id, { ...u, Role: (r === 'superadmin' ? 'SuperAdmin' : 'Admin') as any });
          }
        }
      }
      const allAdmins = Array.from(adminMap.values());
      return {
        admins: allAdmins,
        total: allAdmins.length,
      };
    } catch (err) {
      console.error('Failed to fetch admins from backend:', err);
      return { admins: [], total: 0 };
    }
  },

  /**
   * Delete an admin (SuperAdmin only: DELETE /users/admins/:userId or demote role).
   */
  deleteAdmin: async (userId: string): Promise<void> => {
    try {
      await apiClient.delete(`/users/admins/${userId}`);
    } catch {
      await apiClient.patch(`/users/${userId}/role`, { Role: 'Student' });
    }
  },
};
