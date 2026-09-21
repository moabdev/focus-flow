import React, { useState, useMemo, useEffect } from 'react';
import { CalendarEvent, Project, Subtask } from '@/features/core/types';
import { SelectOption } from '@/features/core/components/common/CustomSelect';
import { CalendarEventForm } from './CalendarEventForm';

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

  const handleProjectChange = (pid: string) => {
    setEventProjectId(pid);
    const p = projects.find((proj) => proj.id === pid);
    if (p && p.color) setEventColor(p.color);
    setEventSubtaskId('');
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

        <CalendarEventForm
          eventTitle={eventTitle}
          setEventTitle={setEventTitle}
          eventDate={eventDate}
          setEventDate={setEventDate}
          eventStartTime={eventStartTime}
          setEventStartTime={setEventStartTime}
          eventEndTime={eventEndTime}
          setEventEndTime={setEventEndTime}
          eventProjectId={eventProjectId}
          setEventProjectId={setEventProjectId}
          eventSubtaskId={eventSubtaskId}
          setEventSubtaskId={setEventSubtaskId}
          eventDescription={eventDescription}
          setEventDescription={setEventDescription}
          projectOptions={projectOptions}
          subtaskOptions={subtaskOptions}
          onProjectChange={handleProjectChange}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  );
};
