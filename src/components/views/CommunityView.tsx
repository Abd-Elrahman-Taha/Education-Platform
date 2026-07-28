import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, Share2, Download, Plus, Search, Tag, CheckCircle2, User, Send } from 'lucide-react';
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

  const [posts, setPosts] = useState<CommunityPost[]>([
    {
      id: 'p1',
      authorName: 'عمر خالد',
      authorRole: 'طالب ثانوي - القاهرة',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
      timeAgo: 'منذ ساعتين',
      subject: 'الفيزياء',
      title: 'استفسار عن اتجاه التيار المستحث في حلقة معدنية عند تقريب مغناطيس؟',
      content: 'سلام عليكم يا شباب، في سؤال الصفحة 42 رقم 18 في بوكليت الفيزياء: ليه اتجاه التيار المستحث في الحلقة المعدنية بيكون عكس عقارب الساعة لما بنقرب القطب الشمالي؟ هل ده بسبب قاعدة لينز مباشرة؟',
      upvotes: 24,
      repliesCount: 8,
      isSolved: true,
    },
    {
      id: 'p2',
      authorName: 'نورهان علي',
      authorRole: 'طالبة ثانوي - الإسكندرية',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
      timeAgo: 'منذ 5 ساعات',
      subject: 'الرياضيات',
      title: 'طريقة سرعة لإيجاد نقط الانقلاب في الدوال الكسرية؟',
      content: 'هل فيه طريقة سريعة للتحقق من خط الأعداد في المشتقة الثانية للتفاضل بدون التعويض بأرقام كثيرة؟ شفت المستر بيعملها في الشرح بس محتاجة تأكيد.',
      upvotes: 18,
      repliesCount: 5,
      isSolved: false,
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
      authorName: 'أحمد محمد (أنت)',
      authorRole: 'طالب ثانوي',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      timeAgo: 'الآن',
      subject: 'الفيزياء',
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
    showToast("تم نشر سؤالك في مجتمع الطلاب بنجاح! وسيرد عليك الأسستنت قريباً", "success");
  };

  return (
    <div className="container fade-in-up" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem' }}>
      {/* Top Banner */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <MessageSquare size={26} color="var(--primary-light)" /> مجتمع المناقشات والأسئلة العلمية
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>اطرح أسئلتك وشارك إجاباتك مع زملائك ومعلمي المنصة المعتمدين</p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowNewQuestionForm(!showNewQuestionForm)}>
          <Plus size={18} /> {showNewQuestionForm ? 'إغلاق النموذج' : 'إضافة سؤال جديد'}
        </button>
      </div>

      {/* New Question Form */}
      {showNewQuestionForm && (
        <form onSubmit={handleAddQuestion} className="glass-card" style={{ padding: '1.75rem', marginBottom: '2rem', border: '1px solid var(--primary-light)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>نشر سؤال جديد للمجتمع العلمي</h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>عنوان السؤال</label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="اكتب عنواناً واضحاً ومختصراً..."
              style={{ width: '100%' }}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>تفاصيل السؤال وشرح النقطة المبهمة</label>
            <textarea
              required
              rows={4}
              className="input-field"
              placeholder="وضح بالتفصيل رقم الصفحة والمثال أو النقطة الصعبة..."
              style={{ width: '100%' }}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            <Send size={16} /> نشر السؤال الان
          </button>
        </form>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button className={`filter-btn ${activeSubject === 'all' ? 'active' : ''}`} onClick={() => setActiveSubject('all')}>جميع المواد</button>
        <button className={`filter-btn ${activeSubject === 'الفيزياء' ? 'active' : ''}`} onClick={() => setActiveSubject('الفيزياء')}>الفيزياء</button>
        <button className={`filter-btn ${activeSubject === 'الرياضيات' ? 'active' : ''}`} onClick={() => setActiveSubject('الرياضيات')}>الرياضيات</button>
      </div>

      {/* Feed List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {posts
          .filter(p => activeSubject === 'all' || p.subject === activeSubject)
          .map(post => (
            <div key={post.id} className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <img src={post.authorAvatar} style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }} alt={post.authorName} />
                  <div>
                    <strong style={{ fontSize: '0.95rem', display: 'block' }}>{post.authorName}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{post.authorRole} • {post.timeAgo}</span>
                  </div>
                </div>

                <span className="gradient-badge" style={{ fontSize: '0.75rem' }}>{post.subject}</span>
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>{post.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.7', marginBottom: '1.5rem' }}>{post.content}</p>

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
                  <button className="icon-btn" onClick={() => showToast("جاري تحضير وتنزيل السؤال والإجابة كملف PDF...")} title="تصدير كملف PDF">
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
