import React, { useState } from 'react';
import { Sliders, CreditCard, FileSpreadsheet, Ban, Plus, CheckCircle2, Search } from 'lucide-react';
import { RosterStudent } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AdminView: React.FC = () => {
  const { showToast } = useToast();
  const [scratchCardCount, setScratchCardCount] = useState<number>(100);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  const [students, setStudents] = useState<RosterStudent[]>([
    { id: 's1', code: '94021', name: 'أحمد محمد محمود', phone: '01012345678', parentPhone: '01198765432', grade: 'الصف الثالث الثانوي', attendance: '96%', averageScore: 94.2, status: 'active' },
    { id: 's2', code: '94022', name: 'محمود السيد علي', phone: '01055544332', parentPhone: '01211223344', grade: 'الصف الثالث الثانوي', attendance: '72%', averageScore: 65.0, status: 'active' },
    { id: 's3', code: '94023', name: 'مريم إبراهيم حسن', phone: '01599887766', parentPhone: '01033445566', grade: 'الصف الثاني الثانوي', attendance: '98%', averageScore: 98.5, status: 'active' },
    { id: 's4', code: '94024', name: 'مصطفى حسين مصطفى', phone: '01122334455', parentPhone: '01299887711', grade: 'الصف الثالث الثانوي', attendance: '45%', averageScore: 40.0, status: 'blocked' },
  ]);

  const handleToggleStatus = (id: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        const nextStatus = s.status === 'active' ? 'blocked' : 'active';
        showToast(nextStatus === 'blocked' ? `تم حظر الطالب (${s.name}) وتجميد وصوله للمحاضرات` : `تم تفعيل حساب الطالب (${s.name}) بنجاح`, nextStatus === 'blocked' ? 'warning' : 'success');
        return { ...s, status: nextStatus };
      }
      return s;
    }));
  };

  const handleGenerateScratchCards = () => {
    showToast(`تم توليد ${scratchCardCount} كارت شحن للسنتر وتصدير الكشوفات بتنسيق Excel!`, 'success');
  };

  const handleExportExcel = () => {
    showToast('جاري تصدير كشوفات الطلاب مفلترة وطباعة النماذج...', 'info');
  };

  const filteredStudents = students.filter(s =>
    s.name.includes(studentSearchQuery) ||
    s.code.includes(studentSearchQuery) ||
    s.phone.includes(studentSearchQuery)
  );

  return (
    <div className="container fade-in-up" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sliders size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>لوحة أدمن المنصة ومساعدي المعلم (Assistants)</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>إدارة كروت السنتر، رصد حضور وحظر الطلاب، وتوليد التقارير</p>
          </div>
        </div>
      </div>

      {/* Control Tools Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
        {/* Scratch Card Generator */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={20} color="var(--primary-light)" /> مولد كروت الشحن (الأكواد للسنتر)
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            توليد كروت شحن بأكواد عشوائية مشفرة لتوزيعها في السنتر للمجموعات الحضورية.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="number"
              className="input-field"
              value={scratchCardCount}
              onChange={(e) => setScratchCardCount(Number(e.target.value))}
              style={{ width: '120px' }}
            />
            <button className="btn btn-primary" onClick={handleGenerateScratchCards}>
              <Plus size={16} /> توليد الكروت الان
            </button>
          </div>
        </div>

        {/* Excel & Roster Exports */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileSpreadsheet size={20} color="var(--success)" /> تصدير الكشوفات والتقارير
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            تصدير بيانات الطلاب، نسب الحضور، ودرجات البابل شيت طبقاً لـ 60+ فلتر محدد.
          </p>

          <button className="btn btn-secondary" onClick={handleExportExcel} style={{ width: '100%' }}>
            <FileSpreadsheet size={18} color="var(--success)" /> تصدير ملفات Excel الشاملة
          </button>
        </div>
      </div>

      {/* Roster Table */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>سجل الطلاب والتحكم بالحظر والحسابات</h3>

          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="البحث باسم الطالب أو الكود..."
              style={{ width: '100%', paddingRight: '36px', fontSize: '0.85rem' }}
              value={studentSearchQuery}
              onChange={(e) => setStudentSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.85rem 1rem' }}>كود الطالب</th>
                <th style={{ padding: '0.85rem 1rem' }}>الاسم بالكامل</th>
                <th style={{ padding: '0.85rem 1rem' }}>الهاتف</th>
                <th style={{ padding: '0.85rem 1rem' }}>المرحلة الدراسية</th>
                <th style={{ padding: '0.85rem 1rem' }}>النسبة والتفوق</th>
                <th style={{ padding: '0.85rem 1rem' }}>حالة الحساب</th>
                <th style={{ padding: '0.85rem 1rem' }}>إجراءات الأدمن</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-light)' }}>#{student.code}</td>
                  <td style={{ padding: '1rem', fontWeight: 700 }}>{student.name}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{student.phone}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{student.grade}</td>
                  <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--success)' }}>{student.averageScore}%</td>
                  <td style={{ padding: '1rem' }}>
                    {student.status === 'active' ? (
                      <span style={{ color: 'var(--success)', background: 'rgba(16, 185, 129, 0.15)', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckCircle2 size={12} /> مفعل
                      </span>
                    ) : (
                      <span style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.15)', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Ban size={12} /> محظور
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button
                      className={`btn ${student.status === 'active' ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                      onClick={() => handleToggleStatus(student.id)}
                    >
                      {student.status === 'active' ? 'حظر الطالب' : 'تفعيل الحساب'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
