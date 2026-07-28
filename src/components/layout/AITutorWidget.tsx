import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, User, RefreshCw } from 'lucide-react';
import { AIMessage } from '../../types';

export const AITutorWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'أهلاً بك! أنا مساعد Syntax AI المتخصص في التفاضل والتكامل والهندسة الفراغية. كيف يمكنني مساعدتك في حل مسألة أو شرح قاعدة اليوم؟',
      timestamp: 'الآن',
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOpenAI = () => setIsOpen(true);
    window.addEventListener('openAITutor', handleOpenAI);
    return () => window.removeEventListener('openAITutor', handleOpenAI);
  }, []);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMsg: AIMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // Simulated RAG model response for Calculus & 3D Geometry
    setTimeout(() => {
      const responses = [
        "بناءً على محتوى المحاضرة في التفاضل والتكامل، فإن مشتقة الدالة e^(f(x)) هي f'(x) · e^(f(x)).",
        "سؤال ممتاز في الهندسة الفراغية! لإيجاد زاوية اتجاه المتجه AB، نقسم المركبات (x, y, z) على طول المتجه |AB|.",
        "تم تحليل مسألتك بواسطة نموذج Syntax Math RAG: نقطة الانقلاب تحدث عندما تتغير إشارة المشتقة الثانية f''(x) وتكون f''(x) = 0.",
        "أهلاً يا بطل! يمكنك استخدام قانون حجم الجسم الناشئ عن الدوران: V = π ∫ [f(x)]² dx لتقييم التكامل المحدد.",
      ];
      const botResponseText = responses[Math.floor(Math.random() * responses.length)];

      const botMsg: AIMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botResponseText,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, botMsg]);
    }, 600);
  };

  return (
    <div className="ai-widget-wrapper">
      {/* Floating Trigger Button */}
      <button
        className="ai-trigger-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="مساعد الرياضيات الذكي 24/7"
      >
        {isOpen ? <X size={26} /> : <Bot size={28} />}
      </button>

      {/* Chat Window */}
      <div className={`ai-chat-window ${isOpen ? 'active' : ''}`}>
        <div className="ai-chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={20} color="var(--accent-light)" />
            <div>
              <strong style={{ fontSize: '0.95rem', display: 'block' }}>مساعد Syntax Math AI</strong>
              <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>متصل الآن • التفاضل والهندسة الفراغية</span>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', color: '#FFF' }}>
            <X size={18} />
          </button>
        </div>

        <div className="ai-chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
              <div style={{ fontSize: '0.75rem', color: msg.sender === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                {msg.sender === 'bot' ? <Bot size={12} /> : <User size={12} />}
                <span>{msg.sender === 'bot' ? 'Syntax AI' : 'أنت'}</span>
              </div>
              <div>{msg.text}</div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="ai-chat-input-area">
          <input
            type="text"
            placeholder="اسأل المعلم الذكي عن مسألة تفاضل أو فراغية..."
            className="input-field"
            style={{ fontSize: '0.85rem' }}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="btn btn-primary" style={{ padding: '0.6rem 0.9rem' }} onClick={handleSend}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
