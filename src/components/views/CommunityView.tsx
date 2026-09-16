import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MessageSquare, ThumbsUp, Share2, Download, Plus, Send, Sigma, Box, Layers,
  LogIn, UserPlus, Sparkles, Users, HelpCircle, ShieldCheck,
  Inbox, Mail, MailOpen, Clock, CheckCircle2, AlertCircle, RefreshCw, ChevronDown, ChevronUp,
  ArrowDownLeft, ArrowUpRight, MessageCircle,
} from 'lucide-react';
import { CommunityPost } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { inquiriesApi } from '../../api/inquiries.api';
import { Inquiry } from '../../types/api.types';
import { getFriendlyErrorMessage } from '../../utils/errors';

interface CommunityViewProps {
  onOpenShareModal: () => void;
  onOpenAuthModal?: () => void;
}

type CommunityTab = 'posts' | 'inquiries';
type InquiriesFilter = 'all' | 'incoming' | 'outgoing';

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('ar-EG', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
};

export const CommunityView: React.FC<CommunityViewProps> = ({ onOpenShareModal, onOpenAuthModal }) => {
  const { showToast } = useToast();
  const { isAuthenticated, currentUser } = useAuth();
  const [communityTab, setCommunityTab] = useState<CommunityTab>('posts');

  // ── POSTS STATE ───────────────────────────────────────────────
  const [activeSubject, setActiveSubject] = useState<string>('all');
  const [showNewQuestionForm, setShowNewQuestionForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTopic, setNewTopic] = useState<'التفاضل والتكامل' | 'الهندسة الفراغية'>('التفاضل والتكامل');

  const [posts, setPosts] = useState<CommunityPost[]>([
    {
      id: 'p1',
      authorName: 'عمر خالد',
      authorRole: 'طالب ثانوي - القاهرة',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
      timeAgo: 'منذ ساعتين',
      subject: 'التفاضل والتكامل',
      title: 'استفسار عن إيجاد نقاط الانقلاب وحساب المشتقة الثانية للدوال الكسرية؟',
      content: 'سلام عليكم يا شباب، في سؤال الصفحة 42 رقم 18 في التفاضل: لما بنجيب المشتقة الثانية لدالة كسرية، هل بنساوي البسط بالصفر دائماً لإيجاد نقط الانقلاب المرشحة؟ وهل ممكن المقام يساوي صفر عند نقطة الانقلاب؟',
      upvotes: 28,
      repliesCount: 9,
      isSolved: true,
    },
    {
      id: 'p2',
      authorName: 'نورهان علي',
      authorRole: 'طالبة ثانوي - الإسكندرية',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
      timeAgo: 'منذ 5 ساعات',
      subject: 'الهندسة الفراغية',
      title: 'كيفية تحديد زاوية الاتجاه ومتجهات الوحدة في ثلاثي الأبعاد؟',
      content: 'في درس الهندسة الفراغية: لو عندي نقطتين في الفراغ A(2, -1, 3) و B(5, 3, -1)، إزاي بأسرع طريقة أحسب جيب تمام زوايا الاتجاه للمتجه AB ونعوض في معادلة المستوى؟',
      upvotes: 21,
      repliesCount: 6,
      isSolved: false,
    },
    {
      id: 'p3',
      authorName: 'مريم إبراهيم',
      authorRole: 'طالبة ثانوي - الجيزة',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      timeAgo: 'منذ يوم واحد',
      subject: 'التفاضل والتكامل',
      title: 'طريقة قاعدة السلسلة (Chain Rule) في مشتقة الدوال المثلثية المرفوعة لأس؟',
      content: 'لما بنشتق دالة زي y = sin³(5x)، هل الأسهل نعتبرها (sin(5x))³ وننزل الأس ونطرح منه 1 وبعدين نضرب في مشتقة ما داخل القوس وملاحظة مشتقة الـ 5x؟',
      upvotes: 35,
      repliesCount: 12,
      isSolved: true,
    },
  ]);

  // ── INQUIRIES STATE ───────────────────────────────────────────
  const [myInquiries, setMyInquiries] = useState<Inquiry[]>([]);
  const [isInquiriesLoading, setIsInquiriesLoading] = useState(false);
  const [expandedInquiryId, setExpandedInquiryId] = useState<string | null>(null);
  const [inquiriesFilter, setInquiriesFilter] = useState<InquiriesFilter>('all');

  // New inquiry form
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isSendingInquiry, setIsSendingInquiry] = useState(false);
  const [showInquiryForm, setShowInquiryForm] = useState(false);

  // Restore navigation from notifications (localStorage / sessionStorage)
  useEffect(() => {
    try {
      const activeTabReq = localStorage.getItem('community_active_tab');
      if (activeTabReq === 'inquiries') {
        setCommunityTab('inquiries');
        localStorage.removeItem('community_active_tab');
      }
      const filterReq = localStorage.getItem('community_inquiries_filter');
      if (filterReq === 'incoming' || filterReq === 'outgoing' || filterReq === 'all') {
        setInquiriesFilter(filterReq as InquiriesFilter);
        localStorage.removeItem('community_inquiries_filter');
      }
      const selectedId = sessionStorage.getItem('community_selected_inquiry_id');
      if (selectedId) {
        setExpandedInquiryId(selectedId);
        sessionStorage.removeItem('community_selected_inquiry_id');
      }
    } catch {}
  }, []);

  const loadMyInquiries = useCallback(async () => {
    setIsInquiriesLoading(true);
    try {
      const { inquiries } = await inquiriesApi.getMyInquiries({ limit: 50 });
      setMyInquiries(inquiries);
    } catch (err: any) {
      console.warn('[Inquiries] Failed to load:', err);
    } finally {
      setIsInquiriesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadMyInquiries();
    }
  }, [isAuthenticated, loadMyInquiries]);

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) return;
    setIsSendingInquiry(true);
    try {
      const created = await inquiriesApi.createInquiry({
        Subject: newSubject.trim(),
        Message: newMessage.trim(),
      });
      setMyInquiries(prev => [created, ...prev]);
      setNewSubject('');
      setNewMessage('');
      setShowInquiryForm(false);
      showToast('تم إرسال استفسارك للإدارة بنجاح! سيتم الرد عليك في أقرب وقت.', 'success');
    } catch (err: any) {
      showToast(getFriendlyErrorMessage(err, 'تعذر إرسال الاستفسار، يرجى المحاولة مرة أخرى.'), 'error');
    } finally {
      setIsSendingInquiry(false);
    }
  };

  // ── Posts handlers ─────────────────────────────────────────
  const handleUpvote = (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, upvotes: p.upvotes + 1 } : p));
    showToast('تم إضافة تصويتك للإجابة بنجاح!');
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    const newPost: CommunityPost = {
      id: Date.now().toString(),
      authorName: currentUser?.name || 'طالب',
      authorRole: 'طالب ثانوي',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
      timeAgo: 'الآن',
      subject: newTopic,
      title: newTitle,
      content: newContent,
      upvotes: 1,
      repliesCount: 0,
      isSolved: false,
    };
    setPosts([newPost, ...posts]);
    setNewTitle('');
    setNewContent('');
    setShowNewQuestionForm(false);
    showToast('تم نشر سؤالك في مجتمع الرياضيات بنجاح!', 'success');
  };

  const totalAll = posts.length;
  const totalCalc = posts.filter(p => p.subject === 'التفاضل والتكامل').length;
  const totalGeom = posts.filter(p => p.subject === 'الهندسة الفراغية').length;
  const openCount = useMemo(() => myInquiries.filter(i => i.Status === 'Open').length, [myInquiries]);
  const answeredCount = useMemo(() => myInquiries.filter(i => i.Status === 'Answered').length, [myInquiries]);

  const displayedInquiries = useMemo(() => {
    if (inquiriesFilter === 'incoming') {
      return myInquiries.filter(i => i.Status === 'Answered');
    }
    if (inquiriesFilter === 'outgoing') {
      return myInquiries.filter(i => i.Status === 'Open');
    }
    return myInquiries;
  }, [myInquiries, inquiriesFilter]);

  // ── GUEST SCREEN ─────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="container fade-in-up" style={{ padding: '3rem 1.5rem 6rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3rem' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '24px', margin: '0 auto 1.5rem',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 32px var(--primary-glow)',
          }}>
            <Users size={38} color="#fff" />
          </div>
          <span className="gradient-badge" style={{ marginBottom: '0.75rem' }}>
            <Sparkles size={14} /> مجتمع الطلاب والمعلمين
          </span>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-bright)', margin: '0.5rem 0 0.75rem' }}>
            انضم إلى مجتمع التعلم
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.7, maxWidth: '580px', margin: '0 auto' }}>
            سجّل دخولك للمشاركة في النقاشات، طرح الأسئلة والاستفسارات، والتواصل المباشر مع إدارة المنصة.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', maxWidth: '900px', margin: '0 auto 3rem' }}>
          <div className="glass-card" style={{ padding: '1.75rem', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', margin: '0 auto 1rem', background: 'rgba(8,145,178,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HelpCircle size={24} color="var(--primary-light)" />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.4rem' }}>طرح استفسارات للإدارة</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>أرسل سؤالك أو استفسارك مباشرة للإدارة واحصل على رد سريع.</p>
          </div>
          <div className="glass-card" style={{ padding: '1.75rem', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', margin: '0 auto 1rem', background: 'rgba(8,145,178,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={24} color="#10B981" />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.4rem' }}>إجابات موثوقة من المعلم</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>متابعة ومراجعة مستمرة من المعلم للتأكد من صحة القوانين والحلول.</p>
          </div>
          <div className="glass-card" style={{ padding: '1.75rem', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', margin: '0 auto 1rem', background: 'rgba(8,145,178,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={24} color="#F59E0B" />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.4rem' }}>تبادل الخبرات بين الزملاء</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>تفاعل مع زملائك وشارك طرق حل أسرع وملاحظات هامة.</p>
          </div>
        </div>

        <div className="glass-card" style={{
          maxWidth: '520px', margin: '0 auto', padding: '2.5rem',
          textAlign: 'center', background: 'var(--banner-gradient)',
          border: '1px solid rgba(8,145,178,0.25)',
        }}>
          <MessageSquare size={36} color="var(--primary-light)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.5rem' }}>
            سجّل دخولك للمشاركة في المجتمع
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
            سجّل دخولك للوصول إلى منتدى الأسئلة وصندوق الرسائل مع الإدارة.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={onOpenAuthModal} style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}>
              <LogIn size={18} /> تسجيل الدخول
            </button>
            <button className="btn btn-secondary" onClick={onOpenAuthModal} style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}>
              <UserPlus size={18} /> إنشاء حساب جديد
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container fade-in-up" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem' }}>
      {/* Top Banner */}
      <div className="glass-card" style={{ padding: '1.75rem 2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-bright)' }}>
            <MessageSquare size={24} color="var(--primary-light)" /> المجتمع التعليمي
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            منتدى الأسئلة الرياضية • الرسائل مع الإدارة
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0' }}>
        <button
          onClick={() => setCommunityTab('posts')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.65rem 1.25rem', borderRadius: '8px 8px 0 0',
            fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', border: 'none',
            background: communityTab === 'posts' ? 'var(--bg-glass-card)' : 'transparent',
            color: communityTab === 'posts' ? 'var(--primary-light)' : 'var(--text-muted)',
            borderBottom: communityTab === 'posts' ? '2px solid var(--primary-light)' : '2px solid transparent',
          }}
        >
          <Users size={16} /> منتدى الأسئلة
        </button>
        <button
          onClick={() => setCommunityTab('inquiries')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.45rem',
            padding: '0.65rem 1.25rem', borderRadius: '8px 8px 0 0',
            fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', border: 'none',
            background: communityTab === 'inquiries' ? 'var(--bg-glass-card)' : 'transparent',
            color: communityTab === 'inquiries' ? 'var(--primary-light)' : 'var(--text-muted)',
            borderBottom: communityTab === 'inquiries' ? '2px solid var(--primary-light)' : '2px solid transparent',
            position: 'relative',
          }}
        >
          <Inbox size={16} /> الرسائل مع الإدارة (الواردة والصادرة)
          {answeredCount > 0 && (
            <span style={{
              background: '#10B981', color: '#fff', fontSize: '0.68rem', fontWeight: 800,
              padding: '0.1rem 0.45rem', borderRadius: '9999px', minWidth: '18px', textAlign: 'center',
            }} title={`${answeredCount} ردود واردة من الإدارة`}>
              {answeredCount} وارد
            </span>
          )}
          {openCount > 0 && (
            <span style={{
              background: '#F59E0B', color: '#fff', fontSize: '0.68rem', fontWeight: 800,
              padding: '0.1rem 0.45rem', borderRadius: '9999px', minWidth: '18px', textAlign: 'center',
            }} title={`${openCount} رسائل صادرة قيد الانتظار`}>
              {openCount} صادر
            </span>
          )}
        </button>
      </div>

      {/* ── TAB: POSTS ─────────────────────────────────────────── */}
      {communityTab === 'posts' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
            <button className="btn btn-primary" onClick={() => setShowNewQuestionForm(!showNewQuestionForm)}>
              <Plus size={18} /> {showNewQuestionForm ? 'إغلاق النموذج' : 'إضافة سؤال جديد'}
            </button>
          </div>

          {showNewQuestionForm && (
            <form onSubmit={handleAddQuestion} className="glass-card" style={{ padding: '1.75rem', marginBottom: '2rem', border: '1px solid var(--primary-light)' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-bright)' }}>نشر سؤال رياضيات جديد</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>عنوان السؤال</label>
                  <input type="text" required className="input-field" placeholder="اكتب عنواناً واضحاً..." style={{ width: '100%' }} value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>التخصص</label>
                  <select className="input-field" value={newTopic} onChange={e => setNewTopic(e.target.value as any)} style={{ width: '100%' }}>
                    <option value="التفاضل والتكامل">التفاضل والتكامل</option>
                    <option value="الهندسة الفراغية">الهندسة الفراغية</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>تفاصيل المسألة</label>
                <textarea required rows={4} className="input-field" placeholder="اكتب تفاصيل المعطيات أو الخطوة التي توقفت عندها..." style={{ width: '100%' }} value={newContent} onChange={e => setNewContent(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary">
                <Send size={16} /> نشر السؤال
              </button>
            </form>
          )}

          <div className="math-filter-tabs">
            <button className={`math-tab-btn ${activeSubject === 'all' ? 'active' : ''}`} onClick={() => setActiveSubject('all')}>
              <Layers size={18} /><span>جميع المواضيع</span><span className="math-tab-badge">{totalAll}</span>
            </button>
            <button className={`math-tab-btn ${activeSubject === 'التفاضل والتكامل' ? 'active' : ''}`} onClick={() => setActiveSubject('التفاضل والتكامل')}>
              <Sigma size={18} /><span>التفاضل والتكامل</span><span className="math-tab-badge">{totalCalc}</span>
            </button>
            <button className={`math-tab-btn ${activeSubject === 'الهندسة الفراغية' ? 'active' : ''}`} onClick={() => setActiveSubject('الهندسة الفراغية')}>
              <Box size={18} /><span>الهندسة الفراغية</span><span className="math-tab-badge">{totalGeom}</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {posts.filter(p => activeSubject === 'all' || p.subject === activeSubject).map(post => (
              <div key={post.id} className="glass-card" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <img src={post.authorAvatar} style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--border-glass)' }} alt={post.authorName} />
                    <div>
                      <strong style={{ fontSize: '0.95rem', display: 'block', color: 'var(--text-bright)' }}>{post.authorName}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{post.authorRole} • {post.timeAgo}</span>
                    </div>
                  </div>
                  <span className="gradient-badge" style={{ fontSize: '0.78rem' }}>
                    {post.subject === 'التفاضل والتكامل' ? <Sigma size={12} /> : <Box size={12} />} {post.subject}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-bright)' }}>{post.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.75', marginBottom: '1.5rem' }}>{post.content}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-secondary" onClick={() => handleUpvote(post.id)} style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
                      <ThumbsUp size={15} /> إعجاب ({post.upvotes})
                    </button>
                    <button className="btn btn-secondary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
                      <MessageSquare size={15} /> الإجابات ({post.repliesCount})
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="icon-btn" onClick={onOpenShareModal} title="مشاركة السؤال"><Share2 size={16} /></button>
                    <button className="icon-btn" onClick={() => showToast('جاري تنزيل السؤال...')} title="تصدير PDF"><Download size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── TAB: INQUIRIES (INCOMING & OUTGOING MESSAGES) ─────── */}
      {communityTab === 'inquiries' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header Card */}
          <div className="glass-card" style={{ padding: '1.25rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <MessageCircle size={22} color="var(--primary-light)" /> صندوق الرسائل المتبادلة مع إدارة المنصة
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                تواصل مباشر مع مسؤولي المنصة — استقبل الردود الواردة وتابع حالة استفساراتك الصادرة
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={loadMyInquiries} disabled={isInquiriesLoading} style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <RefreshCw size={14} className={isInquiriesLoading ? 'spin' : ''} /> تحديث
              </button>
              <button className="btn btn-primary" onClick={() => setShowInquiryForm(!showInquiryForm)} style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Plus size={16} /> {showInquiryForm ? 'إغلاق النموذج' : 'إرسال رسالة جديدة للإدارة'}
              </button>
            </div>
          </div>

          {/* New Inquiry Form */}
          {showInquiryForm && (
            <form onSubmit={handleSendInquiry} className="glass-card" style={{ padding: '1.75rem', border: '1px solid var(--primary-light)', boxShadow: '0 8px 32px var(--primary-glow)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={18} color="var(--primary-light)" /> كتابة رسالة أو استفسار جديد للإدارة
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                سيتم إرسال رسالتك مباشرة إلى لوحة تحكم المسؤولين، وسيصلك إشعار فوري عند الرد عليها هنا وفي التنبيهات.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                    موضوع الرسالة <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="text" required className="input-field"
                    placeholder="مثال: استفسار عن تفعيل الكورس / مشكلة في كود الشحن / سؤال علمي..."
                    style={{ width: '100%' }}
                    value={newSubject}
                    onChange={e => setNewSubject(e.target.value)}
                    minLength={3}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                    تفاصيل الرسالة أو الاستفسار <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <textarea
                    required rows={4} className="input-field"
                    placeholder="اكتب تفاصيل استفسارك بوضوح لتتمكن الإدارة من مساعدتك بدقة..."
                    style={{ width: '100%', resize: 'vertical' }}
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    minLength={10}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowInquiryForm(false)} disabled={isSendingInquiry}>
                    إلغاء
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSendingInquiry}>
                    <Send size={15} /> {isSendingInquiry ? 'جاري الإرسال...' : 'إرسال الرسالة للإدارة'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Sub-Tabs: Incoming / Outgoing / All */}
          <div style={{
            display: 'flex', gap: '0.5rem', flexWrap: 'wrap',
            padding: '0.4rem', background: 'var(--bg-glass-card)',
            borderRadius: '12px', border: '1px solid var(--border-glass)'
          }}>
            <button
              onClick={() => setInquiriesFilter('incoming')}
              style={{
                flex: 1, minWidth: '160px', padding: '0.65rem 1rem',
                borderRadius: '8px', border: 'none', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
                fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s ease',
                background: inquiriesFilter === 'incoming' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                color: inquiriesFilter === 'incoming' ? '#10B981' : 'var(--text-muted)',
                borderBottom: inquiriesFilter === 'incoming' ? '2px solid #10B981' : '2px solid transparent',
              }}
            >
              <ArrowDownLeft size={16} color={inquiriesFilter === 'incoming' ? '#10B981' : 'var(--text-muted)'} />
              <span>الرسائل الواردة (ردود الإدارة)</span>
              <span style={{
                background: inquiriesFilter === 'incoming' ? '#10B981' : 'rgba(16, 185, 129, 0.2)',
                color: inquiriesFilter === 'incoming' ? '#FFF' : '#10B981',
                padding: '0.1rem 0.45rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 800,
              }}>
                {answeredCount}
              </span>
            </button>

            <button
              onClick={() => setInquiriesFilter('outgoing')}
              style={{
                flex: 1, minWidth: '160px', padding: '0.65rem 1rem',
                borderRadius: '8px', border: 'none', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
                fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s ease',
                background: inquiriesFilter === 'outgoing' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                color: inquiriesFilter === 'outgoing' ? '#F59E0B' : 'var(--text-muted)',
                borderBottom: inquiriesFilter === 'outgoing' ? '2px solid #F59E0B' : '2px solid transparent',
              }}
            >
              <ArrowUpRight size={16} color={inquiriesFilter === 'outgoing' ? '#F59E0B' : 'var(--text-muted)'} />
              <span>الرسائل الصادرة (المُرسلة للإدارة)</span>
              <span style={{
                background: inquiriesFilter === 'outgoing' ? '#F59E0B' : 'rgba(245, 158, 11, 0.2)',
                color: inquiriesFilter === 'outgoing' ? '#FFF' : '#F59E0B',
                padding: '0.1rem 0.45rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 800,
              }}>
                {openCount}
              </span>
            </button>

            <button
              onClick={() => setInquiriesFilter('all')}
              style={{
                flex: 1, minWidth: '110px', padding: '0.65rem 1rem',
                borderRadius: '8px', border: 'none', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
                fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s ease',
                background: inquiriesFilter === 'all' ? 'var(--primary-light-15)' : 'transparent',
                color: inquiriesFilter === 'all' ? 'var(--primary-light)' : 'var(--text-muted)',
                borderBottom: inquiriesFilter === 'all' ? '2px solid var(--primary-light)' : '2px solid transparent',
              }}
            >
              <Inbox size={15} />
              <span>الكل ({myInquiries.length})</span>
            </button>
          </div>

          {/* Inquiries List */}
          {isInquiriesLoading ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={26} className="spin" style={{ marginBottom: '0.75rem', color: 'var(--primary-light)' }} />
              <div style={{ fontWeight: 600 }}>جاري تحديث صندوق الرسائل...</div>
            </div>
          ) : displayedInquiries.length === 0 ? (
            <div className="glass-card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'rgba(8,145,178,0.12)', margin: '0 auto 1.25rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-light)'
              }}>
                {inquiriesFilter === 'incoming' ? (
                  <MailOpen size={28} color="#10B981" />
                ) : inquiriesFilter === 'outgoing' ? (
                  <Send size={28} color="#F59E0B" />
                ) : (
                  <Inbox size={28} />
                )}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.5rem' }}>
                {inquiriesFilter === 'incoming'
                  ? 'لا توجد ردود واردة من الإدارة حالياً'
                  : inquiriesFilter === 'outgoing'
                  ? 'لا توجد رسائل صادرة قيد الانتظار'
                  : 'صندوق الرسائل فارغ حتى الآن'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '460px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
                {inquiriesFilter === 'incoming'
                  ? 'عندما تقوم إدارة المنصة بالرد على أي من رسائلك أو استفساراتك، سيظهر الرد هنا فوراً مع تنبيه إشعار.'
                  : inquiriesFilter === 'outgoing'
                  ? 'جميع استفساراتك السابقة تم الرد عليها أو لم تقم بإرسال رسائل جديدة بعد.'
                  : 'يمكنك التواصل المباشر مع إدارة المنصة وطرح أي استفسار أو مشكلة بكل سهولة.'}
              </p>
              <button className="btn btn-primary" onClick={() => setShowInquiryForm(true)}>
                <Plus size={16} /> كتابة رسالة جديدة للإدارة
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {displayedInquiries.map(inquiry => {
                const isExpanded = expandedInquiryId === inquiry._id;
                const isAnswered = inquiry.Status === 'Answered';

                return (
                  <div
                    key={inquiry._id}
                    id={`inquiry-${inquiry._id}`}
                    className="glass-card"
                    style={{
                      padding: '1.35rem',
                      border: isAnswered ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(245,158,11,0.3)',
                      borderRadius: '12px',
                      background: isAnswered ? 'rgba(16, 185, 129, 0.02)' : 'rgba(245, 158, 11, 0.02)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Top Row: Clickable Header */}
                    <div
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer', gap: '0.75rem' }}
                      onClick={() => setExpandedInquiryId(isExpanded ? null : inquiry._id)}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                          {isAnswered ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                              padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.74rem', fontWeight: 800,
                              background: 'rgba(16,185,129,0.15)', color: '#10B981',
                              border: '1px solid rgba(16,185,129,0.35)',
                            }}>
                              <ArrowDownLeft size={13} /> رد وارد من إدارة المنصة
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                              padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.74rem', fontWeight: 800,
                              background: 'rgba(245,158,11,0.15)', color: '#F59E0B',
                              border: '1px solid rgba(245,158,11,0.35)',
                            }}>
                              <ArrowUpRight size={13} /> رسالة صادرة للإدارة • ⏳ قيد المراجعة
                            </span>
                          )}

                          <strong style={{ fontSize: '0.98rem', color: 'var(--text-bright)', marginRight: '0.25rem' }}>
                            {inquiry.Subject}
                          </strong>
                        </div>

                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span>
                            <Clock size={12} style={{ verticalAlign: 'middle', marginLeft: '3px' }} />
                            تاريخ الإرسال: {formatDate(inquiry.createdAt)}
                          </span>
                          {isAnswered && inquiry.RepliedAt && (
                            <span style={{ color: '#10B981', fontWeight: 600 }}>
                              <CheckCircle2 size={12} style={{ verticalAlign: 'middle', marginLeft: '3px' }} />
                              تاريخ الرد: {formatDate(inquiry.RepliedAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ flexShrink: 0, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isExpanded ? 'var(--primary-light)' : 'var(--text-muted)' }}>
                          {isExpanded ? 'طي التفاصيل' : 'عرض التفاصيل'}
                        </span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {/* Quick Preview when not expanded */}
                    {!isExpanded && (
                      <div style={{ marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-glass)' }}>
                        {isAnswered && inquiry.Reply ? (
                          <div style={{
                            fontSize: '0.85rem', color: 'var(--text-bright)',
                            background: 'rgba(16, 185, 129, 0.08)', padding: '0.5rem 0.75rem',
                            borderRadius: '8px', borderRight: '3px solid #10B981',
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                          }}>
                            <span style={{ fontWeight: 700, color: '#10B981', flexShrink: 0 }}>رد الإدارة:</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{inquiry.Reply}</span>
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <span style={{ fontWeight: 600 }}>رسالتك:</span> {inquiry.Message}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Expanded Detail View */}
                    {isExpanded && (
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
                        {/* If Answered: Showcase Admin Reply prominently first */}
                        {isAnswered && inquiry.Reply && (
                          <div style={{
                            background: 'rgba(16, 185, 129, 0.08)',
                            border: '1px solid rgba(16, 185, 129, 0.28)',
                            borderRadius: '12px',
                            padding: '1.25rem',
                            marginBottom: '1rem',
                            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.08)',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{
                                  width: '30px', height: '30px', borderRadius: '50%',
                                  background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981'
                                }}>
                                  <ShieldCheck size={17} />
                                </div>
                                <div>
                                  <strong style={{ fontSize: '0.92rem', color: '#10B981' }}>
                                    رد إدارة المنصة
                                  </strong>
                                  {inquiry.RepliedBy && (
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginRight: '0.4rem' }}>
                                      (المسؤول: {inquiry.RepliedBy.FullName})
                                    </span>
                                  )}
                                </div>
                              </div>
                              {inquiry.RepliedAt && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {formatDate(inquiry.RepliedAt)}
                                </span>
                              )}
                            </div>

                            <div style={{ fontSize: '0.92rem', color: 'var(--text-bright)', lineHeight: 1.7, whiteSpace: 'pre-wrap', padding: '0.25rem 0.25rem' }}>
                              {inquiry.Reply}
                            </div>
                          </div>
                        )}

                        {/* Original student message */}
                        <div style={{
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: '10px',
                          padding: '1rem',
                          marginBottom: !isAnswered ? '0.85rem' : '0',
                        }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Mail size={13} color="var(--primary-light)" /> نص رسالتك المُرسلة للإدارة:
                          </div>
                          <div style={{ fontSize: '0.88rem', color: 'var(--text-bright)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                            {inquiry.Message}
                          </div>
                        </div>

                        {/* Pending indicator for open messages */}
                        {!isAnswered && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.75rem 1rem',
                            background: 'rgba(245,158,11,0.08)',
                            borderRadius: '8px',
                            border: '1px solid rgba(245,158,11,0.25)',
                            color: '#F59E0B',
                            fontSize: '0.82rem',
                          }}>
                            <AlertCircle size={16} style={{ flexShrink: 0 }} />
                            <span>استفسارك قيد المتابعة من مسؤولي المنصة، وسيصلك إشعار وتظهر الإجابة في الرسائل الواردة فور اعتماد الرد.</span>
                          </div>
                        )}
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
