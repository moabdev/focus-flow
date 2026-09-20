import React from 'react';
import { Check, Play, FileText, Trash2 } from 'lucide-react';
import { Subtask } from '../../types';

export const formatSeconds = (totalSecs: number): string => {
  if (!totalSecs || totalSecs <= 0) return '0 min';
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs > 0 ? `${secs}s` : ''}`;
  return `${secs}s`;
};

interface SubtaskItemProps {
  subtask: Subtask;
  isCurrentActive: boolean;
  onToggleCompleted: (id: string) => void;
  onSelectActiveSubtask: (id: string) => void;
  onOpenTimerTab?: () => void;
  onOpenNotes: (subtask: Subtask) => void;
  onDeleteSubtask: (id: string) => void;
}

export const SubtaskItem: React.FC<SubtaskItemProps> = ({
  subtask,
  isCurrentActive,
  onToggleCompleted,
  onSelectActiveSubtask,
  onOpenTimerTab,
  onOpenNotes,
  onDeleteSubtask,
}) => {
  return (
    <div
      className={`subtask-item ${subtask.is_completed ? 'completed' : ''} ${
        isCurrentActive ? 'active-focus' : ''
      }`}
    >
      {/* Checkbox de Conclusão */}
      <button
        className={`task-checkbox ${subtask.is_completed ? 'checked' : ''}`}
        onClick={() => onToggleCompleted(subtask.id)}
        title={subtask.is_completed ? 'Desmarcar' : 'Concluir subtask'}
        aria-label="Concluir subtask"
      >
        {subtask.is_completed && <Check size={14} />}
      </button>

      {/* Informações da Subtask */}
      <div
        className="subtask-info"
        onClick={() => {
          onSelectActiveSubtask(subtask.id);
          if (onOpenTimerTab) onOpenTimerTab();
        }}
        title="Clique para definir esta subtask como foco atual no Timer"
      >
        <div className="subtask-title-line">
          <span className="subtask-title">{subtask.title}</span>
          {isCurrentActive && (
            <span className="active-timer-badge">
              <Play size={10} /> Em Foco
            </span>
          )}
        </div>

        <div className="subtask-details-line">
          <span className={`priority-pill priority-${subtask.priority}`}>
            {subtask.priority}
          </span>

          <span className="pomodoro-count">
            🍅 {subtask.pomodoros_completed}/{subtask.pomodoros_estimated}
          </span>

          <span className="subtask-elapsed-badge">
            ⏱️ {formatSeconds(subtask.elapsed_seconds || 0)}
          </span>

          {subtask.due_date && (
            <span className="subtask-due-date">
              📅 {subtask.due_date}
            </span>
          )}
        </div>
      </div>

      {/* Ações da Subtask: Anotações Notion e Excluir */}
      <div className="subtask-actions">
        <button
          className={`notion-notes-btn ${subtask.notes ? 'has-notes' : ''}`}
          onClick={() => onOpenNotes(subtask)}
          title={subtask.notes ? 'Ver/Editar Anotações (Notion)' : 'Adicionar Anotações (Notion)'}
        >
          <FileText size={15} />
          <span>{subtask.notes ? 'Notas' : '+ Nota'}</span>
        </button>

        <button
          className="icon-btn text-danger"
          onClick={() => onDeleteSubtask(subtask.id)}
          title="Excluir Subtask"
          aria-label="Excluir Subtask"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};
