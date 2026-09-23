import { SupabaseClient } from '@supabase/supabase-js';
import { QuickNote } from '@/features/core/types';
import { storageService } from '@/features/core/api/storage';
import { mergeById } from '@/features/core/api/syncUtils';

export async function pushQuickNotes(client: SupabaseClient, userId: string, localNotes: QuickNote[]) {
  for (const n of localNotes) {
    await client.from('quick_notes').upsert({
      id: n.id,
      user_id: userId,
      title: n.title || 'Nova Anotação',
      content: n.content || '',
      project_id: n.project_id || null,
      subtask_id: n.subtask_id || null,
      created_at: n.created_at,
      updated_at: n.updated_at,
    });
  }
}

export async function pullQuickNotes(client: SupabaseClient, userId: string, localNotes: QuickNote[]) {
  const { data: remoteNotes, error } = await client
    .from('quick_notes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (!error && remoteNotes) {
    const mergedNotes = mergeById(localNotes, remoteNotes as QuickNote[]);
    storageService.saveQuickNotes(mergedNotes);
  }
}
