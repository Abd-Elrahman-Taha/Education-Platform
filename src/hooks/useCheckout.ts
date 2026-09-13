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

  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);

  /**
   * Purchases a course using student's Wallet balance (POST /payment/checkout/wallet).
   * Automatically refreshes wallet balance and student enrollments upon success.
   */
  const checkoutWithWallet = async (courseId: string) => {
    setIsCheckingOut(true);
    setCheckoutError(null);
    setCheckoutSuccess(null);

    try {
      const res = await paymentApi.checkoutWallet({ courseId });
      const successMsg = res?.message || 'تم الاشتراك في الكورس بنجاح!';
      setCheckoutSuccess(successMsg);

      // Trigger wallet refresh across components
      window.dispatchEvent(new CustomEvent('wallet:balance-updated'));

      return res;
    } catch (err: any) {
      const friendly = getFriendlyErrorMessage(
        err,
        'تعذر إتمام عملية الاشتراك، يرجى التأكد من رصيد المحفظة والمحاولة لاحقاً.'
      );
      setCheckoutError(friendly);
      throw err;
    } finally {
      setIsCheckingOut(false);
    }
  };

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
    checkoutSuccess,
    redeemError,
    redeemSuccess,
    initiateCourseCheckout,
    checkoutWithWallet,
    redeemScratchCard,
    clearErrors: () => {
      setCheckoutError(null);
      setCheckoutSuccess(null);
      setRedeemError(null);
    },
  };
}
