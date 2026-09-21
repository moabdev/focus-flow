import React, { useMemo } from 'react';
import { CalendarEvent, Project, Subtask } from '@/features/core/types';
import { CalendarEventBlock } from './CalendarEventBlock';
import { Plus } from 'lucide-react';

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

/** Height in pixels of one hour slot */
const HOUR_HEIGHT = 64;
const START_HOUR = 6;  // 06:00
const END_HOUR = 23;   // 23:00
const TOTAL_HOURS = END_HOUR - START_HOUR;

/** Returns minutes since START_HOUR (clamps between 0 and TOTAL_HOURS*60) */
const toMinutesFromStart = (isoTime: string): number => {
  const timePart = isoTime.includes('T') ? isoTime.split('T')[1] : isoTime;
  const [h, m] = timePart.split(':').map(Number);
  const total = (h - START_HOUR) * 60 + (m || 0);
  return Math.max(0, Math.min(total, TOTAL_HOURS * 60));
};

interface PositionedEvent {
  event: CalendarEvent;
  top: number;    // px
  height: number; // px
  left: number;   // percent
  width: number;  // percent
}

/**
 * Overlap layout algorithm — similar to Google Calendar.
 * Groups events that overlap in time, then distributes them horizontally.
 */
function layoutEvents(events: CalendarEvent[]): PositionedEvent[] {
  if (events.length === 0) return [];

  // Sort by start time
  const sorted = [...events].sort((a, b) => {
    const aMin = toMinutesFromStart(a.start_time);
    const bMin = toMinutesFromStart(b.start_time);
    return aMin - bMin;
  });

  const positioned: PositionedEvent[] = sorted.map((event) => {
    const startMin = toMinutesFromStart(event.start_time);
    const endMin = toMinutesFromStart(event.end_time);
    const duration = Math.max(endMin - startMin, 30); // minimum 30 min height

    return {
      event,
      top: (startMin / 60) * HOUR_HEIGHT,
      height: (duration / 60) * HOUR_HEIGHT,
      left: 0,
      width: 100,
    };
  });

  // Group overlapping events and assign columns
  const columns: PositionedEvent[][] = [];

  for (const pos of positioned) {
    let placed = false;
    for (const col of columns) {
      const lastInCol = col[col.length - 1];
      const lastEnd = lastInCol.top + lastInCol.height;
      // No overlap: place here
      if (pos.top >= lastEnd - 2) { // -2px tolerance
        col.push(pos);
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push([pos]);
    }
  }

  // Assign left/width based on which overlapping group each event belongs to
  // First, find all events that overlap with each other in time
  for (let i = 0; i < positioned.length; i++) {
    const pos = positioned[i];
    const posEnd = pos.top + pos.height;

    // Find all events that overlap with this one
    const overlapping = positioned.filter((other) => {
      if (other === pos) return false;
      const otherEnd = other.top + other.height;
      return pos.top < otherEnd - 2 && posEnd > other.top + 2;
    });

    if (overlapping.length === 0) {
      pos.left = 0;
      pos.width = 100;
    }
  }

  // For true column distribution, assign each event to a visual column slot
  const slots: PositionedEvent[][] = [];

  for (const pos of positioned) {
    let slotIdx = -1;
    for (let s = 0; s < slots.length; s++) {
      const lastInSlot = slots[s][slots[s].length - 1];
      if (pos.top >= lastInSlot.top + lastInSlot.height - 2) {
        slotIdx = s;
        break;
      }
    }
    if (slotIdx === -1) {
      slotIdx = slots.length;
      slots.push([]);
    }
    slots[slotIdx].push(pos);
    pos.left = 0; // will be recalculated below
  }

  // Now that we have slot assignment, figure out how many slots overlap at each event
  for (const pos of positioned) {
    const posEnd = pos.top + pos.height;

    // Count how many total slots are "active" (have an overlapping event) at pos.top
    let activeSlots = 0;
    let mySlot = 0;

    for (let s = 0; s < slots.length; s++) {
      const hasOverlap = slots[s].some((other) => {
        const otherEnd = other.top + other.height;
        return pos.top < otherEnd - 2 && posEnd > other.top + 2;
      });
      if (hasOverlap) {
        if (slots[s].includes(pos)) mySlot = activeSlots;
        activeSlots++;
      }
    }

    if (activeSlots <= 1) {
      pos.left = 0;
      pos.width = 100;
    } else {
      pos.width = 100 / activeSlots;
      pos.left = mySlot * pos.width;
    }
  }

  return positioned;
}

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
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);

  const dayEvents = events.filter((ev) => ev.start_time.startsWith(selectedDate));
  const positioned = useMemo(() => layoutEvents(dayEvents), [dayEvents]);

  // Current time indicator
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const isToday = selectedDate === todayStr;
  const nowMinutes = (now.getHours() - START_HOUR) * 60 + now.getMinutes();
  const nowTop = (nowMinutes / 60) * HOUR_HEIGHT;

  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (
      target.classList.contains('day-events-area') ||
      target.classList.contains('hour-row-bg')
    ) {
      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      const hour = Math.floor(clickY / HOUR_HEIGHT) + START_HOUR;
      onOpenCreateAtHour(Math.min(Math.max(hour, START_HOUR), END_HOUR - 1));
    }
  };

  return (
    <div className="day-view-container glass-panel">
      {/* Scrollable time grid */}
      <div className="day-view-scroll">
        {/* Fixed left column: time labels */}
        <div className="day-time-column">
          {hours.map((hour) => (
            <div
              key={hour}
              className="day-time-label"
              style={{ height: HOUR_HEIGHT }}
            >
              <span>{hour.toString().padStart(2, '0')}:00</span>
            </div>
          ))}
        </div>

        {/* Right: events area */}
        <div
          className="day-events-area"
          style={{ height: TOTAL_HOURS * HOUR_HEIGHT, position: 'relative' }}
          onClick={handleGridClick}
        >
          {/* Hour separator lines */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="hour-row-bg"
              style={{
                position: 'absolute',
                top: (hour - START_HOUR) * HOUR_HEIGHT,
                left: 0,
                right: 0,
                height: HOUR_HEIGHT,
                borderTop: '1px solid var(--color-border)',
                cursor: 'pointer',
              }}
              onClick={() => onOpenCreateAtHour(hour)}
            >
              {/* Half-hour dashed line */}
              <div
                style={{
                  position: 'absolute',
                  top: HOUR_HEIGHT / 2,
                  left: 0,
                  right: 0,
                  borderTop: '1px dashed var(--color-border)',
                  opacity: 0.4,
                }}
              />
              {/* "+" hover hint */}
              <div className="hour-add-hint">
                <Plus size={12} />
                <span>Agendar às {hour.toString().padStart(2, '0')}:00</span>
              </div>
            </div>
          ))}

          {/* Current time indicator */}
          {isToday && nowMinutes >= 0 && nowMinutes < TOTAL_HOURS * 60 && (
            <div
              className="now-indicator"
              style={{ top: nowTop }}
            >
              <div className="now-dot" />
              <div className="now-line" />
            </div>
          )}

          {/* Positioned event blocks */}
          {positioned.map(({ event, top, height, left, width }) => {
            const parentProject = projects.find((p) => p.id === event.project_id);
            const linkedSubtask = subtasks.find((s) => s.id === event.subtask_id);
            const isShort = height < 48;

            return (
              <div
                key={event.id}
                style={{
                  position: 'absolute',
                  top,
                  height: Math.max(height, 28),
                  left: `${left}%`,
                  width: `calc(${width}% - 4px)`,
                  zIndex: 2,
                  padding: '0 2px',
                }}
              >
                <CalendarEventBlock
                  event={event}
                  parentProject={parentProject}
                  linkedSubtask={linkedSubtask}
                  onToggleEventCompleted={onToggleEventCompleted}
                  onDeleteEvent={onDeleteEvent}
                  onSelectSubtaskForFocus={onSelectSubtaskForFocus}
                  onOpenTimerTab={onOpenTimerTab}
                  compact={isShort}
                />
              </div>
            );
          })}

          {/* Empty state */}
          {positioned.length === 0 && (
            <div className="day-empty-state">
              <span>Nenhum evento. Clique em qualquer horário para agendar.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
