import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../api/messagesApi';
import { MessageSquare, Send, Paperclip, X, CheckCircle, Image as ImageIcon, User } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

interface Props {
  lessonId: string;
  lessonTitle: string;
}

export const AskTeacherSection: React.FC<Props> = ({ lessonId, lessonTitle }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);

  const { data: messagesRes } = useQuery({
    queryKey: ['studentLessonMessages', lessonId],
    queryFn: () => messagesApi.getStudentMessages(lessonId),
  });

  const sendMutation = useMutation({
    mutationFn: (data: { text: string; attachmentUrl?: string }) =>
      messagesApi.sendStudentMessage(lessonId, data.text, data.attachmentUrl),
    onSuccess: () => {
      setText('');
      setAttachment(null);
      queryClient.invalidateQueries({ queryKey: ['studentLessonMessages', lessonId] });
      queryClient.invalidateQueries({ queryKey: ['teacherInboxMessages'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      showToast('تم إرسال استفسارك للمعلم بنجاح! ووصلت الإشارة لصندوق وارد المعلم.', 'success');
    },
    onError: () => {
      showToast('تعذر إرسال السؤال، يرجى المحاولة مرة أخرى', 'danger');
    },
  });

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment(reader.result as string);
        showToast('تم إرفاق صورة السؤال بنجاح', 'info');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMutation.mutate({ text: text.trim(), attachmentUrl: attachment || undefined });
  };

  const messages = messagesRes?.data || [];

  return (
    <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid var(--border-glass)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(8,145,178,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-light)' }}>
          <MessageSquare size={22} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
            Ask Your Teacher — اسأل معلمك المباشر
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            استفسر من أ. د. محمد الشريف مباشرة وسيصلك الرد التفاعلي في هذا القسم فور رده.
          </span>
        </div>
      </div>

      {/* Write Question Form */}
      <form onSubmit={handleSend} style={{ marginBottom: '1.75rem' }}>
        <textarea
          className="input-field"
          rows={3}
          placeholder={`اكتب سؤالك التفصيلي للمعلم حول "${lessonTitle}"...`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ width: '100%', resize: 'vertical', marginBottom: '0.75rem', fontSize: '0.92rem' }}
        />

        {/* Attachment preview */}
        {attachment && (
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '0.75rem' }}>
            <img src={attachment} alt="Attachment Preview" style={{ maxHeight: '120px', borderRadius: '8px', border: '1px solid var(--primary-light)' }} />
            <button
              type="button"
              onClick={() => setAttachment(null)}
              style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--danger)', color: '#FFF', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--primary-light)', background: 'rgba(8,145,178,0.12)', padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(8,145,178,0.25)' }}>
            <Paperclip size={16} />
            إرفاق صورة مسألة / ورقة
            <input type="file" accept="image/*" onChange={handleFileAttach} style={{ display: 'none' }} />
          </label>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={sendMutation.isPending || !text.trim()}
            style={{ padding: '0.6rem 1.5rem' }}
          >
            <Send size={16} /> إرسال السؤال للمعلم
          </button>
        </div>
      </form>

      {/* Message History & Replies for this lesson */}
      {messages.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '1rem' }}>
            سجل الاستفسارات السابقة في هذا الدرس ({messages.length})
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map(msg => (
              <div key={msg.id} className="glass-card" style={{ padding: '1rem 1.25rem', background: 'var(--bg-subtle)', border: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <User size={14} color="var(--primary-light)" /> {msg.studentName}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{msg.timestamp}</span>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  {msg.text}
                </p>

                {msg.attachmentUrl && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <img src={msg.attachmentUrl} alt="Attachment" style={{ maxHeight: '100px', borderRadius: '6px' }} />
                  </div>
                )}

                {/* Teacher Reply if exists */}
                {msg.reply ? (
                  <div style={{ marginTop: '0.85rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '8px', padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <CheckCircle size={14} /> رد المعلم (أ. د. محمد الشريف)
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{msg.replyTimestamp}</span>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-bright)', margin: 0, lineHeight: 1.5 }}>
                      {msg.reply}
                    </p>
                  </div>
                ) : (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#F59E0B', fontStyle: 'italic' }}>
                    ⏳ قيد المراجعة بواسطة المعلم...
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
