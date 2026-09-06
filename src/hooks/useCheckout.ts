import { useState } from 'react';
import { paymentApi } from '../api/payment.api';
import { ScratchCardResponse } from '../types/api.types';

export function useCheckout() {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<ScratchCardResponse | null>(null);

  /**
   * Initializes course checkout with fresh idempotency key and redirects to paymentUrl.
   */
  const initiateCourseCheckout = async (courseId: string) => {
    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      const res = await paymentApi.checkout({
        courseId,
        gateway: 'MockEgyptian',
      });

      if (res.paymentUrl) {
        window.location.href = res.paymentUrl;
      } else {
        throw new Error('لم يتم استلام رابط الدفع من الخادم.');
      }
    } catch (err: any) {
      setCheckoutError(err?.message || 'فشل في إتمام عملية الاشتراك.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  /**
   * Redeems a scratch card voucher code.
   */
  const redeemScratchCard = async (code: string): Promise<ScratchCardResponse> => {
    setIsRedeeming(true);
    setRedeemError(null);
    setRedeemSuccess(null);

    try {
      const res = await paymentApi.redeemScratchCard({ code: code.trim() });
      setRedeemSuccess(res);
      return res;
    } catch (err: any) {
      setRedeemError(err?.message || 'كود الكارت غير صحيح أو تم استخدامه مسبقاً.');
      throw err;
    } finally {
      setIsRedeeming(false);
    }
  };

  return {
    isCheckingOut,
    isRedeeming,
    checkoutError,
    redeemError,
    redeemSuccess,
    initiateCourseCheckout,
    redeemScratchCard,
    clearErrors: () => {
      setCheckoutError(null);
      setRedeemError(null);
    },
  };
}
