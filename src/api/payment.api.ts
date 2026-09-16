import { apiClient } from './axios';
import { normalizeArabicDigits } from '../utils/errors';
import {
  CheckoutRequest,
  CheckoutResponse,
  ScratchCardRequest,
  ScratchCardResponse,
  GenerateScratchCardsRequest,
  GenerateScratchCardsResponse,
  SubmitManualPaymentRequest,
  ManualPaymentRequest,
  ManualPaymentRequestsResponse,
  WalletPurchaseRequest,
  WalletPurchaseResponse,
} from '../types/api.types';

export const paymentApi = {
  /**
   * Purchase a course using student's Wallet balance.
   * Endpoint: POST /api/v1/payment/wallet/purchase
   * Deducts Course.Price from WalletBalance and atomically enrolls student.
   */
  purchaseWithWallet: async (data: WalletPurchaseRequest): Promise<WalletPurchaseResponse> => {
    const response = await apiClient.post<WalletPurchaseResponse>(
      '/payment/wallet/purchase',
      data
    );
    return response.data;
  },

  /**
   * Alias for backward compatibility with existing code.
   */
  checkoutWallet: async (data: { courseId: string }): Promise<WalletPurchaseResponse> => {
    return paymentApi.purchaseWithWallet(data);
  },

  /**
   * Submit a new manual payment request (Vodafone Cash / InstaPay receipt) for Admin review.
   * Endpoint: POST /api/v1/payment/requests
   * Supports both camelCase (Swagger spec) and PascalCase (Mongoose schema) fields
   * and normalizes Arabic-Indic numerals.
   */
  submitManualPaymentRequest: async (
    data: SubmitManualPaymentRequest
  ): Promise<{ status: string; message: string; data: ManualPaymentRequest }> => {
    const rawPhone = normalizeArabicDigits(String(data.Phone || data.senderPhone || data.senderPhone || ''));
    let cleanPhone = rawPhone.replace(/\s+/g, '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('20') && cleanPhone.length === 13) {
      cleanPhone = cleanPhone.slice(2);
    }

    const cleanRef = normalizeArabicDigits(String(data.transactionReference || data.TransactionReference || '')).trim();
    const courseId = String(data.courseId || data.CourseId || '').trim();
    const method = (data.paymentMethod === 'InstaPay' || data.PaymentMethod === 'InstaPay') ? 'InstaPay' : 'VodafoneCash';

    // The backend strictly validates payload with Joi (stripUnknown: false).
    // The schema requires "Phone" (not "senderPhone"):
    const cleanPayload = {
      courseId,
      paymentMethod: method,
      Phone: cleanPhone,
      transactionReference: cleanRef,
    };

    const response = await apiClient.post<any>('/payment/requests', cleanPayload);
    return response.data;
  },

  /**
   * Get student's own manual payment requests.
   * Endpoint: GET /api/v1/payment/requests/my
   */
  getMyPaymentRequests: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<ManualPaymentRequestsResponse> => {
    const response = await apiClient.get<ManualPaymentRequestsResponse>(
      '/payment/requests/my',
      { params }
    );
    return response.data;
  },

  /**
   * Get all manual payment requests (Admin only).
   * Endpoint: GET /api/v1/payment/requests
   */
  getAdminPaymentRequests: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<ManualPaymentRequestsResponse> => {
    const response = await apiClient.get<ManualPaymentRequestsResponse>(
      '/payment/requests',
      { params }
    );
    return response.data;
  },

  /**
   * Approve a manual payment request and automatically enroll student (Admin only).
   * Endpoint: PATCH /api/v1/payment/requests/{requestId}/approve
   */
  approvePaymentRequest: async (
    requestId: string
  ): Promise<{ status: string; message: string; data: ManualPaymentRequest }> => {
    const response = await apiClient.patch<any>(
      `/payment/requests/${requestId}/approve`
    );
    return response.data;
  },

  /**
   * Reject a manual payment request with a reason (Admin only).
   * Endpoint: PATCH /api/v1/payment/requests/{requestId}/reject
   */
  rejectPaymentRequest: async (
    requestId: string,
    rejectionReason: string
  ): Promise<{ status: string; message: string; data: ManualPaymentRequest }> => {
    const response = await apiClient.patch<any>(
      `/payment/requests/${requestId}/reject`,
      { rejectionReason: String(rejectionReason || '').trim() }
    );
    return response.data;
  },

  /**
   * Initialize gateway checkout with fresh UUID idempotency key.
   */
  checkout: async (data: CheckoutRequest): Promise<CheckoutResponse> => {
    let idempotencyKey: string;
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      idempotencyKey = crypto.randomUUID();
    } else {
      idempotencyKey = 'idemp-' + Date.now() + '-' + Math.random().toString(36).substring(2);
    }

    const response = await apiClient.post<CheckoutResponse>('/payment/checkout', data, {
      headers: {
        'x-idempotency-key': idempotencyKey,
      },
    });
    return response.data;
  },

  /**
   * Generate scratch card vouchers (Admin only).
   */
  generateScratchCards: async (
    data: GenerateScratchCardsRequest
  ): Promise<GenerateScratchCardsResponse> => {
    const response = await apiClient.post<GenerateScratchCardsResponse>(
      '/payment/scratch-cards/generate',
      data
    );
    return response.data;
  },

  /**
   * Redeem a scratch card voucher code for wallet balance (Student/Admin).
   */
  redeemScratchCard: async (data: ScratchCardRequest): Promise<ScratchCardResponse> => {
    const response = await apiClient.post<ScratchCardResponse>(
      '/payment/scratch-cards/redeem',
      data
    );
    return response.data;
  },
};
