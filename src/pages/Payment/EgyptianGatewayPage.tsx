import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  Copy,
  ArrowRight,
  Smartphone,
  Zap,
  Clock,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Key,
  Wallet,
  History,
  Send,
  RefreshCw,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { paymentApi } from '../../api/payment.api';
import { useWalletBalance } from '../../hooks/useWalletBalance';
import { SelectedPackagePayment } from '../Packages/PackagesPricingPage';
import { ManualPaymentRequest } from '../../types/api.types';
import { getFriendlyErrorMessage } from '../../utils/errors';

interface EgyptianGatewayPageProps {
  selectedPackage: SelectedPackagePayment;
  onBackToPackages: () => void;
  onPaymentSuccess: (courseId?: string) => void;
}

type PaymentMethodTab = 'vodafone' | 'instapay' | 'scratch' | 'wallet' | 'history';

export const EgyptianGatewayPage: React.FC<EgyptianGatewayPageProps> = ({
  selectedPackage,
  onBackToPackages,
  onPaymentSuccess,
}) => {
  const { currentUser, refreshUser } = useAuth();
  const { showToast } = useToast();
  const { walletBalance, refetch: refetchBalance } = useWalletBalance();

  const [activeTab, setActiveTab] = useState<PaymentMethodTab>('vodafone');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Manual Payment Request Form State
  const [senderPhone, setSenderPhone] = useState(currentUser?.phone || '');
  const [transactionRef, setTransactionRef] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState<ManualPaymentRequest | null>(null);

  // Scratch Card State
  const [scratchCode, setScratchCode] = useState('');
  const [isRedeemingScratch, setIsRedeemingScratch] = useState(false);
  const [scratchSuccessMsg, setScratchSuccessMsg] = useState<string | null>(null);

  // Wallet Purchase State
  const [isPurchasingWallet, setIsPurchasingWallet] = useState(false);
  const [walletSuccess, setWalletSuccess] = useState(false);

  // My Payment Requests History
  const [myRequests, setMyRequests] = useState<ManualPaymentRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  const PLATFORM_VODAFONE_NUMBER = '01030246983';
  const PLATFORM_INSTAPAY_IPA = 'edulearn@instapay';

  const courseIdToPurchase = selectedPackage.courseId || selectedPackage.id;
  const hasSufficientWallet = walletBalance >= selectedPackage.price;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    showToast(`تم نسخ ${label} بنجاح!`, 'success');
    setTimeout(() => setCopiedText(null), 2500);
  };

  const loadMyRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const res = await paymentApi.getMyPaymentRequests({ page: 1, limit: 20 });
      setMyRequests(res?.data || []);
    } catch (err) {
      console.warn('Could not load my payment requests:', err);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      loadMyRequests();
    }
  }, [activeTab]);

  // 1. Submit Manual Payment Request (Vodafone Cash / InstaPay)
  const handleSubmitManualPayment = async (e: React.FormEvent, method: 'VodafoneCash' | 'InstaPay') => {
    e.preventDefault();
    if (!senderPhone.trim()) {
      showToast('يرجى إدخال رقم المحفظة / الهاتف الذي قمت بالتحويل منه.', 'error');
      return;
    }
    if (!transactionRef.trim()) {
      showToast('يرجى إدخال كود العملية أو الرقم المرجعي للتحويل.', 'error');
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const res = await paymentApi.submitManualPaymentRequest({
        courseId: courseIdToPurchase,
        paymentMethod: method,
        SenderPhone: senderPhone.trim(),
        transactionReference: transactionRef.trim(),
      });

      setRequestSubmitted(res.data);
      showToast(res.message || 'تم إرسال طلب الدفع للإدارة بنجاح! سيتم مراجعته وتفعيل الكورس.', 'success');
      // Clear form
      setTransactionRef('');
    } catch (err: any) {
      const msg = getFriendlyErrorMessage(err, 'حدث خطأ أثناء إرسال طلب الدفع، يرجى المحاولة مرة أخرى.');
      showToast(msg, 'error');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // 2. Redeem Scratch Card
  const handleRedeemScratch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scratchCode.trim()) {
      showToast('يرجى إدخال كود كارت الشحن.', 'error');
      return;
    }

    setIsRedeemingScratch(true);
    setScratchSuccessMsg(null);
    try {
      const res = await paymentApi.redeemScratchCard({ code: scratchCode.trim() });
      const credited = res.creditedAmount || 0;
      const newBal = res.newWalletBalance || (walletBalance + credited);

      setScratchSuccessMsg(`تم شحن المحفظة بنجاح بمبلغ ${credited} ج.م! رصيدك الجديد الآن: ${newBal} ج.م`);
      showToast(`تم شحن كارت بقيمة ${credited} ج.م بنجاح!`, 'success');
      setScratchCode('');

      // Refresh balance & user profile
      refetchBalance();
      try {
        await refreshUser();
      } catch {}
      window.dispatchEvent(new CustomEvent('wallet:balance-updated', { detail: { balance: newBal } }));
    } catch (err: any) {
      const msg = getFriendlyErrorMessage(err, 'كود كارت الشحن غير صالح أو تم استخدامه مسبقاً.');
      showToast(msg, 'error');
    } finally {
      setIsRedeemingScratch(false);
    }
  };

  // 3. Purchase Course using Wallet
  const handleWalletPurchase = async () => {
    if (!hasSufficientWallet) {
      showToast('رصيدك بالمحفظة غير كافٍ للاشتراك. يمكنك شحن رصيدك أولاً عبر كارت الشحن أو فودافون كاش.', 'error');
      return;
    }

    setIsPurchasingWallet(true);
    try {
      await paymentApi.purchaseWithWallet({ courseId: courseIdToPurchase });
      setWalletSuccess(true);
      showToast('تم سداد قيمة الكورس وخصمها من المحفظة وتفعيل الاشتراك فوراً!', 'success');

      refetchBalance();
      try {
        await refreshUser();
      } catch {}
      window.dispatchEvent(new CustomEvent('wallet:balance-updated'));
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 400) {
        showToast('رصيد المحفظة غير كافٍ لإتمام عملية الشراء.', 'error');
      } else if (status === 409) {
        showToast('أنت مشترك بالفعل في هذا الكورس!', 'info');
        setWalletSuccess(true);
      } else {
        const msg = getFriendlyErrorMessage(err, 'تعذر إتمام عملية الشراء من المحفظة، يرجى المحاولة لاحقاً.');
        showToast(msg, 'error');
      }
    } finally {
      setIsPurchasingWallet(false);
    }
  };

  // Instant Success View (for Wallet Purchase)
  if (walletSuccess) {
    return (
      <div className="container fade-in-up" style={{ padding: '4rem 1.5rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '3rem 2rem', border: '2px solid #10B981', background: 'rgba(16, 185, 129, 0.04)' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <CheckCircle2 size={42} />
          </div>

          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-bright)', marginBottom: '0.6rem' }}>
            تم تفعيل الاشتراك في الكورس بنجاح!
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            تهانينا! تم خصم <strong>{selectedPackage.price} ج.م</strong> من رصيد محفظتك وتفعيل <strong>{selectedPackage.title}</strong> في حسابك فوراً.
          </p>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onPaymentSuccess(courseIdToPurchase)}
            style={{
              width: '100%',
              padding: '0.9rem',
              fontSize: '1rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            الانتقال إلى محتوى الكورس والمحاضرات الآن <ArrowLeft size={18} />
          </button>
        </div>
      </div>
    );
  }

  // Request Submitted Success State (for Manual Payments)
  if (requestSubmitted) {
    return (
      <div className="container fade-in-up" style={{ padding: '3.5rem 1.5rem', maxWidth: '650px', margin: '0 auto', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '2.5rem 2rem', border: '2px solid var(--accent)', background: 'rgba(245, 158, 11, 0.04)' }}>
          <div
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.15)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <Clock size={38} />
          </div>

          <h2 style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-bright)', marginBottom: '0.6rem' }}>
            تم إرسال طلب السداد للإدارة بنجاح!
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            تم تسجيل طلبك لتحويل <strong>{selectedPackage.price} ج.م</strong> بنجاح. يقوم فريق الإدارة الآن بمطابقة التحويل المستلم من رقم محفظتك <strong>({requestSubmitted.SenderPhone})</strong>، وسيتم تفعيل الكورس في حسابك تلقائياً بمجرد التأكيد.
          </p>

          <div
            style={{
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1.75rem',
              textAlign: 'right',
              fontSize: '0.88rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>الكورس:</span>
              <strong style={{ color: 'var(--text-bright)' }}>{selectedPackage.title}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>طريقة التحويل:</span>
              <strong style={{ color: 'var(--text-bright)' }}>
                {requestSubmitted.PaymentMethod === 'VodafoneCash' ? 'فودافون كاش (Vodafone Cash)' : 'إنستاباي (InstaPay)'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>رقم المحفظة المحول منها:</span>
              <strong style={{ color: 'var(--text-bright)', fontFamily: 'monospace' }}>{requestSubmitted.SenderPhone}</strong>
            </div>
            {requestSubmitted.TransactionReference && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>كود العملية / الرقم المرجعي:</span>
                <strong style={{ color: 'var(--text-bright)', fontFamily: 'monospace' }}>{requestSubmitted.TransactionReference}</strong>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>حالة الطلب الحالية:</span>
              <span style={{ color: '#F59E0B', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={13} /> قيد المراجعة والتحقق
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setRequestSubmitted(null);
                setActiveTab('history');
              }}
              style={{ flex: 1, padding: '0.8rem', fontSize: '0.92rem' }}
            >
              <History size={16} /> متابعة حالة طلباتي
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onBackToPackages}
              style={{ flex: 1, padding: '0.8rem', fontSize: '0.92rem' }}
            >
              العودة إلى الكورسات
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container fade-in-up" style={{ padding: '2.5rem 1rem 5rem', maxWidth: '850px', margin: '0 auto' }}>
      {/* Back button */}
      <button
        type="button"
        onClick={onBackToPackages}
        className="btn btn-secondary"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          marginBottom: '1.5rem',
          fontSize: '0.88rem',
        }}
      >
        <ArrowRight size={16} /> العودة إلى الكورسات والباقات
      </button>

      {/* Gateway Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
          }}
        >
          <CreditCard size={26} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-bright)', margin: 0 }}>
            صفحة الدفع والاشتراك (Checkout & Payments)
          </h1>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            سداد الكورس عبر فودافون كاش، إنستاباي، كروت الشحن، أو رصيد المحفظة
          </span>
        </div>
      </div>

      {/* Order & Wallet Summary Card */}
      <div
        className="glass-card"
        style={{
          padding: '1.5rem 1.75rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          background: 'rgba(16, 185, 129, 0.03)',
        }}
      >
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--primary-light)', fontWeight: 700 }}>
            الكورس المطلوب الاشتراك به:
          </span>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-bright)', margin: '0.2rem 0' }}>
            {selectedPackage.title}
          </h3>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            الطالب: {currentUser?.name || 'حساب الطالب'} • {currentUser?.phone || ''}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>سعر الكورس:</span>
            <span style={{ fontSize: '1.9rem', fontWeight: 900, color: '#10B981' }}>
              {selectedPackage.price} <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>ج.م</span>
            </span>
          </div>

          <div style={{ borderRight: '1px solid var(--border-glass)', paddingRight: '1.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Wallet size={13} color="var(--primary-light)" /> رصيد محفظتك:
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: hasSufficientWallet ? '#10B981' : 'var(--text-bright)' }}>
              {walletBalance} <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>ج.م</span>
            </span>
          </div>
        </div>
      </div>

      {/* Payment Method Selector Tabs */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.75rem' }}>
          اختر وسيلة الدفع التي تناسبك:
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.65rem' }}>
          {/* Tab 1: Vodafone Cash */}
          <button
            type="button"
            className={`filter-btn ${activeTab === 'vodafone' ? 'active' : ''}`}
            onClick={() => setActiveTab('vodafone')}
            style={{
              padding: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.88rem',
              fontWeight: 800,
            }}
          >
            <Smartphone size={16} color="#EF4444" /> فودافون كاش
          </button>

          {/* Tab 2: InstaPay */}
          <button
            type="button"
            className={`filter-btn ${activeTab === 'instapay' ? 'active' : ''}`}
            onClick={() => setActiveTab('instapay')}
            style={{
              padding: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.88rem',
              fontWeight: 800,
            }}
          >
            <Zap size={16} color="#8B5CF6" /> إنستاباي (InstaPay)
          </button>

          {/* Tab 3: Scratch Card */}
          <button
            type="button"
            className={`filter-btn ${activeTab === 'scratch' ? 'active' : ''}`}
            onClick={() => setActiveTab('scratch')}
            style={{
              padding: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.88rem',
              fontWeight: 800,
            }}
          >
            <Key size={16} color="#F59E0B" /> كارت الشحن (كود)
          </button>

          {/* Tab 4: Wallet Purchase */}
          <button
            type="button"
            className={`filter-btn ${activeTab === 'wallet' ? 'active' : ''}`}
            onClick={() => setActiveTab('wallet')}
            style={{
              padding: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.88rem',
              fontWeight: 800,
            }}
          >
            <Wallet size={16} color="#10B981" /> رصيد المحفظة ({walletBalance})
          </button>

          {/* Tab 5: Requests History */}
          <button
            type="button"
            className={`filter-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
            style={{
              padding: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.88rem',
              fontWeight: 800,
            }}
          >
            <History size={16} color="var(--primary-light)" /> طلباتي السابقة
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          TAB 1: VODAFONE CASH
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'vodafone' && (
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
              <Smartphone size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                التحويل عبر محفظة فودافون كاش الرسمية
              </h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                حول المبلغ المطلوب للمنصة ثم أرسل بيانات التحويل لتفعيل الكورس فوراً
              </span>
            </div>
          </div>

          {/* Platform Number Banner */}
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px dashed rgba(239, 68, 68, 0.45)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.75rem',
            }}
          >
            <div>
              <span style={{ fontSize: '0.82rem', color: '#EF4444', fontWeight: 800 }}>
                رقم محفظة فودافون كاش الرسمية للمنصة (حول المبلغ عليه):
              </span>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-bright)', fontFamily: 'monospace', letterSpacing: '1px', marginTop: '0.2rem' }}>
                {PLATFORM_VODAFONE_NUMBER}
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                المبلغ المطلوب تحويله: <strong style={{ color: '#10B981' }}>{selectedPackage.price} جنيه مصري</strong>
              </span>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleCopy(PLATFORM_VODAFONE_NUMBER, 'رقم محفظة فودافون كاش')}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1.1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Copy size={15} /> {copiedText === 'رقم محفظة فودافون كاش' ? 'تم النسخ!' : 'نسخ رقم المحفظة'}
            </button>
          </div>

          {/* Instructions */}
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '1.75rem', background: 'var(--bg-subtle)', padding: '1rem 1.25rem', borderRadius: '8px' }}>
            <strong style={{ color: 'var(--text-bright)', display: 'block', marginBottom: '0.3rem' }}>خطوات التحويل والتأكيد:</strong>
            1. اطلب <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>*9*7*الرقم*المبلغ#</code> من هاتفك أو افتح تطبيق أنا فودافون.<br />
            2. حول مبلغ (<strong style={{ color: '#10B981' }}>{selectedPackage.price} ج.م</strong>) إلى الرقم: <strong style={{ color: 'var(--text-bright)' }}>{PLATFORM_VODAFONE_NUMBER}</strong>.<br />
            3. بعد إتمام التحويل، املأ النموذج بالأسفل برقم المحفظة التي حولت منها وكود العملية من رسالة فودافون، ثم اضغط <strong>"إرسال طلب الدفع"</strong>.
          </div>

          {/* Submission Form */}
          <form onSubmit={(e) => handleSubmitManualPayment(e, 'VodafoneCash')} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.35rem' }}>
                رقم المحفظة التي قمت بالتحويل منها (رقمك): <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="tel"
                required
                className="input-field"
                placeholder="مثال: 01012345678"
                value={senderPhone}
                onChange={e => setSenderPhone(e.target.value)}
                style={{ width: '100%', fontSize: '0.92rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.35rem' }}>
                كود العملية أو الرقم المرجعي للتحويل (من رسالة فودافون كاش): <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="أدخل كود العملية المدون في رسالة نجاح التحويل..."
                value={transactionRef}
                onChange={e => setTransactionRef(e.target.value)}
                style={{ width: '100%', fontSize: '0.92rem' }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingRequest}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.95rem',
                fontSize: '1rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '0.5rem',
                background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                borderColor: '#EF4444',
              }}
            >
              {isSubmittingRequest ? (
                <>جاري إرسال الطلب للإدارة...</>
              ) : (
                <>
                  <Send size={18} /> إرسال إشعار التحويل وتأكيد الدفع للإدارة
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 2: INSTAPAY EGYPT
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'instapay' && (
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6' }}>
              <Zap size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                التحويل عبر إنستاباي مصر (InstaPay IPA)
              </h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                تحويل فوري ومجاني من جميع الحسابات البنكية المصرية والبطاقات
              </span>
            </div>
          </div>

          {/* Platform InstaPay IPA Banner */}
          <div
            style={{
              background: 'rgba(139, 92, 246, 0.08)',
              border: '1px dashed rgba(139, 92, 246, 0.45)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.75rem',
            }}
          >
            <div>
              <span style={{ fontSize: '0.82rem', color: '#8B5CF6', fontWeight: 800 }}>
                عنوان الدفع اللحظي الرسمي للمنصة (InstaPay IPA):
              </span>
              <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-bright)', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                {PLATFORM_INSTAPAY_IPA}
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                المبلغ المطلوب تحويله: <strong style={{ color: '#10B981' }}>{selectedPackage.price} جنيه مصري</strong>
              </span>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleCopy(PLATFORM_INSTAPAY_IPA, 'عنوان إنستاباي IPA')}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1.1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Copy size={15} /> {copiedText === 'عنوان إنستاباي IPA' ? 'تم النسخ!' : 'نسخ العنوان'}
            </button>
          </div>

          {/* Instructions */}
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '1.75rem', background: 'var(--bg-subtle)', padding: '1rem 1.25rem', borderRadius: '8px' }}>
            <strong style={{ color: 'var(--text-bright)', display: 'block', marginBottom: '0.3rem' }}>خطوات التحويل عبر إنستاباي:</strong>
            1. افتح تطبيق إنستاباي على هاتفك.<br />
            2. اختر <strong>"إرسال نقود"</strong> ثم <strong>"عنوان الدفع اللحظي IPA"</strong>.<br />
            3. ادخل العنوان: <strong style={{ color: 'var(--text-bright)' }}>{PLATFORM_INSTAPAY_IPA}</strong>.<br />
            4. حوّل مبلغ (<strong style={{ color: '#10B981' }}>{selectedPackage.price} ج.م</strong>) وسجل بيانات التحويل بالأسفل لتفعيل الكورس.
          </div>

          {/* Submission Form */}
          <form onSubmit={(e) => handleSubmitManualPayment(e, 'InstaPay')} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.35rem' }}>
                رقم الهاتف أو عنوان الحساب المحول منه (حسابك على إنستاباي): <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="مثال: 01123456789 أو username@instapay"
                value={senderPhone}
                onChange={e => setSenderPhone(e.target.value)}
                style={{ width: '100%', fontSize: '0.92rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.35rem' }}>
                الرقم المرجعي لعملية إنستاباي (Reference Number): <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="الرقم المرجعي المدون في إيصال إنستاباي..."
                value={transactionRef}
                onChange={e => setTransactionRef(e.target.value)}
                style={{ width: '100%', fontSize: '0.92rem' }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingRequest}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.95rem',
                fontSize: '1rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '0.5rem',
                background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                borderColor: '#8B5CF6',
              }}
            >
              {isSubmittingRequest ? (
                <>جاري إرسال الطلب للإدارة...</>
              ) : (
                <>
                  <Send size={18} /> إرسال إشعار تحويل إنستاباي للإدارة
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 3: SCRATCH CARD (كارت الشحن)
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'scratch' && (
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
              <Key size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                شحن المحفظة بواسطة كارت الشحن (Scratch Code)
              </h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                ادخل كود كارت الشحن الورقي لشحن رصيد محفظتك والاشتراك في الكورس فوراً
              </span>
            </div>
          </div>

          {scratchSuccessMsg && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: '#10B981',
                fontSize: '0.92rem',
                fontWeight: 700,
              }}
            >
              <CheckCircle2 size={22} style={{ flexShrink: 0 }} />
              <div>{scratchSuccessMsg}</div>
            </div>
          )}

          <form onSubmit={handleRedeemScratch} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.4rem' }}>
                أدخل كود كارت الشحن (Scratch Card Code):
              </label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="أدخل كود الكارت هنا (مثال: ABCD-1234-EFGH-5678)"
                value={scratchCode}
                onChange={e => setScratchCode(e.target.value.toUpperCase())}
                style={{ width: '100%', fontSize: '1.1rem', letterSpacing: '2px', fontFamily: 'monospace', textAlign: 'center' }}
              />
            </div>

            <button
              type="submit"
              disabled={isRedeemingScratch}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.9rem',
                fontSize: '0.98rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              {isRedeemingScratch ? 'جاري شحن الكارت...' : (
                <>
                  <Sparkles size={18} /> شحن الكارت وإضافة الرصيد للمحفظة
                </>
              )}
            </button>
          </form>

          {/* Quick purchase action if balance is now sufficient */}
          {hasSufficientWallet && (
            <div
              style={{
                marginTop: '1.75rem',
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '0.9rem', color: 'var(--text-bright)', fontWeight: 700, display: 'block', marginBottom: '0.75rem' }}>
                رصيدك الحالي ({walletBalance} ج.م) كافٍ الآن للاشتراك في <strong>{selectedPackage.title}</strong>!
              </span>
              <button
                type="button"
                className="btn btn-primary"
                disabled={isPurchasingWallet}
                onClick={handleWalletPurchase}
                style={{
                  padding: '0.75rem 2rem',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                {isPurchasingWallet ? 'جاري التفعيل...' : (
                  <>
                    <Wallet size={16} /> تفعيل الكورس الآن بالرصيد ({selectedPackage.price} ج.م)
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 4: WALLET BALANCE PURCHASE
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'wallet' && (
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
              <Wallet size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                الدفع المباشر من رصيد المحفظة الإلكترونية
              </h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                خصم فوري وتفعيل تلقائي للكورس في ثانية واحدة
              </span>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              marginBottom: '1.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>سعر الكورس:</span>
              <strong style={{ fontSize: '1.2rem', color: 'var(--text-bright)' }}>{selectedPackage.price} ج.م</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>رصيدك المتاح بالمحفظة:</span>
              <strong style={{ fontSize: '1.4rem', color: hasSufficientWallet ? '#10B981' : 'var(--danger)' }}>
                {walletBalance} ج.م
              </strong>
            </div>

            <div style={{ borderTop: '1px dashed var(--border-glass)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>الرصيد المتبقي بعد الشراء:</span>
              <strong style={{ fontSize: '1.1rem', color: hasSufficientWallet ? 'var(--text-bright)' : 'var(--text-muted)' }}>
                {hasSufficientWallet ? `${walletBalance - selectedPackage.price} ج.م` : 'غير كافٍ'}
              </strong>
            </div>
          </div>

          {hasSufficientWallet ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10B981', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                <ShieldCheck size={18} />
                <span>رصيدك كافٍ. سيتم خصم المبلغ وتفعيل الكورس في حسابك فوراً.</span>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                disabled={isPurchasingWallet}
                onClick={handleWalletPurchase}
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1.05rem',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                {isPurchasingWallet ? 'جاري الاشتراك...' : (
                  <>
                    <CheckCircle2 size={20} /> تأكيد الشراء الآن ({selectedPackage.price} ج.م)
                  </>
                )}
              </button>
            </div>
          ) : (
            <div>
              <div
                style={{
                  background: 'rgba(234, 179, 8, 0.1)',
                  border: '1px solid rgba(234, 179, 8, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem 1.25rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <AlertCircle size={22} color="var(--accent)" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.88rem', color: 'var(--text-bright)' }}>
                  <strong>رصيد المحفظة غير كافٍ:</strong> تحتاج إلى شحن <strong>{selectedPackage.price - walletBalance} ج.م</strong> إضافية لإتمام الشراء عبر المحفظة.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActiveTab('scratch')}
                  style={{ flex: 1, padding: '0.8rem', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  <Key size={16} /> شحن بكارت شحن (سكراتش)
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveTab('vodafone')}
                  style={{ flex: 1, padding: '0.8rem', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  <Smartphone size={16} /> تحويل فودافون كاش
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 5: MY PAYMENT REQUESTS HISTORY
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-light)' }}>
                <History size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                  طلبات الدفع والتحويل الخاصة بي
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  تتبع حالة طلباتك (قيد المراجعة، مقبولة، مرفوضة)
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={loadMyRequests}
              disabled={isLoadingRequests}
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <RefreshCw size={14} className={isLoadingRequests ? 'spin' : ''} /> تحديث
            </button>
          </div>

          {isLoadingRequests ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              جاري تحميل سجل طلبات الدفع...
            </div>
          ) : myRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-subtle)', borderRadius: '10px', color: 'var(--text-muted)' }}>
              <History size={36} style={{ opacity: 0.3, margin: '0 auto 0.5rem' }} />
              <p style={{ margin: 0, fontSize: '0.92rem' }}>
                لا توجد طلبات دفع مسجلة في حسابك حتى الآن.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {myRequests.map((req) => {
                const isPending = req.Status === 'Pending' || req.Status === 'pending';
                const isApproved = req.Status === 'Approved' || req.Status === 'approved';
                const isRejected = req.Status === 'Rejected' || req.Status === 'rejected';

                const courseTitle = typeof req.CourseId === 'object' ? req.CourseId?.Title : (req.CourseId || 'كورس تعليمي');

                return (
                  <div
                    key={req._id}
                    className="glass-card"
                    style={{
                      padding: '1.25rem',
                      border: isApproved ? '1px solid rgba(16, 185, 129, 0.4)' : isRejected ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                      background: isApproved ? 'rgba(16, 185, 129, 0.02)' : isRejected ? 'rgba(239, 68, 68, 0.02)' : 'rgba(245, 158, 11, 0.02)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-bright)', margin: '0 0 0.2rem' }}>
                          {courseTitle}
                        </h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          طريقة الدفع: {req.PaymentMethod === 'VodafoneCash' ? 'فودافون كاش' : req.PaymentMethod === 'InstaPay' ? 'إنستاباي' : req.PaymentMethod} • المحفظة المحول منها: <strong style={{ color: 'var(--text-bright)', fontFamily: 'monospace' }}>{req.SenderPhone}</strong>
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {isPending && (
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, padding: '0.3rem 0.8rem', borderRadius: '9999px', background: 'rgba(245, 158, 11, 0.18)', color: '#F59E0B', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Clock size={13} /> قيد المراجعة
                          </span>
                        )}
                        {isApproved && (
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, padding: '0.3rem 0.8rem', borderRadius: '9999px', background: 'rgba(16, 185, 129, 0.18)', color: '#10B981', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <CheckCircle2 size={13} /> تم القبول والتفعيل
                          </span>
                        )}
                        {isRejected && (
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, padding: '0.3rem 0.8rem', borderRadius: '9999px', background: 'rgba(239, 68, 68, 0.18)', color: '#EF4444', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <XCircle size={13} /> تم الرفض
                          </span>
                        )}
                      </div>
                    </div>

                    {req.TransactionReference && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        الرقم المرجعي / كود العملية: <span style={{ color: 'var(--text-bright)', fontFamily: 'monospace' }}>{req.TransactionReference}</span>
                      </div>
                    )}

                    {/* Rejection Notice if rejected */}
                    {isRejected && req.RejectionReason && (
                      <div
                        style={{
                          marginTop: '0.5rem',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          borderRadius: '6px',
                          padding: '0.6rem 0.85rem',
                          fontSize: '0.82rem',
                          color: '#EF4444',
                        }}
                      >
                        <strong>سبب الرفض من الإدارة:</strong> {req.RejectionReason}
                      </div>
                    )}

                    {isApproved && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#10B981' }}>
                        ✓ تم تفعيل الكورس بنجاح ومتاح الآن في قائمة كورساتك ومحاضراتك.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

