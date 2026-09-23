import { SupabaseClient } from '@supabase/supabase-js';
import { Project, Subtask } from '@/features/core/types';
import { storageService } from '@/features/core/api/storage';
import { mergeById } from '@/features/core/api/syncUtils';

export async function pushProjects(client: SupabaseClient, userId: string, localProjects: Project[]) {
  for (const p of localProjects) {
    await client.from('projects').upsert({
      id: p.id,
      user_id: userId,
      title: p.title,
      description: p.description || '',
      start_date: p.start_date || null,
      end_date: p.end_date || null,
      color: p.color,
      icon: p.icon || '📁',
      total_elapsed_seconds: p.total_elapsed_seconds || 0,
    });
  }
}

export async function pullProjects(client: SupabaseClient, userId: string, localProjects: Project[]) {
  const { data: remoteProjects, error } = await client
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (!error && remoteProjects) {
    const mergedProjects = mergeById(localProjects, remoteProjects as Project[]);
    storageService.saveLocalProjects(mergedProjects);
  }
}

export async function pushSubtasks(client: SupabaseClient, userId: string, localSubtasks: Subtask[]) {
  for (const s of localSubtasks) {
    await client.from('subtasks').upsert({
      id: s.id,
      project_id: s.project_id,
      user_id: userId,
      title: s.title,
      discipline: s.discipline || 'Geral',
      priority: s.priority,
      pomodoros_estimated: s.pomodoros_estimated,
      pomodoros_completed: s.pomodoros_completed,
      elapsed_seconds: s.elapsed_seconds || 0,
      is_completed: s.is_completed,
      notes: s.notes || '',
      due_date: s.due_date || null,
    });
  }
}

export async function pullSubtasks(client: SupabaseClient, userId: string, localSubtasks: Subtask[]) {
  const { data: remoteSubtasks, error } = await client
    .from('subtasks')
    .select('*')
    .eq('user_id', userId);

  if (!error && remoteSubtasks) {
    const mergedSubtasks = mergeById(localSubtasks, remoteSubtasks as Subtask[]);
    storageService.saveLocalSubtasks(mergedSubtasks);
  }
}
