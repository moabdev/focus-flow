import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { storageService } from '@/features/core/api/storage';

// Mock storageService and syncService
vi.mock('@/features/core/api/storage', () => ({
  storageService: {
    getLocalProjects: vi.fn(() => []),
    getLocalSubtasks: vi.fn(() => []),
    fetchProjects: vi.fn(() => Promise.resolve([])),
    fetchSubtasks: vi.fn(() => Promise.resolve([])),
    isInitialized: vi.fn(() => true),
    markInitialized: vi.fn(),
    initDefaults: vi.fn(),
    saveProject: vi.fn(() => Promise.resolve()),
    updateProject: vi.fn(() => Promise.resolve()),
    deleteProject: vi.fn(() => Promise.resolve()),
    saveSubtask: vi.fn(() => Promise.resolve()),
    deleteSubtask: vi.fn(() => Promise.resolve()),
    addTimeSpent: vi.fn(() => Promise.resolve({ project: null, subtask: null })),
  }
}));

vi.mock('@/features/core/api/syncService', () => ({
  syncService: {
    onDataSynced: vi.fn(() => vi.fn())
  }
}));

vi.mock('canvas-confetti', () => ({
  default: vi.fn()
}));

describe('useProjects Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve carregar projetos vazios inicialmente', async () => {
    const { result } = renderHook(() => useProjects());
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
    expect(storageService.fetchProjects).toHaveBeenCalled();
  });

  it('deve criar um novo projeto', async () => {
    const { result } = renderHook(() => useProjects());
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
    
    await act(async () => {
      const p = await result.current.createProject({ title: 'Projeto Teste', color: '#000', icon: '🚀' });
      expect(p.title).toBe('Projeto Teste');
    });
    
    expect(result.current.projects.length).toBe(1);
    expect(result.current.projects[0].title).toBe('Projeto Teste');
    expect(storageService.saveProject).toHaveBeenCalled();
  });

  it('deve criar e atualizar uma subtarefa', async () => {
    const { result } = renderHook(() => useProjects());
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
    
    let subtask: any;
    await act(async () => {
      subtask = await result.current.createSubtask('proj-1', 'Minha Tarefa', 'Matemática');
    });
    
    expect(result.current.subtasks.length).toBe(1);
    expect(result.current.subtasks[0].title).toBe('Minha Tarefa');
    
    await act(async () => {
      await result.current.updateSubtask(subtask.id, { title: 'Tarefa Atualizada' });
    });
    
    expect(result.current.subtasks[0].title).toBe('Tarefa Atualizada');
    expect(storageService.saveSubtask).toHaveBeenCalledTimes(2);
  });

  it('deve alternar status de conclusão da subtarefa', async () => {
    const { result } = renderHook(() => useProjects());
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
    
    let subtask: any;
    await act(async () => {
      subtask = await result.current.createSubtask('proj-1', 'Tarefa Concluível');
    });
    
    expect(result.current.subtasks[0].is_completed).toBe(false);
    
    await act(async () => {
      await result.current.toggleSubtaskCompleted(subtask.id);
    });
    
    expect(result.current.subtasks[0].is_completed).toBe(true);
  });

  it('deve deletar um projeto e suas subtarefas em cascata', async () => {
    const { result } = renderHook(() => useProjects());
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
    
    let p: any;
    await act(async () => {
      p = await result.current.createProject({ title: 'Projeto Deletar' });
      await result.current.createSubtask(p.id, 'Tarefa Vinculada');
    });
    
    expect(result.current.projects.length).toBe(1);
    expect(result.current.subtasks.length).toBe(1);
    
    await act(async () => {
      await result.current.deleteProject(result.current.projects[0].id);
    });
    
    expect(result.current.projects.length).toBe(0);
    expect(result.current.subtasks.length).toBe(0);
    expect(storageService.deleteProject).toHaveBeenCalled();
  });
});
