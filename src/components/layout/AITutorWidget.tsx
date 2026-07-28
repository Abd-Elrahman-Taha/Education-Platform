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
      text: 'أهلاً بك! أنا مساعد Syntax AI للفيزياء والرياضيات. كيف يمكنني مساعدتك في درس اليوم؟',
      timestamp: 'الآن',
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

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

    // Simulated RAG model response
    setTimeout(() => {
      const responses = [
        "بناءً على محتوى المحاضرة الثانية في الفيزياء الحديثة، فإن معادلة أينشتاين للظاهرة الكهرودوئية تعتمد على تردد الضوء الساقط ودالة الشغل للمعدن (E = hν - Ww).",
        "سؤال ممتاز! يمكنك مراجعة قانون أوم للدائرة المغلقة في الصفحة 14 من الكتاب، أو يمكنني توليد 3 أسئلة سريعة لك للتدريب عليها الآن.",
        "تم تحليل سؤالك بواسطة نموذج Syntax AI RAG: التغير في الفيض المغناطيسي يولد قوة دافعة كهربية مستحثة حسب قانون فاراداي (emf = -N ΔΦm/Δt).",
        "أهلاً يا بطل! تم تحديث تقريرك وإخطار ولي الأمر بنجاحك في امتحان الدرس السابق بنسبة 95%.",
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
        title="المساعد الذكي 24/7"
      >
        {isOpen ? <X size={26} /> : <Bot size={28} />}
      </button>

      {/* Chat Window */}
      <div className={`ai-chat-window ${isOpen ? 'active' : ''}`}>
        <div className="ai-chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={20} color="var(--accent-light)" />
            <div>
              <strong style={{ fontSize: '0.95rem', display: 'block' }}>مساعد Syntax AI الذكي</strong>
              <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>متصل الان • RAG Engine v3</span>
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
            placeholder="اسأل المعلم الذكي عن أي قاعدة أو قانون..."
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
