import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reportExportService } from '@/features/stats/api/reportExportService';
import { StudySession, Subtask, Project } from '@/features/core/types';

describe('ReportExportService (Exportação CSV e Relatórios)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockSessions: StudySession[] = [
    {
      id: 'sess-1',
      discipline: 'Algoritmos & Grafos',
      duration_minutes: 50,
      completed_at: '2026-09-20T10:00:00.000Z',
    },
  ];

  const mockTasks: Subtask[] = [
    {
      id: 'sub-1',
      project_id: 'proj-1',
      title: 'Estudo de Busca em Largura (BFS)',
      discipline: 'Computação',
      priority: 'alta',
      pomodoros_estimated: 3,
      pomodoros_completed: 3,
      is_completed: true,
    },
  ];

  const mockProjects: Project[] = [
    {
      id: 'proj-1',
      title: 'Projeto Engenharia de Software',
      color: '#ff2a5f',
      total_elapsed_seconds: 3000,
      created_at: '2026-09-01T00:00:00.000Z',
    },
  ];

  it('deve lançar erro se a lista de sessões para exportar estiver vazia', () => {
    expect(() => reportExportService.exportSessionsCSV([])).toThrow('Não há sessões registradas');
  });

  it('deve lançar erro se a lista de tarefas para exportar estiver vazia', () => {
    expect(() => reportExportService.exportTasksCSV([], [])).toThrow('Não há tarefas para exportar');
  });

  it('deve formatar e disparar download ao exportar sessões válidas', () => {
    const clickMock = vi.fn();
    const appendChildMock = vi.spyOn(document.body, 'appendChild').mockImplementation(vi.fn());
    const removeChildMock = vi.spyOn(document.body, 'removeChild').mockImplementation(vi.fn());
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
      click: clickMock,
      href: '',
      download: '',
    } as any);

    // Mock URL.createObjectURL / revokeObjectURL
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    reportExportService.exportSessionsCSV(mockSessions);

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(clickMock).toHaveBeenCalled();
    expect(appendChildMock).toHaveBeenCalled();
    expect(removeChildMock).toHaveBeenCalled();
  });

  it('deve formatar e disparar download ao exportar tarefas válidas', () => {
    const clickMock = vi.fn();
    vi.spyOn(document.body, 'appendChild').mockImplementation(vi.fn());
    vi.spyOn(document.body, 'removeChild').mockImplementation(vi.fn());
    vi.spyOn(document, 'createElement').mockReturnValue({
      click: clickMock,
      href: '',
      download: '',
    } as any);

    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    reportExportService.exportTasksCSV(mockTasks, mockProjects);
    expect(clickMock).toHaveBeenCalled();
  });
});
