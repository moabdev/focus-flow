import { describe, it, expect, vi, beforeEach } from 'vitest';
import { leaderboardService } from '@/features/stats/api/leaderboardService';
import { supabaseService } from '@/features/core/api/supabase';
import { storageGroups } from '@/features/groups/api/storageGroups';
import { StudyGroup, GroupMember } from '@/features/core/types';

// Mock dependências
vi.mock('@/features/core/api/supabase', () => ({
  supabaseService: {
    getClient: vi.fn(),
  },
}));

vi.mock('@/features/groups/api/storageGroups', () => ({
  storageGroups: {
    getGroups: vi.fn(),
    getMembers: vi.fn(),
  },
}));

describe('LeaderboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCommunityRanking', () => {
    it('deve retornar dados do Supabase agregados corretamente', async () => {
      const mockSupabaseData = [
        { user_id: 'user1', user_name: 'Alice', weekly_seconds: 3600, streak_days: 2 },
        { user_id: 'user2', user_name: 'Bob', weekly_seconds: 7200, streak_days: 5 },
        { user_id: 'user1', user_name: 'Alice', weekly_seconds: 1800, streak_days: 2 }, // Duplicado, deve ignorar pois é menor
      ];

      const selectMock = vi.fn().mockResolvedValue({ data: mockSupabaseData, error: null });
      const fromMock = vi.fn().mockReturnValue({ select: selectMock });
      
      vi.mocked(supabaseService.getClient).mockReturnValue({
        from: fromMock,
      } as any);

      const result = await leaderboardService.getCommunityRanking();

      // Renata Delegada (64800s) e Lucas Code (52200s) vão ficar no topo, mas Bob e Alice devem estar na lista
      expect(result.length).toBeGreaterThanOrEqual(5);
      expect(result.find(r => r.name === 'Bob')?.weekly_seconds).toBe(7200);
      expect(result.find(r => r.name === 'Alice')?.weekly_seconds).toBe(3600);
      
      // Fallback
      expect(result.some(r => r.name === 'Renata Delegada')).toBe(true);
    });

    it('deve usar o fallback se o Supabase falhar', async () => {
      const selectMock = vi.fn().mockResolvedValue({ data: null, error: new Error('Network error') });
      const fromMock = vi.fn().mockReturnValue({ select: selectMock });
      
      vi.mocked(supabaseService.getClient).mockReturnValue({
        from: fromMock,
      } as any);

      // Configura os grupos locais para o fallback
      vi.mocked(storageGroups.getGroups).mockReturnValue([{ id: 'g1' }] as StudyGroup[]);
      vi.mocked(storageGroups.getMembers).mockReturnValue([
        { id: 'm1', user_name: 'Carlos Local', weekly_seconds: 10000, streak_days: 3, role: 'member', group_id: 'g1', current_status: 'idle' } as GroupMember
      ]);

      const result = await leaderboardService.getCommunityRanking();

      // O top 1 deve ser a Renata Delegada (64800s dos SEEDS), Carlos Local (10000s) deve aparecer
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].name).toBe('Renata Delegada');
      expect(result.some(r => r.name === 'Carlos Local')).toBe(true);
    });

    it('deve usar o fallback se o Supabase estiver offline (cliente null)', async () => {
      vi.mocked(supabaseService.getClient).mockReturnValue(null);
      vi.mocked(storageGroups.getGroups).mockReturnValue([]);
      
      const result = await leaderboardService.getCommunityRanking();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].name).toBe('Renata Delegada');
    });
  });

  describe('getMyGroupsRanking', () => {
    it('deve agregar os membros dos grupos locais', async () => {
      vi.mocked(storageGroups.getGroups).mockReturnValue([
        { id: 'group1' } as StudyGroup,
        { id: 'group2' } as StudyGroup,
      ]);

      vi.mocked(storageGroups.getMembers).mockImplementation((groupId) => {
        if (groupId === 'group1') {
          return [
            { id: 'm1', user_name: 'Bob', weekly_seconds: 2000, streak_days: 1, role: 'member', group_id: 'group1', current_status: 'idle' } as GroupMember,
          ];
        }
        if (groupId === 'group2') {
          return [
            { id: 'm2', user_name: 'Alice', weekly_seconds: 5000, streak_days: 3, role: 'member', group_id: 'group2', current_status: 'idle' } as GroupMember,
            { id: 'm3', user_name: 'Bob', weekly_seconds: 1500, streak_days: 1, role: 'member', group_id: 'group2', current_status: 'idle' } as GroupMember, // Duplicado menor, deve ser ignorado
          ];
        }
        return [];
      });

      const result = await leaderboardService.getMyGroupsRanking();

      // Alice (5000s), Bob (2000s - pegou o maior de seus dois registros)
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Alice');
      expect(result[0].weekly_seconds).toBe(5000);
      expect(result[1].name).toBe('Bob');
      expect(result[1].weekly_seconds).toBe(2000);
    });
  });
});
