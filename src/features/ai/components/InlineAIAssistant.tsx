import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '../api/aiApi';
import { Bot, Send, Trash2, Copy, RefreshCw, Sparkles, Check, Code, User } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

interface Props {
  lessonId: string;
  lessonTitle: string;
}

export const InlineAIAssistant: React.FC<Props> = ({ lessonId, lessonTitle }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: chatRes, isLoading } = useQuery({
    queryKey: ['aiChat', lessonId],
    queryFn: () => aiApi.getChatHistory(lessonId),
  });

  const sendMutation = useMutation({
    mutationFn: (text: string) => aiApi.sendMessage(lessonId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiChat', lessonId] });
    },
    onError: () => {
      showToast('حدث خطأ أثناء التواصل مع المعلم الذكي', 'danger');
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => aiApi.clearChat(lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiChat', lessonId] });
      showToast('تم مسح سريان المحادثة بنجاح', 'info');
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
    showToast('تم نسخ الإجابة إلى الحافظة', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegenerate = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user');
    if (lastUserMsg) {
      handleSend(lastUserMsg.text);
    } else {
      handleSend('أعد إجابة وتوضيح النقاط الرئيسية في هذا الدرس.');
    }
  };

  const suggestedQuestions = [
    'اشرح لي قاعدة السلسلة بأسلوب تبسيطي ومبسط',
    'ما هي الخطوات المتبعة لاشتقاق الدوال المركبة؟',
    'أعطني مثالاً تطبيقياً على مشتقات الدوال المثلثية',
    'ما الفارق الرئيسي بين dy/dx و Δy/Δx؟',
  ];

  return (
    <div className="glass-card" style={{ padding: '2rem', border: '1px solid rgba(8,145,178,0.3)', background: 'var(--bg-glass-card)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
            <Bot size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                Ask AI — المعلم الذكي التفاعلي
              </h3>
              <span className="gradient-badge" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                <Sparkles size={12} /> GPT-4o Math
              </span>
            </div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              مساعدك الشخصي لفهم نقاط {lessonTitle}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
            onClick={handleRegenerate}
            disabled={sendMutation.isPending}
            title="إعادة توليد الإجابة"
          >
            <RefreshCw size={14} className={sendMutation.isPending ? 'spin' : ''} /> إعادة التوليد
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', color: 'var(--danger)' }}
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending}
            title="مسح المحادثة"
          >
            <Trash2 size={14} /> مسح
          </button>
        </div>
      </div>

      {/* Suggested Questions Pill Row */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={sendMutation.isPending}
            style={{
              whiteSpace: 'nowrap',
              background: 'rgba(8,145,178,0.1)',
              border: '1px solid rgba(8,145,178,0.25)',
              borderRadius: '9999px',
              padding: '0.35rem 0.85rem',
              fontSize: '0.8rem',
              color: 'var(--primary-light)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            💡 {q}
          </button>
        ))}
      </div>

      {/* Messages Feed */}
      <div
        style={{
          maxHeight: '380px',
          overflowY: 'auto',
          padding: '1rem',
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-glass)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            جاري استرجاع المحادثة...
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: msg.sender === 'user' ? 'var(--primary)' : 'linear-gradient(135deg, var(--secondary), var(--primary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFF',
                  flexShrink: 0,
                }}
              >
                {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>

              <div
                style={{
                  background: msg.sender === 'user' ? 'rgba(8,145,178,0.25)' : 'var(--bg-glass-card)',
                  border: `1px solid ${msg.sender === 'user' ? 'rgba(8,145,178,0.4)' : 'var(--border-glass)'}`,
                  borderRadius: '12px',
                  padding: '0.85rem 1.1rem',
                  position: 'relative',
                }}
              >
                <div style={{ fontSize: '0.92rem', color: 'var(--text-bright)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {msg.text}
                </div>

                {/* Code Block rendering */}
                {msg.codeSnippet && (
                  <div style={{ marginTop: '0.75rem', background: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.85rem', color: '#38BDF8', direction: 'ltr', textAlign: 'left', whiteSpace: 'pre-wrap' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1E293B', paddingBottom: '0.35rem', marginBottom: '0.5rem', fontSize: '0.75rem', color: '#64748B' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Code size={12} /> Math Proof / Code</span>
                      <span>LaTeX / Calculus</span>
                    </div>
                    {msg.codeSnippet}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.35rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'bot' && (
                    <button
                      onClick={() => handleCopy(msg.text + (msg.codeSnippet ? '\n' + msg.codeSnippet : ''), msg.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      {copiedId === msg.id ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                      {copiedId === msg.id ? 'تم النسخ' : 'نسخ'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Typing animation indicator */}
        {sendMutation.isPending && (
          <div style={{ display: 'flex', gap: '0.75rem', alignSelf: 'flex-start', maxWidth: '85%' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--secondary), var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
              <Bot size={16} />
            </div>
            <div style={{ background: 'var(--bg-glass-card)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '0.85rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>المعلم الذكي يكتب الإجابة...</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-light)', animation: 'pulse 1s infinite 0.1s' }}></span>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-light)', animation: 'pulse 1s infinite 0.3s' }}></span>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-light)', animation: 'pulse 1s infinite 0.5s' }}></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        style={{ display: 'flex', gap: '0.75rem' }}
      >
        <input
          type="text"
          className="input-field"
          placeholder="اكتب سؤالك للمعلم الذكي بخصوص هذا الدرس..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={sendMutation.isPending}
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={sendMutation.isPending || !inputText.trim()}
          style={{ padding: '0.75rem 1.5rem' }}
        >
          <Send size={18} /> إرسال
        </button>
      </form>
    </div>
  );
};
