import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../api/users.api';

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
      const user = await usersApi.getMe();
      const bal = user?.WalletBalance;
      if (typeof bal === 'number') {
        setWalletBalance(bal);
      } else if (typeof (currentUser as any)?.walletBalance === 'number') {
        setWalletBalance((currentUser as any).walletBalance);
      }
    } catch {
      // If error, fall back to currentUser state
      if (typeof (currentUser as any)?.walletBalance === 'number') {
        setWalletBalance((currentUser as any).walletBalance);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, token]);

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
