import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalendar } from '@/features/calendar/hooks/useCalendar';
import { storageService, DEFAULT_CALENDAR_EVENTS } from '@/features/core/api/storage';

vi.mock('@/features/core/api/storage', () => ({
  storageService: {
    fetchCalendarEvents: vi.fn(() => Promise.resolve([])),
    getLocalCalendarEvents: vi.fn(() => []),
    saveLocalCalendarEvents: vi.fn(),
    saveCalendarEvent: vi.fn(() => Promise.resolve()),
    deleteCalendarEvent: vi.fn(() => Promise.resolve()),
  },
  DEFAULT_CALENDAR_EVENTS: [{ id: 'def-1', title: 'Default Event', start_time: '2023-01-01T10:00:00Z', end_time: '2023-01-01T11:00:00Z', is_completed: false }]
}));

vi.mock('@/features/core/api/syncService', () => ({
  syncService: {
    onDataSynced: vi.fn(() => vi.fn())
  }
}));

describe('useCalendar Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve carregar eventos padrão se o storage estiver vazio', async () => {
    const { result } = renderHook(() => useCalendar());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(storageService.fetchCalendarEvents).toHaveBeenCalled();
    expect(result.current.events).toEqual(DEFAULT_CALENDAR_EVENTS);
    expect(storageService.saveLocalCalendarEvents).toHaveBeenCalledWith(DEFAULT_CALENDAR_EVENTS);
  });

  it('deve adicionar um novo evento e salvar no storage', async () => {
    const { result } = renderHook(() => useCalendar());
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
    
    let event: any;
    await act(async () => {
      event = await result.current.addEvent({
        title: 'Revisão Enem',
        start_time: '2023-05-10T14:00:00Z',
        end_time: '2023-05-10T16:00:00Z',
        is_completed: false
      });
    });
    
    // Como mockamos default no fetch, teremos 1 default + 1 novo
    expect(result.current.events.length).toBeGreaterThan(0);
    const added = result.current.events.find(e => e.id === event.id);
    expect(added).toBeDefined();
    expect(added?.title).toBe('Revisão Enem');
    expect(storageService.saveCalendarEvent).toHaveBeenCalled();
  });

  it('deve atualizar um evento existente', async () => {
    const { result } = renderHook(() => useCalendar());
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
    
    let event: any;
    await act(async () => {
      event = await result.current.addEvent({
        title: 'Original',
        start_time: '2023-05-10T14:00:00Z',
        end_time: '2023-05-10T16:00:00Z',
        is_completed: false
      });
    });
    
    await act(async () => {
      await result.current.updateEvent(event.id, { title: 'Modificado' });
    });
    
    const updated = result.current.events.find(e => e.id === event.id);
    expect(updated?.title).toBe('Modificado');
    expect(storageService.saveCalendarEvent).toHaveBeenCalledTimes(2);
  });

  it('deve alternar status de conclusão de um evento', async () => {
    const { result } = renderHook(() => useCalendar());
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
    
    let event: any;
    await act(async () => {
      event = await result.current.addEvent({
        title: 'Tarefa Concluível',
        start_time: '2023-05-10T14:00:00Z',
        end_time: '2023-05-10T16:00:00Z',
        is_completed: false
      });
    });
    
    expect(result.current.events.find(e => e.id === event.id)?.is_completed).toBe(false);
    
    await act(async () => {
      await result.current.toggleEventCompleted(event.id);
    });
    
    expect(result.current.events.find(e => e.id === event.id)?.is_completed).toBe(true);
  });

  it('deve filtrar eventos para a data selecionada', async () => {
    const { result } = renderHook(() => useCalendar());
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
    
    await act(async () => {
      await result.current.addEvent({
        title: 'Hoje',
        start_time: '2023-06-15T14:00:00Z',
        end_time: '2023-06-15T16:00:00Z',
        is_completed: false
      });
    });
    
    await act(async () => {
      await result.current.addEvent({
        title: 'Amanhã',
        start_time: '2023-06-16T14:00:00Z',
        end_time: '2023-06-16T16:00:00Z',
        is_completed: false
      });
    });
    
    await act(async () => {
      result.current.setSelectedDate('2023-06-15');
    });
    
    expect(result.current.eventsForSelectedDate.some(e => e.title === 'Hoje')).toBe(true);
    expect(result.current.eventsForSelectedDate.some(e => e.title === 'Amanhã')).toBe(false);
  });

  it('deve alterar a visualização do calendário', () => {
    const { result } = renderHook(() => useCalendar());
    
    expect(result.current.calendarView).toBe('day');
    
    act(() => {
      result.current.setCalendarView('month');
    });
    
    expect(result.current.calendarView).toBe('month');
  });

  it('deve deletar um evento', async () => {
    const { result } = renderHook(() => useCalendar());
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
    
    let event: any;
    await act(async () => {
      event = await result.current.addEvent({
        title: 'Para Deletar',
        start_time: '2023-06-15T14:00:00Z',
        end_time: '2023-06-15T16:00:00Z',
        is_completed: false
      });
    });
    
    expect(result.current.events.some(e => e.id === event.id)).toBe(true);
    
    await act(async () => {
      await result.current.deleteEvent(event.id);
    });
    
    expect(result.current.events.some(e => e.id === event.id)).toBe(false);
    expect(storageService.deleteCalendarEvent).toHaveBeenCalledWith(event.id);
  });
});
