import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { CalendarEvent, Project, Subtask, CalendarViewMode } from '@/features/core/types';
import { CalendarDayView } from './calendar/CalendarDayView';
import { CalendarWeekView } from './calendar/CalendarWeekView';
import { CalendarMonthView } from './calendar/CalendarMonthView';
import { CalendarEventModal } from './calendar/CalendarEventModal';
import { GoogleCalendarSyncPanel } from './calendar/GoogleCalendarSyncPanel';
import { OutlookCalendarSyncPanel } from './calendar/OutlookCalendarSyncPanel';
import { CloudCalendarSyncStatus } from '@/features/calendar/hooks/useCalendar';
import { MicrosoftCalendarResource } from '@/services/calendar/outlookCalendarService';

interface CalendarViewProps {
  events: CalendarEvent[];
  projects: Project[];
  subtasks: Subtask[];
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  calendarView: CalendarViewMode;
  onChangeView: (view: CalendarViewMode) => void;
  onAddEvent: (data: Omit<CalendarEvent, 'id'>) => Promise<CalendarEvent>;
  onUpdateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
  onToggleEventCompleted: (id: string) => Promise<void>;
  onSelectSubtaskForFocus: (subtaskId: string) => void;
  onOpenTimerTab?: () => void;
  onImportGoogleEvents: (events: CalendarEvent[]) => void;
  onBulkUpdateEvents: (events: CalendarEvent[]) => void;
  googleSyncStatus: CloudCalendarSyncStatus;
  lastGoogleSync: Date | null;
  onManualGoogleSync: () => void;
  outlookSyncStatus: CloudCalendarSyncStatus;
  lastOutlookSync: Date | null;
  onManualOutlookSync: () => void;
  availableOutlookCalendars: MicrosoftCalendarResource[];
  selectedOutlookCalendars: string[];
  toggleOutlookCalendarSelection: (id: string) => void;
}

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
  onImportGoogleEvents,
  onBulkUpdateEvents,
  googleSyncStatus,
  lastGoogleSync,
  onManualGoogleSync,
  outlookSyncStatus,
  lastOutlookSync,
  onManualOutlookSync,
  availableOutlookCalendars,
  selectedOutlookCalendars,
  toggleOutlookCalendarSelection,
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

  const handleOpenCreateForDate = (dateStr: string) => {
    onSelectDate(dateStr);
    setModalHour(9);
    setIsModalOpen(true);
  };

  // Formatação amigável de cabeçalho
  const formattedHeaderDate = useMemo(() => {
    const d = new Date(`${selectedDate}T12:00:00`);
    if (calendarView === 'month') {
      const monthTitle = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      return monthTitle.charAt(0).toUpperCase() + monthTitle.slice(1);
    }
    return d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [selectedDate, calendarView]);

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

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <GoogleCalendarSyncPanel
            syncStatus={googleSyncStatus}
            lastSyncTime={lastGoogleSync}
            onManualSync={onManualGoogleSync}
          />
          <OutlookCalendarSyncPanel
            syncStatus={outlookSyncStatus}
            lastSyncTime={lastOutlookSync}
            onManualSync={onManualOutlookSync}
            availableCalendars={availableOutlookCalendars}
            selectedCalendars={selectedOutlookCalendars}
            onToggleCalendar={toggleOutlookCalendarSelection}
          />
          
          <button
            className="main-start-btn"
            onClick={() => handleOpenCreateAtHour(9)}
          >
            <Plus size={16} /> Novo Agendamento
          </button>
        </div>
      </div>

      {/* Controles de Navegação e Seletor de Visão (Dia / Semana / Mês) */}
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
          <button
            className={`filter-chip ${calendarView === 'month' ? 'active' : ''}`}
            onClick={() => onChangeView('month')}
          >
            Mês
          </button>
        </div>
      </div>

      {/* Renderização Condicional das Visões */}
      {calendarView === 'day' && (
        <CalendarDayView
          events={events}
          projects={projects}
          subtasks={subtasks}
          selectedDate={selectedDate}
          onToggleEventCompleted={onToggleEventCompleted}
          onDeleteEvent={onDeleteEvent}
          onSelectSubtaskForFocus={onSelectSubtaskForFocus}
          onOpenTimerTab={onOpenTimerTab}
          onOpenCreateAtHour={handleOpenCreateAtHour}
        />
      )}

      {calendarView === 'week' && (
        <CalendarWeekView
          events={events}
          projects={projects}
          subtasks={subtasks}
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
          onToggleEventCompleted={onToggleEventCompleted}
          onDeleteEvent={onDeleteEvent}
          onSelectSubtaskForFocus={onSelectSubtaskForFocus}
          onOpenTimerTab={onOpenTimerTab}
          onOpenCreateForDate={handleOpenCreateForDate}
        />
      )}

      {calendarView === 'month' && (
        <CalendarMonthView
          events={events}
          projects={projects}
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
          onSwitchToDayView={() => onChangeView('day')}
        />
      )}

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
