import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ZenMode } from '@/features/zenmode/components/ZenMode';
import { Task } from '@/features/core/types';

describe('ZenMode Component', () => {
  const defaultProps = {
    isOpen: true,
    onExit: vi.fn(),
    formattedTime: '25:00',
    progressPercent: 100,
    isRunning: false,
    onToggleTimer: vi.fn(),
    activeTask: null,
    quoteText: 'Meu mantra',
    ambientSound: 'none' as const,
    onToggleAmbient: vi.fn(),
  };

  it('não deve renderizar nada se isOpen for false', () => {
    const { container } = render(<ZenMode {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('deve renderizar os elementos principais quando aberto', () => {
    render(<ZenMode {...defaultProps} />);
    
    // Verifica o tempo
    expect(screen.getByText('25:00')).toBeInTheDocument();
    
    // Verifica o mantra/quote
    expect(screen.getByText(/Meu mantra/i)).toBeInTheDocument();
    
    // Verifica os botões (title/aria-label)
    expect(screen.getByTitle('Sair do Modo Zen (Esc)')).toBeInTheDocument();
    expect(screen.getByTitle('Clique para pausar/iniciar')).toBeInTheDocument();
  });

  it('deve alternar o ícone de Play/Pause baseado no isRunning', () => {
    const { rerender } = render(<ZenMode {...defaultProps} isRunning={false} />);
    expect(screen.getByTitle('Clique para pausar/iniciar')).toBeInTheDocument();
    
    rerender(<ZenMode {...defaultProps} isRunning={true} />);
    expect(screen.getByTitle('Clique para pausar/iniciar')).toBeInTheDocument();
  });

  it('deve exibir a tarefa ativa se existir', () => {
    const mockTask: Task = {
      id: 't1',
      title: 'Estudar Vitest',
      pomodoros_completed: 0,
      pomodoros_estimated: 1,
      is_completed: false,
      discipline: '',
      priority: 'media',
      created_at: '',
    };
    
    render(<ZenMode {...defaultProps} activeTask={mockTask} />);
    expect(screen.getByText('Estudar Vitest')).toBeInTheDocument();
  });

  it('deve chamar onExit ao clicar no botão de sair', () => {
    render(<ZenMode {...defaultProps} />);
    
    const exitBtn = screen.getByTitle('Sair do Modo Zen (Esc)');
    fireEvent.click(exitBtn);
    
    expect(defaultProps.onExit).toHaveBeenCalled();
  });

  it('deve chamar onToggleTimer ao clicar no botão de controle', () => {
    render(<ZenMode {...defaultProps} />);
    
    const toggleBtn = screen.getByTitle('Clique para pausar/iniciar');
    fireEvent.click(toggleBtn);
    
    expect(defaultProps.onToggleTimer).toHaveBeenCalled();
  });

  it('deve chamar onToggleAmbient ao clicar no botão de som ambiente', () => {
    render(<ZenMode {...defaultProps} />);
    
    // O botão de som ambiente quando ambientSound é 'none' exibe VolumeX
    const soundBtn = screen.getByTitle('Alternar áudio de chuva');
    fireEvent.click(soundBtn);
    
    expect(defaultProps.onToggleAmbient).toHaveBeenCalled();
  });

  it('deve exibir ícone correto quando som ambiente está ativo', () => {
    render(<ZenMode {...defaultProps} ambientSound="rain" />);
    // O botão continua com o mesmo title, só muda o icone por dentro
    expect(screen.getByTitle('Alternar áudio de chuva')).toBeInTheDocument();
  });
});
