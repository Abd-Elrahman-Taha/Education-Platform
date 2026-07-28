import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, ShieldCheck, FileText, Sparkles, MessageCircle, Download, CheckCircle2, Lock } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const DRMPlayerView: React.FC = () => {
  const { showToast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState('1.0x');
  const [resolution, setResolution] = useState('1080p (FHD)');
  const [activeTab, setActiveTab] = useState<'chapters' | 'notes' | 'qa'>('chapters');
  const [notes, setNotes] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Dynamic Canvas Bouncing Watermark Physics
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let x = 40;
    let y = 60;
    let dx = 1.8;
    let dy = 1.4;

    const studentName = "أحمد محمد محمود (الطالب)";
    const studentCode = "CODE: #94021";
    const ipAddress = "IP: 197.34.88.12";

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

      // Translucent bounding box
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.strokeStyle = 'rgba(79, 70, 229, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, 230, 56, 12);
      ctx.fill();
      ctx.stroke();

      // Student info text inside canvas watermark
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '600 13px Cairo, sans-serif';
      ctx.fillText(studentName, x + 14, y + 22);

      ctx.fillStyle = '#67E8F9';
      ctx.font = '700 11px monospace';
      ctx.fillText(`${studentCode} • ${ipAddress}`, x + 14, y + 42);

      // Bounce limits
      if (x + 230 >= canvas.width || x <= 0) dx = -dx;
      if (y + 56 >= canvas.height || y <= 0) dy = -dy;

      x += dx;
      y += dy;

      animFrameIdRef.current = requestAnimationFrame(drawWatermark);
    };

    drawWatermark();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => showToast("البث التفاعلي المشفر يعمل بنجاح"));
        setIsPlaying(true);
        showToast("جاري تشغيل الفيديو المحمي بواسطة DRM ومطابقة العلامة المائية", "success");
      }
    } else {
      setIsPlaying(!isPlaying);
      showToast(isPlaying ? "إيقاف مؤقت" : "جاري تشغيل الفيديو DRM", "info");
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    showToast("تحذير حماية DRM: تم منع النقر الأيمن لحماية حقوق الملكية الفكرية للمحاضرة", "warning");
  };

  return (
    <div className="container fade-in-up" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="drm-heartbeat-badge">
              <span className="pulse-dot" style={{ background: 'var(--success)', boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.7)' }}></span>
              بث مشفر DRM v2.4 (حماية نشطة)
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>الصف الثالث الثانوي • الفيزياء الحديثة</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>المحاضرة 4: الظاهرة الكهرودوئية وقانون بلانك والفيض المغناطيسي</h1>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select
            className="drm-source-selector"
            value={resolution}
            onChange={(e) => {
              setResolution(e.target.value);
              showToast(`تم تغيير جودة البث إلى: ${e.target.value}`);
            }}
          >
            <option value="1080p (FHD)">1080p Full HD (موصى به)</option>
            <option value="720p (HD)">720p HD</option>
            <option value="480p (SD)">480p SD</option>
          </select>

          <select
            className="drm-source-selector"
            value={playbackSpeed}
            onChange={(e) => {
              setPlaybackSpeed(e.target.value);
              showToast(`تغيير سرعة التشغيل: ${e.target.value}`);
            }}
          >
            <option value="0.75x">0.75x (بطيء)</option>
            <option value="1.0x">1.0x (عادي)</option>
            <option value="1.25x">1.25x (سريع)</option>
            <option value="1.5x">1.5x (سريع جداً)</option>
            <option value="2.0x">2.0x (مزدوج)</option>
          </select>
        </div>
      </div>

      {/* Main Video & DRM Canvas Container */}
      <div className="drm-player-container" onContextMenu={handleContextMenu}>
        <div className="drm-video-wrapper">
          {/* HTML5 Canvas Watermark Overlay */}
          <canvas ref={canvasRef} className="drm-watermark-canvas" />

          {/* Video / Mock Stream */}
          <video
            ref={videoRef}
            className="drm-video-element"
            poster="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"
          />

          {!isPlaying && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(15, 23, 42, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 5
            }}>
              <button
                onClick={togglePlay}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 30px var(--primary-glow)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Play size={36} fill="#FFF" style={{ marginLeft: '4px' }} />
              </button>
            </div>
          )}
        </div>

        {/* Custom DRM Controls Bar */}
        <div className="drm-controls-bar">
          <div className="drm-controls-left">
            <button className="drm-play-btn" onClick={togglePlay}>
              {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: '2px' }} />}
            </button>
            <span className="drm-time-display">24:15 / 1:45:00</span>
          </div>

          <div className="drm-progress-bar-wrap">
            <div className="drm-progress-fill"></div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <ShieldCheck size={18} color="var(--success)" />
            <span>DRM Protected</span>
          </div>
        </div>
      </div>

      {/* Tabs & Additional Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: '2.5rem' }}>
        {/* Left Side: Description & Notes */}
        <div>
          <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} color="var(--primary-light)" /> ملخص وملاحظات المحاضرة
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.7' }}>
              تتناول هذه المحاضرة الشرح التفصيلي لظاهرة انبعاث الإلكترونات الضوئية من سطوح المعادن عند سقوط ضوء ذو تردد مناسب، وشرح معادلة أينشتاين الكهرودوئية، بالإضافة لحل أكثر من 25 مسألة من امتحانات الأعوام السابقة.
            </p>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
              <button className="btn btn-secondary" onClick={() => showToast("جاري تحميل مذكرة PDF المحاضرة...")}>
                <Download size={16} /> تحميل الملزمة (PDF)
              </button>
              <button className="btn btn-secondary" onClick={() => showToast("تم إضافة المحاضرة للمفضلة")}>
                <Sparkles size={16} /> إضافة للمفضلة
              </button>
            </div>
          </div>

          {/* Personal Notes Box */}
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>دفتر ملاحظات الطالب الشخصي</h3>
            <textarea
              className="input-field"
              rows={4}
              placeholder="اكتب ملاحظاتك أثناء مشاهدة الفيديو وستحفظ تلقائياً في حسابك..."
              style={{ width: '100%', resize: 'vertical' }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button
              className="btn btn-primary"
              style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}
              onClick={() => showToast("تم حفظ ملاحظاتك الشخصية بنجاح", "success")}
            >
              حفظ الملاحظات
            </button>
          </div>
        </div>

        {/* Right Side Tab Panel */}
        <div className="glass-card" style={{ padding: '1.5rem', height: 'fit-content' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
            <button
              className={`filter-btn ${activeTab === 'chapters' ? 'active' : ''}`}
              style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.8rem' }}
              onClick={() => setActiveTab('chapters')}
            >
              الفصول والتقسيم
            </button>
            <button
              className={`filter-btn ${activeTab === 'qa' ? 'active' : ''}`}
              style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.8rem' }}
              onClick={() => setActiveTab('qa')}
            >
              أسئلة الشات
            </button>
          </div>

          {activeTab === 'chapters' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(79, 70, 229, 0.15)', border: '1px solid var(--primary-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '0.85rem', display: 'block' }}>1. مقدمة الانبعاث الحراري</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>00:00 - 15:30</span>
                </div>
                <CheckCircle2 size={16} color="var(--success)" />
              </div>

              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '0.85rem', display: 'block' }}>2. معادلة أينشتاين الكهروضوئية</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>15:30 - 45:00</span>
                </div>
                <Play size={14} color="var(--primary-light)" />
              </div>

              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '0.85rem', display: 'block' }}>3. حل مسائل الاختيار من متعدد</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>45:00 - 1:45:00</span>
                </div>
                <Lock size={14} color="var(--text-muted)" />
              </div>
            </div>
          )}

          {activeTab === 'qa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>طرح استفسار مباشر للمعلم أثناء الشرح:</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="text" placeholder="اكتب سؤالك هنا..." className="input-field" style={{ flex: 1, fontSize: '0.85rem' }} />
                <button className="btn btn-primary" style={{ padding: '0.5rem 0.8rem' }} onClick={() => showToast("تم إرسال سؤالك للمعلم ومساعد المادة")}>
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
