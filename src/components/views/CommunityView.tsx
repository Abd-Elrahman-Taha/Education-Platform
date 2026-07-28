import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, Share2, Download, Plus, Search, Tag, CheckCircle2, User, Send, Sigma, Box, BookOpen, Layers } from 'lucide-react';
import { CommunityPost } from '../../types';
import { useToast } from '../../context/ToastContext';

interface CommunityViewProps {
  onOpenShareModal: () => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({ onOpenShareModal }) => {
  const { showToast } = useToast();
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

  const handleUpvote = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, upvotes: p.upvotes + 1 };
      }
      return p;
    }));
    showToast("تم إضافة تصويتك للإجابة بنجاح!");
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newPost: CommunityPost = {
      id: Date.now().toString(),
      authorName: 'أحمد طالب (أنت)',
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
    showToast("تم نشر سؤالك في مجتمع الرياضيات بنجاح! وسيرد عليك معلم المادة قريباً", "success");
  };

  const totalAll = posts.length;
  const totalCalc = posts.filter(p => p.subject === 'التفاضل والتكامل').length;
  const totalGeom = posts.filter(p => p.subject === 'الهندسة الفراغية').length;

  return (
    <div className="container fade-in-up" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem' }}>
      {/* Top Banner */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-bright)' }}>
            <MessageSquare size={26} color="var(--primary-light)" /> مجتمع أسئلة التفاضل والهندسة الفراغية
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>منتدى المناقشات المخصص حصرياً لمادتي التفاضل والتكامل والهندسة الفراغية</p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowNewQuestionForm(!showNewQuestionForm)}>
          <Plus size={18} /> {showNewQuestionForm ? 'إغلاق النموذج' : 'إضافة سؤال جديد'}
        </button>
      </div>

      {/* New Question Form */}
      {showNewQuestionForm && (
        <form onSubmit={handleAddQuestion} className="glass-card" style={{ padding: '1.75rem', marginBottom: '2rem', border: '1px solid var(--primary-light)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-bright)' }}>نشر سؤال رياضيات جديد</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>عنوان السؤال</label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="اكتب عنواناً واضحاً لمسألة التفاضل أو الهندسة الفراغية..."
                style={{ width: '100%' }}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>تخصص المسألة</label>
              <select
                className="input-field"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value as any)}
                style={{ width: '100%' }}
              >
                <option value="التفاضل والتكامل">التفاضل والتكامل (Calculus)</option>
                <option value="الهندسة الفراغية">الهندسة الفراغية (3D Geometry)</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>تفاصيل المسألة وملاحظات الحل</label>
            <textarea
              required
              rows={4}
              className="input-field"
              placeholder="اكتب تفاصيل المعطيات، أو الخطوة التي توقفت عندها أثناء الحل..."
              style={{ width: '100%' }}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            <Send size={16} /> نشر السؤال في مجتمع الرياضيات
          </button>
        </form>
      )}

      {/* Premium Designed Math Subject Filter Tabs */}
      <div className="math-filter-tabs">
        <button
          className={`math-tab-btn ${activeSubject === 'all' ? 'active' : ''}`}
          onClick={() => setActiveSubject('all')}
        >
          <Layers size={18} />
          <span>جميع مواضيع الرياضيات</span>
          <span className="math-tab-badge">{totalAll}</span>
        </button>

        <button
          className={`math-tab-btn ${activeSubject === 'التفاضل والتكامل' ? 'active' : ''}`}
          onClick={() => setActiveSubject('التفاضل والتكامل')}
        >
          <Sigma size={18} />
          <span>التفاضل والتكامل</span>
          <span className="math-tab-badge">{totalCalc}</span>
        </button>

        <button
          className={`math-tab-btn ${activeSubject === 'الهندسة الفراغية' ? 'active' : ''}`}
          onClick={() => setActiveSubject('الهندسة الفراغية')}
        >
          <Box size={18} />
          <span>الهندسة الفراغية</span>
          <span className="math-tab-badge">{totalGeom}</span>
        </button>
      </div>

      {/* Posts Feed List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {posts
          .filter(p => activeSubject === 'all' || p.subject === activeSubject)
          .map(post => (
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
                  <button className="icon-btn" onClick={onOpenShareModal} title="مشاركة السؤال">
                    <Share2 size={16} />
                  </button>
                  <button className="icon-btn" onClick={() => showToast("جاري تنزيل السؤال والإجابة كملف PDF...")} title="تصدير كملف PDF">
                    <Download size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
