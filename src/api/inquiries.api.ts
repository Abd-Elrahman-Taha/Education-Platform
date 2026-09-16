import { apiClient } from './axios';
import {
  Inquiry,
  CreateInquiryRequest,
  ReplyInquiryRequest,
  InquiryStatus,
} from '../types/api.types';

export interface InquiryQueryParams {
  page?: number;
  limit?: number;
  Status?: InquiryStatus;
}

const parseInquiriesList = (raw: any): Inquiry[] => {
  const list =
    Array.isArray(raw?.data?.inquiries) ? raw.data.inquiries
    : Array.isArray(raw?.inquiries) ? raw.inquiries
    : Array.isArray(raw?.data) ? raw.data
    : Array.isArray(raw) ? raw
    : [];
  return list;
};

export const inquiriesApi = {
  createInquiry: async (data: CreateInquiryRequest): Promise<Inquiry> => {
    const cleanSub = data.Subject.trim();
    const cleanMsg = data.Message.trim();
    try {
      const response = await apiClient.post<any>('/inquiries', {
        Subject: cleanSub,
        Message: cleanMsg,
      });
      const raw = response.data;
      return raw?.data?.inquiry || raw?.inquiry || raw?.data || raw;
    } catch (primaryErr: any) {
      if (primaryErr?.response?.status === 400) {
        try {
          const resAlt = await apiClient.post<any>('/inquiries', {
            subject: cleanSub,
            message: cleanMsg,
          });
          const raw = resAlt.data;
          return raw?.data?.inquiry || raw?.inquiry || raw?.data || raw;
        } catch {}
      }
      throw primaryErr;
    }
  },

  getMyInquiries: async (params?: InquiryQueryParams): Promise<{ inquiries: Inquiry[]; total: number }> => {
    const response = await apiClient.get<any>('/inquiries/my', { params });
    const raw = response.data;
    const inquiries = parseInquiriesList(raw);
    return { inquiries, total: raw?.pagination?.total ?? inquiries.length };
  },

  getMyInquiryById: async (id: string): Promise<Inquiry> => {
    const response = await apiClient.get<any>('/inquiries/my/' + id);
    const raw = response.data;
    return raw?.data?.inquiry || raw?.inquiry || raw?.data || raw;
  },

  getAllInquiries: async (params?: InquiryQueryParams): Promise<{ inquiries: Inquiry[]; total: number }> => {
    const response = await apiClient.get<any>('/inquiries', { params });
    const raw = response.data;
    const inquiries = parseInquiriesList(raw);
    return { inquiries, total: raw?.pagination?.total ?? inquiries.length };
  },

  getInquiryById: async (id: string): Promise<Inquiry> => {
    const response = await apiClient.get<any>('/inquiries/' + id);
    const raw = response.data;
    return raw?.data?.inquiry || raw?.inquiry || raw?.data || raw;
  },

  replyToInquiry: async (id: string, data: ReplyInquiryRequest): Promise<Inquiry> => {
    const cleanReply = data.Reply.trim();
    try {
      const response = await apiClient.patch<any>('/inquiries/' + id + '/reply', {
        Reply: cleanReply,
      });
      const raw = response.data;
      return raw?.data?.inquiry || raw?.inquiry || raw?.data || raw;
    } catch (primaryErr: any) {
      if (primaryErr?.response?.status === 400) {
        try {
          const resAlt = await apiClient.patch<any>('/inquiries/' + id + '/reply', {
            reply: cleanReply,
          });
          const raw = resAlt.data;
          return raw?.data?.inquiry || raw?.inquiry || raw?.data || raw;
        } catch {}
      }
      throw primaryErr;
    }
  },
};
