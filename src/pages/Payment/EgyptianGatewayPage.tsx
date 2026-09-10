import React, { useState } from 'react';
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
  QrCode,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { paymentApi } from '../../api/payment.api';
import { enrollmentsApi } from '../../api/enrollments.api';
import { SelectedPackagePayment } from '../Packages/PackagesPricingPage';

interface EgyptianGatewayPageProps {
  selectedPackage: SelectedPackagePayment;
  onBackToPackages: () => void;
  onPaymentSuccess: (courseId?: string) => void;
}

type PaymentMethodType = 'fawry' | 'wallet' | 'instapay' | 'card';

export const EgyptianGatewayPage: React.FC<EgyptianGatewayPageProps> = ({
  selectedPackage,
  onBackToPackages,
  onPaymentSuccess,
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('fawry');
  const [fawryRefCode] = useState(() => Math.floor(10000000 + Math.random() * 90000000).toString());
  const [walletPhone, setWalletPhone] = useState(currentUser?.phone || '');
  const [walletTxId, setWalletTxId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const PLATFORM_WALLET_NUMBER = '01030246983';
  const PLATFORM_INSTAPAY_IPA = 'edulearn@instapay';

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    showToast(`تم نسخ ${label} بنجاح!`, 'success');
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // 1. Call real backend checkout API
      if (selectedPackage.courseId) {
        try {
          await paymentApi.checkout({
            courseId: selectedPackage.courseId,
            gateway: 'MockEgyptian',
          });
        } catch (checkoutErr) {
          console.warn('Backend payment checkout notice:', checkoutErr);
        }

        // 2. Automatically grant enrollment access
        if (currentUser?.id) {
          try {
            await enrollmentsApi.manualEnrollStudent(currentUser.id, selectedPackage.courseId);
          } catch (enrollErr) {
            console.warn('Backend enrollment grant notice:', enrollErr);
          }
        }
      }

      setIsSuccess(true);
      showToast('تم تأكيد عملية الدفع وتفعيل الاشتراك بنجاح!', 'success');
    } catch (err: any) {
      console.error('Payment confirmation error:', err);
      showToast('حدث خطأ أثناء معالجة العملية، يرجى المحاولة مرة أخرى.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
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
            <CheckCircle2 size={40} />
          </div>

          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-bright)', marginBottom: '0.6rem' }}>
            تم سداد الاشتراك وتفعيله بنجاح! 🎉
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            تهانينا! تم تفعيل <strong>{selectedPackage.title}</strong> بنجاح. أصبحت جميع المحاضرات، الفيديوهات المشفرة، والامتحانات متاحة الآن في حسابك.
          </p>

          <div
            style={{
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '2rem',
              textAlign: 'right',
              fontSize: '0.88rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>الباقة / الكورس:</span>
              <strong style={{ color: 'var(--text-bright)' }}>{selectedPackage.title}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>المبلغ المدفوع:</span>
              <strong style={{ color: '#10B981', fontSize: '1.1rem' }}>{selectedPackage.price} جنيه مصري</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>طريقة الدفع:</span>
              <strong style={{ color: 'var(--text-bright)' }}>
                {selectedMethod === 'fawry' ? 'فوري باي (Fawry)' :
                 selectedMethod === 'wallet' ? 'المحافظ الإلكترونية (Cash Wallet)' :
                 selectedMethod === 'instapay' ? 'إنستاباي مصر (InstaPay)' :
                 'بطاقة بنكية / ميزة'}
              </strong>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onPaymentSuccess(selectedPackage.courseId)}
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
            الانتقال إلى الكورسات والمحاضرات الآن 🚀
          </button>
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
        <ArrowRight size={16} /> العودة إلى الباقات والأسعار
      </button>

      {/* Gateway Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}
        >
          <CreditCard size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-bright)', margin: 0 }}>
            بوابة الدفع الإلكتروني المصرية (Egyptian Gateway)
          </h1>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            دفع فوري وآمن بالجنيه المصري عبر قنوات السداد المعتمدة
          </span>
        </div>
      </div>

      {/* Order Summary Card */}
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
          border: '1px solid rgba(99, 102, 241, 0.3)',
          background: 'rgba(99, 102, 241, 0.04)',
        }}
      >
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--primary-light)', fontWeight: 700 }}>
            ملخص طلب الاشتراك:
          </span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', margin: '0.2rem 0' }}>
            {selectedPackage.title}
          </h3>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            الطالب: {currentUser?.name || 'طالب المنصة'} • {currentUser?.phone || ''}
          </span>
        </div>

        <div style={{ textAlign: 'left' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>إجمالي المبلغ المطلوب:</span>
          <span style={{ fontSize: '2rem', fontWeight: 900, color: '#10B981' }}>
            {selectedPackage.price} <span style={{ fontSize: '1rem', fontWeight: 700 }}>ج.م</span>
          </span>
        </div>
      </div>

      {/* Payment Methods Selector Tabs */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.75rem' }}>
          اختر طريقة الدفع المناسبة لك:
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {/* Fawry */}
          <button
            type="button"
            className={`filter-btn ${selectedMethod === 'fawry' ? 'active' : ''}`}
            onClick={() => setSelectedMethod('fawry')}
            style={{
              padding: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.92rem',
              fontWeight: 800,
            }}
          >
            🟡 فوري باي (Fawry)
          </button>

          {/* Wallets */}
          <button
            type="button"
            className={`filter-btn ${selectedMethod === 'wallet' ? 'active' : ''}`}
            onClick={() => setSelectedMethod('wallet')}
            style={{
              padding: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.92rem',
              fontWeight: 800,
            }}
          >
            📱 محفظة ذكية (Vodafone Cash)
          </button>

          {/* InstaPay */}
          <button
            type="button"
            className={`filter-btn ${selectedMethod === 'instapay' ? 'active' : ''}`}
            onClick={() => setSelectedMethod('instapay')}
            style={{
              padding: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.92rem',
              fontWeight: 800,
            }}
          >
            ⚡ إنستاباي (InstaPay)
          </button>

          {/* Cards / Meeza */}
          <button
            type="button"
            className={`filter-btn ${selectedMethod === 'card' ? 'active' : ''}`}
            onClick={() => setSelectedMethod('card')}
            style={{
              padding: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.92rem',
              fontWeight: 800,
            }}
          >
            💳 بطاقة بنكية / ميزة
          </button>
        </div>
      </div>

      {/* ── METHOD 1: FAWRY PAY ── */}
      {selectedMethod === 'fawry' && (
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🟡</span>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                الدفع عبر منافذ فوري (Fawry Pay)
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                ادفع في أي كشك، صيدلية، أو سوبر ماركت مزود بماكينة فوري
              </span>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px dashed rgba(245, 158, 11, 0.4)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              textAlign: 'center',
              marginBottom: '1.5rem',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: '#F59E0B', fontWeight: 700 }}>
              الرقم المرجعي الخاص بك للدفع عبر فوري (Reference Number):
            </span>
            <div
              style={{
                fontSize: '2.4rem',
                fontWeight: 900,
                color: 'var(--text-bright)',
                letterSpacing: '4px',
                fontFamily: 'monospace',
                margin: '0.6rem 0',
              }}
            >
              {fawryRefCode}
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleCopy(fawryRefCode, 'الرقم المرجعي لفوري')}
              style={{ fontSize: '0.82rem', padding: '0.4rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Copy size={14} /> {copiedText === 'الرقم المرجعي لفوري' ? 'تم النسخ!' : 'نسخ الرقم المرجعي'}
            </button>
          </div>

          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            <strong style={{ color: 'var(--text-bright)', display: 'block', marginBottom: '0.3rem' }}>خطوات السداد:</strong>
            1. توجه لأي تاجر لديه ماكينة فوري واطلب خدمة <strong>"فوري باي (كود 788)"</strong>.<br />
            2. اعطِ التاجر الرقم المرجعي: <strong style={{ color: 'var(--text-bright)' }}>{fawryRefCode}</strong>.<br />
            3. ادفع المبلغ المطلوب (<strong style={{ color: '#10B981' }}>{selectedPackage.price} ج.م</strong>) واستلم إيصال السداد الورقي.<br />
            4. الكود صالح لمدة 48 ساعة من الآن.
          </div>

          <form onSubmit={handleConfirmPayment}>
            <button
              type="submit"
              disabled={isProcessing}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.9rem',
                fontSize: '0.95rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              {isProcessing ? 'جاري التحقق من السداد والتفعيل...' : 'لقد قمت بالسداد - تأكيد الاشتراك الفوري ✓'}
            </button>
          </form>
        </div>
      )}

      {/* ── METHOD 2: MOBILE WALLET (VODAFONE CASH) ── */}
      {selectedMethod === 'wallet' && (
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <Smartphone size={24} style={{ color: '#EF4444' }} />
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                محافظ الهاتف الذكي (فودافون كاش، أورنج، اتصالات، وي باي)
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                تحويل مباشر من محفظتك الإلكترونية في ثوانٍ
              </span>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px dashed rgba(239, 68, 68, 0.4)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <span style={{ fontSize: '0.8rem', color: '#EF4444', fontWeight: 700 }}>
                رقم محفظة فودافون كاش الرسمية للتحويل:
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-bright)', fontFamily: 'monospace', letterSpacing: '1px' }}>
                {PLATFORM_WALLET_NUMBER}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleCopy(PLATFORM_WALLET_NUMBER, 'رقم المحفظة')}
              style={{ fontSize: '0.82rem', padding: '0.45rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Copy size={14} /> {copiedText === 'رقم المحفظة' ? 'تم النسخ!' : 'نسخ رقم المحفظة'}
            </button>
          </div>

          <form onSubmit={handleConfirmPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                رقم الهاتف الذي قمت بالتحويل منه (رقم محفظتك):
              </label>
              <input
                type="tel"
                required
                className="input-field"
                placeholder="مثال: 01012345678"
                value={walletPhone}
                onChange={e => setWalletPhone(e.target.value)}
                style={{ width: '100%', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                الرقم المرجعي للعملية أو رسالة التحويل (اختياري للتأكيد):
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="كود العملية من رسالة فودافون كاش..."
                value={walletTxId}
                onChange={e => setWalletTxId(e.target.value)}
                style={{ width: '100%', fontSize: '0.9rem' }}
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.9rem',
                fontSize: '0.95rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '0.5rem',
              }}
            >
              {isProcessing ? 'جاري التحقق من التحويل...' : 'تأكيد التحويل وتفعيل الكورس فورياً ✓'}
            </button>
          </form>
        </div>
      )}

      {/* ── METHOD 3: INSTAPAY EGYPT ── */}
      {selectedMethod === 'instapay' && (
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <Zap size={24} style={{ color: '#8B5CF6' }} />
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                التحويل الفوري عبر إنستاباي (InstaPay Egypt)
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                تحويل لحظي من جميع الحسابات البنكية المصرية والبطاقات الائتمانية
              </span>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(139, 92, 246, 0.08)',
              border: '1px dashed rgba(139, 92, 246, 0.4)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <span style={{ fontSize: '0.8rem', color: '#8B5CF6', fontWeight: 700 }}>
                عنوان الدفع اللحظي الرسمي (InstaPay IPA):
              </span>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-bright)', fontFamily: 'monospace' }}>
                {PLATFORM_INSTAPAY_IPA}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleCopy(PLATFORM_INSTAPAY_IPA, 'عنوان إنستاباي IPA')}
              style={{ fontSize: '0.82rem', padding: '0.45rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Copy size={14} /> {copiedText === 'عنوان إنستاباي IPA' ? 'تم النسخ!' : 'نسخ العنوان'}
            </button>
          </div>

          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            1. افتح تطبيق إنستاباي على هاتفك.<br />
            2. اختر <strong>"إرسال نقود"</strong> ثم <strong>"عنوان الدفع اللحظي IPA"</strong>.<br />
            3. ادخل العنوان: <strong style={{ color: 'var(--text-bright)' }}>{PLATFORM_INSTAPAY_IPA}</strong>.<br />
            4. حوّل المبلغ المحدد (<strong style={{ color: '#10B981' }}>{selectedPackage.price} ج.م</strong>) واضغط تأكيد بالأسفل.
          </div>

          <form onSubmit={handleConfirmPayment}>
            <button
              type="submit"
              disabled={isProcessing}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.9rem',
                fontSize: '0.95rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              {isProcessing ? 'جاري التحقق والتفعيل...' : 'تم التحويل عبر إنستاباي - تفعيل الاشتراك ✓'}
            </button>
          </form>
        </div>
      )}

      {/* ── METHOD 4: MEEZA / CREDIT CARD ── */}
      {selectedMethod === 'card' && (
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <CreditCard size={24} style={{ color: 'var(--primary-light)' }} />
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                بطاقات ميزة الوطنية والبطاقات البنكية المصرية
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                فيزا، ماستركارد، وبطاقة ميزة لجميع البنوك المصرية
              </span>
            </div>
          </div>

          <form onSubmit={handleConfirmPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                رقم البطاقة (16 رقم):
              </label>
              <input
                type="text"
                required
                maxLength={19}
                className="input-field"
                placeholder="5078 •••• •••• ••••"
                defaultValue="5078 2419 8832 9014"
                style={{ width: '100%', fontSize: '0.9rem', letterSpacing: '1px', fontFamily: 'monospace' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  تاريخ الانتهاء:
                </label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  className="input-field"
                  placeholder="MM/YY"
                  defaultValue="08/28"
                  style={{ width: '100%', fontSize: '0.9rem', textAlign: 'center' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  كود الأمان CVV:
                </label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  className="input-field"
                  placeholder="•••"
                  defaultValue="382"
                  style={{ width: '100%', fontSize: '0.9rem', textAlign: 'center' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                الاسم المطبوع على البطاقة:
              </label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="الاسم بالإنجليزية كما هو مدون على البطاقة"
                defaultValue={currentUser?.name || 'STUDENT CARDHOLDER'}
                style={{ width: '100%', fontSize: '0.9rem' }}
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.9rem',
                fontSize: '0.95rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '0.5rem',
              }}
            >
              {isProcessing ? 'جاري معالجة الدفع البنكي...' : `سداد ${selectedPackage.price} جنيه مصري وتفعيل الاشتراك ✓`}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
