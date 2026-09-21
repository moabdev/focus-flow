import React from 'react';
import { FileText, CheckSquare, Check, Copy, Trash2 } from 'lucide-react';
import { QuickNote, Project, Subtask } from '@/features/core/types';

interface DraftCardProps {
  note: QuickNote;
  project?: Project;
  subtask?: Subtask;
  isCopied: boolean;
  wordCount: number;
  formatDate: (isoString?: string) => string;
  onClick: () => void;
  onCopy: (note: QuickNote, e: React.MouseEvent) => void;
  onDelete: (note: QuickNote, e: React.MouseEvent) => void;
}

export const DraftCard: React.FC<DraftCardProps> = ({
  note,
  project,
  subtask,
  isCopied,
  wordCount,
  formatDate,
  onClick,
  onCopy,
  onDelete,
}) => {
  return (
    <div
      className="draft-card"
      onClick={onClick}
      title="Clique para editar este rascunho"
    >
      <div className="draft-card-header">
        {project ? (
          <span className="draft-card-project-tag">
            <span className="draft-project-dot" style={{ background: project.color }} />
            <span>{project.title}</span>
          </span>
        ) : (
          <span className="draft-card-project-tag" style={{ color: 'var(--text-muted)' }}>
            Geral
          </span>
        )}
        <span className="draft-card-date">{formatDate(note.updated_at || note.created_at)}</span>
      </div>

      <div className="draft-card-title-row">
        <FileText size={16} className="draft-card-icon" />
        <h3 className="draft-card-title">{note.title || 'Sem título'}</h3>
      </div>

      {subtask && (
        <div className="draft-card-subtask-badge" title={`Subtarefa: ${subtask.title}`}>
          <CheckSquare size={12} />
          <span>{subtask.title}</span>
        </div>
      )}

      <p className={`draft-card-preview ${!note.content?.trim() ? 'empty' : ''}`}>
        {note.content?.trim() || 'Rascunho vazio. Clique para começar a escrever anotações de estudo...'}
      </p>

      <div className="draft-card-footer">
        <span className="draft-card-stats">
          {wordCount} {wordCount === 1 ? 'palavra' : 'palavras'} • {(note.content || '').length} caracteres
        </span>

        <div className="draft-card-actions">
          <button
            type="button"
            className="draft-action-btn"
            onClick={(e) => onCopy(note, e)}
            title="Copiar texto do rascunho"
          >
            {isCopied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
          </button>

          <button
            type="button"
            className="draft-action-btn delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note, e);
            }}
            title="Excluir rascunho"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
