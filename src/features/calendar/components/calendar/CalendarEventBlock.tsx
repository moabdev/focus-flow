import React from 'react';
import { Check, Play, Trash2 } from 'lucide-react';
import { CalendarEvent, Project, Subtask } from '@/features/core/types';

interface CalendarEventBlockProps {
  event: CalendarEvent;
  parentProject?: Project;
  linkedSubtask?: Subtask;
  onToggleEventCompleted: (id: string) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
  onSelectSubtaskForFocus: (subtaskId: string) => void;
  onOpenTimerTab?: () => void;
}

export const CalendarEventBlock: React.FC<CalendarEventBlockProps> = ({
  event,
  parentProject,
  linkedSubtask,
  onToggleEventCompleted,
  onDeleteEvent,
  onSelectSubtaskForFocus,
  onOpenTimerTab,
}) => {
  return (
    <div
      className={`calendar-event-block ${event.is_completed ? 'completed' : ''}`}
      style={{
        borderLeft: `4px solid ${event.color || parentProject?.color || 'var(--accent-primary)'}`,
        backgroundColor: `${event.color || parentProject?.color || 'var(--accent-primary)'}18`,
      }}
    >
      <button
        className={`task-checkbox ${event.is_completed ? 'checked' : ''}`}
        onClick={() => onToggleEventCompleted(event.id)}
        title={event.is_completed ? 'Desmarcar' : 'Concluir agendamento'}
      >
        {event.is_completed && <Check size={12} />}
      </button>

      <div className="event-info">
        <div className="event-title-row">
          <strong className="event-title">{event.title}</strong>
          <span className="event-time-range">
            {event.start_time.split('T')[1]?.slice(0, 5)} - {event.end_time.split('T')[1]?.slice(0, 5)}
          </span>
        </div>

        {parentProject && (
          <div className="event-project-badge" style={{ color: parentProject.color }}>
            {parentProject.icon || '📁'} {parentProject.title}
          </div>
        )}

        {linkedSubtask && (
          <div className="event-subtask-link">
            ↳ Subtask: <em>{linkedSubtask.title}</em>
          </div>
        )}
      </div>

      <div className="event-actions">
        <button
          className="event-focus-btn"
          onClick={() => {
            if (linkedSubtask) {
              onSelectSubtaskForFocus(linkedSubtask.id);
            }
            if (onOpenTimerTab) onOpenTimerTab();
          }}
          title="Iniciar Foco Imediato no Cronômetro"
        >
          <Play size={12} /> Focar Agora
        </button>

        <button
          className="icon-btn text-danger"
          onClick={() => onDeleteEvent(event.id)}
          title="Excluir agendamento"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};
