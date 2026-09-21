import React from 'react';
import { CalendarEvent, Project, Subtask } from '@/features/core/types';
import { CalendarEventBlock } from './CalendarEventBlock';

interface CalendarDayViewProps {
  events: CalendarEvent[];
  projects: Project[];
  subtasks: Subtask[];
  selectedDate: string;
  onToggleEventCompleted: (id: string) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
  onSelectSubtaskForFocus: (subtaskId: string) => void;
  onOpenTimerTab?: () => void;
  onOpenCreateAtHour: (hour: number) => void;
}

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6);

export const CalendarDayView: React.FC<CalendarDayViewProps> = ({
  events,
  projects,
  subtasks,
  selectedDate,
  onToggleEventCompleted,
  onDeleteEvent,
  onSelectSubtaskForFocus,
  onOpenTimerTab,
  onOpenCreateAtHour,
}) => {
  const dayEvents = events.filter((ev) => ev.start_time.startsWith(selectedDate));

  return (
    <div className="time-blocking-grid glass-panel">
      {HOURS.map((hour) => {
        const hourPrefix = `${hour.toString().padStart(2, '0')}:`;
        const slotEvents = dayEvents.filter((ev) => {
          const timePart = ev.start_time.split('T')[1] || '';
          return timePart.startsWith(hourPrefix);
        });

        return (
          <div key={hour} className="time-slot-row">
            <div className="time-label">
              <span>{hour.toString().padStart(2, '0')}:00</span>
            </div>

            <div
              className="time-slot-content"
              onClick={(e) => {
                if ((e.target as HTMLElement).classList.contains('time-slot-content')) {
                  onOpenCreateAtHour(hour);
                }
              }}
            >
              {slotEvents.map((ev) => {
                const parentProject = projects.find((p) => p.id === ev.project_id);
                const linkedSubtask = subtasks.find((s) => s.id === ev.subtask_id);

                return (
                  <CalendarEventBlock
                    key={ev.id}
                    event={ev}
                    parentProject={parentProject}
                    linkedSubtask={linkedSubtask}
                    onToggleEventCompleted={onToggleEventCompleted}
                    onDeleteEvent={onDeleteEvent}
                    onSelectSubtaskForFocus={onSelectSubtaskForFocus}
                    onOpenTimerTab={onOpenTimerTab}
                  />
                );
              })}

              {slotEvents.length === 0 && (
                <button
                  className="add-event-slot-hint"
                  onClick={() => onOpenCreateAtHour(hour)}
                >
                  + Agendar tarefa neste horário
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
