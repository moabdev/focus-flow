import React, { useState, useMemo, useEffect } from 'react';
import { CalendarEvent, Project, Subtask } from '@/features/core/types';
import { CustomSelect, SelectOption } from '@/features/core/components/common/CustomSelect';

interface CalendarEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  initialHour?: number;
  projects: Project[];
  subtasks: Subtask[];
  onAddEvent: (data: Omit<CalendarEvent, 'id'>) => Promise<CalendarEvent>;
}

export const CalendarEventModal: React.FC<CalendarEventModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  initialHour = 9,
  projects,
  subtasks,
  onAddEvent,
}) => {
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState(selectedDate);
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('10:00');
  const [eventProjectId, setEventProjectId] = useState<string>('');
  const [eventSubtaskId, setEventSubtaskId] = useState<string>('');
  const [eventColor, setEventColor] = useState('#ff2a5f');

  useEffect(() => {
    if (isOpen) {
      setEventTitle('');
      setEventDescription('');
      setEventDate(selectedDate);
      const startStr = `${initialHour.toString().padStart(2, '0')}:00`;
      const endStr = `${(initialHour + 1).toString().padStart(2, '0')}:00`;
      setEventStartTime(startStr);
      setEventEndTime(endStr);
      const defaultProj = projects[0];
      if (defaultProj) {
        setEventProjectId(defaultProj.id);
        setEventColor(defaultProj.color || '#ff2a5f');
      }
      setEventSubtaskId('');
    }
  }, [isOpen, selectedDate, initialHour, projects]);

  const availableSubtasks = useMemo(() => {
    if (!eventProjectId) return [];
    return subtasks.filter((s) => s.project_id === eventProjectId);
  }, [subtasks, eventProjectId]);

  const projectOptions: SelectOption[] = useMemo(() => [
    { value: '', label: 'Nenhum (Avulso)', icon: '📌' },
    ...projects.map((p) => ({
      value: p.id,
      label: p.title,
      icon: p.icon || '📁',
      badgeColor: p.color,
    })),
  ], [projects]);

  const subtaskOptions: SelectOption[] = useMemo(() => [
    { value: '', label: 'Nenhuma' },
    ...availableSubtasks.map((s) => ({
      value: s.id,
      label: `${s.title} (${s.priority})`,
      badgeColor: s.priority === 'alta' ? '#ff2a5f' : s.priority === 'media' ? '#f59e0b' : '#10b981',
    })),
  ], [availableSubtasks]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Novo Bloco de Estudo / Tarefa</h3>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-content">
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

          <div className="event-modal-datetime-grid">
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
            <div style={{ marginTop: '0.4rem' }}>
              <CustomSelect
                value={eventProjectId}
                options={projectOptions}
                onChange={(pid) => {
                  setEventProjectId(pid);
                  const p = projects.find((proj) => proj.id === pid);
                  if (p && p.color) setEventColor(p.color);
                  setEventSubtaskId('');
                }}
              />
            </div>
          </div>

          {eventProjectId && (
            <div>
              <label className="setting-label">Vincular a uma Subtask do Projeto</label>
              <div style={{ marginTop: '0.4rem' }}>
                <CustomSelect
                  value={eventSubtaskId}
                  options={subtaskOptions}
                  onChange={(sid) => setEventSubtaskId(sid)}
                />
              </div>
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
              onClick={onClose}
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
  );
};
