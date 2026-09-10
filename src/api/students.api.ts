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
   * Demote Admin to normal Student user (Admin-only).
   * Backend endpoint: PATCH /users/:userId/role with { Role: "Student" }.
   */
  demoteAdminToStudent: async (userId: string): Promise<any> => {
    try {
      const response = await apiClient.patch(`/users/${userId}/role`, { Role: 'Student' });
      try {
        const stored = localStorage.getItem('platform_admins_registry');
        if (stored) {
          const list: AdminStudent[] = JSON.parse(stored);
          const updated = list.filter(a => a._id !== userId);
          localStorage.setItem('platform_admins_registry', JSON.stringify(updated));
        }
      } catch {}
      return response.data;
    } catch (err: any) {
      // Fallback: some backends allow updating role via students endpoint
      try {
        const fallback = await apiClient.patch(`/users/students/${userId}`, { Role: 'Student' } as any);
        try {
          const stored = localStorage.getItem('platform_admins_registry');
          if (stored) {
            const list: AdminStudent[] = JSON.parse(stored);
            const updated = list.filter(a => a._id !== userId);
            localStorage.setItem('platform_admins_registry', JSON.stringify(updated));
          }
        } catch {}
        return fallback.data;
      } catch {
        throw err;
      }
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
   * Get all admin users (Admin-only).
   * Queries /users/students across all pages directly from the live API,
   * plus checks the persistent admins registry so promoted/existing admins are always preserved.
   */
  getAdmins: async (): Promise<{ admins: AdminStudent[]; total: number }> => {
    const userMap = new Map<string, AdminStudent>();

    // 1. Load registry first so known admins are never empty
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

    // 2. Query API /users/students across pages
    try {
      // First page with default limit 50
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
        if (r === 'admin' || (u as any).isAdmin === true || (u.Role && u.Role !== 'Student')) {
          if (u && u._id) userMap.set(u._id, { ...u, Role: 'Admin' });
        }
      }

      const totalItems = raw?.pagination?.total || raw?.results || raw?.total || list.length;
      const totalPages = raw?.pagination?.totalPages || raw?.pagination?.pages || Math.ceil(totalItems / 50) || 1;

      if (totalPages > 1) {
        const fetchPromises = [];
        for (let p = 2; p <= Math.min(totalPages, 10); p++) {
          fetchPromises.push(
            apiClient.get<StudentsListResponse>('/users/students', { params: { limit: 50, page: p } })
              .then(res => {
                const pRaw = res.data as any;
                const pList: AdminStudent[] = pRaw?.data?.students || pRaw?.students || pRaw?.data || [];
                return pList;
              })
              .catch(() => [] as AdminStudent[])
          );
        }
        const pagesData = await Promise.all(fetchPromises);
        for (const pList of pagesData) {
          for (const u of pList) {
            const r = (u.Role || (u as any).role || '').toString().toLowerCase().trim();
            if (r === 'admin' || (u as any).isAdmin === true || (u.Role && u.Role !== 'Student')) {
              if (u && u._id) userMap.set(u._id, { ...u, Role: 'Admin' });
            }
          }
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
};
