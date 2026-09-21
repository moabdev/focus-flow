import React from 'react';
import { CustomSelect, SelectOption } from '@/features/core/components/common/CustomSelect';

interface CalendarEventFormProps {
  eventTitle: string;
  setEventTitle: (val: string) => void;
  eventDate: string;
  setEventDate: (val: string) => void;
  eventStartTime: string;
  setEventStartTime: (val: string) => void;
  eventEndTime: string;
  setEventEndTime: (val: string) => void;
  eventProjectId: string;
  setEventProjectId: (val: string) => void;
  eventSubtaskId: string;
  setEventSubtaskId: (val: string) => void;
  eventDescription: string;
  setEventDescription: (val: string) => void;
  projectOptions: SelectOption[];
  subtaskOptions: SelectOption[];
  onProjectChange: (pid: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const CalendarEventForm: React.FC<CalendarEventFormProps> = ({
  eventTitle,
  setEventTitle,
  eventDate,
  setEventDate,
  eventStartTime,
  setEventStartTime,
  eventEndTime,
  setEventEndTime,
  eventProjectId,
  eventSubtaskId,
  setEventSubtaskId,
  eventDescription,
  setEventDescription,
  projectOptions,
  subtaskOptions,
  onProjectChange,
  onSubmit,
  onCancel,
}) => {
  return (
    <form onSubmit={onSubmit} className="modal-content">
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
            onChange={onProjectChange}
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
          onClick={onCancel}
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
  );
};
