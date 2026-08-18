import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '../api/aiApi';
import {
  Bot, Send, Trash2, Copy, RefreshCw, Sparkles, Check,
  User, LogIn, UserPlus, Brain, Zap, BookOpen, Calculator
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

interface Props {
  onOpenAuthModal: () => void;
}

const GENERAL_LESSON_ID = 'general';
const GENERAL_LESSON_TITLE = 'مساعد الذكاء الاصطناعي — التفاضل والهندسة الفراغية';

const QUICK_PROMPTS = [
  { label: 'شرح قاعدة السلسلة', text: 'اشرح لي قاعدة السلسلة (Chain Rule) في التفاضل مع مثال عملي' },
  { label: 'مشتقة دالة مثلثية', text: 'كيف أجد مشتقة دالة sin²(3x)؟ أوضح الخطوات' },
  { label: 'إيجاد نقاط الانقلاب', text: 'كيف أجد نقاط الانقلاب (Inflection Points) لدالة رياضية؟' },
  { label: 'الهندسة الفراغية: زوايا', text: 'كيف أحسب زاوية بين متجهين في الفراغ ثلاثي الأبعاد؟' },
];

export const StandaloneAIView: React.FC<Props> = ({ onOpenAuthModal }) => {
  const { showToast } = useToast();
  const { isAuthenticated, currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: chatRes, isLoading } = useQuery({
    queryKey: ['aiChat', GENERAL_LESSON_ID],
    queryFn: () => aiApi.getChatHistory(GENERAL_LESSON_ID),
    enabled: isAuthenticated,
  });

  const sendMutation = useMutation({
    mutationFn: (text: string) => aiApi.sendMessage(GENERAL_LESSON_ID, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiChat', GENERAL_LESSON_ID] });
    },
    onError: () => {
      showToast('حدث خطأ أثناء التواصل مع المعلم الذكي', 'danger');
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => aiApi.clearChat(GENERAL_LESSON_ID),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiChat', GENERAL_LESSON_ID] });
      showToast('تم مسح المحادثة بنجاح', 'info');
    },
  });

  const messages = chatRes?.data || [];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText.trim();
    if (!text) return;
    setInputText('');
    sendMutation.mutate(text);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── GUEST GATE ─────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="container fade-in-up" style={{ padding: '3rem 1.5rem 6rem' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 3rem' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '24px', margin: '0 auto 1.5rem',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 32px var(--primary-glow)',
          }}>
            <Brain size={38} color="#fff" />
          </div>
          <span className="gradient-badge" style={{ marginBottom: '0.75rem' }}>
            <Sparkles size={14} /> Syntax AI — المعلم الذكي
          </span>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-bright)', margin: '0.5rem 0 0.75rem' }}>
            مساعد الذكاء الاصطناعي للرياضيات
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.7, maxWidth: '560px', margin: '0 auto' }}>
            اطرح أي سؤال في التفاضل والتكامل أو الهندسة الفراغية وسيشرح لك المعلم الذكي الحل خطوة بخطوة مع القوانين والتوضيحات.
          </p>
        </div>

        {/* Feature Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', maxWidth: '900px', margin: '0 auto 3rem' }}>
          {[
            { icon: Calculator, title: 'حل مسائل التفاضل', desc: 'مشتقات، تكامل، قاعدة السلسلة، نقاط الانقلاب' },
            { icon: BookOpen, title: 'الهندسة الفراغية', desc: 'متجهات، زوايا، مستويات، أجسام ثلاثية الأبعاد' },
            { icon: Zap, title: 'شرح فوري خطوة بخطوة', desc: 'لا انتظار — إجابات واضحة ومفصلة على الفور' },
            { icon: Brain, title: 'يتذكر سياق المحادثة', desc: 'يُكمل معك من حيث توقفت في كل جلسة' },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px', margin: '0 auto 1rem',
                  background: 'rgba(8,145,178,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={22} color="var(--primary-light)" />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.4rem' }}>{f.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Auth CTA */}
        <div className="glass-card" style={{
          maxWidth: '520px', margin: '0 auto', padding: '2.5rem',
          textAlign: 'center', background: 'var(--banner-gradient)',
          border: '1px solid rgba(8,145,178,0.25)',
        }}>
          <Bot size={36} color="var(--primary-light)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.5rem' }}>
            سجّل دخولك لاستخدام المعلم الذكي
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
            أنشئ حساباً مجانياً أو سجّل دخولك للوصول إلى المساعد الذكي وجميع ميزات المنصة التعليمية.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={onOpenAuthModal} style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}>
              <LogIn size={18} /> تسجيل الدخول
            </button>
            <button className="btn btn-secondary" onClick={onOpenAuthModal} style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}>
              <UserPlus size={18} /> إنشاء حساب مجاني
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── AUTHENTICATED: FULL AI CHAT ─────────────────────────────
  return (
    <div className="container fade-in-up" style={{ padding: '2rem 1.5rem 5rem' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '1.5rem 2rem', marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px var(--primary-glow)',
          }}>
            <Bot size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
              Syntax AI — المعلم الذكي
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              متخصص في التفاضل والتكامل والهندسة الفراغية
            </p>
          </div>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => clearMutation.mutate()}
          disabled={clearMutation.isPending || messages.length === 0}
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          <Trash2 size={15} /> مسح المحادثة
        </button>
      </div>

      {/* Quick Prompts */}
      {messages.length === 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            🚀 ابدأ بسؤال سريع:
          </p>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            {QUICK_PROMPTS.map((qp) => (
              <button
                key={qp.label}
                className="filter-btn"
                style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}
                onClick={() => handleSend(qp.text)}
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.25rem', minHeight: '400px', maxHeight: '520px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-muted)' }}>
            <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginLeft: '0.5rem' }} />
            جاري تحميل المحادثة...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '250px', color: 'var(--text-muted)', textAlign: 'center', gap: '0.75rem' }}>
            <Sparkles size={32} color="var(--primary-light)" />
            <p style={{ margin: 0, fontSize: '0.95rem' }}>مرحباً {currentUser?.name?.split(' ')[0]}! اطرح سؤالك في الرياضيات وسأشرح لك الحل خطوة بخطوة.</p>
          </div>
        ) : (
          messages.map((msg: any) => {
            const isBot = msg.sender === 'bot';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: isBot ? 'row' : 'row-reverse',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{
                  width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                  background: isBot ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'rgba(8,145,178,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isBot ? <Bot size={16} color="#fff" /> : <User size={16} color="var(--primary-light)" />}
                </div>
                <div style={{ maxWidth: '80%' }}>
                  <div style={{
                    background: isBot ? 'var(--bg-subtle)' : 'rgba(8,145,178,0.15)',
                    border: `1px solid ${isBot ? 'var(--border-glass)' : 'rgba(8,145,178,0.3)'}`,
                    borderRadius: isBot ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                    padding: '0.85rem 1.1rem',
                    fontSize: '0.9rem', color: 'var(--text-bright)', lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {msg.text}
                    {msg.codeSnippet && (
                      <div style={{ marginTop: '0.75rem', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', padding: '0.85rem 1rem', fontFamily: 'monospace', fontSize: '0.82rem', color: '#22D3EE', overflowX: 'auto' }}>
                        {msg.codeSnippet}
                      </div>
                    )}
                  </div>
                  {isBot && (
                    <button
                      onClick={() => handleCopy(msg.text, msg.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.35rem', padding: '0 0.25rem' }}
                    >
                      {copiedId === msg.id ? <><Check size={12} color="#10B981" /> تم النسخ</> : <><Copy size={12} /> نسخ الرد</>}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        {sendMutation.isPending && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={16} color="#fff" />
            </div>
            <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-glass)', borderRadius: '4px 14px 14px 14px', padding: '0.85rem 1.1rem' }}>
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                {[0, 0.2, 0.4].map((d, i) => (
                  <span key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--primary-light)', animation: `pulse 1s ${d}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
        <textarea
          className="input-field"
          rows={2}
          placeholder="اكتب سؤالك في التفاضل أو الهندسة الفراغية..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          style={{ flex: 1, resize: 'none', fontSize: '0.92rem', lineHeight: 1.5 }}
        />
        <button
          className="btn btn-primary"
          onClick={() => handleSend()}
          disabled={!inputText.trim() || sendMutation.isPending}
          style={{ padding: '0.75rem 1.25rem', flexShrink: 0 }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
