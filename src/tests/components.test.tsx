import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimerCard } from '@/features/timer/components/TimerCard';
import { QuoteBanner } from '@/features/quotes/components/QuoteBanner';
import { CustomSelect, SelectOption } from '@/features/core/components/common/CustomSelect';
import { Quote, Task } from '@/features/core/types';

describe('Componentes Principais da Interface', () => {
  it('deve renderizar o TimerCard com dígitos e botão de iniciar', () => {
    const onChangeMode = vi.fn();
    const onToggle = vi.fn();
    const onSkip = vi.fn();
    const onReset = vi.fn();
    const onOpenTasksScroll = vi.fn();

    const mockTask: Task = {
      id: 't-1',
      title: 'Estudo de Algoritmos',
      discipline: 'Computação',
      pomodoros_estimated: 4,
      pomodoros_completed: 2,
      is_completed: false,
      priority: 'alta',
    };

    render(
      <TimerCard
        mode="pomodoro"
        onChangeMode={onChangeMode}
        formattedTime="25:00"
        progressPercent={0}
        isRunning={false}
        cycleCount={0}
        onToggle={onToggle}
        onSkip={onSkip}
        onReset={onReset}
        activeTask={mockTask}
        onOpenTasksScroll={onOpenTasksScroll}
      />
    );

    expect(screen.getByTestId('timer-display')).toHaveTextContent('25:00');
    expect(screen.getByTestId('timer-start-btn')).toBeInTheDocument();
    expect(screen.getByText(/Estudo de Algoritmos/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('timer-start-btn'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar o QuoteBanner com texto da citação e autor', () => {
    const onRefreshQuote = vi.fn();
    const onAddMantra = vi.fn();

    const mockQuote: Quote = {
      id: 'q-test',
      text: 'O conhecimento liberta a mente.',
      author: 'Pensador Foco',
      category: 'foco',
    };

    render(
      <QuoteBanner
        quote={mockQuote}
        onRefreshQuote={onRefreshQuote}
        onAddMantra={onAddMantra}
        isRotating={false}
      />
    );

    expect(screen.getByText(/O conhecimento liberta a mente/i)).toBeInTheDocument();
    expect(screen.getByText(/Pensador Foco/i)).toBeInTheDocument();

    const refreshBtn = screen.getByTitle(/Sortear outra frase motivacional/i);
    fireEvent.click(refreshBtn);
    expect(onRefreshQuote).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar o CustomSelect, abrir dropdown e disparar onChange na seleção', () => {
    const onChange = vi.fn();
    const options: SelectOption[] = [
      { value: 'opt1', label: 'Opção 1', badgeColor: '#ff2a5f' },
      { value: 'opt2', label: 'Opção 2', badgeColor: '#10b981' },
    ];

    render(
      <CustomSelect
        value="opt1"
        options={options}
        onChange={onChange}
      />
    );

    // Deve exibir o label da opção selecionada
    expect(screen.getByText('Opção 1')).toBeInTheDocument();

    // Dropdown fechado inicialmente
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    // Clica para abrir o dropdown
    const triggerBtn = screen.getByRole('button');
    fireEvent.click(triggerBtn);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('Opção 2')).toBeInTheDocument();

    // Clica na opção 2
    fireEvent.click(screen.getByText('Opção 2'));
    expect(onChange).toHaveBeenCalledWith('opt2');

    // Dropdown fecha após seleção
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});

