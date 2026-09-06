import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ExamSessionView } from '../../components/exams/ExamSessionView';

interface ExamPageProps {
  examId: string;
  onBack: () => void;
}

export const ExamPage: React.FC<ExamPageProps> = ({ examId, onBack }) => {
  return (
    <div className="container fade-in-up" style={{ padding: '2rem 1.5rem 6rem' }}>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={onBack}
        style={{ marginBottom: '1rem', padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
      >
        <ArrowRight size={15} /> العودة
      </button>

      <ExamSessionView examId={examId} onBackToCourse={onBack} />
    </div>
  );
};
