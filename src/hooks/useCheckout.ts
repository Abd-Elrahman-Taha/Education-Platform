import { useState } from 'react';
import { paymentApi } from '../api/payment.api';
import { ScratchCardResponse } from '../types/api.types';
import { getFriendlyErrorMessage } from '../utils/errors';

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
        throw new Error('تعذر إتمام عملية الدفع حالياً، يرجى المحاولة مرة أخرى.');
      }
    } catch (err: any) {
      setCheckoutError(getFriendlyErrorMessage(err, 'تعذر إتمام عملية الاشتراك، يرجى المحاولة لاحقاً.'));
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
      if (typeof res.newWalletBalance === 'number') {
        window.dispatchEvent(
          new CustomEvent('wallet:balance-updated', { detail: { balance: res.newWalletBalance } })
        );
      }
      return res;
    } catch (err: any) {
      const friendly = getFriendlyErrorMessage(err, 'كود الكارت غير صالح أو تم استخدامه مسبقاً.');
      setRedeemError(friendly);
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
