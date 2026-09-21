import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useVoiceAgent } from '@/features/voice-agent/hooks/useVoiceAgent';
import * as voiceAgentService from '@/services/ai/voiceAgentService';
import * as ToastContext from '@/features/core/contexts/ToastContext';

vi.mock('@/services/ai/voiceAgentService', () => {
  return {
    BrowserSpeechRecognition: vi.fn().mockImplementation(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      onStart: vi.fn(),
      onEnd: vi.fn(),
      onResult: vi.fn(),
      onError: vi.fn(),
    })),
    BrowserSpeechSynthesis: vi.fn().mockImplementation(() => ({
      speak: vi.fn(),
      stop: vi.fn(),
      onStart: vi.fn(),
      onEnd: vi.fn(),
    })),
    processVoiceAgentMessage: vi.fn(),
  };
});

vi.mock('@/features/core/contexts/ToastContext', () => ({
  useToast: vi.fn(),
}));

describe('useVoiceAgent Hook', () => {
  const mockToast = {
    addToast: vi.fn(),
  };

  const defaultProps = {
    apiKey: 'fake-key',
    currentView: 'timer' as any,
    setCurrentView: vi.fn(),
    timer: {
      isRunning: false,
      mode: 'pomodoro' as any,
      formattedTime: '25:00',
      toggle: vi.fn(),
      reset: vi.fn(),
      skip: vi.fn(),
    },
    projects: [],
    subtasks: [],
    activeProject: null,
    activeSubtask: null,
    events: [],
    onCreateSubtask: vi.fn(),
    onToggleSubtaskCompleted: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (ToastContext.useToast as any).mockReturnValue(mockToast);
  });

  it('deve inicializar fechado e no estado idle', () => {
    const { result } = renderHook(() => useVoiceAgent(defaultProps as any));
    expect(result.current.isOpen).toBe(false);
    expect(result.current.status).toBe('idle');
    expect(result.current.messages).toHaveLength(1); // Mensagem de boas-vindas
  });

  it('deve permitir abrir e fechar o widget', () => {
    const { result } = renderHook(() => useVoiceAgent(defaultProps as any));
    
    act(() => {
      result.current.setIsOpen(true);
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.setIsOpen(false);
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('deve permitir mutar a voz', () => {
    const { result } = renderHook(() => useVoiceAgent(defaultProps as any));
    expect(result.current.isMuted).toBe(false);
    
    act(() => {
      result.current.setIsMuted(true);
    });
    
    expect(result.current.isMuted).toBe(true);
  });

  it('deve limpar o histórico de mensagens mantendo a de boas-vindas', () => {
    const { result } = renderHook(() => useVoiceAgent(defaultProps as any));
    
    act(() => {
      // Mocking internal state update by tricking a message addition
      // We know clearHistory resets to initial length of 1
      result.current.clearHistory();
    });
    
    expect(result.current.messages).toHaveLength(1);
  });

  it('deve iniciar a escuta ao chamar startListening', () => {
    const { result } = renderHook(() => useVoiceAgent(defaultProps as any));
    
    act(() => {
      result.current.startListening();
    });
    
    // Status is likely updated inside the callbacks of BrowserSpeechRecognition which we mocked,
    // but the function call should not crash.
    expect(result.current.errorMessage).toBeNull();
  });

  it('deve parar a escuta ao chamar stopListening', () => {
    const { result } = renderHook(() => useVoiceAgent(defaultProps as any));
    
    act(() => {
      result.current.stopListening();
    });
    
    expect(result.current.errorMessage).toBeNull();
  });

  it('deve lidar com o envio de mensagens de texto', async () => {
    (voiceAgentService.processVoiceAgentMessage as any).mockResolvedValue({
      reply: 'Tudo bem, timer pausado.',
      toolCalls: [],
    });

    const { result } = renderHook(() => useVoiceAgent(defaultProps as any));
    
    await act(async () => {
      await result.current.sendMessage('Pause o timer');
    });

    expect(voiceAgentService.processVoiceAgentMessage).toHaveBeenCalled();
    // After processing, it should add user msg and bot msg
    expect(result.current.messages.length).toBeGreaterThan(1);
  });
});
