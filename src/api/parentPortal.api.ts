import { apiClient } from './axios';
import {
  ParentPortalLookupRequest,
  ParentPortalLookupResponse,
} from '../types/api.types';

export const parentPortalApi = {
  /**
   * Retrieve read-only educational progress report for a student.
   * Public endpoint (Rate limit: 5 attempts / 5 mins per IP).
   * Both nationalId (14 digits) and phone (Egyptian 11 digits) must belong to the exact same student.
   */
  lookupProgress: async (data: ParentPortalLookupRequest): Promise<ParentPortalLookupResponse> => {
    const response = await apiClient.post<ParentPortalLookupResponse>('/parent-portal/lookup', data);
    return response.data;
  },

  /**
   * Generate and download student educational progress PDF report.
   * Public endpoint. Returns binary PDF file stream.
   */
  downloadPdfReport: async (data: ParentPortalLookupRequest): Promise<Blob> => {
    const response = await apiClient.post('/parent-portal/report/pdf', data, {
      responseType: 'blob',
    });
    return response.data;
  },
};
