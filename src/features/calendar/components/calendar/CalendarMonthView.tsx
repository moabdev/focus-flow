import React, { useMemo } from 'react';
import { CalendarEvent, Project } from '@/features/core/types';

interface CalendarMonthViewProps {
  events: CalendarEvent[];
  projects: Project[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onSwitchToDayView: () => void;
}

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  events,
  projects,
  selectedDate,
  onSelectDate,
  onSwitchToDayView,
}) => {
  const { monthDays } = useMemo(() => {
    const [yearStr, monthStr] = selectedDate.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // 0-indexed

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDaysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 is Sunday

    const todayStr = new Date().toISOString().split('T')[0];
    const cells = [];

    // Dias do mês anterior para preencher a primeira semana
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, d);
      const isoDate = prevDate.toISOString().split('T')[0];
      cells.push({
        isoDate,
        dayNum: d,
        isCurrentMonth: false,
        isToday: isoDate === todayStr,
        isSelected: isoDate === selectedDate,
      });
    }

    // Dias do mês atual
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const isoDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      cells.push({
        isoDate,
        dayNum: d,
        isCurrentMonth: true,
        isToday: isoDate === todayStr,
        isSelected: isoDate === selectedDate,
      });
    }

    // Dias do próximo mês para completar grid de 35 ou 42 células
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const isoDate = nextDate.toISOString().split('T')[0];
      cells.push({
        isoDate,
        dayNum: d,
        isCurrentMonth: false,
        isToday: isoDate === todayStr,
        isSelected: isoDate === selectedDate,
      });
    }

    const title = firstDay.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return {
      monthDays: cells,
      currentMonthYearTitle: title.charAt(0).toUpperCase() + title.slice(1),
    };
  }, [selectedDate]);

  const WEEK_HEADERS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

  return (
    <div className="calendar-month-container calendar-month-grid glass-panel">
      <div className="month-grid-header">
        {WEEK_HEADERS.map((dayName) => (
          <div key={dayName} className="month-weekday-header">
            {dayName}
          </div>
        ))}
      </div>

      <div className="month-grid-cells">
        {monthDays.map((cell) => {
          const dayEvents = events.filter((ev) => ev.start_time.startsWith(cell.isoDate));

          return (
            <div
              key={cell.isoDate}
              className={`month-day-cell ${cell.isCurrentMonth ? 'in-month' : 'out-month'} ${
                cell.isToday ? 'today' : ''
              } ${cell.isSelected ? 'selected' : ''}`}
              onClick={() => {
                onSelectDate(cell.isoDate);
                onSwitchToDayView();
              }}
              title={`Ver ${cell.isoDate} (${dayEvents.length} tarefas agendadas)`}
            >
              <div className="month-cell-top">
                <span className={`month-day-num ${cell.isToday ? 'today-badge' : ''}`}>
                  {cell.dayNum}
                </span>
                {dayEvents.length > 0 && (
                  <span className="month-event-count">{dayEvents.length}</span>
                )}
              </div>

              <div className="month-events-preview">
                {dayEvents.slice(0, 3).map((ev) => {
                  const parentProj = projects.find((p) => p.id === ev.project_id);
                  const dotColor = ev.color || parentProj?.color || 'var(--accent-primary)';
                  return (
                    <div key={ev.id} className="month-event-pill" style={{ borderLeftColor: dotColor }}>
                      <span className="month-event-dot" style={{ backgroundColor: dotColor }} />
                      <span className="month-event-text">{ev.title}</span>
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <span className="month-more-events">+{dayEvents.length - 3} mais</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
