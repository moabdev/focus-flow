import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatsView } from '@/features/stats/components/StatsView';
import { badgeService } from '@/features/stats/api/badgeService';
import { reportExportService } from '@/features/stats/api/reportExportService';
import { useToast } from '@/features/core/contexts/ToastContext';

// Mock dependencies
vi.mock('@/features/stats/api/badgeService', () => ({
  badgeService: {
    getBadges: vi.fn(),
  },
}));

vi.mock('@/features/stats/api/reportExportService', () => ({
  reportExportService: {
    exportSessionsCSV: vi.fn(),
    exportTasksCSV: vi.fn(),
    printReportSummary: vi.fn(),
  },
}));

vi.mock('@/features/core/contexts/ToastContext', () => ({
  useToast: vi.fn(),
}));

describe('StatsView Component', () => {
  const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  };

  const defaultProps = {
    metrics: {
      totalFocusTime: 120,
      totalSessions: 5,
      history: [
        {
          id: '1',
          duration: 25,
          type: 'pomodoro',
          date: '2023-01-01T10:00:00Z',
        },
      ],
      subjectMinutes: {},
      streak: { currentStreak: 5, longestStreak: 10 },
    } as any,
    subtasks: [
      { id: '1', title: 'Task 1', is_completed: true },
      { id: '2', title: 'Task 2', is_completed: false },
    ] as any,
    projects: [] as any,
    userName: 'John Doe',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as any).mockReturnValue(mockToast);
    (badgeService.getBadges as any).mockReturnValue([
      { id: 'badge1', title: 'First Steps', unlocked: true },
      { id: 'badge2', title: 'Master', unlocked: false },
    ]);
  });

  it('deve renderizar a página com os dados corretos', () => {
    render(<StatsView {...defaultProps} />);
    
    // Verifica título
    expect(screen.getByText('Estatísticas, Conquistas & Relatórios')).toBeInTheDocument();
    
    // Verifica abas
    expect(screen.getByText(/Visão Geral/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Conquistas/i })).toBeInTheDocument();
    expect(screen.getByText(/Exportar Relatórios/i)).toBeInTheDocument();
  });

  it('deve alternar entre as abas', () => {
    render(<StatsView {...defaultProps} />);
    
    // Aba inicial
    // Visão geral content
    expect(screen.getByText('Distribuição de Estudo por Disciplina')).toBeInTheDocument();

    // Clicar Conquistas
    fireEvent.click(screen.getByRole('button', { name: /Conquistas/i }));
    expect(screen.getByText('First Steps')).toBeInTheDocument();

    // Clicar Exportar
    fireEvent.click(screen.getByText(/Exportar Relatórios/i));
    expect(screen.getByText(/Baixar Sessões CSV/i)).toBeInTheDocument(); 
  });

  describe('Tab: Export', () => {
    it('deve exportar CSV de sessões com sucesso', () => {
      render(<StatsView {...defaultProps} />);
      fireEvent.click(screen.getByText(/Exportar Relatórios/i));
      
      const exportSessionsBtn = screen.getByText(/Baixar Sessões CSV/i);
      fireEvent.click(exportSessionsBtn);
      
      expect(reportExportService.exportSessionsCSV).toHaveBeenCalledWith(defaultProps.metrics.history);
      expect(mockToast.success).toHaveBeenCalledWith(expect.any(String), 'Exportação Concluída');
    });

    it('deve exportar CSV de tarefas com sucesso', () => {
      render(<StatsView {...defaultProps} />);
      fireEvent.click(screen.getByText(/Exportar Relatórios/i));
      
      const exportTasksBtn = screen.getByText(/Baixar Tarefas CSV/i); 
      fireEvent.click(exportTasksBtn);
      
      expect(reportExportService.exportTasksCSV).toHaveBeenCalledWith(defaultProps.subtasks, defaultProps.projects);
      expect(mockToast.success).toHaveBeenCalledWith(expect.any(String), 'Exportação Concluída');
    });

    it('deve imprimir relatório em PDF com sucesso', () => {
      render(<StatsView {...defaultProps} />);
      fireEvent.click(screen.getByText(/Exportar Relatórios/i));
      
      const printBtn = screen.getByText(/Gerar PDF \/ Imprimir/i);
      fireEvent.click(printBtn);
      
      expect(reportExportService.printReportSummary).toHaveBeenCalledWith({
        sessions: defaultProps.metrics.history,
        projects: defaultProps.projects,
        tasks: defaultProps.subtasks,
        userName: defaultProps.userName,
      });
      expect(mockToast.info).toHaveBeenCalledWith(expect.any(String), 'Relatório Oficial');
    });
  });
});
