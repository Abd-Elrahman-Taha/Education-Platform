import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/axios';

export const WALLET_BALANCE_KEY = 'student_wallet_balance';

export function useWalletBalance() {
  const { currentUser, token } = useAuth();
  const [walletBalance, setWalletBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(WALLET_BALANCE_KEY);
      if (saved !== null) {
        const val = Number(saved);
        if (!isNaN(val)) return val;
      }
    } catch {}
    return 0;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchBalance = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      // 1. Try to query student profile if userId is available
      if (currentUser?.id) {
        try {
          const res = await apiClient.get<any>(`/users/students/${currentUser.id}`);
          const bal =
            res.data?.data?.student?.WalletBalance ??
            res.data?.student?.WalletBalance ??
            res.data?.WalletBalance;
          if (typeof bal === 'number') {
            setWalletBalance(bal);
            localStorage.setItem(WALLET_BALANCE_KEY, String(bal));
            return;
          }
        } catch {}
      }

      // 2. Try common profile endpoints
      const profileEndpoints = ['/users/me', '/auth/me', '/users/profile'];
      for (const ep of profileEndpoints) {
        try {
          const r = await apiClient.get<any>(ep);
          const bal =
            r.data?.data?.student?.WalletBalance ??
            r.data?.data?.WalletBalance ??
            r.data?.user?.WalletBalance ??
            r.data?.WalletBalance;
          if (typeof bal === 'number') {
            setWalletBalance(bal);
            localStorage.setItem(WALLET_BALANCE_KEY, String(bal));
            return;
          }
        } catch {}
      }
    } catch {
      // Gracefully keep cached balance on failure
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id, token]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  useEffect(() => {
    const handleBalanceUpdate = (e: any) => {
      const bal = e?.detail?.balance;
      if (typeof bal === 'number') {
        setWalletBalance(bal);
      } else {
        const saved = localStorage.getItem(WALLET_BALANCE_KEY);
        if (saved !== null) {
          const val = Number(saved);
          if (!isNaN(val)) setWalletBalance(val);
        }
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === WALLET_BALANCE_KEY && e.newValue !== null) {
        const val = Number(e.newValue);
        if (!isNaN(val)) setWalletBalance(val);
      }
    };

    window.addEventListener('wallet:balance-updated', handleBalanceUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('wallet:balance-updated', handleBalanceUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const updateBalance = useCallback((newBalance: number) => {
    setWalletBalance(newBalance);
    try {
      localStorage.setItem(WALLET_BALANCE_KEY, String(newBalance));
      window.dispatchEvent(
        new CustomEvent('wallet:balance-updated', { detail: { balance: newBalance } })
      );
    } catch {}
  }, []);

  return {
    walletBalance,
    isLoading,
    refetch: fetchBalance,
    updateBalance,
  };
}
