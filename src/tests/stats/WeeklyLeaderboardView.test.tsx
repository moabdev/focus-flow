import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WeeklyLeaderboardView } from '@/features/stats/components/ranking/WeeklyLeaderboardView';
import { leaderboardService } from '@/features/stats/api/leaderboardService';
import { LeaderboardUser } from '@/features/core/types';

vi.mock('@/features/stats/api/leaderboardService', () => ({
  leaderboardService: {
    getCommunityRanking: vi.fn(),
    getMyGroupsRanking: vi.fn(),
  },
}));

describe('WeeklyLeaderboardView Component', () => {
  const mockCommunity: LeaderboardUser[] = [
    { id: '1', name: 'Alice', weekly_seconds: 10000, pomodoros_completed: 5, streak_days: 2 },
    { id: '2', name: 'Bob', weekly_seconds: 5000, pomodoros_completed: 3, streak_days: 1 },
    { id: '3', name: 'Charlie', weekly_seconds: 2000, pomodoros_completed: 1, streak_days: 0 },
    { id: '4', name: 'Dave', weekly_seconds: 1000, pomodoros_completed: 0, streak_days: 0 },
  ];

  const mockGroups: LeaderboardUser[] = [
    { id: '1', name: 'Alice', weekly_seconds: 10000, pomodoros_completed: 5, streak_days: 2 },
    { id: '5', name: 'Eve', weekly_seconds: 8000, pomodoros_completed: 4, streak_days: 1 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(leaderboardService.getCommunityRanking).mockResolvedValue(mockCommunity);
    vi.mocked(leaderboardService.getMyGroupsRanking).mockResolvedValue(mockGroups);
  });

  it('deve exibir o loading inicialmente e depois renderizar o ranking geral', async () => {
    render(<WeeklyLeaderboardView userWeekMinutes={100} userName="Current User" />);
    
    expect(screen.getByText(/Carregando ranking.../i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText(/Carregando ranking.../i)).not.toBeInTheDocument();
    });

    expect(leaderboardService.getCommunityRanking).toHaveBeenCalled();
    // Verifica se os nomes do pódio e usuários estão na tela
    expect(screen.getByText('Alice')).toBeInTheDocument(); // 🥇
    expect(screen.getByText('Bob')).toBeInTheDocument(); // 🥈
    // Current user com 100 minutos (6000 segundos) vai ficar em 2º lugar!
    // A ordem será: Alice (10000), Current User (6000), Bob (5000)
    expect(screen.getByText('Current User')).toBeInTheDocument();
  });

  it('deve alternar para o ranking de grupos ao clicar no filtro', async () => {
    render(<WeeklyLeaderboardView userWeekMinutes={10} userName="Current User" />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Carregando ranking.../i)).not.toBeInTheDocument();
    });

    const groupsBtn = screen.getByRole('button', { name: /Meus Grupos/i });
    fireEvent.click(groupsBtn);

    await waitFor(() => {
      expect(leaderboardService.getMyGroupsRanking).toHaveBeenCalled();
    });

    // Eve deve aparecer agora, Bob não
    expect(screen.getByText('Eve')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  it('deve remover o usuário logado dos dados recebidos para não duplicar', async () => {
    // Current user = Alice
    render(<WeeklyLeaderboardView userWeekMinutes={0} userName="Alice" userProfile={{ id: '1', full_name: 'Alice' }} />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Carregando ranking.../i)).not.toBeInTheDocument();
    });

    // Alice do mockCommunity deve ser ignorada, e a Alice "Current User" será a única exibida (0 minutos, então cai na lista geral fora do top 3)
    // O texto 'VOCÊ' aparece ao lado do nome na lista
    const youTags = screen.getAllByText('VOCÊ');
    expect(youTags.length).toBe(1);
  });
});
