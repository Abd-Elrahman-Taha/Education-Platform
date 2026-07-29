import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../api/messagesApi';
import { TeacherMessage } from '../../../types';
import { Inbox, MessageSquare, Send, CheckCircle, Clock, Filter, Paperclip, User, BookOpen, AlertCircle } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export const TeacherInboxView: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data: messagesRes, isLoading, refetch } = useQuery({
    queryKey: ['teacherInboxMessages'],
    queryFn: messagesApi.getTeacherMessages,
  });

  const replyMutation = useMutation({
    mutationFn: (data: { messageId: string; replyText: string }) =>
      messagesApi.replyTeacherMessage(data.messageId, data.replyText),
    onSuccess: () => {
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['teacherInboxMessages'] });
      queryClient.invalidateQueries({ queryKey: ['studentLessonMessages'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      showToast('تم إرسال الرد للطالب بنجاح وإشعاره في الحين!', 'success');
    },
    onError: () => {
      showToast('تعذر إرسال الرد، يرجى المحاولة لاحقاً', 'danger');
    },
  });

  const allMessages = messagesRes?.data || [];
  const filteredMessages = allMessages.filter(m => (filter === 'unread' ? !m.isRead : true));

  const activeMsg = allMessages.find(m => m.id === selectedMsgId) || filteredMessages[0] || null;

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMsg || !replyText.trim()) return;
    replyMutation.mutate({ messageId: activeMsg.id, replyText: replyText.trim() });
  };

  const unreadCount = allMessages.filter(m => !m.isRead).length;

  if (isLoading) {
    return (
      <div className="container fade-in-up" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '3rem', maxWidth: '500px', margin: '0 auto' }}>
          <div className="spinner" style={{ margin: '0 auto 1.5rem', width: '40px', height: '40px', border: '4px solid rgba(8,145,178,0.2)', borderTopColor: 'var(--primary-light)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-bright)' }}>جاري فتح صندوق رسائل المعلم...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="container fade-in-up" style={{ padding: '2.5rem 1.5rem 5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="gradient-badge">
              <Inbox size={14} /> Teacher Dashboard Inbox
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>استفسارات الطلاب المباشرة</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
            صندوق الوارد والرد التفاعلي على أسئلة الدروس
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            جميع الرسائل ({allMessages.length})
          </button>
          <button className={`filter-btn ${filter === 'unread' ? 'active' : ''}`} onClick={() => setFilter('unread')}>
            غير المقروءة ({unreadCount})
          </button>
        </div>
      </div>

      {allMessages.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Inbox size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-bright)' }}>صندوق الوارد فارغ حالياً</h3>
          <p style={{ color: 'var(--text-muted)' }}>لم يتم استلام أي أسئلة جديدة من الطلاب بعد.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '1.75rem' }}>
          {/* Conversation List Pane */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredMessages.map(msg => {
              const isSelected = activeMsg?.id === msg.id;
              return (
                <div
                  key={msg.id}
                  className="glass-card"
                  onClick={() => setSelectedMsgId(msg.id)}
                  style={{
                    padding: '1.1rem 1.25rem',
                    cursor: 'pointer',
                    borderColor: isSelected ? 'var(--primary-light)' : 'var(--border-glass)',
                    background: isSelected ? 'rgba(8,145,178,0.15)' : 'var(--bg-glass-card)',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {!msg.isRead && (
                    <span style={{ position: 'absolute', top: '12px', left: '12px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary-light)' }} />
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <img src={msg.studentAvatar} alt={msg.studentName} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-bright)', display: 'block' }}>
                        {msg.studentName}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <BookOpen size={12} /> {msg.lessonTitle}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {msg.text}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span><Clock size={12} style={{ display: 'inline', marginLeft: '3px' }} /> {msg.timestamp}</span>
                    {msg.reply ? (
                      <span style={{ color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle size={12} /> تم الرد
                      </span>
                    ) : (
                      <span style={{ color: '#F59E0B', fontWeight: 600 }}>بحاجة للرد</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Message & Reply Box Pane */}
          {activeMsg && (
            <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
              {/* Student Details Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <img src={activeMsg.studentAvatar} alt={activeMsg.studentName} style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--primary-light)' }} />
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                      {activeMsg.studentName}
                    </h3>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      الكود: #CODE-94021 • الصف الثالث الثانوي
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'left' }}>
                  <span className="gradient-badge" style={{ fontSize: '0.78rem' }}>
                    {activeMsg.lessonTitle}
                  </span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    وقت الرسالة: {activeMsg.timestamp}
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--primary-light)', fontWeight: 700, marginBottom: '0.5rem' }}>
                  نص سؤال الطالب:
                </h4>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-bright)', lineHeight: 1.6, margin: 0 }}>
                  {activeMsg.text}
                </p>

                {activeMsg.attachmentUrl && (
                  <div style={{ marginTop: '1rem', borderTop: '1px dashed var(--border-glass)', paddingTop: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                      المرفقات:
                    </span>
                    <img src={activeMsg.attachmentUrl} alt="Student Attachment" style={{ maxHeight: '180px', borderRadius: '8px', border: '1px solid var(--primary-light)' }} />
                  </div>
                )}
              </div>

              {/* Previous Reply if any */}
              {activeMsg.reply && (
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <strong style={{ fontSize: '0.88rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <CheckCircle size={16} /> الرد الذي تم إرساله سابقاً:
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activeMsg.replyTimestamp}</span>
                  </div>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-bright)', margin: 0, lineHeight: 1.6 }}>
                    {activeMsg.reply}
                  </p>
                </div>
              )}

              {/* Reply Form Box */}
              <form onSubmit={handleSendReply}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.5rem' }}>
                  كتابة الرد للمعلم:
                </h4>
                <textarea
                  className="input-field"
                  rows={4}
                  placeholder="اكتب ردك التعليمي للطالب هنا، وسيصله تنبيه فوري بالرد..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{ width: '100%', resize: 'vertical', marginBottom: '0.85rem' }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={replyMutation.isPending || !replyText.trim()}
                    style={{ padding: '0.65rem 1.75rem' }}
                  >
                    <Send size={16} /> إرسال الرد وإشعار الطالب
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
