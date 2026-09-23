import { SupabaseClient } from '@supabase/supabase-js';
import { CalendarEvent } from '@/features/core/types';
import { storageService } from '@/features/core/api/storage';
import { mergeById } from '@/features/core/api/syncUtils';

export async function pushCalendarEvents(client: SupabaseClient, userId: string, localEvents: CalendarEvent[]) {
  for (const e of localEvents) {
    await client.from('calendar_events').upsert({
      id: e.id,
      user_id: userId,
      title: e.title,
      description: e.description || '',
      start_time: e.start_time,
      end_time: e.end_time,
      project_id: e.project_id || null,
      subtask_id: e.subtask_id || null,
      color: e.color || '#ff2a5f',
      is_completed: !!e.is_completed,
    });
  }
}

export async function pullCalendarEvents(client: SupabaseClient, userId: string, localEvents: CalendarEvent[]) {
  const { data: remoteEvents, error } = await client
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .order('start_time', { ascending: true });

  if (!error && remoteEvents) {
    const mergedEvents = mergeById(localEvents, remoteEvents as CalendarEvent[]);
    storageService.saveLocalCalendarEvents(mergedEvents);
  }
}
