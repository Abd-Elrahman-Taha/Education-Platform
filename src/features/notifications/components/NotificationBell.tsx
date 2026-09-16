import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Bell, Check, MessageSquare, Mail, MailOpen, Inbox } from 'lucide-react';
import { AppView } from '../../../types';
import { inquiriesApi } from '../../../api/inquiries.api';
import { Inquiry } from '../../../types/api.types';

interface Props {
  onNavigateView: (view: AppView, lessonId?: string) => void;
}

export const NotificationBell: React.FC<Props> = ({ onNavigateView }) => {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'superadmin' ||
    (currentUser as any)?.Role === 'Admin' ||
    (currentUser as any)?.Role === 'SuperAdmin';

  // ── State ────────────────────────────────────────────────────
  // For students: list of my inquiries; track answered ones as "notifications"
  const [myInquiries, setMyInquiries] = useState<Inquiry[]>([]);
  // For admins: list of open inquiries
  const [adminInquiries, setAdminInquiries] = useState<Inquiry[]>([]);
  const [openCount, setOpenCount] = useState(0);
  // Ids the student has already "seen as answered" (persisted in sessionStorage)
  const [seenAnsweredIds, setSeenAnsweredIds] = useState<Set<string>>(() => {
    try {
      const raw = sessionStorage.getItem('seen_answered_inquiries');
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  });

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Poll every 30 seconds
  const poll = async () => {
    if (!currentUser) return;
    try {
      if (isAdmin) {
        const { inquiries } = await inquiriesApi.getAllInquiries({ Status: 'Open', limit: 50 });
        setAdminInquiries(inquiries);
        setOpenCount(inquiries.length);
      } else {
        const { inquiries } = await inquiriesApi.getMyInquiries({ limit: 50 });
        setMyInquiries(inquiries);
      }
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (!currentUser) return;
    poll();
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, [currentUser?.id, isAdmin]);

  // ── Derived "notifications" ──────────────────────────────────
  const newlyAnswered = useMemo(() =>
    myInquiries.filter(i => i.Status === 'Answered' && !seenAnsweredIds.has(i._id)),
    [myInquiries, seenAnsweredIds]
  );

  const unreadCount = isAdmin ? openCount : newlyAnswered.length;

  const markAllSeen = () => {
    if (!isAdmin) {
      const newSeen = new Set([...seenAnsweredIds, ...newlyAnswered.map(i => i._id)]);
      setSeenAnsweredIds(newSeen);
      try { sessionStorage.setItem('seen_answered_inquiries', JSON.stringify([...newSeen])); } catch {}
    }
  };

  const handleBellClick = () => {
    setIsOpen(prev => !prev);
    poll();
  };

  const handleStudentInquiryClick = (inquiry: Inquiry) => {
    // Mark this one as seen
    const newSeen = new Set([...seenAnsweredIds, inquiry._id]);
    setSeenAnsweredIds(newSeen);
    try {
      sessionStorage.setItem('seen_answered_inquiries', JSON.stringify([...newSeen]));
      localStorage.setItem('community_active_tab', 'inquiries');
      localStorage.setItem('community_inquiries_filter', 'incoming');
      sessionStorage.setItem('community_selected_inquiry_id', inquiry._id);
    } catch {}
    setIsOpen(false);
    onNavigateView('view-community');
  };

  const handleAdminInquiryClick = (inquiry: Inquiry) => {
    setIsOpen(false);
    try {
      localStorage.setItem('admin_active_tab', 'inquiries');
      sessionStorage.setItem('admin_selected_inquiry_id', inquiry._id);
    } catch {}
    onNavigateView('view-admin');
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
  };

  if (!currentUser) return null;

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        className="icon-btn"
        onClick={handleBellClick}
        title="الإشعارات والتنبيهات"
        style={{ position: 'relative' }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '-2px', right: '-2px',
            background: 'var(--danger)', color: '#FFF',
            fontSize: '0.65rem', fontWeight: 800,
            width: '18px', height: '18px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--bg-surface)',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown-panel fade-in-up" style={{ minWidth: '340px', maxWidth: '400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
            <strong style={{ fontSize: '0.95rem', color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Bell size={16} color="var(--primary-light)" />
              {isAdmin ? 'رسائل واستفسارات الطلاب' : 'إشعارات الردود والتنبيهات'}
            </strong>
            {!isAdmin && unreadCount > 0 && (
              <button
                onClick={markAllSeen}
                style={{ background: 'none', border: 'none', color: 'var(--primary-light)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
              >
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          {isAdmin ? (
            // Admin: show open inquiries list
            adminInquiries.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                لا توجد استفسارات جديدة بانتظار الرد حالياً
              </div>
            ) : (
              <div className="notification-list" style={{ maxHeight: '360px', overflowY: 'auto' }}>
                {adminInquiries.map(inq => {
                  const student = inq.StudentId as any;
                  const studentName = student?.FullName || 'طالب';
                  const studentPhone = student?.Phone || '';
                  return (
                    <div
                      key={inq._id}
                      onClick={() => handleAdminInquiryClick(inq)}
                      className="notification-item unread"
                      style={{ cursor: 'pointer', padding: '0.75rem', borderBottom: '1px solid var(--border-glass)' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Mail size={13} color="#EF4444" /> {inq.Subject}
                        </strong>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {formatDate(inq.createdAt)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary-light)', fontWeight: 600, marginBottom: '0.25rem' }}>
                        من الطالب: {studentName} {studentPhone ? `(${studentPhone})` : ''}
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {inq.Message}
                      </p>
                      <div style={{ fontSize: '0.72rem', color: '#EF4444', fontWeight: 700, marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span>● قيد الانتظار</span> • <span style={{ color: 'var(--primary-light)' }}>انقر للرد المباشر في الإدارة ←</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            // Student: show newly answered inquiries
            newlyAnswered.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                لا توجد ردود أو إشعارات جديدة حالياً
              </div>
            ) : (
              <div className="notification-list" style={{ maxHeight: '360px', overflowY: 'auto' }}>
                {newlyAnswered.map(inq => (
                  <div
                    key={inq._id}
                    onClick={() => handleStudentInquiryClick(inq)}
                    className="notification-item unread"
                    style={{
                      cursor: 'pointer',
                      padding: '0.85rem',
                      borderBottom: '1px solid var(--border-glass)',
                      background: 'rgba(16, 185, 129, 0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <MailOpen size={14} color="#10B981" /> تم الرد على استفسارك
                      </strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {inq.RepliedAt ? formatDate(inq.RepliedAt) : formatDate(inq.updatedAt)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.25rem' }}>
                      {inq.Subject}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-bright)',
                      background: 'var(--bg-subtle)',
                      padding: '0.45rem 0.6rem',
                      borderRadius: '6px',
                      borderRight: '3px solid #10B981',
                      lineHeight: 1.4,
                    }}>
                      <span style={{ fontWeight: 700, color: '#10B981', fontSize: '0.75rem', display: 'block', marginBottom: '0.15rem' }}>
                        رد الإدارة:
                      </span>
                      {inq.Reply ? (inq.Reply.slice(0, 110) + (inq.Reply.length > 110 ? '...' : '')) : 'تم الرد على استفسارك بنجاح'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--primary-light)', marginTop: '0.35rem', textAlign: 'left' }}>
                      انقر لمشاهدة الرد الكامل في المجتمع ←
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
