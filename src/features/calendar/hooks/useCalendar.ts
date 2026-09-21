import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CalendarEvent } from '@/features/core/types';
import { storageService, DEFAULT_CALENDAR_EVENTS } from '@/features/core/api/storage';
import { syncService } from '@/features/core/api/syncService';
import {
  getGoogleAccessToken,
  fetchGoogleCalendarEvents,
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from '@/services/calendar/googleCalendarService';
import {
  getMicrosoftAccessToken,
  fetchOutlookCalendarEvents,
  createOutlookCalendarEvent,
  updateOutlookCalendarEvent,
  deleteOutlookCalendarEvent,
} from '@/services/calendar/outlookCalendarService';

/** How often to auto-pull from Google/Outlook Calendar (in milliseconds) */
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export type CloudCalendarSyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'disconnected';

export function useCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('day');
  
  const [googleSyncStatus, setGoogleSyncStatus] = useState<CloudCalendarSyncStatus>('idle');
  const [lastGoogleSync, setLastGoogleSync] = useState<Date | null>(null);
  
  const [outlookSyncStatus, setOutlookSyncStatus] = useState<CloudCalendarSyncStatus>('idle');
  const [lastOutlookSync, setLastOutlookSync] = useState<Date | null>(null);

  // Use a ref to always have the latest events inside async callbacks without stale closures
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

  // ─── Google Calendar Pull (bidirectional: Google → FocusFlow) ───────────────

  const pullFromGoogle = useCallback(async (silent = false) => {
    const token = await getGoogleAccessToken();
    if (!token) {
      setGoogleSyncStatus('disconnected');
      return;
    }

    if (!silent) setGoogleSyncStatus('syncing');

    try {
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString();

      const googleEvents = await fetchGoogleCalendarEvents(token, timeMin, timeMax);

      setEvents((prev) => {
        const localByGoogleId = new Map<string, CalendarEvent>();
        prev.forEach((e) => {
          if (e.google_event_id) localByGoogleId.set(e.google_event_id, e);
        });

        const pulledGoogleIds = new Set(googleEvents.map((e) => e.google_event_id!));
        const withoutStale = prev.filter(
          (e) => e.source !== 'google' || (e.google_event_id && pulledGoogleIds.has(e.google_event_id))
        );

        const merged = [...withoutStale];
        for (const ge of googleEvents) {
          const existingIdx = merged.findIndex(
            (e) => e.google_event_id === ge.google_event_id
          );
          if (existingIdx >= 0) {
            merged[existingIdx] = { ...merged[existingIdx], ...ge };
          } else {
            merged.push(ge);
          }
        }

        storageService.saveLocalCalendarEvents(merged);
        return merged;
      });

      setGoogleSyncStatus('synced');
      setLastGoogleSync(new Date());
    } catch (err) {
      console.warn('[GoogleSync] Pull failed:', err);
      setGoogleSyncStatus('error');
    }
  }, []);

  // ─── Outlook Calendar Pull (bidirectional: Outlook → FocusFlow) ───────────────

  const pullFromOutlook = useCallback(async (silent = false) => {
    const token = await getMicrosoftAccessToken();
    if (!token) {
      setOutlookSyncStatus('disconnected');
      return;
    }

    if (!silent) setOutlookSyncStatus('syncing');

    try {
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString();

      const outlookEvents = await fetchOutlookCalendarEvents(token, timeMin, timeMax);

      setEvents((prev) => {
        const localByOutlookId = new Map<string, CalendarEvent>();
        prev.forEach((e) => {
          if (e.outlook_event_id) localByOutlookId.set(e.outlook_event_id, e);
        });

        const pulledOutlookIds = new Set(outlookEvents.map((e) => e.outlook_event_id!));
        const withoutStale = prev.filter(
          (e) => e.source !== 'outlook' || (e.outlook_event_id && pulledOutlookIds.has(e.outlook_event_id))
        );

        const merged = [...withoutStale];
        for (const oe of outlookEvents) {
          const existingIdx = merged.findIndex(
            (e) => e.outlook_event_id === oe.outlook_event_id
          );
          if (existingIdx >= 0) {
            merged[existingIdx] = { ...merged[existingIdx], ...oe };
          } else {
            merged.push(oe);
          }
        }

        storageService.saveLocalCalendarEvents(merged);
        return merged;
      });

      setOutlookSyncStatus('synced');
      setLastOutlookSync(new Date());
    } catch (err) {
      console.warn('[OutlookSync] Pull failed:', err);
      setOutlookSyncStatus('error');
    }
  }, []);

  // Auto-pull on mount
  useEffect(() => {
    pullFromGoogle(true);
    pullFromOutlook(true);
  }, [pullFromGoogle, pullFromOutlook]);

  // Auto-pull every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      pullFromGoogle(true);
      pullFromOutlook(true);
    }, SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [pullFromGoogle, pullFromOutlook]);

  // Auto-pull when the browser tab regains focus
  useEffect(() => {
    const onFocus = () => {
      pullFromGoogle(true);
      pullFromOutlook(true);
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [pullFromGoogle, pullFromOutlook]);

  // ─── Google Calendar Push helpers ───────────────────────────────────────────

  const pushNewToGoogle = useCallback(async (event: CalendarEvent): Promise<CalendarEvent> => {
    const token = await getGoogleAccessToken();
    if (!token || event.source === 'google' || event.source === 'outlook') return event;

    try {
      const googleId = await createGoogleCalendarEvent(token, event);
      return { ...event, google_event_id: googleId };
    } catch (err) {
      console.warn('[GoogleSync] Push (create) failed:', err);
      return event;
    }
  }, []);

  const pushUpdateToGoogle = useCallback(async (event: CalendarEvent): Promise<void> => {
    if (!event.google_event_id || event.source === 'google') return;
    const token = await getGoogleAccessToken();
    if (!token) return;

    try {
      await updateGoogleCalendarEvent(token, event.google_event_id, event);
    } catch (err) {
      console.warn('[GoogleSync] Push (update) failed:', err);
    }
  }, []);

  const pushDeleteToGoogle = useCallback(async (googleEventId: string): Promise<void> => {
    const token = await getGoogleAccessToken();
    if (!token) return;

    try {
      await deleteGoogleCalendarEvent(token, googleEventId);
    } catch (err) {
      console.warn('[GoogleSync] Push (delete) failed:', err);
    }
  }, []);

  // ─── Outlook Calendar Push helpers ──────────────────────────────────────────

  const pushNewToOutlook = useCallback(async (event: CalendarEvent): Promise<CalendarEvent> => {
    const token = await getMicrosoftAccessToken();
    if (!token || event.source === 'outlook' || event.source === 'google') return event;

    try {
      const outlookId = await createOutlookCalendarEvent(token, event);
      return { ...event, outlook_event_id: outlookId };
    } catch (err) {
      console.warn('[OutlookSync] Push (create) failed:', err);
      return event;
    }
  }, []);

  const pushUpdateToOutlook = useCallback(async (event: CalendarEvent): Promise<void> => {
    if (!event.outlook_event_id || event.source === 'outlook') return;
    const token = await getMicrosoftAccessToken();
    if (!token) return;

    try {
      await updateOutlookCalendarEvent(token, event.outlook_event_id, event);
    } catch (err) {
      console.warn('[OutlookSync] Push (update) failed:', err);
    }
  }, []);

  const pushDeleteToOutlook = useCallback(async (outlookEventId: string): Promise<void> => {
    const token = await getMicrosoftAccessToken();
    if (!token) return;

    try {
      await deleteOutlookCalendarEvent(token, outlookEventId);
    } catch (err) {
      console.warn('[OutlookSync] Push (delete) failed:', err);
    }
  }, []);

  // ─── CRUD with auto-sync ─────────────────────────────────────────────────────

  const addEvent = useCallback(
    async (eventData: Omit<CalendarEvent, 'id'>) => {
      let newEvent: CalendarEvent = {
        ...eventData,
        id: `cal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        source: eventData.source || 'local',
      };

      setEvents((prev) => [...prev, newEvent]);
      await storageService.saveCalendarEvent(newEvent);

      // Push to Google (if connected)
      newEvent = await pushNewToGoogle(newEvent);
      if (newEvent.google_event_id) {
        setEvents((prev) => prev.map((e) => (e.id === newEvent.id ? newEvent : e)));
        await storageService.saveCalendarEvent(newEvent);
      }

      // Push to Outlook (if connected)
      newEvent = await pushNewToOutlook(newEvent);
      if (newEvent.outlook_event_id) {
        setEvents((prev) => prev.map((e) => (e.id === newEvent.id ? newEvent : e)));
        await storageService.saveCalendarEvent(newEvent);
      }

      return newEvent;
    },
    [pushNewToGoogle, pushNewToOutlook]
  );

  const updateEvent = useCallback(
    async (id: string, updates: Partial<CalendarEvent>) => {
      const current = eventsRef.current;
      const index = current.findIndex((e) => e.id === id);
      if (index === -1) return;

      const updatedEvent = { ...current[index], ...updates };
      setEvents((prev) => prev.map((e) => (e.id === id ? updatedEvent : e)));
      await storageService.saveCalendarEvent(updatedEvent);

      await pushUpdateToGoogle(updatedEvent);
      await pushUpdateToOutlook(updatedEvent);
    },
    [pushUpdateToGoogle, pushUpdateToOutlook]
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      const target = eventsRef.current.find((e) => e.id === id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      await storageService.deleteCalendarEvent(id);

      if (target?.google_event_id) {
        await pushDeleteToGoogle(target.google_event_id);
      }
      if (target?.outlook_event_id) {
        await pushDeleteToOutlook(target.outlook_event_id);
      }
    },
    [pushDeleteToGoogle, pushDeleteToOutlook]
  );

  const toggleEventCompleted = useCallback(
    async (id: string) => {
      const target = eventsRef.current.find((e) => e.id === id);
      if (!target) return;

      const updatedEvent: CalendarEvent = { ...target, is_completed: !target.is_completed };
      setEvents((prev) => prev.map((e) => (e.id === id ? updatedEvent : e)));
      await storageService.saveCalendarEvent(updatedEvent);
      
      await pushUpdateToGoogle(updatedEvent);
      await pushUpdateToOutlook(updatedEvent);
    },
    [pushUpdateToGoogle, pushUpdateToOutlook]
  );

  // Eventos do dia selecionado
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
    // Google sync state (for UI)
    googleSyncStatus,
    lastGoogleSync,
    pullFromGoogle,
    // Outlook sync state (for UI)
    outlookSyncStatus,
    lastOutlookSync,
    pullFromOutlook,
  };
}
