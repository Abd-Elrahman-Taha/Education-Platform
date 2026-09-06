import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { PaginationMeta } from '../../types/api.types';

interface PaginationProps {
  pagination?: PaginationMeta;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  pagination,
  onPageChange,
}) => {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, total } = pagination;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginTop: '2rem',
        paddingTop: '1.25rem',
        borderTop: '1px solid var(--border-glass)',
      }}
    >
      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        الصفحة <strong>{page}</strong> من <strong>{totalPages}</strong> (إجمالي {total} عنصر)
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronRight size={16} /> السابق
        </button>

        {Array.from({ length: totalPages }, (_, idx) => idx + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
          .map((p, index, array) => {
            const showEllipsisBefore = index > 0 && p - array[index - 1] > 1;
            return (
              <React.Fragment key={p}>
                {showEllipsisBefore && (
                  <span style={{ color: 'var(--text-muted)', padding: '0 0.25rem' }}>…</span>
                )}
                <button
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`btn ${p === page ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    minWidth: '34px',
                    height: '34px',
                    padding: 0,
                    fontSize: '0.82rem',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {p}
                </button>
              </React.Fragment>
            );
          })}

        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          التالي <ChevronLeft size={16} />
        </button>
      </div>
    </div>
  );
};
