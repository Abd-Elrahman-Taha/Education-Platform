import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../api/messagesApi';
import { TeacherMessage } from '../../../types';
import {
  Inbox, MessageSquare, Send, CheckCircle, Clock, Filter, Paperclip,
  User, BookOpen, AlertCircle, Sparkles, Check, ChevronRight, Mail,
  MailOpen
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export const TeacherInboxView: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data: messagesRes, isLoading } = useQuery({
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
  const unreadMessages = allMessages.filter(m => !m.isRead);
  const filteredMessages = filter === 'unread' ? unreadMessages : allMessages;

  const activeMsg = allMessages.find(m => m.id === selectedMsgId) || filteredMessages[0] || null;

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMsg || !replyText.trim()) return;
    replyMutation.mutate({ messageId: activeMsg.id, replyText: replyText.trim() });
  };

  const unreadCount = unreadMessages.length;

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="gradient-badge">
              <Inbox size={14} /> Teacher Dashboard Inbox
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>استفسارات وأسئلة الطلاب</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
            صندوق الوارد والرد التفاعلي على أسئلة الدروس
          </h1>
        </div>

        {/* Filter Switcher Pills */}
        <div className="module-switcher" style={{ background: 'var(--bg-subtle)', padding: '0.3rem' }}>
          <button
            className={`module-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Mail size={14} />
            <span>جميع الرسائل ({allMessages.length})</span>
          </button>
          <button
            className={`module-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <MailOpen size={14} />
            <span>غير المقروءة ({unreadCount})</span>
          </button>
        </div>
      </div>

      {allMessages.length === 0 ? (
        <div className="glass-card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <Inbox size={52} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-bright)' }}>صندوق الوارد فارغ حالياً</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '450px', margin: '0.5rem auto 0' }}>
            لم يتم استلام أي أسئلة أو استفسارات جديدة من الطلاب بعد.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>
          {/* Conversation List Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                {filter === 'unread' ? `الرسائل غير المقروءة (${filteredMessages.length})` : `إجمالي الرسائل (${filteredMessages.length})`}
              </span>
              {unreadCount > 0 && filter === 'all' && (
                <span className="gradient-badge" style={{ fontSize: '0.72rem', padding: '0.15rem 0.55rem' }}>
                  {unreadCount} رسالة غير مقروءة
                </span>
              )}
            </div>

            {filteredMessages.length === 0 ? (
              <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
                <CheckCircle size={36} color="#10B981" style={{ margin: '0 auto 0.75rem' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-bright)', margin: 0 }}>
                  رائع! تم الرد على كافة الرسائل
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  لا توجد رسائل غير مقروءة حالياً.
                </p>
              </div>
            ) : (
              filteredMessages.map(msg => {
                const isSelected = activeMsg?.id === msg.id;
                return (
                  <div
                    key={msg.id}
                    className="glass-card"
                    onClick={() => setSelectedMsgId(msg.id)}
                    style={{
                      padding: '1.2rem 1.35rem',
                      cursor: 'pointer',
                      border: isSelected
                        ? '2px solid var(--primary-light)'
                        : !msg.isRead
                        ? '1px solid rgba(8,145,178,0.45)'
                        : '1px solid var(--border-glass)',
                      background: isSelected
                        ? 'rgba(8,145,178,0.14)'
                        : !msg.isRead
                        ? 'rgba(8,145,178,0.06)'
                        : 'var(--bg-glass-card)',
                      position: 'relative',
                      transition: 'all var(--transition-fast)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    {/* Unread indicator */}
                    {!msg.isRead && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '14px',
                          left: '14px',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: 'var(--primary-light)',
                          boxShadow: '0 0 8px var(--primary-glow)',
                        }}
                      />
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <img
                        src={msg.studentAvatar}
                        alt={msg.studentName}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-glass)' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <strong style={{ fontSize: '0.92rem', color: 'var(--text-bright)' }}>
                            {msg.studentName}
                          </strong>
                          {!msg.isRead && (
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--primary-light)', background: 'rgba(8,145,178,0.15)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                              جديد
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                          <BookOpen size={12} color="var(--primary-light)" /> {msg.lessonTitle}
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: '0.5rem 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                      {msg.text}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.65rem', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-glass)', paddingTop: '0.5rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} /> {msg.timestamp}
                      </span>
                      {msg.reply ? (
                        <span style={{ color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle size={13} /> تم الرد
                        </span>
                      ) : (
                        <span style={{ color: '#F59E0B', fontWeight: 700, background: 'rgba(245,158,11,0.12)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                          بحاجة للرد
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Active Message & Reply Box Column */}
          {activeMsg && (
            <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: 'fit-content', borderRadius: 'var(--radius-lg)' }}>
              {/* Student Details Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1.25rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <img
                    src={activeMsg.studentAvatar}
                    alt={activeMsg.studentName}
                    style={{ width: '50px', height: '50px', borderRadius: '50%', border: '2px solid var(--primary-light)', objectFit: 'cover' }}
                  />
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
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
                    تاريخ الإرسال: {activeMsg.timestamp}
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '1.35rem', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--primary-light)', fontWeight: 800, marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MessageSquare size={15} /> نص سؤال الطالب:
                </h4>
                <p style={{ fontSize: '0.96rem', color: 'var(--text-bright)', lineHeight: 1.7, margin: 0 }}>
                  {activeMsg.text}
                </p>

                {activeMsg.attachmentUrl && (
                  <div style={{ marginTop: '1.25rem', borderTop: '1px dashed var(--border-glass)', paddingTop: '0.85rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem', fontWeight: 700 }}>
                      المرفقات وصور المسألة:
                    </span>
                    <img
                      src={activeMsg.attachmentUrl}
                      alt="Student Attachment"
                      style={{ maxHeight: '200px', borderRadius: '8px', border: '1px solid var(--primary-light)' }}
                    />
                  </div>
                )}
              </div>

              {/* Previous Reply if any */}
              {activeMsg.reply && (
                <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
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
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.5rem' }}>
                  كتابة الرد التعليمي للطالب:
                </h4>
                <textarea
                  className="input-field"
                  rows={4}
                  placeholder="اكتب ردك وتوضيح خطوات الحل للطالب هنا، وسيصله تنبيه فوري بالرد على حسابه..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{ width: '100%', resize: 'vertical', marginBottom: '1rem', fontSize: '0.9rem', lineHeight: 1.5 }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={replyMutation.isPending || !replyText.trim()}
                    style={{ padding: '0.75rem 2rem', fontSize: '0.92rem', fontWeight: 800 }}
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
