import React from 'react';
import { X, Save } from 'lucide-react';
import { Subtask, Project } from '@/features/core/types';

interface NotionEditorHeaderProps {
  project?: Project | null;
  subtask: Subtask;
  saveIndicator: boolean;
  onClose: () => void;
}

export const NotionEditorHeader: React.FC<NotionEditorHeaderProps> = ({
  project,
  subtask,
  saveIndicator,
  onClose,
}) => {
  return (
    <div className="modal-header notion-editor-header">
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          {project && (
            <span
              className="discipline-tag"
              style={{
                backgroundColor: `${project.color}20`,
                borderColor: `${project.color}40`,
                color: project.color,
              }}
            >
              {project.icon || '📁'} {project.title}
            </span>
          )}
          <span className={`priority-pill priority-${subtask.priority}`}>
            {subtask.priority}
          </span>
        </div>
        <h3 className="modal-title" style={{ fontSize: '1.2rem' }}>
          📝 {subtask.title}
        </h3>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {saveIndicator && (
          <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Save size={14} /> Salvo
          </span>
        )}
        <button className="icon-btn" onClick={onClose} aria-label="Fechar editor">
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
