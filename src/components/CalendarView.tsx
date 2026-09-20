import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  Trash2,
  Play,
  Check,
  Sparkles,
} from 'lucide-react';
import { CalendarEvent, Project, Subtask } from '../types';

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
  onUpdateEvent,
  onDeleteEvent,
  onToggleEventCompleted,
  onSelectSubtaskForFocus,
  onOpenTimerTab,
}) => {
  // Modal de Criação / Edição de Evento
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState(selectedDate);
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('10:00');
  const [eventProjectId, setEventProjectId] = useState<string>('');
  const [eventSubtaskId, setEventSubtaskId] = useState<string>('');
  const [eventColor, setEventColor] = useState('#ff2a5f');

  // Subtarefas do projeto selecionado no formulário
  const availableSubtasks = useMemo(() => {
    if (!eventProjectId) return [];
    return subtasks.filter((s) => s.project_id === eventProjectId);
  }, [subtasks, eventProjectId]);

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
    const startStr = `${hour.toString().padStart(2, '0')}:00`;
    const endStr = `${(hour + 1).toString().padStart(2, '0')}:00`;
    setEventTitle('');
    setEventDescription('');
    setEventDate(selectedDate);
    setEventStartTime(startStr);
    setEventEndTime(endStr);
    const defaultProj = projects[0];
    if (defaultProj) {
      setEventProjectId(defaultProj.id);
      setEventColor(defaultProj.color || '#ff2a5f');
    }
    setIsModalOpen(true);
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    const start_time = `${eventDate}T${eventStartTime}:00`;
    const end_time = `${eventDate}T${eventEndTime}:00`;

    await onAddEvent({
      title: eventTitle.trim(),
      description: eventDescription.trim(),
      start_time,
      end_time,
      project_id: eventProjectId || undefined,
      subtask_id: eventSubtaskId || undefined,
      color: eventColor,
      is_completed: false,
    });

    setIsModalOpen(false);
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
          onClick={() => {
            handleOpenCreateAtHour(9);
          }}
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
          // Encontra eventos neste horário
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
                  // Se clicou no fundo vazio do slot, abre criação para este horário
                  if ((e.target as HTMLElement).classList.contains('time-slot-content')) {
                    handleOpenCreateAtHour(hour);
                  }
                }}
              >
                {slotEvents.map((ev) => {
                  const parentProject = projects.find((p) => p.id === ev.project_id);
                  const linkedSubtask = subtasks.find((s) => s.id === ev.subtask_id);

                  return (
                    <div
                      key={ev.id}
                      className={`calendar-event-block ${ev.is_completed ? 'completed' : ''}`}
                      style={{
                        borderLeft: `4px solid ${ev.color || parentProject?.color || 'var(--accent-primary)'}`,
                        backgroundColor: `${ev.color || parentProject?.color || 'var(--accent-primary)'}18`,
                      }}
                    >
                      <button
                        className={`task-checkbox ${ev.is_completed ? 'checked' : ''}`}
                        onClick={() => onToggleEventCompleted(ev.id)}
                        title={ev.is_completed ? 'Desmarcar' : 'Concluir agendamento'}
                      >
                        {ev.is_completed && <Check size={12} />}
                      </button>

                      <div className="event-info">
                        <div className="event-title-row">
                          <strong className="event-title">{ev.title}</strong>
                          <span className="event-time-range">
                            {ev.start_time.split('T')[1]?.slice(0, 5)} - {ev.end_time.split('T')[1]?.slice(0, 5)}
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
                          onClick={() => onDeleteEvent(ev.id)}
                          title="Excluir agendamento"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
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
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Novo Bloco de Estudo / Tarefa</h3>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitEvent} className="modal-content">
              <div>
                <label className="setting-label">Título da Tarefa / Bloco</label>
                <input
                  type="text"
                  placeholder="Ex: Resolver 20 questões de SQL, Leitura capítulo 4..."
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid var(--border-glass-subtle)',
                    color: 'var(--text-primary)',
                    marginTop: '0.4rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="setting-label">Data</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid var(--border-glass-subtle)',
                      color: 'var(--text-primary)',
                      marginTop: '0.4rem',
                    }}
                  />
                </div>
                <div>
                  <label className="setting-label">Início</label>
                  <input
                    type="time"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid var(--border-glass-subtle)',
                      color: 'var(--text-primary)',
                      marginTop: '0.4rem',
                    }}
                  />
                </div>
                <div>
                  <label className="setting-label">Término</label>
                  <input
                    type="time"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid var(--border-glass-subtle)',
                      color: 'var(--text-primary)',
                      marginTop: '0.4rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="setting-label">Vincular a um Projeto</label>
                <select
                  value={eventProjectId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setEventProjectId(pid);
                    const p = projects.find((proj) => proj.id === pid);
                    if (p && p.color) setEventColor(p.color);
                    setEventSubtaskId('');
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid var(--border-glass-subtle)',
                    color: 'var(--text-primary)',
                    marginTop: '0.4rem',
                  }}
                >
                  <option value="">Nenhum (Avulso)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.icon || '📁'} {p.title}
                    </option>
                  ))}
                </select>
              </div>

              {eventProjectId && (
                <div>
                  <label className="setting-label">Vincular a uma Subtask do Projeto</label>
                  <select
                    value={eventSubtaskId}
                    onChange={(e) => setEventSubtaskId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid var(--border-glass-subtle)',
                      color: 'var(--text-primary)',
                      marginTop: '0.4rem',
                    }}
                  >
                    <option value="">Nenhuma</option>
                    {availableSubtasks.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({s.priority})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="setting-label">Observações / Detalhes</label>
                <textarea
                  placeholder="Instruções para a sessão de foco..."
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid var(--border-glass-subtle)',
                    color: 'var(--text-primary)',
                    marginTop: '0.4rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="filter-chip"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="main-start-btn"
                  style={{ padding: '0.65rem 1.5rem', fontSize: '0.9rem' }}
                >
                  Agendar Bloco
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
