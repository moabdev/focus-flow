import { describe, it, expect, beforeEach } from 'vitest';
import { storageService } from '@/features/core/api/storage';
import { CalendarEvent, Project, Subtask } from '@/features/core/types';

describe('Ações de Calendário & Time-Blocking (Agendamentos e Conclusão)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockProject: Project = {
    id: 'proj-cal-1',
    title: 'Preparatório OAB',
    color: '#3b82f6',
    total_elapsed_seconds: 0,
    created_at: new Date().toISOString(),
  };

  const mockSubtask: Subtask = {
    id: 'sub-cal-1',
    project_id: 'proj-cal-1',
    title: 'Direito Processual Civil',
    priority: 'alta',
    pomodoros_estimated: 2,
    pomodoros_completed: 0,
    elapsed_seconds: 0,
    is_completed: false,
    created_at: new Date().toISOString(),
  };

  it('deve criar um evento de calendário vinculado a um projeto e subtarefa', async () => {
    await storageService.saveProject(mockProject);
    await storageService.saveSubtask(mockSubtask);

    const event: CalendarEvent = {
      id: 'cal-act-1',
      title: 'Sessão Matinal de Processo Civil',
      description: 'Revisão de recursos e jurisprudência',
      start_time: '2026-09-20T08:00',
      end_time: '2026-09-20T09:30',
      project_id: 'proj-cal-1',
      subtask_id: 'sub-cal-1',
      color: '#3b82f6',
      is_completed: false,
    };

    await storageService.saveCalendarEvent(event);

    const events = storageService.getLocalCalendarEvents();
    expect(events.length).toBe(1);
    expect(events[0].id).toBe('cal-act-1');
    expect(events[0].title).toBe('Sessão Matinal de Processo Civil');
    expect(events[0].project_id).toBe('proj-cal-1');
    expect(events[0].subtask_id).toBe('sub-cal-1');
    expect(events[0].is_completed).toBe(false);
  });

  it('deve alternar o status de conclusão de um evento de calendário', async () => {
    const event: CalendarEvent = {
      id: 'cal-act-2',
      title: 'Bloco de Exercícios',
      start_time: '2026-09-20T14:00',
      end_time: '2026-09-20T15:00',
      color: '#10b981',
      is_completed: false,
    };

    await storageService.saveCalendarEvent(event);

    // Marca como concluído
    await storageService.toggleCalendarEventCompleted('cal-act-2');
    let loaded = storageService.getLocalCalendarEvents();
    expect(loaded.find((e) => e.id === 'cal-act-2')?.is_completed).toBe(true);

    // Desmarca como concluído
    await storageService.toggleCalendarEventCompleted('cal-act-2');
    loaded = storageService.getLocalCalendarEvents();
    expect(loaded.find((e) => e.id === 'cal-act-2')?.is_completed).toBe(false);
  });

  it('deve atualizar o horário e detalhes de um evento de calendário', async () => {
    const event: CalendarEvent = {
      id: 'cal-act-3',
      title: 'Reunião de Estudos',
      start_time: '2026-09-20T16:00',
      end_time: '2026-09-20T17:00',
      color: '#f59e0b',
      is_completed: false,
    };

    await storageService.saveCalendarEvent(event);

    // Modifica horário e título
    const updatedEvent: CalendarEvent = {
      ...event,
      title: 'Reunião de Estudos Estendida',
      end_time: '2026-09-20T17:30',
    };
    await storageService.saveCalendarEvent(updatedEvent);

    const loaded = storageService.getLocalCalendarEvents();
    expect(loaded[0].title).toBe('Reunião de Estudos Estendida');
    expect(loaded[0].end_time).toBe('2026-09-20T17:30');
  });

  it('deve excluir um evento de calendário com sucesso', async () => {
    const event: CalendarEvent = {
      id: 'cal-act-4',
      title: 'Evento a ser excluído',
      start_time: '2026-09-20T18:00',
      end_time: '2026-09-20T19:00',
      color: '#ef4444',
      is_completed: false,
    };

    await storageService.saveCalendarEvent(event);
    expect(storageService.getLocalCalendarEvents().length).toBe(1);

    await storageService.deleteCalendarEvent('cal-act-4');
    expect(storageService.getLocalCalendarEvents().length).toBe(0);
  });
});
