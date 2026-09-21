import React, { useMemo } from 'react';
import { Check, Play, FileText, Trash2, Clock, Calendar, Tag } from 'lucide-react';
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

export const SubtaskItem: React.FC<SubtaskItemProps> = React.memo(({
  subtask,
  isCurrentActive,
  onToggleCompleted,
  onSelectActiveSubtask,
  onOpenTimerTab,
  onOpenNotes,
  onDeleteSubtask,
}) => {
  // Helpers para cálculo e formatação visual inteligente de prazo (Due Date)
  const dueDateInfo = useMemo(() => {
    if (!subtask.due_date) return null;
    try {
      const [year, month, day] = subtask.due_date.split('-');
      if (!year || !month || !day) return { text: subtask.due_date, isOverdue: false, isToday: false };
      const dueDateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDateObj.setHours(0, 0, 0, 0);

      const diffDays = Math.round((dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return { text: 'Hoje', isOverdue: false, isToday: true };
      if (diffDays === 1) return { text: 'Amanhã', isOverdue: false, isToday: false };
      if (diffDays === -1) return { text: 'Ontem', isOverdue: true, isToday: false };
      if (diffDays < 0) return { text: `${Math.abs(diffDays)}d atrasada`, isOverdue: true, isToday: false };
      return { text: `${day}/${month}`, isOverdue: false, isToday: false };
    } catch {
      return { text: subtask.due_date, isOverdue: false, isToday: false };
    }
  }, [subtask.due_date]);

  const handleStartFocus = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectActiveSubtask(subtask.id);
    if (onOpenTimerTab) onOpenTimerTab();
  };

  return (
    <div
      className={`subtask-item ${subtask.is_completed ? 'completed' : ''} ${
        isCurrentActive ? 'active-focus' : ''
      }`}
    >
      {/* Checkbox de Conclusão com feedback visual elegante */}
      <button
        type="button"
        className={`subtask-checkbox ${subtask.is_completed ? 'checked' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleCompleted(subtask.id);
        }}
        title={subtask.is_completed ? 'Desmarcar como concluída' : 'Marcar como concluída'}
        aria-label="Concluir subtarefa"
      >
        {subtask.is_completed && <Check size={13} strokeWidth={3} />}
      </button>

      {/* Conteúdo Principal da Subtarefa */}
      <div
        className="subtask-info"
        onClick={() => {
          onSelectActiveSubtask(subtask.id);
          if (onOpenTimerTab) onOpenTimerTab();
        }}
        title="Clique para definir esta subtarefa como foco ativo no Timer"
      >
        <div className="subtask-title-line">
          <span className="subtask-title">{subtask.title}</span>
          {isCurrentActive && (
            <span className="active-timer-badge">
              <span className="active-pulse-dot" />
              <Play size={9} fill="currentColor" />
              <span>Em Foco</span>
            </span>
          )}
        </div>

        {/* Linha de Metadados: Prioridade, Pomodoros, Tempo, Disciplina e Prazo */}
        <div className="subtask-meta-row">
          <span className={`subtask-meta-chip subtask-priority-${subtask.priority}`}>
            <span className="priority-indicator-dot" />
            <span>{subtask.priority.charAt(0).toUpperCase() + subtask.priority.slice(1)}</span>
          </span>

          <span
            className="subtask-meta-chip subtask-pomo-chip"
            title={`${subtask.pomodoros_completed} de ${subtask.pomodoros_estimated} ciclos concluídos`}
          >
            <span className="pomo-emoji">🍅</span>
            <span>{subtask.pomodoros_completed}/{subtask.pomodoros_estimated}</span>
          </span>

          {subtask.elapsed_seconds && subtask.elapsed_seconds > 0 ? (
            <span
              className="subtask-meta-chip subtask-time-chip"
              title={`Tempo total focado: ${formatSeconds(subtask.elapsed_seconds)}`}
            >
              <Clock size={11} className="subtask-meta-icon" />
              <span>{formatSeconds(subtask.elapsed_seconds)}</span>
            </span>
          ) : null}

          {subtask.discipline && subtask.discipline !== 'Geral' && (
            <span className="subtask-meta-chip subtask-discipline-chip" title={`Disciplina: ${subtask.discipline}`}>
              <Tag size={10} className="subtask-meta-icon" />
              <span>{subtask.discipline}</span>
            </span>
          )}

          {dueDateInfo && (
            <span
              className={`subtask-meta-chip subtask-date-chip ${dueDateInfo.isOverdue ? 'overdue' : ''} ${
                dueDateInfo.isToday ? 'today' : ''
              }`}
              title={subtask.due_date ? `Prazo: ${subtask.due_date}` : undefined}
            >
              <Calendar size={11} className="subtask-meta-icon" />
              <span>{dueDateInfo.text}</span>
            </span>
          )}
        </div>
      </div>

      {/* Ações da Subtarefa: Focar, Anotações Notion e Excluir */}
      <div className="subtask-actions">
        {!subtask.is_completed && !isCurrentActive && (
          <button
            type="button"
            className="subtask-action-btn subtask-focus-btn"
            onClick={handleStartFocus}
            title="Iniciar foco nesta subtarefa agora"
            aria-label="Focar agora"
          >
            <Play size={12} fill="currentColor" />
            <span className="action-btn-text">Focar</span>
          </button>
        )}

        <button
          type="button"
          className={`subtask-action-btn subtask-notes-btn ${subtask.notes ? 'has-notes' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onOpenNotes(subtask);
          }}
          title={subtask.notes ? 'Ver/Editar Anotações (Notion)' : 'Adicionar Anotações (Notion)'}
        >
          <FileText size={13} />
          <span className="action-btn-text">{subtask.notes ? 'Notas' : '+ Nota'}</span>
          {subtask.notes && <span className="notes-indicator-dot" />}
        </button>

        <button
          type="button"
          className="subtask-action-btn subtask-delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteSubtask(subtask.id);
          }}
          title="Excluir Subtask"
          aria-label="Excluir Subtask"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
});
