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
  /** When true, renders a condensed single-line layout for short time slots */
  compact?: boolean;
}

export const CalendarEventBlock: React.FC<CalendarEventBlockProps> = ({
  event,
  parentProject,
  linkedSubtask,
  onToggleEventCompleted,
  onDeleteEvent,
  onSelectSubtaskForFocus,
  onOpenTimerTab,
  compact = false,
}) => {
  const accentColor = event.color || parentProject?.color || 'var(--accent-primary)';
  const isGoogle = event.source === 'google';

  const timeRange = `${event.start_time.split('T')[1]?.slice(0, 5)} – ${event.end_time.split('T')[1]?.slice(0, 5)}`;

  if (compact) {
    // Compact: single row, just title + time, minimal controls
    return (
      <div
        className={`calendar-event-block compact ${event.is_completed ? 'completed' : ''}`}
        style={{
          borderLeft: `3px solid ${accentColor}`,
          backgroundColor: `${accentColor}22`,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '2px 6px',
          overflow: 'hidden',
        }}
        title={`${event.title} | ${timeRange}`}
      >
        <button
          className={`task-checkbox small ${event.is_completed ? 'checked' : ''}`}
          onClick={() => onToggleEventCompleted(event.id)}
          title={event.is_completed ? 'Desmarcar' : 'Concluir'}
          style={{ flexShrink: 0 }}
        >
          {event.is_completed && <Check size={9} />}
        </button>

        <span className="event-title" style={{ fontSize: '0.78rem', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {isGoogle && <span style={{ marginRight: 3 }}>🔵</span>}
          {event.title}
        </span>

        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>
          {event.start_time.split('T')[1]?.slice(0, 5)}
        </span>

        <button
          className="icon-btn text-danger"
          onClick={() => onDeleteEvent(event.id)}
          title="Excluir"
          style={{ flexShrink: 0, padding: '0 2px' }}
        >
          <Trash2 size={11} />
        </button>
      </div>
    );
  }

  // Full layout
  return (
    <div
      className={`calendar-event-block ${event.is_completed ? 'completed' : ''}`}
      style={{
        borderLeft: `4px solid ${accentColor}`,
        backgroundColor: `${accentColor}18`,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '6px 8px',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Top row */}
      <div className="event-title-row" style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
        <button
          className={`task-checkbox ${event.is_completed ? 'checked' : ''}`}
          onClick={() => onToggleEventCompleted(event.id)}
          title={event.is_completed ? 'Desmarcar' : 'Concluir agendamento'}
          style={{ flexShrink: 0, marginTop: 2 }}
        >
          {event.is_completed && <Check size={12} />}
        </button>

        <div style={{ flex: 1, overflow: 'hidden' }}>
          <strong className="event-title" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isGoogle && <span style={{ marginRight: 4 }}>🔵</span>}
            {event.title}
          </strong>
          <span className="event-time-range" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {timeRange}
          </span>
        </div>

        <button
          className="icon-btn text-danger"
          onClick={() => onDeleteEvent(event.id)}
          title="Excluir agendamento"
          style={{ flexShrink: 0 }}
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Project badge */}
      {parentProject && (
        <div className="event-project-badge" style={{ color: parentProject.color, marginTop: 4, fontSize: '0.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {parentProject.icon || '📁'} {parentProject.title}
        </div>
      )}

      {/* Subtask + Focus button */}
      {linkedSubtask && (
        <div style={{ marginTop: 'auto', paddingTop: 4 }}>
          <button
            className="event-focus-btn"
            onClick={() => {
              onSelectSubtaskForFocus(linkedSubtask.id);
              if (onOpenTimerTab) onOpenTimerTab();
            }}
            title="Iniciar Foco Imediato no Cronômetro"
            style={{ fontSize: '0.72rem' }}
          >
            <Play size={11} /> Focar Agora
          </button>
        </div>
      )}
    </div>
  );
};
