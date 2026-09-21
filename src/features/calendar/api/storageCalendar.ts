import { CalendarEvent } from '@/features/core/types';
import { supabaseService } from '@/features/core/api/supabase';
import { STORAGE_KEYS } from '@/features/core/api/storageDefaults';

export class StorageCalendarService {
  public getLocalCalendarEvents(): CalendarEvent[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CALENDAR);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch {
      return [];
    }
  }

  public saveLocalCalendarEvents(events: CalendarEvent[]): void {
    localStorage.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify(events));
  }

  public async fetchCalendarEvents(): Promise<CalendarEvent[]> {
    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();

    if (client && user) {
      try {
        const { data, error } = await client
          .from('calendar_events')
          .select('*')
          .order('start_time', { ascending: true });

        if (!error && data) {
          if (data.length > 0) {
            this.saveLocalCalendarEvents(data as CalendarEvent[]);
            return data as CalendarEvent[];
          } else if (localStorage.getItem(STORAGE_KEYS.INITIALIZED) === 'true') {
            this.saveLocalCalendarEvents([]);
            return [];
          }
        }
      } catch (err) {
        console.warn('[FocusFlow] Erro ao sincronizar calendário no Supabase:', err);
      }
    }

    return this.getLocalCalendarEvents();
  }

  public async saveCalendarEvent(event: CalendarEvent): Promise<CalendarEvent> {
    const events = this.getLocalCalendarEvents();
    const index = events.findIndex((e) => e.id === event.id);

    if (index >= 0) {
      events[index] = event;
    } else {
      events.push(event);
    }
    this.saveLocalCalendarEvents(events);

    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();

    if (client && user) {
      try {
        await client.from('calendar_events').upsert({
          id: event.id,
          user_id: user.id,
          title: event.title,
          description: event.description || '',
          start_time: event.start_time,
          end_time: event.end_time,
          project_id: event.project_id || null,
          subtask_id: event.subtask_id || null,
          color: event.color || '#ff2a5f',
          is_completed: !!event.is_completed,
        });
      } catch (err) {
        console.warn('[FocusFlow] Erro ao salvar evento no Supabase:', err);
      }
    }

    return event;
  }

  public async toggleCalendarEventCompleted(eventId: string): Promise<CalendarEvent | null> {
    const events = this.getLocalCalendarEvents();
    const event = events.find((e) => e.id === eventId);
    if (!event) return null;

    event.is_completed = !event.is_completed;
    await this.saveCalendarEvent(event);
    return event;
  }

  public async deleteCalendarEvent(eventId: string): Promise<void> {
    const events = this.getLocalCalendarEvents().filter((e) => e.id !== eventId);
    this.saveLocalCalendarEvents(events);

    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');

    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();

    if (client && user) {
      try {
        await client.from('calendar_events').delete().eq('id', eventId);
      } catch (err) {
        console.warn('[FocusFlow] Erro ao deletar evento no Supabase:', err);
      }
    }
  }
}

export const storageCalendarService = new StorageCalendarService();
