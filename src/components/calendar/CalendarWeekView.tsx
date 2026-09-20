import React, { useMemo } from 'react';
import { Plus, CheckCircle2, Clock } from 'lucide-react';
import { CalendarEvent, Project, Subtask } from '../../types';

interface CalendarWeekViewProps {
  events: CalendarEvent[];
  projects: Project[];
  subtasks: Subtask[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onToggleEventCompleted: (id: string) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
  onSelectSubtaskForFocus: (subtaskId: string) => void;
  onOpenTimerTab?: () => void;
  onOpenCreateForDate: (date: string) => void;
}

export const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({
  events,
  projects,
  subtasks,
  selectedDate,
  onSelectDate,
  onToggleEventCompleted,
  onDeleteEvent: _onDeleteEvent,
  onSelectSubtaskForFocus,
  onOpenTimerTab,
  onOpenCreateForDate,
}) => {
  const weekDays = useMemo(() => {
    const current = new Date(`${selectedDate}T12:00:00`);
    const dayOfWeek = current.getDay(); // 0 is Sunday, 1 is Monday
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(current);
    monday.setDate(current.getDate() + diffToMonday);

    const days = [];
    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isoDate = d.toISOString().split('T')[0];
      const weekdayName = d.toLocaleDateString('pt-BR', { weekday: 'short' });
      days.push({
        isoDate,
        dayNum: d.getDate(),
        weekdayName: weekdayName.replace('.', '').toUpperCase(),
        isToday: isoDate === todayStr,
        isSelected: isoDate === selectedDate,
      });
    }
    return days;
  }, [selectedDate]);

  return (
    <div className="calendar-week-grid glass-panel">
      {weekDays.map((day) => {
        const dayEvents = events.filter((ev) => ev.start_time.startsWith(day.isoDate));

        return (
          <div
            key={day.isoDate}
            className={`week-day-column ${day.isToday ? 'today' : ''} ${day.isSelected ? 'selected' : ''}`}
            onClick={() => onSelectDate(day.isoDate)}
          >
            <div className="week-day-header">
              <span className="week-day-name">{day.weekdayName}</span>
              <span className={`week-day-number ${day.isToday ? 'today-pill' : ''}`}>
                {day.dayNum}
              </span>
              <button
                className="week-add-event-btn"
                title={`Agendar em ${day.isoDate}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCreateForDate(day.isoDate);
                }}
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="week-day-events-list">
              {dayEvents.map((ev) => {
                const parentProject = projects.find((p) => p.id === ev.project_id);
                const linkedSub = subtasks.find((s) => s.id === ev.subtask_id);
                const timeStr = (ev.start_time.split('T')[1] || '').substring(0, 5);

                return (
                  <div
                    key={ev.id}
                    className={`week-event-card ${ev.is_completed ? 'completed' : ''}`}
                    style={{ borderLeftColor: ev.color || parentProject?.color || 'var(--accent-primary)' }}
                  >
                    <div className="week-event-top">
                      <span className="week-event-time">
                        <Clock size={11} />
                        {timeStr}
                      </span>
                      <button
                        className="week-event-check"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleEventCompleted(ev.id);
                        }}
                      >
                        <CheckCircle2 size={13} color={ev.is_completed ? '#10b981' : 'var(--text-muted)'} />
                      </button>
                    </div>

                    <div className="week-event-title">{ev.title}</div>

                    {linkedSub && (
                      <button
                        className="week-event-focus-btn event-focus-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSubtaskForFocus(linkedSub.id);
                          if (onOpenTimerTab) onOpenTimerTab();
                        }}
                      >
                        Focar
                      </button>
                    )}
                  </div>
                );
              })}

              {dayEvents.length === 0 && (
                <div className="week-empty-day">
                  <span>Livre</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
