import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notificationsApi';
import { useAuth } from '../../../context/AuthContext';
import { Bell, CheckCircle2, MessageSquare, Unlock, Check, Sparkles } from 'lucide-react';
import { AppView } from '../../../types';

interface Props {
  onNavigateView: (view: AppView, lessonId?: string) => void;
}

export const NotificationBell: React.FC<Props> = ({ onNavigateView }) => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const userId = currentUser?.id || 'u_student_demo';

  const { data: notificationsRes } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => notificationsApi.getNotifications(userId),
    refetchInterval: 5000, // Real-time notification polling simulation
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });

  const notifications = notificationsRes?.data || [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = (notif: any) => {
    if (!notif.isRead) {
      markReadMutation.mutate(notif.id);
    }
    setIsOpen(false);

    if (currentUser?.role === 'teacher') {
      onNavigateView('view-teacher-inbox');
    } else if (notif.link) {
      onNavigateView('view-drm-player', notif.link);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="icon-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="الإشعارات والتنبيهات"
        style={{ position: 'relative' }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              background: 'var(--danger)',
              color: '#FFF',
              fontSize: '0.65rem',
              fontWeight: 800,
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--bg-surface)',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown-panel fade-in-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
            <strong style={{ fontSize: '0.95rem', color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Bell size={16} color="var(--primary-light)" /> الإشعارات والتنبيهات
            </strong>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                style={{ background: 'none', border: 'none', color: 'var(--primary-light)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
              >
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              لا توجد إشعارات جديدة حالياً
            </div>
          ) : (
            <div className="notification-list">
              {notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`notification-item ${!n.isRead ? 'unread' : ''}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {n.type === 'teacher_reply' && <MessageSquare size={13} color="#10B981" />}
                      {n.type === 'lesson_unlock' && <Unlock size={13} color="#F59E0B" />}
                      {n.type === 'student_question' && <MessageSquare size={13} color="var(--primary-light)" />}
                      {n.title}
                    </strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{n.timestamp}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                    {n.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
