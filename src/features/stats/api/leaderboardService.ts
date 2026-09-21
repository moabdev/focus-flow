import { supabaseService } from '@/features/core/api/supabase';
import { storageGroups } from '@/features/groups/api/storageGroups';
import { LeaderboardUser, GroupMember } from '@/features/core/types';

// Mock data fallback in case Supabase is offline or empty
const SEED_COMMUNITY_USERS: LeaderboardUser[] = [
  {
    id: 'u-1',
    name: 'Renata Delegada',
    weekly_seconds: 64800, // 18h
    pomodoros_completed: 36,
    streak_days: 21,
  },
  {
    id: 'u-2',
    name: 'Lucas Code',
    weekly_seconds: 52200, // 14.5h
    pomodoros_completed: 29,
    streak_days: 14,
  },
  {
    id: 'u-3',
    name: 'Dra. Beatriz',
    weekly_seconds: 43200, // 12h
    pomodoros_completed: 24,
    streak_days: 10,
  },
  {
    id: 'u-4',
    name: 'Mariana Concursos',
    weekly_seconds: 37800, // 10.5h
    pomodoros_completed: 21,
    streak_days: 8,
  },
  {
    id: 'u-5',
    name: 'Carlos OAB',
    weekly_seconds: 32400, // 9h
    pomodoros_completed: 18,
    streak_days: 7,
  },
  {
    id: 'u-6',
    name: 'Gabriel DevOps',
    weekly_seconds: 27000, // 7.5h
    pomodoros_completed: 15,
    streak_days: 5,
  },
];

export const leaderboardService = {
  /**
   * Busca o ranking de todos os usuários disponíveis na plataforma.
   * Prioriza o Supabase (tabela group_members para usuários públicos). Se offline, cai pro fallback.
   */
  async getCommunityRanking(): Promise<LeaderboardUser[]> {
    const client = supabaseService.getClient();

    if (client) {
      try {
        // Como o Supabase não tem uma tabela "leaderboard" dedicada no momento,
        // mas group_members tem permissão de leitura pública (RLS USING true) e armazena os segundos,
        // agregamos daqui para simular a comunidade.
        const { data, error } = await client
          .from('group_members')
          .select('user_id, user_name, weekly_seconds, streak_days');

        if (!error && data && data.length > 0) {
          // Agrupar usuários removendo duplicações (um usuário pode estar em vários grupos)
          // Vamos pegar o MAX weekly_seconds de cada um.
          const userMap = new Map<string, LeaderboardUser>();

          data.forEach((row) => {
            const userId = row.user_id || `anon-${row.user_name}`;
            const existing = userMap.get(userId);

            if (!existing || existing.weekly_seconds < (row.weekly_seconds || 0)) {
              userMap.set(userId, {
                id: userId,
                name: row.user_name || 'Usuário',
                weekly_seconds: row.weekly_seconds || 0,
                // Uma aproximação para os pomodoros completos (25 min por pomodoro)
                pomodoros_completed: Math.floor((row.weekly_seconds || 0) / 1500),
                streak_days: row.streak_days || 0,
              });
            }
          });

          // Se a lista via Supabase tiver menos de 5 pessoas, injetamos alguns seeds para dar volume
          let aggregated = Array.from(userMap.values());
          
          if (aggregated.length < 5) {
             const existingNames = new Set(aggregated.map(u => u.name));
             const fill = SEED_COMMUNITY_USERS.filter(su => !existingNames.has(su.name));
             aggregated = [...aggregated, ...fill];
          }

          return aggregated.sort((a, b) => b.weekly_seconds - a.weekly_seconds);
        }
      } catch (err) {
        console.error('[LeaderboardService] Erro ao buscar comunidade:', err);
      }
    }

    // Fallback: junta os SEEDS com o ranking local
    return this.mergeWithSeeds(this.getLocalGroupsRanking());
  },

  /**
   * Busca o ranking apenas dos usuários que estão nos mesmos grupos que o usuário atual.
   * Para evitar demoras de rede, priorizamos a leitura dos membros de grupos armazenados localmente.
   */
  async getMyGroupsRanking(): Promise<LeaderboardUser[]> {
    return this.getLocalGroupsRanking().sort((a, b) => b.weekly_seconds - a.weekly_seconds);
  },

  /**
   * Método utilitário privado para pegar os membros do cache local (storageGroups)
   */
  getLocalGroupsRanking(): LeaderboardUser[] {
    const groups = storageGroups.getGroups();
    const userMap = new Map<string, LeaderboardUser>();

    groups.forEach((group) => {
      const members = storageGroups.getMembers(group.id);
      members.forEach((m: GroupMember) => {
        const id = m.user_name; // Como o type GroupMember local não tem user_id, usamos o user_name como fallback único
        const existing = userMap.get(id);
        
        if (!existing || existing.weekly_seconds < (m.weekly_seconds || 0)) {
          userMap.set(id, {
            id,
            name: m.user_name,
            weekly_seconds: m.weekly_seconds || 0,
            pomodoros_completed: Math.floor((m.weekly_seconds || 0) / 1500),
            streak_days: m.streak_days || 0,
          });
        }
      });
    });

    return Array.from(userMap.values());
  },

  /**
   * Utilitário para mesclar ranking com os seeds sem duplicar nomes
   */
  mergeWithSeeds(ranking: LeaderboardUser[]): LeaderboardUser[] {
    const existingNames = new Set(ranking.map(u => u.name.toLowerCase()));
    const safeSeeds = SEED_COMMUNITY_USERS.filter(u => !existingNames.has(u.name.toLowerCase()));
    return [...ranking, ...safeSeeds].sort((a, b) => b.weekly_seconds - a.weekly_seconds);
  }
};
