import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/axios';

export function useWalletBalance() {
  const { currentUser, token } = useAuth();
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchBalance = useCallback(async () => {
    if (!token) return;
    const role = (currentUser?.role || (currentUser as any)?.Role || '').toString().toLowerCase();
    if (role === 'admin' || role === 'superadmin' || currentUser?.isSuperAdmin) {
      return;
    }

    setIsLoading(true);
    try {
      if (currentUser?.id) {
        try {
          const res = await apiClient.get<any>(`/users/students/${currentUser.id}`);
          const bal =
            res.data?.data?.student?.WalletBalance ??
            res.data?.student?.WalletBalance ??
            res.data?.WalletBalance;
          if (typeof bal === 'number') {
            setWalletBalance(bal);
            return;
          }
        } catch (err: any) {
          if (err?.status === 401 || err?.status === 403 || err?.status === 404) return;
        }
      }
    } catch {
      // Ignore network errors
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id, currentUser?.role, currentUser?.isSuperAdmin, token]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  useEffect(() => {
    const handleBalanceUpdate = (e: any) => {
      const bal = e?.detail?.balance;
      if (typeof bal === 'number') {
        setWalletBalance(bal);
      }
    };

    window.addEventListener('wallet:balance-updated', handleBalanceUpdate);
    return () => {
      window.removeEventListener('wallet:balance-updated', handleBalanceUpdate);
    };
  }, []);

  const updateBalance = useCallback((newBalance: number) => {
    setWalletBalance(newBalance);
    window.dispatchEvent(
      new CustomEvent('wallet:balance-updated', { detail: { balance: newBalance } })
    );
  }, []);

  return {
    walletBalance,
    isLoading,
    refetch: fetchBalance,
    updateBalance,
  };
}
