import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, ShieldCheck, FileText, Sparkles, MessageCircle, Download, CheckCircle2, Lock, LogIn, UserPlus } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const DRMPlayerView: React.FC = () => {
  const { showToast } = useToast();
  const { isAuthenticated, currentUser } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState('1.0x');
  const [resolution, setResolution] = useState('1080p (FHD)');
  const [activeTab, setActiveTab] = useState<'chapters' | 'qa'>('chapters');
  const [notes, setNotes] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Dynamic Canvas Bouncing Watermark — only loads when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let x = 40, y = 60, dx = 1.8, dy = 1.4;

    const studentName = currentUser?.name || 'طالب مشترك';
    const studentCode = `CODE: #${currentUser?.id?.slice(-5) || '94021'}`;
    const ipAddress = 'IP: 197.34.88.12';

    const resizeCanvas = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const drawWatermark = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(13, 31, 35, 0.78)';
      ctx.strokeStyle = 'rgba(8, 145, 178, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, 240, 56, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.font = '600 13px Cairo, sans-serif';
      ctx.fillText(studentName, x + 14, y + 22);
      ctx.fillStyle = '#22D3EE';
      ctx.font = '700 11px monospace';
      ctx.fillText(`${studentCode} • ${ipAddress}`, x + 14, y + 42);
      if (x + 240 >= canvas.width || x <= 0) dx = -dx;
      if (y + 56 >= canvas.height || y <= 0) dy = -dy;
      x += dx; y += dy;
      animFrameIdRef.current = requestAnimationFrame(drawWatermark);
    };

    drawWatermark();
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isAuthenticated, currentUser]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) { videoRef.current.pause(); setIsPlaying(false); }
      else {
        videoRef.current.play().catch(() => showToast('البث التفاعلي المشفر يعمل بنجاح'));
        setIsPlaying(true);
        showToast('جاري تشغيل الفيديو المحمي بواسطة DRM ومطابقة العلامة المائية', 'success');
      }
    } else {
      setIsPlaying(!isPlaying);
      showToast(isPlaying ? 'إيقاف مؤقت' : 'جاري تشغيل الفيديو DRM', 'info');
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    showToast('تحذير DRM: تم منع النقر الأيمن لحماية حقوق الملكية الفكرية', 'warning');
  };

  // ── AUTH GUARD WALL: Displayed if user is NOT logged in ──
  if (!isAuthenticated) {
    return (
      <div className="container fade-in-up" style={{ padding: '3rem 1.5rem 5rem' }}>
        <div className="auth-guard-wall">
          <div className="auth-guard-wall-icon">
            <Lock size={42} />
          </div>
          <h2>This lesson requires login.</h2>
          <p>
            هذا الدرس يتطلب تسجيل الدخول. يجب تسجيل الدخول أو إنشاء حساب جديد للوصول للمحاضرات المحمية وتقنيات DRM.
          </p>
          <div className="auth-guard-cta">
            <button
              className="btn btn-primary"
              style={{ padding: '0.85rem 2rem' }}
              onClick={() => window.dispatchEvent(new CustomEvent('openAuthModal'))}
            >
              <LogIn size={18} /> Login
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.85rem 2rem' }}
              onClick={() => window.dispatchEvent(new CustomEvent('openAuthModal'))}
            >
              <UserPlus size={18} /> Register
            </button>
          </div>
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              'حماية DRM متقدمة',
              'علامة مائية ديناميكية',
              'محاضرات التفاضل والهندسة الفراغية'
            ].map(f => (
              <span key={f} style={{ background: 'rgba(8,145,178,0.12)', border: '1px solid rgba(8,145,178,0.25)', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.78rem', color: 'var(--primary-light)', fontWeight: 600 }}>{f}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── AUTHENTICATED DRM VIDEO PLAYER ──
  return (
    <div className="container fade-in-up" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="drm-heartbeat-badge">
              <span className="pulse-dot" style={{ background: 'var(--success)' }}></span>
              بث مشفر DRM v2.4 (حماية نشطة)
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>التفاضل والتكامل — الفصل الثالث</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-bright)' }}>المحاضرة 4: المشتقات — قاعدة السلسلة وتطبيقات هندسية</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select className="drm-source-selector" value={resolution} onChange={e => { setResolution(e.target.value); showToast(`تغيير الجودة: ${e.target.value}`); }}>
            <option value="1080p (FHD)">1080p Full HD (موصى به)</option>
            <option value="720p (HD)">720p HD</option>
            <option value="480p (SD)">480p SD</option>
          </select>
          <select className="drm-source-selector" value={playbackSpeed} onChange={e => { setPlaybackSpeed(e.target.value); showToast(`سرعة التشغيل: ${e.target.value}`); }}>
            <option value="0.75x">0.75x</option>
            <option value="1.0x">1.0x (عادي)</option>
            <option value="1.25x">1.25x</option>
            <option value="1.5x">1.5x</option>
            <option value="2.0x">2.0x</option>
          </select>
        </div>
      </div>

      <div className="drm-player-container" onContextMenu={handleContextMenu}>
        <div className="drm-video-wrapper">
          <canvas ref={canvasRef} className="drm-watermark-canvas" />
          <video ref={videoRef} className="drm-video-element" poster="https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80" />
          {!isPlaying && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(13,31,35,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
              <button onClick={togglePlay} style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px var(--primary-glow)', border: 'none', cursor: 'pointer' }}>
                <Play size={36} fill="#FFF" style={{ marginLeft: '4px' }} />
              </button>
            </div>
          )}
        </div>
        <div className="drm-controls-bar">
          <div className="drm-controls-left">
            <button className="drm-play-btn" onClick={togglePlay}>
              {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: '2px' }} />}
            </button>
            <span className="drm-time-display">24:15 / 1:45:00</span>
          </div>
          <div className="drm-progress-bar-wrap"><div className="drm-progress-fill"></div></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <ShieldCheck size={18} color="var(--success)" />
            <span>DRM Protected</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: '2.5rem' }}>
        <div>
          <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-bright)' }}>
              <FileText size={20} color="var(--primary-light)" /> ملخص وملاحظات المحاضرة
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.75 }}>
              تتناول هذه المحاضرة شرح قاعدة السلسلة في التفاضل، مشتقات الدوال المركبة والمثلثية، مع تطبيقات عملية على أكثر من 25 مسألة من امتحانات الأعوام السابقة في التفاضل والتكامل.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
              <button className="btn btn-secondary" onClick={() => showToast('جاري تحميل مذكرة PDF المحاضرة...')}>
                <Download size={16} /> تحميل الملزمة (PDF)
              </button>
              <button className="btn btn-secondary" onClick={() => showToast('تم إضافة المحاضرة للمفضلة')}>
                <Sparkles size={16} /> إضافة للمفضلة
              </button>
            </div>
          </div>
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-bright)' }}>دفتر ملاحظات الطالب الشخصي</h3>
            <textarea className="input-field" rows={4} placeholder="اكتب ملاحظاتك أثناء مشاهدة الفيديو وستحفظ تلقائياً..." style={{ width: '100%', resize: 'vertical' }} value={notes} onChange={e => setNotes(e.target.value)} />
            <button className="btn btn-primary" style={{ marginTop: '0.75rem', fontSize: '0.85rem' }} onClick={() => showToast('تم حفظ ملاحظاتك بنجاح', 'success')}>
              حفظ الملاحظات
            </button>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', height: 'fit-content' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
            <button className={`filter-btn ${activeTab === 'chapters' ? 'active' : ''}`} style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.8rem' }} onClick={() => setActiveTab('chapters')}>الفصول والتقسيم</button>
            <button className={`filter-btn ${activeTab === 'qa' ? 'active' : ''}`} style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.8rem' }} onClick={() => setActiveTab('qa')}>أسئلة الشات</button>
          </div>
          {activeTab === 'chapters' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { title: '1. مقدمة المشتقات وتفاضل الدوال', time: '00:00 - 15:30', done: true },
                { title: '2. قاعدة السلسلة وتفاضل الدوال المركبة', time: '15:30 - 52:00', done: false },
                { title: '3. حل مسائل الامتحانات السابقة', time: '52:00 - 1:45:00', done: false },
              ].map((ch, i) => (
                <div key={i} style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: ch.done ? 'rgba(8,145,178,0.12)' : 'var(--bg-surface)', border: `1px solid ${ch.done ? 'var(--primary-light)' : 'var(--border-glass)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.85rem', display: 'block', color: 'var(--text-bright)' }}>{ch.title}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ch.time}</span>
                  </div>
                  {ch.done ? <CheckCircle2 size={16} color="var(--success)" /> : <Lock size={14} color="var(--text-muted)" />}
                </div>
              ))}
            </div>
          )}
          {activeTab === 'qa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>طرح استفسار مباشر للمعلم أثناء الشرح:</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="text" placeholder="اكتب سؤالك في التفاضل..." className="input-field" style={{ flex: 1, fontSize: '0.85rem' }} />
                <button className="btn btn-primary" style={{ padding: '0.5rem 0.8rem' }} onClick={() => showToast('تم إرسال سؤالك للمعلم')}>
                  <MessageCircle size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
