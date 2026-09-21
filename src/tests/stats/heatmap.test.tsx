import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeatmapCalendar } from '@/features/stats/components/stats/HeatmapCalendar';
import { StudySession } from '@/features/core/types';

describe('HeatmapCalendar (Mapa Mensal de Consistência)', () => {
  it('deve renderizar o container do heatmap e título', () => {
    const sessions: StudySession[] = [];
    render(<HeatmapCalendar sessions={sessions} />);

    expect(screen.getByText('Mapa Mensal de Consistência')).toBeInTheDocument();
    expect(screen.getByText(/dias ativos/i)).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: /Heatmap de Estudos Mensal/i })).toBeInTheDocument();
  });

  it('deve contabilizar corretamente sessões nos dias ativos', () => {
    const today = new Date().toISOString();
    const sessions: StudySession[] = [
      {
        id: 's-1',
        discipline: 'Cálculo',
        duration_minutes: 50,
        completed_at: today,
      },
      {
        id: 's-2',
        discipline: 'Física',
        duration_minutes: 30,
        completed_at: today,
      },
    ];

    render(<HeatmapCalendar sessions={sessions} />);
    // 1 dia ativo e 80 minutos (~1h)
    expect(screen.getByText(/1 dia ativo/i)).toBeInTheDocument();
    expect(screen.getByText(/1h no último mês/i)).toBeInTheDocument();
  });
});
