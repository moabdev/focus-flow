import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppNavigation } from '@/features/core/hooks/useAppNavigation';
import { useAppAuthAndSync } from '@/features/core/hooks/useAppAuthAndSync';
import { useAppTimerEvents } from '@/features/core/hooks/useAppTimerEvents';
import { supabaseService } from '@/features/core/api/supabase';
import { syncService } from '@/features/core/api/syncService';
import { storageService } from '@/features/core/api/storage';

vi.mock('@/features/core/api/supabase', () => ({
  supabaseService: {
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    onAuthChange: vi.fn((cb) => {
      // Simula callback síncrono para testar perfil
      cb({ id: 'user-1', full_name: 'Test User' });
      return vi.fn(); // retorna unsubscribe() dummy
    })
  }
}));

vi.mock('@/features/core/api/syncService', () => ({
  syncService: {
    startAutoSync: vi.fn(),
    stopAutoSync: vi.fn(),
    getStatus: vi.fn(() => ({ pendingOperations: 0, lastSync: null })),
    subscribeStatus: vi.fn(() => vi.fn()),
    init: vi.fn(),
  }
}));

vi.mock('@/features/core/api/storage', () => ({
  storageService: {
    addTimeSpent: vi.fn(() => Promise.resolve({ project: null, subtask: null })),
  }
}));

vi.mock('@/features/core/contexts/ToastContext', () => ({
  useToast: () => ({ addToast: vi.fn() }),
  ToastProvider: ({ children }: any) => children
}));

describe('App Core Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAppNavigation', () => {
    it('deve inicializar com a view timer (padrão)', () => {
      const { result } = renderHook(() => useAppNavigation());
      expect(result.current.currentView).toBe('timer');
    });

    it('deve alterar a view e modais', () => {
      const { result } = renderHook(() => useAppNavigation());
      
      act(() => {
        result.current.setCurrentView('groups');
      });
      expect(result.current.currentView).toBe('groups');
      
      act(() => {
        result.current.setIsSettingsOpen(true);
      });
      expect(result.current.isSettingsOpen).toBe(true);
      
      act(() => {
        result.current.setIsZenModeOpen(true);
      });
      expect(result.current.isZenModeOpen).toBe(true);
    });

    it('deve abrir detalhes do projeto', () => {
      const { result } = renderHook(() => useAppNavigation());
      
      act(() => {
        result.current.handleOpenProjectDetail('proj-1');
      });
      
      expect(result.current.currentView).toBe('project-detail');
      // No useAppNavigation original, handleOpenProjectDetail altera a view, mas não gerencia a seleção do projeto
      // A seleção em si é gerenciada no App.tsx. Aqui apenas validamos a view.
    });

    it('deve abrir as configurações e definir a tab correta', () => {
      const { result } = renderHook(() => useAppNavigation());
      
      const playClick = vi.fn();
      act(() => {
        result.current.handleOpenSettings('cloud', playClick);
      });
      
      expect(result.current.isSettingsOpen).toBe(true);
      expect(result.current.settingsTab).toBe('cloud');
      expect(playClick).toHaveBeenCalled();
    });
  });

  describe('useAppAuthAndSync', () => {
    it('deve carregar perfil do usuário na inicialização', async () => {
      const { result } = renderHook(() => useAppAuthAndSync({
        playClick: vi.fn(),
        clearProjects: vi.fn(),
        clearEvents: vi.fn(),
        clearStats: vi.fn(),
        clearMantras: vi.fn(),
        resetNavigation: vi.fn(),
        resetTimer: vi.fn(),
      }));
      
      expect(supabaseService.onAuthChange).toHaveBeenCalled();
      expect(result.current.userProfile?.full_name).toBe('Test User');
      expect(syncService.init).toHaveBeenCalled();
    });
  });

  describe('useAppTimerEvents', () => {
    it('deve acumular tempo de foco e enviar para o storage', () => {
      const addTimeSpentMock = vi.fn();
      const mockMetrics = {
        totalFocusSeconds: 0,
        totalBreaks: 0,
        totalPomodoros: 0,
        streakDays: 0,
        lastStudyDate: null,
      } as any;

      const { result } = renderHook(() => useAppTimerEvents({
        activeSubtaskId: 'task-1',
        activeSubtask: { id: 'task-1', title: 'Task', is_completed: false } as any,
        subtasks: [],
        metrics: mockMetrics,
        addTimeSpent: addTimeSpentMock,
        incrementPomodoro: vi.fn(),
        addCompletedSession: vi.fn()
      }));
      
      // Simula 10 segundos (não deve enviar, acumula no ref)
      act(() => {
        result.current.handleTickSecond('pomodoro', 10);
      });
      expect(addTimeSpentMock).not.toHaveBeenCalled();
      
      // Simula mais 5 segundos (total 15, deve enviar ao atingir o flush interval de 15s)
      act(() => {
        result.current.handleTickSecond('pomodoro', 5);
      });
      expect(addTimeSpentMock).toHaveBeenCalledWith('task-1', 15);
    });
  });
});
