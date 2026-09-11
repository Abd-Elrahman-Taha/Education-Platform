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
  /**
   * Promote Student to Admin (Admin-only).
   * Backend endpoint: PATCH /users/:userId/role with { Role: "Admin" }.
   * Note: The target user's active session is invalidated by the backend.
   */
  promoteStudentToAdmin: async (userId: string, studentData?: Partial<AdminStudent>): Promise<any> => {
    const response = await apiClient.patch(`/users/${userId}/role`, { Role: 'Admin' });
    try {
      // Remove from demoted set if re-promoted
      const demotedRaw = localStorage.getItem('platform_demoted_admins');
      if (demotedRaw) {
        const demotedSet: string[] = JSON.parse(demotedRaw);
        const filtered = demotedSet.filter(id => id !== userId);
        localStorage.setItem('platform_demoted_admins', JSON.stringify(filtered));
      }

      const stored = localStorage.getItem('platform_admins_registry');
      const list: AdminStudent[] = stored ? JSON.parse(stored) : [];
      const newAdmin: AdminStudent = {
        _id: userId,
        FullName: studentData?.FullName || 'مسؤول المنصة',
        Phone: studentData?.Phone || '',
        NationalId: studentData?.NationalId || '—',
        ParentPhone: studentData?.ParentPhone || '—',
        Role: 'Admin',
        Status: 'Active',
        ...(studentData || {}),
      };
      const updated = [newAdmin, ...list.filter(a => a._id !== userId)];
      localStorage.setItem('platform_admins_registry', JSON.stringify(updated));
    } catch {}
    return response.data;
  },

  /**
   * Demote Admin to normal Student user (SuperAdmin only).
   * Primary: DELETE /users/admins/:userId (official backend endpoint to remove/demote admin).
   * Fallbacks: PATCH role endpoints if supported.
   */
  demoteAdminToStudent: async (userId: string): Promise<any> => {
    let result: any = null;
    let apiError: any = null;

    // 1. Primary: DELETE /users/admins/:userId (Official SuperAdmin endpoint to remove admin)
    try {
      const response = await apiClient.delete(`/users/admins/${userId}`);
      result = response.data || { success: true };
    } catch (err: any) {
      apiError = err;
      console.warn('[Admins API] DELETE /users/admins/:userId returned error, attempting role fallbacks:', err?.response?.data || err?.message);
    }

    // 2. Fallback: PATCH /users/:userId/role with { Role: 'Student' }
    if (!result) {
      try {
        const response = await apiClient.patch(`/users/${userId}/role`, { Role: 'Student' });
        result = response.data;
      } catch (err: any) {
        apiError = err;
      }
    }

    // 3. Fallback: PATCH /users/:userId/role with { role: 'student' }
    if (!result) {
      try {
        const response = await apiClient.patch(`/users/${userId}/role`, { role: 'student' });
        result = response.data;
      } catch (err: any) {
        apiError = err;
      }
    }

    // 4. Fallback: PATCH /users/students/:userId with { Role: 'Student' }
    if (!result) {
      try {
        const fallback = await apiClient.patch(`/users/students/${userId}`, { Role: 'Student' } as any);
        result = fallback.data;
      } catch (err: any) {
        apiError = err;
      }
    }

    // Always update local registry and demoted tracker
    try {
      const stored = localStorage.getItem('platform_admins_registry');
      if (stored) {
        const list: AdminStudent[] = JSON.parse(stored);
        const updated = list.filter(a => a._id !== userId);
        localStorage.setItem('platform_admins_registry', JSON.stringify(updated));
      }
      const demotedRaw = localStorage.getItem('platform_demoted_admins');
      const demotedSet: string[] = demotedRaw ? JSON.parse(demotedRaw) : [];
      if (!demotedSet.includes(userId)) {
        demotedSet.push(userId);
        localStorage.setItem('platform_demoted_admins', JSON.stringify(demotedSet));
      }
    } catch {}

    if (!result && apiError) {
      throw apiError;
    }

    return result || { success: true };
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
   * Get all admin users (SuperAdmin endpoint: GET /users/admins).
   */
  getAdmins: async (): Promise<{ admins: AdminStudent[]; total: number }> => {
    // 1. Direct call to the new official GET /users/admins
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
        try {
          localStorage.setItem('platform_admins_registry', JSON.stringify(list));
        } catch {}
        return {
          admins: list,
          total: list.length,
        };
      }
    } catch (err) {
      console.warn('[Admins API] /users/admins query error:', err);
    }

    const userMap = new Map<string, AdminStudent>();

    // 2. Load registry cache
    try {
      const stored = localStorage.getItem('platform_admins_registry');
      if (stored) {
        const parsed: AdminStudent[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          for (const a of parsed) {
            if (a && a._id) userMap.set(a._id, a);
          }
        }
      }
    } catch {}

    // 3. Fallback: Query API /users/students across pages
    try {
      const response = await apiClient.get<StudentsListResponse>('/users/students', { params: { limit: 50, page: 1 } });
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

      for (const u of list) {
        const r = (u.Role || (u as any).role || '').toString().toLowerCase().trim();
        if (r === 'admin' || r === 'superadmin' || (u as any).isAdmin === true || (u.Role && u.Role !== 'Student')) {
          if (u && u._id) userMap.set(u._id, { ...u, Role: (r === 'superadmin' ? 'SuperAdmin' : 'Admin') as any });
        }
      }
    } catch (err) {
      console.warn('Failed to fetch students from API for admin detection:', err);
    }

    const allAdmins = Array.from(userMap.values());
    try {
      localStorage.setItem('platform_admins_registry', JSON.stringify(allAdmins));
    } catch {}

    return {
      admins: allAdmins,
      total: allAdmins.length,
    };
  },

  /**
   * Delete an admin (SuperAdmin only: DELETE /users/admins/:userId).
   */
  deleteAdmin: async (userId: string): Promise<void> => {
    try {
      await apiClient.delete(`/users/admins/${userId}`);
    } finally {
      try {
        const stored = localStorage.getItem('platform_admins_registry');
        if (stored) {
          const list: AdminStudent[] = JSON.parse(stored);
          const updated = list.filter(a => a._id !== userId);
          localStorage.setItem('platform_admins_registry', JSON.stringify(updated));
        }
        const demotedRaw = localStorage.getItem('platform_demoted_admins');
        const demotedSet: string[] = demotedRaw ? JSON.parse(demotedRaw) : [];
        if (!demotedSet.includes(userId)) {
          demotedSet.push(userId);
          localStorage.setItem('platform_demoted_admins', JSON.stringify(demotedSet));
        }
      } catch {}
    }
  },
};
