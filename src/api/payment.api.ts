import { apiClient } from './axios';
import {
  CheckoutRequest,
  CheckoutResponse,
  ScratchCardRequest,
  ScratchCardResponse,
} from '../types/api.types';

export const paymentApi = {
  /**
   * Initialize course checkout.
   * Generates a fresh UUID idempotency key for every request.
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
   * Redeem a scratch card voucher code for wallet balance.
   */
  redeemScratchCard: async (data: ScratchCardRequest): Promise<ScratchCardResponse> => {
    const response = await apiClient.post<ScratchCardResponse>(
      '/payment/scratch-cards/redeem',
      data
    );
    return response.data;
  },
};
