import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { CalendarEvent, Project, Subtask } from '../types';
import { CalendarEventBlock } from './calendar/CalendarEventBlock';
import { CalendarEventModal } from './calendar/CalendarEventModal';

interface CalendarViewProps {
  events: CalendarEvent[];
  projects: Project[];
  subtasks: Subtask[];
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  calendarView: 'day' | 'week' | 'month';
  onChangeView: (view: 'day' | 'week' | 'month') => void;
  onAddEvent: (data: Omit<CalendarEvent, 'id'>) => Promise<CalendarEvent>;
  onUpdateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
  onToggleEventCompleted: (id: string) => Promise<void>;
  onSelectSubtaskForFocus: (subtaskId: string) => void;
  onOpenTimerTab?: () => void;
}

// Horários de exibição na grade: 06:00 às 23:00
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6);

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  projects,
  subtasks,
  selectedDate,
  onSelectDate,
  calendarView,
  onChangeView,
  onAddEvent,
  onDeleteEvent,
  onToggleEventCompleted,
  onSelectSubtaskForFocus,
  onOpenTimerTab,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalHour, setModalHour] = useState(9);

  // Navegação de datas (anterior / hoje / próximo)
  const handleNavigateDate = (direction: 'prev' | 'next') => {
    const current = new Date(`${selectedDate}T12:00:00`);
    if (calendarView === 'day') {
      current.setDate(current.getDate() + (direction === 'next' ? 1 : -1));
    } else if (calendarView === 'week') {
      current.setDate(current.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      current.setMonth(current.getMonth() + (direction === 'next' ? 1 : -1));
    }
    onSelectDate(current.toISOString().split('T')[0]);
  };

  const handleSetToday = () => {
    onSelectDate(new Date().toISOString().split('T')[0]);
  };

  const handleOpenCreateAtHour = (hour: number) => {
    setModalHour(hour);
    setIsModalOpen(true);
  };

  // Eventos do dia selecionado
  const dayEvents = useMemo(() => {
    return events.filter((ev) => ev.start_time.startsWith(selectedDate));
  }, [events, selectedDate]);

  // Formata o dia para exibição amigável
  const formattedHeaderDate = useMemo(() => {
    const d = new Date(`${selectedDate}T12:00:00`);
    return d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [selectedDate]);

  return (
    <div className="calendar-view-container">
      {/* Header do Calendário */}
      <div className="calendar-header-bar">
        <div>
          <h2 className="pm-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CalendarIcon size={24} color="var(--accent-primary)" />
            Calendário & Agenda
          </h2>
          <p className="pm-subtitle">
            Organize blocos de tempo (*Time-Blocking*), agende tarefas por horário e comece a focar com 1 clique.
          </p>
        </div>

        <button
          className="main-start-btn"
          onClick={() => handleOpenCreateAtHour(9)}
        >
          <Plus size={16} /> Novo Agendamento
        </button>
      </div>

      {/* Controles de Navegação e Visão */}
      <div className="calendar-controls-bar glass-panel">
        <div className="calendar-nav-group">
          <button className="icon-btn" onClick={() => handleNavigateDate('prev')} title="Anterior">
            <ChevronLeft size={18} />
          </button>
          <button className="filter-chip" onClick={handleSetToday} title="Ir para hoje">
            Hoje
          </button>
          <button className="icon-btn" onClick={() => handleNavigateDate('next')} title="Próximo">
            <ChevronRight size={18} />
          </button>

          <span className="calendar-current-date-title">
            {formattedHeaderDate}
          </span>
        </div>

        <div className="calendar-view-toggle">
          <button
            className={`filter-chip ${calendarView === 'day' ? 'active' : ''}`}
            onClick={() => onChangeView('day')}
          >
            Dia
          </button>
          <button
            className={`filter-chip ${calendarView === 'week' ? 'active' : ''}`}
            onClick={() => onChangeView('week')}
          >
            Semana
          </button>
        </div>
      </div>

      {/* Grade de Horários (Time-Blocking) */}
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
                    handleOpenCreateAtHour(hour);
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
                    onClick={() => handleOpenCreateAtHour(hour)}
                  >
                    + Agendar tarefa neste horário
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Adicionar Evento no Calendário */}
      <CalendarEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        initialHour={modalHour}
        projects={projects}
        subtasks={subtasks}
        onAddEvent={onAddEvent}
      />
    </div>
  );
};
