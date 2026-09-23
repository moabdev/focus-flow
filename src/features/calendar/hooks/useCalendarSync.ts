import { useState, useCallback, useEffect, useRef } from 'react';
import { CalendarEvent } from '@/features/core/types';
import { storageService } from '@/features/core/api/storage';
import { CloudCalendarSyncStatus } from './useCalendarTypes';
import {
  getGoogleAccessToken,
  fetchGoogleCalendarEvents,
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from '@/services/calendar/googleCalendarService';
import {
  getMicrosoftAccessToken,
  fetchOutlookCalendars,
  fetchOutlookCalendarEvents,
  createOutlookCalendarEvent,
  updateOutlookCalendarEvent,
  deleteOutlookCalendarEvent,
  MicrosoftCalendarResource,
} from '@/services/calendar/outlookCalendarService';

const SYNC_INTERVAL_MS = 5 * 60 * 1000;

export function useCalendarSync(
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>,
  eventsRef: React.MutableRefObject<CalendarEvent[]>
) {
  const [googleSyncStatus, setGoogleSyncStatus] = useState<CloudCalendarSyncStatus>('idle');
  const [lastGoogleSync, setLastGoogleSync] = useState<Date | null>(null);

  const [outlookSyncStatus, setOutlookSyncStatus] = useState<CloudCalendarSyncStatus>('idle');
  const [lastOutlookSync, setLastOutlookSync] = useState<Date | null>(null);
  const [availableOutlookCalendars, setAvailableOutlookCalendars] = useState<MicrosoftCalendarResource[]>([]);
  const [selectedOutlookCalendars, setSelectedOutlookCalendars] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('focusflow_selected_outlook_calendars');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleOutlookCalendarSelection = useCallback((calendarId: string) => {
    setSelectedOutlookCalendars(prev => {
      const isSelected = prev.includes(calendarId);
      const newSelection = isSelected ? prev.filter(id => id !== calendarId) : [...prev, calendarId];
      localStorage.setItem('focusflow_selected_outlook_calendars', JSON.stringify(newSelection));
      return newSelection;
    });
  }, []);

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
        const pulledGoogleIds = new Set(googleEvents.map((e) => e.google_event_id!));
        const withoutStale = prev.filter(
          (e) => e.source !== 'google' || (e.google_event_id && pulledGoogleIds.has(e.google_event_id))
        );

        const merged = [...withoutStale];
        for (const ge of googleEvents) {
          const existingIdx = merged.findIndex((e) => e.google_event_id === ge.google_event_id);
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
  }, [setEvents]);

  const pullFromOutlook = useCallback(async (silent = false) => {
    const token = await getMicrosoftAccessToken();
    if (!token) {
      setOutlookSyncStatus('disconnected');
      return;
    }
    if (!silent) setOutlookSyncStatus('syncing');

    try {
      const calendars = await fetchOutlookCalendars(token);
      setAvailableOutlookCalendars(calendars);

      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString();

      let calendarsToFetch = selectedOutlookCalendars;
      if (silent) {
        try {
          const stored = localStorage.getItem('focusflow_selected_outlook_calendars');
          calendarsToFetch = stored ? JSON.parse(stored) : selectedOutlookCalendars;
        } catch { /* ignore */ }
      }

      const outlookEvents = await fetchOutlookCalendarEvents(token, timeMin, timeMax, calendarsToFetch);

      setEvents((prev) => {
        const pulledOutlookIds = new Set(outlookEvents.map((e) => e.outlook_event_id!));
        const withoutStale = prev.filter(
          (e) => e.source !== 'outlook' || (e.outlook_event_id && pulledOutlookIds.has(e.outlook_event_id))
        );

        const merged = [...withoutStale];
        for (const oe of outlookEvents) {
          const existingIdx = merged.findIndex((e) => e.outlook_event_id === oe.outlook_event_id);
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
  }, [selectedOutlookCalendars, setEvents]);

  useEffect(() => {
    pullFromGoogle(true);
    pullFromOutlook(true);
  }, [pullFromGoogle, pullFromOutlook]);

  useEffect(() => {
    const interval = setInterval(() => {
      pullFromGoogle(true);
      pullFromOutlook(true);
    }, SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [pullFromGoogle, pullFromOutlook]);

  useEffect(() => {
    const onFocus = () => {
      pullFromGoogle(true);
      pullFromOutlook(true);
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [pullFromGoogle, pullFromOutlook]);

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

  return {
    googleSyncStatus,
    lastGoogleSync,
    pullFromGoogle,
    outlookSyncStatus,
    lastOutlookSync,
    pullFromOutlook,
    availableOutlookCalendars,
    selectedOutlookCalendars,
    toggleOutlookCalendarSelection,
    pushNewToGoogle,
    pushUpdateToGoogle,
    pushDeleteToGoogle,
    pushNewToOutlook,
    pushUpdateToOutlook,
    pushDeleteToOutlook,
  };
}
