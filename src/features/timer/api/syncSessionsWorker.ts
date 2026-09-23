import { SupabaseClient } from '@supabase/supabase-js';
import { StudySession } from '@/features/core/types';
import { storageService } from '@/features/core/api/storage';
import { mergeById } from '@/features/core/api/syncUtils';

export async function pushSessions(client: SupabaseClient, userId: string, localSessions: StudySession[]) {
  for (const s of localSessions) {
    await client.from('study_sessions').upsert({
      id: s.id,
      user_id: userId,
      discipline: s.discipline,
      project_id: s.project_id || null,
      subtask_id: s.subtask_id || null,
      duration_minutes: s.duration_minutes,
      completed_at: s.completed_at,
    });
  }
}

export async function pullSessions(client: SupabaseClient, userId: string, localSessions: StudySession[]) {
  const { data: remoteSessions, error } = await client
    .from('study_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  if (!error && remoteSessions) {
    const mergedSessions = mergeById(localSessions, remoteSessions as StudySession[]);
    storageService.saveLocalSessions(mergedSessions);
  }
}
