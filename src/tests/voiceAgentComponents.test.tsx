import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VoiceAgentButton } from '@/features/voice-agent/components/VoiceAgentButton';
import { VoiceAgentWidget } from '@/features/voice-agent/components/VoiceAgentWidget';
import { VoiceWaveform } from '@/features/voice-agent/components/VoiceWaveform';

describe('Voice Agent UI Components', () => {
  describe('VoiceAgentButton (FAB)', () => {
    it('deve renderizar o botão flutuante e responder ao clique', () => {
      const onClick = vi.fn();
      render(<VoiceAgentButton status="idle" isOpen={false} onClick={onClick} />);

      const button = screen.getByRole('button', { name: /abrir assistente de voz/i });
      expect(button).toBeInTheDocument();

      fireEvent.click(button);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('deve exibir classe e efeitos para diferentes status (listening, thinking, error)', () => {
      const { rerender } = render(
        <VoiceAgentButton status="listening" isOpen={true} onClick={vi.fn()} />
      );
      expect(document.querySelector('.voice-agent-ripple')).toBeInTheDocument();

      rerender(<VoiceAgentButton status="thinking" isOpen={true} onClick={vi.fn()} />);
      expect(document.querySelector('.voice-agent-spinner-ring')).toBeInTheDocument();

      rerender(<VoiceAgentButton status="error" isOpen={true} onClick={vi.fn()} />);
      expect(document.querySelector('.voice-agent-status-badge.error')).toBeInTheDocument();
    });
  });

  describe('VoiceAgentWidget (Panel)', () => {
    const defaultProps = {
      isOpen: true,
      onClose: vi.fn(),
      status: 'idle' as const,
      messages: [
        {
          id: '1',
          role: 'model' as const,
          content: 'Olá! Sou o Flow, seu copiloto.',
          timestamp: '14:30',
        },
        {
          id: '2',
          role: 'user' as const,
          content: 'Inicie o pomodoro',
          timestamp: '14:31',
        },
      ],
      transcript: '',
      isMuted: false,
      onToggleMute: vi.fn(),
      audioLevel: 0,
      onStartListening: vi.fn(),
      onStopListening: vi.fn(),
      onSendMessage: vi.fn().mockResolvedValue(undefined),
      onClearHistory: vi.fn(),
      errorMessage: null,
    };

    it('não deve renderizar quando isOpen for false', () => {
      const { container } = render(<VoiceAgentWidget {...defaultProps} isOpen={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('deve renderizar mensagens e cabeçalho quando aberto', () => {
      render(<VoiceAgentWidget {...defaultProps} />);

      expect(screen.getByText('Flow Copilot')).toBeInTheDocument();
      expect(screen.getByText('Olá! Sou o Flow, seu copiloto.')).toBeInTheDocument();
      expect(screen.getByText('Inicie o pomodoro')).toBeInTheDocument();
    });

    it('deve acionar envio de mensagem ao submeter formulário de texto', () => {
      const onSendMessage = vi.fn().mockResolvedValue(undefined);
      render(<VoiceAgentWidget {...defaultProps} onSendMessage={onSendMessage} />);

      const input = screen.getByPlaceholderText(/digite ou use a voz/i);
      fireEvent.change(input, { target: { value: 'Criar tarefa Estudar' } });

      const form = input.closest('form');
      if (form) {
        fireEvent.submit(form);
      }

      expect(onSendMessage).toHaveBeenCalledWith('Criar tarefa Estudar');
    });

    it('deve alternar escuta ao clicar no botão de microfone', () => {
      const onStartListening = vi.fn();
      const onStopListening = vi.fn();

      const { rerender } = render(
        <VoiceAgentWidget
          {...defaultProps}
          status="idle"
          onStartListening={onStartListening}
          onStopListening={onStopListening}
        />
      );

      const micBtn = screen.getByTitle(/falar com o assistente/i);
      fireEvent.click(micBtn);
      expect(onStartListening).toHaveBeenCalledTimes(1);

      rerender(
        <VoiceAgentWidget
          {...defaultProps}
          status="listening"
          onStartListening={onStartListening}
          onStopListening={onStopListening}
        />
      );

      const stopMicBtn = screen.getByTitle(/parar de ouvir/i);
      fireEvent.click(stopMicBtn);
      expect(onStopListening).toHaveBeenCalledTimes(1);
    });

    it('deve permitir mutar voz e limpar histórico', () => {
      const onToggleMute = vi.fn();
      const onClearHistory = vi.fn();

      render(
        <VoiceAgentWidget
          {...defaultProps}
          onToggleMute={onToggleMute}
          onClearHistory={onClearHistory}
        />
      );

      const muteBtn = screen.getByTitle(/mutar voz do assistente/i);
      fireEvent.click(muteBtn);
      expect(onToggleMute).toHaveBeenCalledTimes(1);

      const clearBtn = screen.getByTitle(/limpar conversa/i);
      fireEvent.click(clearBtn);
      expect(onClearHistory).toHaveBeenCalledTimes(1);
    });
  });

  describe('VoiceWaveform', () => {
    it('deve renderizar o canvas de waveform', () => {
      render(<VoiceWaveform status="idle" audioLevel={0} />);
      expect(screen.getByLabelText(/visualizador de áudio/i)).toBeInTheDocument();
      expect(screen.getByText(/pronto para ouvir/i)).toBeInTheDocument();
    });
  });
});
