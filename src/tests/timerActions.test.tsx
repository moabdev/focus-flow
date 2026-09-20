import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimerCard } from '../components/TimerCard';
import { Task } from '../types';

describe('Ações de Timer & Pomodoro (Controles, Modos e Vinculação de Tarefa)', () => {
  const mockTask: Task = {
    id: 't-timer-1',
    title: 'Estudo de Estrutura de Dados',
    discipline: 'Ciência da Computação',
    pomodoros_estimated: 4,
    pomodoros_completed: 2,
    is_completed: false,
    priority: 'alta',
    elapsed_seconds: 3600,
  };

  it('deve alternar entre modos Pomodoro, Pausa Curta e Pausa Longa ao clicar nas abas', () => {
    const onChangeMode = vi.fn();

    render(
      <TimerCard
        mode="pomodoro"
        onChangeMode={onChangeMode}
        formattedTime="25:00"
        progressPercent={0}
        isRunning={false}
        cycleCount={0}
        onToggle={vi.fn()}
        onSkip={vi.fn()}
        onReset={vi.fn()}
        activeTask={null}
        onOpenTasksScroll={vi.fn()}
      />
    );

    // Clica em Pausa Curta
    fireEvent.click(screen.getByRole('button', { name: 'Pausa Curta' }));
    expect(onChangeMode).toHaveBeenCalledWith('shortBreak');

    // Clica em Pausa Longa
    fireEvent.click(screen.getByRole('button', { name: 'Pausa Longa' }));
    expect(onChangeMode).toHaveBeenCalledWith('longBreak');

    // Clica em Pomodoro
    fireEvent.click(screen.getByRole('button', { name: 'Pomodoro' }));
    expect(onChangeMode).toHaveBeenCalledWith('pomodoro');
  });

  it('deve iniciar o timer ao clicar em Iniciar e pausar ao clicar em Pausar', () => {
    const onToggle = vi.fn();

    const { rerender } = render(
      <TimerCard
        mode="pomodoro"
        onChangeMode={vi.fn()}
        formattedTime="25:00"
        progressPercent={0}
        isRunning={false}
        cycleCount={0}
        onToggle={onToggle}
        onSkip={vi.fn()}
        onReset={vi.fn()}
        activeTask={null}
        onOpenTasksScroll={vi.fn()}
      />
    );

    const startBtn = screen.getByTestId('timer-start-btn');
    expect(startBtn).toHaveTextContent(/Iniciar/i);
    fireEvent.click(startBtn);
    expect(onToggle).toHaveBeenCalledTimes(1);

    // Atualiza para rodando
    rerender(
      <TimerCard
        mode="pomodoro"
        onChangeMode={vi.fn()}
        formattedTime="24:59"
        progressPercent={1}
        isRunning={true}
        cycleCount={0}
        onToggle={onToggle}
        onSkip={vi.fn()}
        onReset={vi.fn()}
        activeTask={null}
        onOpenTasksScroll={vi.fn()}
      />
    );

    const pauseBtn = screen.getByTestId('timer-start-btn');
    expect(pauseBtn).toHaveTextContent(/Pausar/i);
    fireEvent.click(pauseBtn);
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it('deve disparar onReset ao clicar no botão de reiniciar', () => {
    const onReset = vi.fn();

    render(
      <TimerCard
        mode="pomodoro"
        onChangeMode={vi.fn()}
        formattedTime="18:30"
        progressPercent={26}
        isRunning={true}
        cycleCount={1}
        onToggle={vi.fn()}
        onSkip={vi.fn()}
        onReset={onReset}
        activeTask={null}
        onOpenTasksScroll={vi.fn()}
      />
    );

    const resetBtn = screen.getByLabelText(/Reiniciar cronômetro/i);
    fireEvent.click(resetBtn);

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('deve disparar onSkip ao clicar no botão de pular ciclo', () => {
    const onSkip = vi.fn();

    render(
      <TimerCard
        mode="pomodoro"
        onChangeMode={vi.fn()}
        formattedTime="25:00"
        progressPercent={0}
        isRunning={false}
        cycleCount={0}
        onToggle={vi.fn()}
        onSkip={onSkip}
        onReset={vi.fn()}
        activeTask={null}
        onOpenTasksScroll={vi.fn()}
      />
    );

    const skipBtn = screen.getByLabelText(/Pular ciclo/i);
    fireEvent.click(skipBtn);

    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('deve exibir tarefa ativa vinculada e permitir trocar de tarefa', () => {
    const onOpenTasksScroll = vi.fn();

    render(
      <TimerCard
        mode="pomodoro"
        onChangeMode={vi.fn()}
        formattedTime="25:00"
        progressPercent={0}
        isRunning={false}
        cycleCount={2}
        onToggle={vi.fn()}
        onSkip={vi.fn()}
        onReset={vi.fn()}
        activeTask={mockTask}
        onOpenTasksScroll={onOpenTasksScroll}
      />
    );

    expect(screen.getByText('Estudo de Estrutura de Dados')).toBeInTheDocument();
    expect(screen.getByText(/1h 0m/i)).toBeInTheDocument();
    expect(screen.getByText(/Ciclo #3/i)).toBeInTheDocument();

    // Clica no banner de tarefa para navegar até as tarefas
    const taskBanner = screen.getByTitle(/Clique para ir até as tarefas/i);
    fireEvent.click(taskBanner);

    expect(onOpenTasksScroll).toHaveBeenCalledTimes(1);
  });
});
