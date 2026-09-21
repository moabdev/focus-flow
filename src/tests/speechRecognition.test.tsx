import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import React from 'react';
import { useSpeechRecognition } from '@/features/zenmode/hooks/useSpeechRecognition';
import { NotionToolbar } from '@/features/notion/components/notion/NotionToolbar';
import { NotionNoteEditor } from '@/features/notion/components/NotionNoteEditor';
import { Subtask, Project } from '@/features/core/types';

describe('Sistema de Transcrição e Ditado por Voz (Speech Recognition)', () => {
  const originalWindow = { ...window };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
  });

  it('deve identificar quando o navegador não suporta Web Speech API', () => {
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;

    const onError = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({ onError }));

    expect(result.current.isSupported).toBe(false);

    act(() => {
      result.current.startListening();
    });

    expect(onError).toHaveBeenCalledWith(expect.stringContaining('não suporta reconhecimento de voz'));
    expect(result.current.isListening).toBe(false);
  });

  it('deve inicializar e iniciar escuta quando Web Speech API estiver disponível', () => {
    let onStartCb: any = null;
    let onResultCb: any = null;
    let onEndCb: any = null;

    const mockRecognitionInstance = {
      lang: '',
      continuous: false,
      interimResults: false,
      maxAlternatives: 1,
      start: vi.fn().mockImplementation(() => {
        if (onStartCb) onStartCb();
      }),
      stop: vi.fn().mockImplementation(() => {
        if (onEndCb) onEndCb();
      }),
      abort: vi.fn(),
      set onstart(fn: any) {
        onStartCb = fn;
      },
      set onresult(fn: any) {
        onResultCb = fn;
      },
      set onend(fn: any) {
        onEndCb = fn;
      },
      set onerror(fn: any) {},
    };

    (window as any).webkitSpeechRecognition = vi.fn().mockImplementation(() => mockRecognitionInstance);

    const onResult = vi.fn();
    const { result } = renderHook(() =>
      useSpeechRecognition({
        lang: 'pt-BR',
        onResult,
      })
    );

    expect(result.current.isSupported).toBe(true);

    act(() => {
      result.current.startListening();
    });

    expect(result.current.isListening).toBe(true);

    // Simula evento de fala final
    act(() => {
      if (onResultCb) {
        onResultCb({
          resultIndex: 0,
          results: [
            {
              isFinal: true,
              length: 1,
              0: { transcript: 'Anotação importante sobre TypeScript', confidence: 0.98 },
            },
          ],
        });
      }
    });

    expect(onResult).toHaveBeenCalledWith('Anotação importante sobre TypeScript', true);

    act(() => {
      result.current.stopListening();
    });

    expect(result.current.isListening).toBe(false);
  });

  it('deve renderizar o botão de microfone na NotionToolbar e disparar toggle', () => {
    const onToggleSpeech = vi.fn();

    render(
      <NotionToolbar
        onInsertText={vi.fn()}
        viewMode="edit"
        setViewMode={vi.fn()}
        isListening={false}
        onToggleSpeech={onToggleSpeech}
        isSpeechSupported={true}
      />
    );

    const micBtn = screen.getByLabelText('Ditado por voz');
    expect(micBtn).toBeInTheDocument();
    expect(micBtn).toHaveAttribute('title', expect.stringContaining('Ditado por Voz'));

    fireEvent.click(micBtn);
    expect(onToggleSpeech).toHaveBeenCalledTimes(1);
  });

  it('deve exibir estilo ativo de gravação na NotionToolbar quando isListening for true', () => {
    render(
      <NotionToolbar
        onInsertText={vi.fn()}
        viewMode="edit"
        setViewMode={vi.fn()}
        isListening={true}
        onToggleSpeech={vi.fn()}
        isSpeechSupported={true}
      />
    );

    const micBtn = screen.getByLabelText('Ditado por voz');
    expect(micBtn).toHaveClass('listening');
    expect(micBtn).toHaveAttribute('title', expect.stringContaining('Gravando...'));
  });

  it('deve abrir o NotionNoteEditor com suporte a transcrição', () => {
    const mockSubtask: Subtask = {
      id: 'sub-1',
      title: 'Estudar Algoritmos de Ordenação',
      priority: 'alta',
      pomodoros_estimated: 4,
      pomodoros_completed: 1,
      is_completed: false,
      notes: '# Resumo de QuickSort',
      created_at: '2026-09-20T10:00:00Z',
    };

    const mockProject: Project = {
      id: 'proj-1',
      title: 'Estruturas de Dados',
      color: '#ff2a5f',
      total_elapsed_seconds: 3600,
      created_at: '2026-09-20T10:00:00Z',
    };

    const onSaveNotes = vi.fn();

    render(
      <NotionNoteEditor
        isOpen={true}
        onClose={vi.fn()}
        subtask={mockSubtask}
        project={mockProject}
        onSaveNotes={onSaveNotes}
      />
    );

    expect(screen.getByText('📝 Estudar Algoritmos de Ordenação')).toBeInTheDocument();
    expect(screen.getByDisplayValue('# Resumo de QuickSort')).toBeInTheDocument();
    expect(screen.getByLabelText('Ditado por voz')).toBeInTheDocument();
  });
});
