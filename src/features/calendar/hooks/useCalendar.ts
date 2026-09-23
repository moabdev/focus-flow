import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CalendarEvent } from '@/features/core/types';
import { storageService, DEFAULT_CALENDAR_EVENTS } from '@/features/core/api/storage';
import { syncService } from '@/features/core/api/syncService';
import { useCalendarSync } from './useCalendarSync';
export type { CloudCalendarSyncStatus } from './useCalendarTypes';

export function useCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('day');

  const eventsRef = useRef<CalendarEvent[]>([]);
  eventsRef.current = events;

  const refreshEvents = useCallback(() => {
    const loaded = storageService.getLocalCalendarEvents();
    setEvents(loaded);
  }, []);

  useEffect(() => {
    const unsubscribe = syncService.onDataSynced(() => {
      refreshEvents();
    });
    return () => unsubscribe();
  }, [refreshEvents]);

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

  const sync = useCalendarSync(setEvents, eventsRef);

  const addEvent = useCallback(
    async (eventData: Omit<CalendarEvent, 'id'>) => {
      let newEvent: CalendarEvent = {
        ...eventData,
        id: `cal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        source: eventData.source || 'local',
      };

      setEvents((prev) => [...prev, newEvent]);
      await storageService.saveCalendarEvent(newEvent);

      newEvent = await sync.pushNewToGoogle(newEvent);
      if (newEvent.google_event_id) {
        setEvents((prev) => prev.map((e) => (e.id === newEvent.id ? newEvent : e)));
        await storageService.saveCalendarEvent(newEvent);
      }

      newEvent = await sync.pushNewToOutlook(newEvent);
      if (newEvent.outlook_event_id) {
        setEvents((prev) => prev.map((e) => (e.id === newEvent.id ? newEvent : e)));
        await storageService.saveCalendarEvent(newEvent);
      }

      return newEvent;
    },
    [sync]
  );

  const updateEvent = useCallback(
    async (id: string, updates: Partial<CalendarEvent>) => {
      const current = eventsRef.current;
      const index = current.findIndex((e) => e.id === id);
      if (index === -1) return;

      const updatedEvent = { ...current[index], ...updates };
      setEvents((prev) => prev.map((e) => (e.id === id ? updatedEvent : e)));
      await storageService.saveCalendarEvent(updatedEvent);

      await sync.pushUpdateToGoogle(updatedEvent);
      await sync.pushUpdateToOutlook(updatedEvent);
    },
    [sync]
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      const target = eventsRef.current.find((e) => e.id === id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      await storageService.deleteCalendarEvent(id);

      if (target?.google_event_id) {
        await sync.pushDeleteToGoogle(target.google_event_id);
      }
      if (target?.outlook_event_id) {
        await sync.pushDeleteToOutlook(target.outlook_event_id);
      }
    },
    [sync]
  );

  const toggleEventCompleted = useCallback(
    async (id: string) => {
      const target = eventsRef.current.find((e) => e.id === id);
      if (!target) return;

      const updatedEvent: CalendarEvent = { ...target, is_completed: !target.is_completed };
      setEvents((prev) => prev.map((e) => (e.id === id ? updatedEvent : e)));
      await storageService.saveCalendarEvent(updatedEvent);
      
      await sync.pushUpdateToGoogle(updatedEvent);
      await sync.pushUpdateToOutlook(updatedEvent);
    },
    [sync]
  );

  const eventsForSelectedDate = useMemo(() => {
    return events.filter((e) => e.start_time.startsWith(selectedDate));
  }, [events, selectedDate]);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  const importGoogleEvents = useCallback(
    (googleEvents: CalendarEvent[]) => {
      setEvents((prev) => {
        const merged = [...prev, ...googleEvents];
        storageService.saveLocalCalendarEvents(merged);
        return merged;
      });
    },
    []
  );

  const bulkUpdateEvents = useCallback((updatedEvents: CalendarEvent[]) => {
    setEvents(updatedEvents);
    storageService.saveLocalCalendarEvents(updatedEvents);
  }, []);

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
    clearEvents,
    refreshEvents,
    importGoogleEvents,
    bulkUpdateEvents,
    ...sync,
  };
}
