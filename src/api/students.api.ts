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
    const queryParams = { limit: 500, ...cleanParams };
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
   * Queries /users/students with high limit, scans all pages, and checks case-insensitive Role/role.
   * Merges with persistent platform_admins_list.
   */
  getAdmins: async (): Promise<{ admins: AdminStudent[]; total: number }> => {
    let allUsers: AdminStudent[] = [];
    try {
      const response = await apiClient.get<StudentsListResponse>('/users/students', { params: { limit: 500 } });
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
      allUsers = list;

      const totalPages = raw?.pagination?.totalPages || 1;
      if (totalPages > 1) {
        for (let p = 2; p <= Math.min(totalPages, 5); p++) {
          try {
            const pageRes = await apiClient.get<StudentsListResponse>('/users/students', { params: { limit: 500, page: p } });
            const pageRaw = pageRes.data as any;
            const pageList: AdminStudent[] = pageRaw?.data?.students || pageRaw?.students || [];
            allUsers = [...allUsers, ...pageList];
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Failed to fetch students list when looking for admins:', err);
    }

    // Filter for all Admin users
    const backendAdmins = allUsers.filter(u => {
      const r = (u.Role || (u as any).role || '').toString().toLowerCase().trim();
      return r === 'admin' || (u as any).isAdmin === true || (u.Role && u.Role !== 'Student');
    });

    // Merge with any known stored admins in platform_admins_list
    let storedAdmins: AdminStudent[] = [];
    try {
      const storedAdminsStr = localStorage.getItem('platform_admins_list');
      if (storedAdminsStr) {
        storedAdmins = JSON.parse(storedAdminsStr);
      }
    } catch {}

    // Deduplicate by _id and Phone
    const adminMap = new Map<string, AdminStudent>();
    for (const a of backendAdmins) {
      if (a._id) adminMap.set(a._id, a);
    }
    for (const a of storedAdmins) {
      if (a._id && !adminMap.has(a._id)) {
        adminMap.set(a._id, a);
      }
    }

    const mergedAdmins = Array.from(adminMap.values());
    if (mergedAdmins.length > 0) {
      try {
        localStorage.setItem('platform_admins_list', JSON.stringify(mergedAdmins));
      } catch {}
    }

    return {
      admins: mergedAdmins,
      total: mergedAdmins.length,
    };
  },
};
