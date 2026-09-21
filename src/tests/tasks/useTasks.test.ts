import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { storageService } from '@/features/core/api/storage';

vi.mock('@/features/core/api/storage', () => ({
  storageService: {
    fetchTasks: vi.fn(() => Promise.resolve([])),
    isInitialized: vi.fn(() => true),
    saveLocalTasks: vi.fn(),
    markInitialized: vi.fn(),
    saveTask: vi.fn(() => Promise.resolve()),
    deleteTask: vi.fn(() => Promise.resolve()),
  }
}));

// Mock do confetti para não quebrar no JSDOM
vi.mock('canvas-confetti', () => ({
  default: vi.fn()
}));

describe('useTasks Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve iniciar vazio após o fetch se não houver tarefas salvas', async () => {
    const { result } = renderHook(() => useTasks());
    
    // Antes do resolve da Promise
    expect(result.current.allTasks).toEqual([]);
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(storageService.fetchTasks).toHaveBeenCalled();
    expect(result.current.allTasks).toEqual([]);
  });

  it('deve adicionar uma nova tarefa e definir como ativa se for a primeira', async () => {
    const { result } = renderHook(() => useTasks());
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
    
    await act(async () => {
      await result.current.addTask('Estudar React', 'Programação', 2, 'alta');
    });
    
    expect(result.current.allTasks.length).toBe(1);
    expect(result.current.allTasks[0].title).toBe('Estudar React');
    expect(result.current.allTasks[0].discipline).toBe('Programação');
    expect(result.current.activeTaskId).toBe(result.current.allTasks[0].id);
    expect(storageService.saveTask).toHaveBeenCalled();
  });

  it('deve alternar status de conclusão e aplicar filtros de pendentes/concluídas corretamente', async () => {
    const { result } = renderHook(() => useTasks());
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
    
    await act(async () => {
      await result.current.addTask('Tarefa Filtro 1');
    });
    
    await act(async () => {
      await result.current.addTask('Tarefa Filtro 2');
    });
    
    const task1 = result.current.allTasks.find(t => t.title === 'Tarefa Filtro 1');
    
    await act(async () => {
      if (task1) await result.current.toggleTaskCompleted(task1.id);
    });
    
    await act(async () => {
      result.current.setFilterStatus('pendentes');
    });
    
    const pendentes = result.current.tasks;
    expect(pendentes.length).toBe(1);
    expect(pendentes[0].title).toBe('Tarefa Filtro 2');
    
    // Filtrar apenas concluídas
    await act(async () => {
      result.current.setFilterStatus('concluidas');
    });
    expect(result.current.tasks.length).toBe(1);
    expect(result.current.tasks[0].title).toBe('Tarefa Filtro 1');
  });

  it('deve filtrar tarefas por disciplina', async () => {
    const { result } = renderHook(() => useTasks());
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
    
    await act(async () => {
      await result.current.addTask('T1', 'Matemática');
    });
    await act(async () => {
      await result.current.addTask('T2', 'História');
    });
    
    await act(async () => {
      result.current.setFilterDiscipline('Matemática');
    });
    
    expect(result.current.tasks.length).toBe(1);
    expect(result.current.tasks[0].title).toBe('T1');
    expect(result.current.disciplines).toContain('Matemática');
  });

  it('deve incrementar pomodoros de uma tarefa', async () => {
    const { result } = renderHook(() => useTasks());
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
    
    await act(async () => {
      await result.current.addTask('Pomodoro Task');
    });
    
    const taskId = result.current.allTasks[0].id;
    expect(result.current.allTasks[0].pomodoros_completed).toBe(0);
    
    await act(async () => {
      await result.current.incrementPomodoro(taskId);
    });
    
    expect(result.current.allTasks[0].pomodoros_completed).toBe(1);
    expect(storageService.saveTask).toHaveBeenCalled();
  });

  it('deve deletar uma tarefa', async () => {
    const { result } = renderHook(() => useTasks());
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
    
    await act(async () => {
      await result.current.addTask('Deletar');
    });
    
    const taskId = result.current.allTasks[0].id;
    expect(result.current.allTasks.length).toBe(1);
    
    await act(async () => {
      await result.current.deleteTask(taskId);
    });
    
    expect(result.current.allTasks.length).toBe(0);
    expect(storageService.deleteTask).toHaveBeenCalledWith(taskId);
  });
});
