import { apiClient } from './axios';
import {
  CheckoutRequest,
  CheckoutResponse,
  ScratchCardRequest,
  ScratchCardResponse,
  GenerateScratchCardsRequest,
  GenerateScratchCardsResponse,
} from '../types/api.types';

export const paymentApi = {
  /**
   * Initialize course checkout with fresh UUID idempotency key (Student only).
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
