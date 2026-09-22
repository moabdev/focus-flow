import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { AppViewMode, PriorityLevel, TimerMode } from '@/features/core/types';

// Tipos de ferramentas executáveis pelo Voice Agent
export interface ControlPomodoroArgs {
  action: 'start' | 'pause' | 'resume' | 'stop' | 'skip';
  durationMinutes?: number;
  taskTitle?: string;
  mode?: TimerMode;
}

export interface ManageTasksArgs {
  action: 'create' | 'complete' | 'delete' | 'list';
  title?: string;
  projectName?: string;
  priority?: PriorityLevel;
  estimatedPomodoros?: number;
  dueDate?: string;
}

export interface ManageCalendarArgs {
  action: 'create_event' | 'get_events_today' | 'delete_event';
  title?: string;
  startTime?: string;
  endTime?: string;
}

export interface CreateStudyMaterialArgs {
  type: 'quick_note' | 'flashcard' | 'mantra';
  title?: string;
  content?: string;
  front?: string;
  back?: string;
}

export interface NavigateAppArgs {
  view: AppViewMode;
}

export interface SummarizeProductivityArgs {
  timeframe?: 'today' | 'week';
}

export type AgentToolCall =
  | { name: 'controlPomodoro'; args: ControlPomodoroArgs }
  | { name: 'manageTasks'; args: ManageTasksArgs }
  | { name: 'manageCalendar'; args: ManageCalendarArgs }
  | { name: 'createStudyMaterial'; args: CreateStudyMaterialArgs }
  | { name: 'navigateApp'; args: NavigateAppArgs }
  | { name: 'summarizeProductivity'; args: SummarizeProductivityArgs };

export interface AgentResponse {
  speechText: string;
  toolCalls: AgentToolCall[];
}

export interface AgentAppContext {
  currentTime: string;
  currentDate: string;
  currentView: AppViewMode;
  isTimerRunning: boolean;
  timerMode: TimerMode;
  timerRemainingFormatted: string;
  activeTaskTitle?: string;
  activeProjectTitle?: string;
  pendingTasksCount: number;
  completedTasksCount: number;
  todayEventsCount: number;
  availableProjects: { id: string; title: string }[];
  recentSubtasks: { id: string; title: string; is_completed: boolean; projectName?: string }[];
}

// Declaração de Ferramentas para o Gemini
export const voiceAgentFunctionDeclarations: FunctionDeclaration[] = [
  {
    name: 'controlPomodoro',
    description: 'Controla o timer de Pomodoro e foco do usuário (iniciar, pausar, avançar, pular, mudar tempo).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          enum: ['start', 'pause', 'resume', 'stop', 'skip'],
          description: 'Ação a ser executada no timer.',
        },
        durationMinutes: {
          type: Type.NUMBER,
          description: 'Duração opcional em minutos caso o usuário queira um tempo específico (ex: 25, 50, 15).',
        },
        taskTitle: {
          type: Type.STRING,
          description: 'Título ou assunto da tarefa a ser focada.',
        },
        mode: {
          type: Type.STRING,
          enum: ['pomodoro', 'shortBreak', 'longBreak'],
          description: 'Modo do timer.',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'manageTasks',
    description: 'Cria, conclui, busca ou remove tarefas e subtarefas no FocusFlow.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          enum: ['create', 'complete', 'delete', 'list'],
          description: 'Ação com a tarefa.',
        },
        title: {
          type: Type.STRING,
          description: 'Título da tarefa a ser criada ou concluída.',
        },
        projectName: {
          type: Type.STRING,
          description: 'Nome do projeto ao qual a tarefa pertence.',
        },
        priority: {
          type: Type.STRING,
          enum: ['baixa', 'media', 'alta'],
          description: 'Prioridade da tarefa.',
        },
        estimatedPomodoros: {
          type: Type.NUMBER,
          description: 'Estimativa de pomodoros (ex: 1, 2, 4).',
        },
        dueDate: {
          type: Type.STRING,
          description: 'Data de entrega no formato YYYY-MM-DD.',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'manageCalendar',
    description: 'Agenda compromissos ou blocos de estudo no calendário com sincronização automática.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          enum: ['create_event', 'get_events_today', 'delete_event'],
          description: 'Ação no calendário.',
        },
        title: {
          type: Type.STRING,
          description: 'Título do evento ou compromisso.',
        },
        startTime: {
          type: Type.STRING,
          description: 'Horário de início (formato ISO ou YYYY-MM-DDTHH:mm).',
        },
        endTime: {
          type: Type.STRING,
          description: 'Horário de término (formato ISO ou YYYY-MM-DDTHH:mm).',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'createStudyMaterial',
    description: 'Cria notas rápidas, anotações de estudo, mantras ou flashcards ditados pelo usuário.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          enum: ['quick_note', 'flashcard', 'mantra'],
          description: 'Tipo de material de estudo a criar.',
        },
        title: {
          type: Type.STRING,
          description: 'Título da nota ou conceito.',
        },
        content: {
          type: Type.STRING,
          description: 'Conteúdo detalhado da nota ou frase do mantra.',
        },
        front: {
          type: Type.STRING,
          description: 'Frente do flashcard (pergunta ou conceito).',
        },
        back: {
          type: Type.STRING,
          description: 'Verso do flashcard (resposta ou explicação).',
        },
      },
      required: ['type'],
    },
  },
  {
    name: 'navigateApp',
    description: 'Navega para uma tela específica da aplicação (timer, projects, calendar, ranking, drafts, flashcards, mindmaps).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        view: {
          type: Type.STRING,
          enum: ['timer', 'projects', 'project-detail', 'calendar', 'groups', 'ranking', 'drafts', 'flashcards', 'mindmaps'],
          description: 'Nome da view para navegar.',
        },
      },
      required: ['view'],
    },
  },
  {
    name: 'summarizeProductivity',
    description: 'Solicita um resumo falado do progresso, estatísticas de foco e tarefas concluídas.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        timeframe: {
          type: Type.STRING,
          enum: ['today', 'week'],
          description: 'Período a resumir.',
        },
      },
    },
  },
];

/**
 * Monta as instruções de sistema para o assistente de voz do FocusFlow
 */
export const buildSystemInstruction = (context: AgentAppContext): string => {
  return `Você é o "Flow", o assistente de voz e copiloto de produtividade do FocusFlow.
Seu papel é ajudar o usuário a focar, gerenciar tarefas, controlar o Pomodoro, agendar eventos e manter a motivação através da voz.

Diretrizes de fala e resposta:
1. Respostas CURTAS, CONCISAS e NATURAIS (máximo 1 a 2 frases faladas). Como você fala por áudio, evite respostas longas ou monólogos.
2. Use tom prestativo, encorajador e direto ao ponto.
3. Se o usuário pedir para fazer algo no app (ex: iniciar pomodoro, criar tarefa, abrir calendário, criar nota), SEMPRE chame a ferramenta apropriada com os parâmetros correspondentes.
4. Confirme verbalmente a ação que você tomou de forma clara e amigável.

Estado atual do usuário e da aplicação:
- Data/Hora: ${context.currentDate} às ${context.currentTime}
- Tela atual: ${context.currentView}
- Timer de Foco: ${context.isTimerRunning ? 'EM ANDAMENTO' : 'PAUSADO/PARADO'} (${context.timerMode}, tempo restante: ${context.timerRemainingFormatted})
- Tarefa em foco: ${context.activeTaskTitle || 'Nenhuma selecionada'}
- Projeto ativo: ${context.activeProjectTitle || 'Geral'}
- Tarefas pendentes: ${context.pendingTasksCount} | Concluídas: ${context.completedTasksCount}
- Eventos hoje: ${context.todayEventsCount}
- Projetos cadastrados: ${context.availableProjects.map((p) => p.title).join(', ') || 'Nenhum'}
- Tarefas recentes: ${context.recentSubtasks.map((t) => `"${t.title}" (${t.is_completed ? 'Feita' : 'Pendente'})`).join(', ') || 'Nenhuma'}`;
};

/**
 * Envia uma mensagem ou transcrição de voz para o Gemini com Function Calling
 */
export const processVoiceAgentMessage = async (
  prompt: string,
  context: AgentAppContext,
  apiKey: string,
  history: { role: 'user' | 'model'; content: string }[] = []
): Promise<AgentResponse> => {
  if (!apiKey) {
    throw new Error('API Key do Gemini não configurada.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const systemInstruction = buildSystemInstruction(context);

  const formattedContents = [
    ...history.slice(-4).map((h) => ({
      role: h.role,
      parts: [{ text: h.content }],
    })),
    {
      role: 'user',
      parts: [{ text: prompt }],
    },
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
        tools: [{ functionDeclarations: voiceAgentFunctionDeclarations }],
      },
    });

    const toolCalls: AgentToolCall[] = [];
    const functionCalls = response.functionCalls;

    if (functionCalls && Array.isArray(functionCalls)) {
      for (const fc of functionCalls) {
        toolCalls.push({
          name: fc.name as any,
          args: (fc.args || {}) as any,
        });
      }
    }

    let speechText = response.text || '';
    if (!speechText && toolCalls.length > 0) {
      // Fallback amigável se o modelo apenas chamou a tool sem gerar texto
      const firstCall = toolCalls[0];
      if (firstCall.name === 'controlPomodoro') speechText = 'Ajustando o timer para você!';
      else if (firstCall.name === 'manageTasks') speechText = 'Tarefa atualizada no seu painel.';
      else if (firstCall.name === 'manageCalendar') speechText = 'Evento sincronizado na sua agenda.';
      else if (firstCall.name === 'navigateApp') speechText = 'Navegando para a tela solicitada.';
      else if (firstCall.name === 'createStudyMaterial') speechText = 'Material salvo nas suas anotações.';
      else speechText = 'Ação executada com sucesso.';
    }

    return {
      speechText,
      toolCalls,
    };
  } catch (error) {
    console.error('[VoiceAgentService] Erro ao processar mensagem:', error);
    throw error;
  }
};

/**
 * Utilitários para Web Speech API (Speech Recognition & Speech Synthesis)
 */

export interface SpeechRecognitionHandlers {
  onInterimResult: (transcript: string) => void;
  onFinalResult: (transcript: string) => void;
  onError: (error: string) => void;
  onStart: () => void;
  onEnd: () => void;
}

export class BrowserSpeechRecognition {
  private recognition: any = null;
  private isListening: boolean = false;

  constructor() {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      this.recognition = new SpeechRecognitionAPI();
      this.recognition.lang = 'pt-BR';
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public start(handlers: SpeechRecognitionHandlers): void {
    if (!this.recognition) {
      handlers.onError('Web Speech API não suportada neste navegador.');
      return;
    }

    if (this.isListening) {
      this.stop();
    }

    this.recognition.onstart = () => {
      this.isListening = true;
      handlers.onStart();
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += item[0].transcript;
        } else {
          interimTranscript += item[0].transcript;
        }
      }

      if (interimTranscript) {
        handlers.onInterimResult(interimTranscript);
      }
      if (finalTranscript) {
        handlers.onFinalResult(finalTranscript);
      }
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      handlers.onError(event.error || 'Erro no reconhecimento de voz.');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      handlers.onEnd();
    };

    try {
      this.recognition.start();
    } catch (err) {
      console.warn('[BrowserSpeechRecognition] Erro ao iniciar:', err);
    }
  }

  public stop(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.warn('[BrowserSpeechRecognition] Erro ao parar:', err);
      }
      this.isListening = false;
    }
  }
}

export class BrowserSpeechSynthesis {
  private synth: SpeechSynthesis | null = null;
  private isSpeaking: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public isSupported(): boolean {
    return !!this.synth;
  }

  public speak(
    text: string,
    options: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): void {
    if (!this.synth) return;

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Tentar selecionar voz natural em pt-BR se disponível
    const voices = this.synth.getVoices();
    const ptVoice =
      voices.find((v) => v.lang === 'pt-BR' && (v.name.includes('Google') || v.name.includes('Luciana') || v.name.includes('Natural'))) ||
      voices.find((v) => v.lang.startsWith('pt'));

    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      options.onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      options.onEnd?.();
    };

    utterance.onerror = (err) => {
      this.isSpeaking = false;
      options.onError?.(err);
    };

    this.synth.speak(utterance);
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }
}
