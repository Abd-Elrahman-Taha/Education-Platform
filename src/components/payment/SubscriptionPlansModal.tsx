import React, { useState } from 'react';
import {
  X,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  Copy,
  Check,
  Zap,
  Key,
  MessageCircle,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { AcademicYear, ACADEMIC_YEAR_LABELS } from '../../types';
import { paymentApi } from '../../api/payment.api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { getFriendlyErrorMessage } from '../../utils/errors';

interface SubscriptionPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  academicYear: AcademicYear;
  onSubscribedSuccess?: () => void;
}

export const SubscriptionPlansModal: React.FC<SubscriptionPlansModalProps> = ({
  isOpen,
  onClose,
  academicYear,
  onSubscribedSuccess,
}) => {
  const { showToast } = useToast();
  const { currentUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'single' | 'comprehensive' | 'center'>('comprehensive');
  const [paymentMethod, setPaymentMethod] = useState<'vodafone' | 'scratch' | 'card'>('vodafone');
  const [copied, setCopied] = useState(false);

  // Scratch card redeem state
  const [cardCode, setCardCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  if (!isOpen) return null;

  const yearLabel = ACADEMIC_YEAR_LABELS[academicYear] || 'السنة الدراسية';
  const VODAFONE_NUMBER = '01012345678';

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(VODAFONE_NUMBER);
    setCopied(true);
    showToast('تم نسخ رقم فودافون كاش / إنستاباي بنجاح!', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleRedeemCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardCode.trim()) {
      showToast('يرجى إدخال كود كارت الشحن', 'error');
      return;
    }

    setIsRedeeming(true);
    try {
      const res = await paymentApi.redeemScratchCard({ code: cardCode.trim() });
      showToast(`تم شحن ${res.creditedAmount} ج.م وتفعيل اشتراكك بنجاح! 🎉`, 'success');

      // Update student subscription locally and dispatch event
      if (currentUser?.phone) {
        const subData = {
          isSubscribed: true,
          subscribedYear: academicYear,
          plan: selectedPlan === 'comprehensive' ? 'الباقة الشاملة' : 'باقة المادة',
          date: new Date().toISOString(),
        };
        localStorage.setItem(`account_subscription_${currentUser.phone.trim()}`, JSON.stringify(subData));
        if (currentUser.id) {
          localStorage.setItem(`account_subscription_${currentUser.id}`, JSON.stringify(subData));
        }
      }

      if (onSubscribedSuccess) {
        onSubscribedSuccess();
      }
      onClose();
    } catch (err: any) {
      showToast(getFriendlyErrorMessage(err, 'كود كارت الشحن غير صالح أو تم استخدامه مسبقاً'), 'error');
    } finally {
      setIsRedeeming(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `السلام عليكم، أرغب في تفعيل الاشتراك في ${yearLabel} - طالب: ${currentUser?.name || ''} - رقم: ${currentUser?.phone || ''}`
  );

  return (
    <div className="modal-overlay active" onClick={onClose} style={{ zIndex: 99999 }}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '750px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <span className="gradient-badge" style={{ marginBottom: '0.5rem', display: 'inline-flex' }}>
            <Zap size={14} /> باقات الاشتراك وطرق الدفع
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-bright)', margin: '0.35rem 0' }}>
            الاشتراك في كورسات {yearLabel}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto', lineHeight: 1.6 }}>
            اختر الباقة المناسبة لك للوصول الفوري لكافة المحاضرات المحمية بتقنية DRM وامتحانات البابل شيت والملازم.
          </p>
        </div>

        {/* Pricing Plans Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
          {/* Plan 1 */}
          <div
            className={`glass-card ${selectedPlan === 'single' ? 'popular' : ''}`}
            onClick={() => setSelectedPlan('single')}
            style={{
              padding: '1.25rem',
              cursor: 'pointer',
              border: selectedPlan === 'single' ? '2px solid var(--primary-light)' : '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-md)',
              position: 'relative',
              transition: 'all 0.2s',
            }}
          >
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-bright)', margin: '0 0 0.35rem' }}>
              باقة مادة واحدة
            </h4>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary-light)', marginBottom: '0.75rem' }}>
              250 <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ج.م / شهر</span>
            </div>
            <ul style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: 0, margin: 0, listStyle: 'none' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Check size={14} color="#10B981" /> جميع محاضرات المادة</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Check size={14} color="#10B981" /> امتحانات بابل شيت دورية</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Check size={14} color="#10B981" /> ملازم PDF للشرح</li>
            </ul>
          </div>

          {/* Plan 2: Most Popular */}
          <div
            className={`glass-card ${selectedPlan === 'comprehensive' ? 'popular' : ''}`}
            onClick={() => setSelectedPlan('comprehensive')}
            style={{
              padding: '1.25rem',
              cursor: 'pointer',
              border: selectedPlan === 'comprehensive' ? '2px solid var(--secondary)' : '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-md)',
              position: 'relative',
              background: selectedPlan === 'comprehensive' ? 'rgba(8, 145, 178, 0.12)' : undefined,
              transition: 'all 0.2s',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-10px',
                right: '50%',
                transform: 'translateX(50%)',
                background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                color: '#FFF',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '0.15rem 0.65rem',
                borderRadius: '9999px',
                whiteSpace: 'nowrap',
              }}
            >
              ★ الباقة الشاملة الموصى بها
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-bright)', margin: '0.5rem 0 0.35rem' }}>
              الباقة الكاملة
            </h4>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', marginBottom: '0.75rem' }}>
              450 <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ج.م / شهر</span>
            </div>
            <ul style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: 0, margin: 0, listStyle: 'none' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Check size={14} color="#10B981" /> وصول كامل لجميع المواد</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Check size={14} color="#10B981" /> امتحانات بابل شيت غير محدودة</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Check size={14} color="#10B981" /> مساعد الذكاء الاصطناعي 24/7</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Check size={14} color="#10B981" /> بث مباشر أسبوعي وتدريبات</li>
            </ul>
          </div>

          {/* Plan 3 */}
          <div
            className={`glass-card ${selectedPlan === 'center' ? 'popular' : ''}`}
            onClick={() => setSelectedPlan('center')}
            style={{
              padding: '1.25rem',
              cursor: 'pointer',
              border: selectedPlan === 'center' ? '2px solid var(--primary-light)' : '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-md)',
              position: 'relative',
              transition: 'all 0.2s',
            }}
          >
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-bright)', margin: '0 0 0.35rem' }}>
              باقة السنتر والمجموعات
            </h4>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-bright)', marginBottom: '0.75rem' }}>
              750 <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ج.م / شهر</span>
            </div>
            <ul style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: 0, margin: 0, listStyle: 'none' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Check size={14} color="#10B981" /> كروت شحن حضورية</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Check size={14} color="#10B981" /> ملازم مطبوعة مع التوصيل</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Check size={14} color="#10B981" /> متابعة خاصة وتواصل مع المعلم</li>
            </ul>
          </div>
        </div>

        {/* Payment Methods Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={18} color="var(--primary-light)" /> اختر طريقة الدفع
          </h3>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <button
              type="button"
              className={`btn ${paymentMethod === 'vodafone' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.88rem', padding: '0.6rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => setPaymentMethod('vodafone')}
            >
              <Smartphone size={16} /> فودافون كاش / إنستاباي (InstaPay)
            </button>

            <button
              type="button"
              className={`btn ${paymentMethod === 'scratch' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.88rem', padding: '0.6rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => setPaymentMethod('scratch')}
            >
              <Key size={16} /> كارت شحن المنصة
            </button>

            <button
              type="button"
              className={`btn ${paymentMethod === 'card' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.88rem', padding: '0.6rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => setPaymentMethod('card')}
            >
              <CreditCard size={16} /> فيزا / ماستركارد / فوري
            </button>
          </div>

          {/* Tab 1: Vodafone Cash & InstaPay */}
          {paymentMethod === 'vodafone' && (
            <div
              className="glass-card"
              style={{
                padding: '1.5rem',
                border: '1px solid rgba(8, 145, 178, 0.3)',
                background: 'rgba(8, 145, 178, 0.08)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>رقم التحويل المباشر (فودافون كاش / إنستاباي):</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-bright)', letterSpacing: '1px', fontFamily: 'monospace' }}>
                    {VODAFONE_NUMBER}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCopyNumber}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                >
                  {copied ? <><Check size={16} color="#10B981" /> تم النسخ</> : <><Copy size={16} /> نسخ الرقم</>}
                </button>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                <strong>خطوات التحويل والتفعيل الفوري:</strong>
                <ol style={{ paddingRight: '1.25rem', marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <li>قم بتحويل قيمة الباقة المختارة ({selectedPlan === 'comprehensive' ? '450' : selectedPlan === 'single' ? '250' : '750'} ج.م) إلى الرقم أعلاه عبر محفظتك الإلكترونية أو تطبيق إنستاباي.</li>
                  <li>التقط صورة لإيصال التحويل أو رسالة التأكيد.</li>
                  <li>اضغط على زر التواصل عبر واتساب بالأسفل وأرسل صورة الإيصال ليتم تفعيل حسابك فوراً من قِبل الإدارة.</li>
                </ol>
              </div>

              <a
                href={`https://wa.me/201012345678?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.95rem', padding: '0.75rem', gap: '0.5rem' }}
              >
                <MessageCircle size={18} /> تواصل لتأكيد التحويل وتفعيل الاشتراك فوراً
              </a>
            </div>
          )}

          {/* Tab 2: Scratch Card */}
          {paymentMethod === 'scratch' && (
            <div
              className="glass-card"
              style={{
                padding: '1.5rem',
                border: '1px solid rgba(8, 145, 178, 0.3)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                إذا حصلت على كارت شحن من السنتر أو الموزع المعتمد، أدخل كود الشحن السري المكتوب على الكارت لتفعيل اشتراكك تلقائياً:
              </p>

              <form onSubmit={handleRedeemCard} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="أدخل كود الكارت هنا (مثال: CRD-XXXX-XXXX)..."
                  className="input-field"
                  style={{ flex: 1, minWidth: '220px', fontSize: '0.95rem' }}
                  value={cardCode}
                  onChange={(e) => setCardCode(e.target.value)}
                  disabled={isRedeeming}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isRedeeming}
                  style={{ minWidth: '130px', justifyContent: 'center' }}
                >
                  {isRedeeming ? 'جاري الشحن...' : 'تفعيل الكارت'}
                </button>
              </form>
            </div>
          )}

          {/* Tab 3: Online Gateway Notice */}
          {paymentMethod === 'card' && (
            <div
              className="glass-card"
              style={{
                padding: '1.5rem',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                background: 'rgba(245, 158, 11, 0.08)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#F59E0B', marginBottom: '0.75rem' }}>
                <AlertCircle size={20} />
                <strong style={{ fontSize: '0.95rem' }}>بوابة الدفع بالبطاقات البنكية وفوري</strong>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 1rem' }}>
                جاري الربط مع بوابات الدفع الإلكتروني المباشر (Visa / Mastercard / Meeza / Fawry).
                في الوقت الحالي، يمكنك الدفع بسهولة وسرعة عبر <strong>فودافون كاش / إنستاباي</strong> أو كروت الشحن أو التواصل المباشر مع إدارة المنصة.
              </p>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPaymentMethod('vodafone')}
                style={{ fontSize: '0.85rem' }}
              >
                التبديل إلى الدفع عبر فودافون كاش / إنستاباي
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <ShieldCheck size={15} color="#10B981" /> ضمان التفعيل والأمان وحماية حقوق الطالب
          </span>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.45rem 1.25rem', fontSize: '0.85rem' }}>
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
