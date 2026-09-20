import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimer } from '../hooks/useTimer';
import { DEFAULT_SETTINGS } from '../services/storage';

describe('useTimer Hook (Regras do Timer e Ciclos Pomodoro)', () => {
  it('deve inicializar no modo pomodoro com o tempo configurado', () => {
    const onPomodoroComplete = vi.fn();
    const playAlarm = vi.fn();

    const { result } = renderHook(() =>
      useTimer({
        settings: DEFAULT_SETTINGS,
        onPomodoroComplete,
        playAlarm,
      })
    );

    expect(result.current.mode).toBe('pomodoro');
    expect(result.current.formattedTime).toBe('25:00');
    expect(result.current.isRunning).toBe(false);
    expect(result.current.cycleCount).toBe(0);
    expect(result.current.progressPercent).toBe(0);
  });

  it('deve alternar para modo pausa curta corretamente', () => {
    const onPomodoroComplete = vi.fn();
    const playAlarm = vi.fn();

    const { result } = renderHook(() =>
      useTimer({
        settings: DEFAULT_SETTINGS,
        onPomodoroComplete,
        playAlarm,
      })
    );

    act(() => {
      result.current.changeMode('shortBreak');
    });

    expect(result.current.mode).toBe('shortBreak');
    expect(result.current.formattedTime).toBe('05:00');
    expect(result.current.timeLeft).toBe(300);
  });

  it('deve alternar para modo pausa longa corretamente', () => {
    const onPomodoroComplete = vi.fn();
    const playAlarm = vi.fn();

    const { result } = renderHook(() =>
      useTimer({
        settings: DEFAULT_SETTINGS,
        onPomodoroComplete,
        playAlarm,
      })
    );

    act(() => {
      result.current.changeMode('longBreak');
    });

    expect(result.current.mode).toBe('longBreak');
    expect(result.current.formattedTime).toBe('15:00');
    expect(result.current.timeLeft).toBe(900);
  });

  it('deve alternar estado de execução ao chamar toggle', () => {
    const onPomodoroComplete = vi.fn();
    const playAlarm = vi.fn();

    const { result } = renderHook(() =>
      useTimer({
        settings: DEFAULT_SETTINGS,
        onPomodoroComplete,
        playAlarm,
      })
    );

    expect(result.current.isRunning).toBe(false);

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isRunning).toBe(true);

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isRunning).toBe(false);
  });

  it('deve reiniciar o tempo ao chamar reset', () => {
    const onPomodoroComplete = vi.fn();
    const playAlarm = vi.fn();

    const { result } = renderHook(() =>
      useTimer({
        settings: DEFAULT_SETTINGS,
        onPomodoroComplete,
        playAlarm,
      })
    );

    act(() => {
      result.current.reset();
    });
    expect(result.current.timeLeft).toBe(25 * 60);
    expect(result.current.isRunning).toBe(false);
  });
});
