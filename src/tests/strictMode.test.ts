import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimer } from '@/features/timer/hooks/useTimer';
import { notificationService } from '@/features/core/api/notificationService';
import { DEFAULT_SETTINGS } from '@/features/core/api/storageDefaults';

describe('Modo Foco Rigoroso (Anti-Distração)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('deve disparar notificação quando o usuário sai da aba com strict_focus_mode ativo e pomodoro rodando', () => {
    const notifySpy = vi.spyOn(notificationService, 'notify').mockImplementation(vi.fn());

    const settings = {
      ...DEFAULT_SETTINGS,
      strict_focus_mode: true,
      pomodoro_time: 25,
    };

    const { result } = renderHook(() =>
      useTimer({
        settings,
        onPomodoroComplete: vi.fn(),
        playAlarm: vi.fn(),
      })
    );

    // Inicia o pomodoro
    act(() => {
      result.current.toggle();
    });
    expect(result.current.isRunning).toBe(true);

    // Simula o usuário minimizando ou trocando de aba (visibilitychange)
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true,
    });

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(notifySpy).toHaveBeenCalledWith(
      '⚠️ Alerta de Foco Rigoroso!',
      expect.stringContaining('Você saiu da aba do FocusFlow')
    );
  });

  it('não deve disparar alerta se strict_focus_mode estiver desativado', () => {
    const notifySpy = vi.spyOn(notificationService, 'notify').mockImplementation(vi.fn());

    const settings = {
      ...DEFAULT_SETTINGS,
      strict_focus_mode: false,
    };

    const { result } = renderHook(() =>
      useTimer({
        settings,
        onPomodoroComplete: vi.fn(),
        playAlarm: vi.fn(),
      })
    );

    act(() => {
      result.current.toggle();
    });

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true,
    });

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(notifySpy).not.toHaveBeenCalled();
  });
});
