import { SupabaseClient } from '@supabase/supabase-js';
import { storageService } from '@/features/core/api/storage';
import { mergeById } from '@/features/core/api/syncUtils';

export async function pushMindMaps(client: SupabaseClient, userId: string) {
  const localMindMaps = storageService.mindMapsService.getLocalMindMaps();
  for (const m of localMindMaps) {
    await client.from('mind_maps').upsert({
      id: m.id,
      user_id: userId,
      title: m.title,
      description: m.description || '',
      project_id: m.project_id || null,
      root_node_id: m.root_node_id,
      created_at: m.created_at,
      updated_at: m.updated_at,
    });

    if (m.nodes && m.nodes.length > 0) {
      for (const node of m.nodes) {
        await client.from('mind_map_nodes').upsert({
          id: node.id,
          mind_map_id: m.id,
          parent_id: node.parent_id || null,
          text: node.text,
          color: node.color || null,
          icon: node.icon || null,
          is_collapsed: node.is_collapsed || false,
          x: node.x || null,
          y: node.y || null,
          project_id: node.project_id || null,
          subtask_id: node.subtask_id || null,
        });
      }
    }
  }
}

export async function pullMindMaps(client: SupabaseClient, userId: string) {
  const { data: remoteMindMaps, error: errMindMaps } = await client
    .from('mind_maps')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (!errMindMaps && remoteMindMaps) {
    const { data: remoteNodes } = await client
      .from('mind_map_nodes')
      .select('*');

    const remoteMindMapsWithNodes = remoteMindMaps.map((m: any) => {
      return {
        ...m,
        nodes: (remoteNodes || []).filter((n: any) => n.mind_map_id === m.id)
      };
    });

    const localMindMaps = storageService.mindMapsService.getLocalMindMaps();
    const mergedMindMaps = mergeById(localMindMaps, remoteMindMapsWithNodes as any[]);
    storageService.mindMapsService.saveLocalMindMaps(mergedMindMaps);
  }
}
