import React from 'react';
import { PriorityLevel } from '@/features/core/types';

interface TaskFormProps {
  newTitle: string;
  setNewTitle: (val: string) => void;
  newDiscipline: string;
  setNewDiscipline: (val: string) => void;
  newEstimated: number;
  setNewEstimated: (val: number) => void;
  newPriority: PriorityLevel;
  setNewPriority: (val: PriorityLevel) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  newTitle,
  setNewTitle,
  newDiscipline,
  setNewDiscipline,
  newEstimated,
  setNewEstimated,
  newPriority,
  setNewPriority,
  onSubmit,
  onCancel,
}) => {
  return (
    <form onSubmit={onSubmit} className="glass-panel" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <input
          type="text"
          placeholder="O que você vai estudar agora?"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          autoFocus
          required
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-primary)',
            fontSize: '1rem',
          }}
        />

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Disciplina (ex: Python, Java, Matemática)"
            value={newDiscipline}
            onChange={(e) => setNewDiscipline(e.target.value)}
            style={{
              flex: 1,
              minWidth: '180px',
              padding: '0.6rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid var(--border-glass-subtle)',
              color: 'var(--text-primary)',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Estimativa (pomos):</span>
            <input
              type="number"
              min="1"
              max="20"
              value={newEstimated}
              onChange={(e) => setNewEstimated(parseInt(e.target.value) || 1)}
              style={{
                width: '60px',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid var(--border-glass-subtle)',
                color: 'var(--text-primary)',
                textAlign: 'center',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            {(['baixa', 'media', 'alta'] as PriorityLevel[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setNewPriority(p)}
                style={{
                  padding: '0.4rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  border: newPriority === p ? '2px solid #fff' : '1px solid transparent',
                  background:
                    p === 'alta'
                      ? 'rgba(239, 68, 68, 0.3)'
                      : p === 'media'
                      ? 'rgba(245, 158, 11, 0.3)'
                      : 'rgba(16, 185, 129, 0.3)',
                  color:
                    p === 'alta'
                      ? '#ef4444'
                      : p === 'media'
                      ? '#f59e0b'
                      : '#10b981',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{ padding: '0.6rem 1.25rem', color: 'var(--text-muted)' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="main-start-btn"
            style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}
          >
            Salvar Tarefa
          </button>
        </div>
      </div>
    </form>
  );
};
