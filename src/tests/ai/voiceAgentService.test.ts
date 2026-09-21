import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildSystemInstruction,
  voiceAgentFunctionDeclarations,
  processVoiceAgentMessage,
  BrowserSpeechRecognition,
  BrowserSpeechSynthesis,
  AgentAppContext,
} from '@/services/ai/voiceAgentService';

const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent,
      },
    })),
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      NUMBER: 'NUMBER',
      BOOLEAN: 'BOOLEAN',
      ARRAY: 'ARRAY',
    },
  };
});

describe('Voice Agent Service (voiceAgentService)', () => {
  const sampleContext: AgentAppContext = {
    currentTime: '14:30',
    currentDate: 'segunda-feira, 21 de setembro',
    currentView: 'timer',
    isTimerRunning: false,
    timerMode: 'pomodoro',
    timerRemainingFormatted: '25:00',
    activeTaskTitle: 'Aprender React',
    activeProjectTitle: 'Frontend',
    pendingTasksCount: 3,
    completedTasksCount: 2,
    todayEventsCount: 1,
    availableProjects: [{ id: 'p1', title: 'Frontend' }],
    recentSubtasks: [{ id: 's1', title: 'Hooks', is_completed: false, projectName: 'Frontend' }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve montar as instruções de sistema com contexto detalhado do app', () => {
    const instruction = buildSystemInstruction(sampleContext);
    expect(instruction).toContain('Você é o "Flow"');
    expect(instruction).toContain('segunda-feira, 21 de setembro às 14:30');
    expect(instruction).toContain('Aprender React');
    expect(instruction).toContain('Frontend');
    expect(instruction).toContain('PAUSADO/PARADO');
  });

  it('deve conter as declarações de ferramentas de function calling esperadas', () => {
    const toolNames = voiceAgentFunctionDeclarations.map((t) => t.name);
    expect(toolNames).toContain('controlPomodoro');
    expect(toolNames).toContain('manageTasks');
    expect(toolNames).toContain('manageCalendar');
    expect(toolNames).toContain('createStudyMaterial');
    expect(toolNames).toContain('navigateApp');
    expect(toolNames).toContain('summarizeProductivity');
  });

  it('deve lançar erro se a API key estiver vazia', async () => {
    await expect(processVoiceAgentMessage('oi', sampleContext, '')).rejects.toThrow(
      'API Key do Gemini não configurada'
    );
  });

  it('deve processar mensagem de texto e retornar texto e tool calls do Gemini', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: 'Iniciando o seu Pomodoro de 25 minutos!',
      functionCalls: [
        {
          name: 'controlPomodoro',
          args: { action: 'start', durationMinutes: 25 },
        },
      ],
    });

    const result = await processVoiceAgentMessage(
      'inicie um pomodoro de 25 minutos',
      sampleContext,
      'test-api-key'
    );

    expect(result.speechText).toBe('Iniciando o seu Pomodoro de 25 minutos!');
    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls[0].name).toBe('controlPomodoro');
    expect(result.toolCalls[0].args).toEqual({ action: 'start', durationMinutes: 25 });
  });

  it('deve instanciar BrowserSpeechRecognition e verificar suporte', () => {
    const recognition = new BrowserSpeechRecognition();
    expect(typeof recognition.isSupported).toBe('function');
  });

  it('deve instanciar BrowserSpeechSynthesis e verificar suporte', () => {
    const synthesis = new BrowserSpeechSynthesis();
    expect(typeof synthesis.isSupported).toBe('function');
  });
});
