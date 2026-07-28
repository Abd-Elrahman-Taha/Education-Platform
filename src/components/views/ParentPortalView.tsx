import React, { useState, useEffect, useRef } from 'react';
import { Search, ShieldCheck, Share2, CheckCircle2, AlertTriangle, TrendingUp, Calendar, BookOpen, Award, Phone } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const ParentPortalView: React.FC = () => {
  const { showToast } = useToast();
  const [studentCode, setStudentCode] = useState('CODE-94021');
  const [hasSearched, setHasSearched] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render performance graph using HTML5 Canvas
  useEffect(() => {
    if (!hasSearched) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    canvas.width = parent ? parent.clientWidth : 700;
    canvas.height = 240;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Horizontal grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 40; i < canvas.height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Exam scores array (out of 100)
    const scores = [85, 90, 88, 96, 92, 98];
    const stepX = canvas.width / (scores.length - 1);

    // Gradient area under curve
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, 'rgba(79, 70, 229, 0.45)');
    grad.addColorStop(1, 'rgba(79, 70, 229, 0)');

    ctx.beginPath();
    scores.forEach((sc, idx) => {
      const x = idx * stepX;
      const y = canvas.height - (sc / 100) * (canvas.height - 50) - 25;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Chart line
    ctx.beginPath();
    scores.forEach((sc, idx) => {
      const x = idx * stepX;
      const y = canvas.height - (sc / 100) * (canvas.height - 50) - 25;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#818CF8';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Data points & glowing dots
    scores.forEach((sc, idx) => {
      const x = idx * stepX;
      const y = canvas.height - (sc / 100) * (canvas.height - 50) - 25;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#06B6D4';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [hasSearched]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentCode.trim()) {
      showToast("يرجى إدخال كود الطالب أو رقم الهاتف المسجل", "warning");
      return;
    }
    setHasSearched(true);
    showToast(`تم استخراج بيانات وتقارير الطالب لكود: ${studentCode}`, "success");
  };

  const handleSendWhatsapp = () => {
    showToast("تم إرسال تقرير المتابعة والتفوق لولي الأمر عبر WhatsApp بنجاح!", "success");
  };

  return (
    <div className="container fade-in-up" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem' }}>
      {/* Header & Search */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>بوابة متابعة ولي الأمر الشاملة</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>استعلام لحظي عن أداء الطالب ودرجات امتحانات البابل شيت ونسبة الحضور</p>
          </div>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', maxWidth: '640px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="أدخل كود الطالب (مثال: CODE-94021) أو رقم هاتف ولي الأمر..."
              style={{ width: '100%', paddingRight: '44px' }}
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            استخراج التقرير
          </button>
        </form>
      </div>

      {/* Report Results */}
      {hasSearched && (
        <div>
          {/* Top Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>اسم الطالب المسجل</div>
              <strong style={{ fontSize: '1.2rem', display: 'block' }}>أحمد محمد محمود</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--primary-light)' }}>الصف الثالث الثانوي • علمي علوم</span>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>نسبة حضور المحاضرات</div>
              <strong style={{ fontSize: '1.5rem', color: 'var(--success)', display: 'block' }}>96%</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>14/15 محاضرة مكتملة</span>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>المعدل التراكمي للامتحانات</div>
              <strong style={{ fontSize: '1.5rem', color: 'var(--primary-light)', display: 'block' }}>94.2%</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>ممتاز مرتفع (Top 5%)</span>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>مستوى الانضباط والحظر</div>
              <strong style={{ fontSize: '1.1rem', color: 'var(--success)', display: 'block' }}>حساب نشط ومثالي</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>0 مخالفات تبديل نافذة</span>
            </div>
          </div>

          {/* Performance Chart & Weak Points Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            {/* Left: Canvas Score Progression */}
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={20} color="var(--primary-light)" /> منحنى درجات الامتحانات (آخر 6 أشاريع)
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>مقياس الدرجات التقييمي من 100%</span>
                </div>
                <button className="btn btn-secondary" onClick={handleSendWhatsapp} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                  <Share2 size={16} /> إرسال لـ WhatsApp
                </button>
              </div>

              <div style={{ width: '100%', overflowX: 'auto' }}>
                <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />
              </div>
            </div>

            {/* Right: Insights & Alerts */}
            <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>تحليلات وتوصيات المعلم</h3>

              <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--success)', marginBottom: '0.35rem' }}>
                  <CheckCircle2 size={18} /> نقاط القوة المتفوقة
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  إتقان تام لقوانين كيرشوف والفيزياء الحديثة مع السرعة الفائقة في حل أسئلة البابل شيت.
                </p>
              </div>

              <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '0.35rem' }}>
                  <AlertTriangle size={18} /> نقاط تحتاج للمراجعة
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  مراجعة الحسابات العددية في باب الدينامو والفيض المغناطيسي لتفادي الأخطاء البسيطة.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
