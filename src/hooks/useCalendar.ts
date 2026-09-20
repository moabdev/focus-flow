import { useState, useEffect, useCallback, useMemo } from 'react';
import { CalendarEvent } from '../types';
import { storageService, DEFAULT_CALENDAR_EVENTS } from '../services/storage';

export function useCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('week');

  useEffect(() => {
    storageService.fetchCalendarEvents().then((loaded) => {
      if (loaded.length === 0) {
        storageService.saveLocalCalendarEvents(DEFAULT_CALENDAR_EVENTS);
        setEvents(DEFAULT_CALENDAR_EVENTS);
      } else {
        setEvents(loaded);
      }
    });
  }, []);

  const addEvent = useCallback(
    async (eventData: Omit<CalendarEvent, 'id'>) => {
      const newEvent: CalendarEvent = {
        ...eventData,
        id: `cal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      };

      const updated = [...events, newEvent];
      setEvents(updated);
      await storageService.saveCalendarEvent(newEvent);
      return newEvent;
    },
    [events]
  );

  const updateEvent = useCallback(
    async (id: string, updates: Partial<CalendarEvent>) => {
      const index = events.findIndex((e) => e.id === id);
      if (index === -1) return;

      const updatedEvent = { ...events[index], ...updates };
      const updatedList = [...events];
      updatedList[index] = updatedEvent;
      setEvents(updatedList);
      await storageService.saveCalendarEvent(updatedEvent);
    },
    [events]
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      const updated = events.filter((e) => e.id !== id);
      setEvents(updated);
      await storageService.deleteCalendarEvent(id);
    },
    [events]
  );

  const toggleEventCompleted = useCallback(
    async (id: string) => {
      const target = events.find((e) => e.id === id);
      if (!target) return;

      const updatedEvent: CalendarEvent = {
        ...target,
        is_completed: !target.is_completed,
      };

      const updatedList = events.map((e) => (e.id === id ? updatedEvent : e));
      setEvents(updatedList);
      await storageService.saveCalendarEvent(updatedEvent);
    },
    [events]
  );

  // Eventos do dia selecionado
  const eventsForSelectedDate = useMemo(() => {
    return events.filter((e) => e.start_time.startsWith(selectedDate));
  }, [events, selectedDate]);

  return {
    events,
    selectedDate,
    setSelectedDate,
    calendarView,
    setCalendarView,
    eventsForSelectedDate,
    addEvent,
    updateEvent,
    deleteEvent,
    toggleEventCompleted,
  };
}
