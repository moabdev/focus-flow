import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  AppViewMode,
  CalendarEvent,
  PriorityLevel,
  Project,
  Subtask,
  TimerMode,
} from '@/features/core/types';
import {
  BrowserSpeechRecognition,
  BrowserSpeechSynthesis,
  processVoiceAgentMessage,
  AgentAppContext,
  AgentToolCall,
} from '@/services/ai/voiceAgentService';
import { useToast } from '@/features/core/contexts/ToastContext';

export type AgentStatus = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

export interface AgentChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  actionSummary?: string;
}

export interface UseVoiceAgentProps {
  apiKey?: string;
  currentView: AppViewMode;
  setCurrentView: (view: AppViewMode) => void;
  timer: {
    isRunning: boolean;
    mode: TimerMode;
    formattedTime: string;
    toggle: () => void;
    reset: () => void;
    skip: () => void;
    changeMode?: (mode: TimerMode) => void;
  };
  projects: Project[];
  subtasks: Subtask[];
  activeProject: Project | null;
  activeSubtask: Subtask | null;
  events: CalendarEvent[];
  onCreateSubtask: (
    title: string,
    projectId?: string,
    priority?: PriorityLevel,
    estimatedPomodoros?: number,
    dueDate?: string
  ) => Promise<Subtask | null>;
  onToggleSubtaskCompleted: (id: string) => Promise<void>;
  onDeleteSubtask?: (id: string) => Promise<void>;
  onAddCalendarEvent?: (event: {
    title: string;
    start_time: string;
    end_time: string;
    description?: string;
  }) => Promise<void>;
  onAddMantra?: (mantra: string) => void;
  onAddQuickNote?: (title: string, content: string, projectId?: string | null) => Promise<void>;
}

export const useVoiceAgent = ({
  apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '',
  currentView,
  setCurrentView,
  timer,
  projects,
  subtasks,
  activeProject,
  activeSubtask,
  events,
  onCreateSubtask,
  onToggleSubtaskCompleted,
  onDeleteSubtask,
  onAddCalendarEvent,
  onAddMantra,
  onAddQuickNote,
}: UseVoiceAgentProps) => {
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<AgentChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: 'Olá! Sou o Flow, seu assistente de foco. Você pode me pedir para iniciar o Pomodoro, criar tarefas, agendar eventos ou consultar seu dia.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const speechRecognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const speechSynthesisRef = useRef<BrowserSpeechSynthesis | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Inicializa motores de fala do navegador
  useEffect(() => {
    speechRecognitionRef.current = new BrowserSpeechRecognition();
    speechSynthesisRef.current = new BrowserSpeechSynthesis();

    return () => {
      speechRecognitionRef.current?.stop();
      speechSynthesisRef.current?.stop();
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const isSpeechSupported = useMemo(() => {
    return !!speechRecognitionRef.current?.isSupported();
  }, []);

  // Coleta o contexto dinâmico do app
  const getAppContext = useCallback((): AgentAppContext => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const todayEvents = events.filter((e) => e.start_time.startsWith(todayStr));

    return {
      currentTime: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      currentDate: now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }),
      currentView,
      isTimerRunning: timer.isRunning,
      timerMode: timer.mode,
      timerRemainingFormatted: timer.formattedTime,
      activeTaskTitle: activeSubtask?.title,
      activeProjectTitle: activeProject?.title,
      pendingTasksCount: subtasks.filter((s) => !s.is_completed).length,
      completedTasksCount: subtasks.filter((s) => s.is_completed).length,
      todayEventsCount: todayEvents.length,
      availableProjects: projects.map((p) => ({ id: p.id, title: p.title })),
      recentSubtasks: subtasks.slice(0, 10).map((s) => ({
        id: s.id,
        title: s.title,
        is_completed: s.is_completed,
        projectName: projects.find((p) => p.id === s.project_id)?.title,
      })),
    };
  }, [events, currentView, timer, activeSubtask, activeProject, subtasks, projects]);

  // Executa as ações / tools despachadas pelo Gemini
  const executeToolCalls = useCallback(
    async (toolCalls: AgentToolCall[]): Promise<string[]> => {
      const summaries: string[] = [];

      for (const call of toolCalls) {
        try {
          switch (call.name) {
            case 'controlPomodoro': {
              const { action, mode } = call.args;
              if (action === 'start' || action === 'resume') {
                if (!timer.isRunning) timer.toggle();
                summaries.push('⏱️ Timer iniciado');
              } else if (action === 'pause' || action === 'stop') {
                if (timer.isRunning) timer.toggle();
                summaries.push('⏸️ Timer pausado');
              } else if (action === 'skip') {
                timer.skip();
                summaries.push('⏭️ Timer avançado');
              }
              if (mode && timer.changeMode) {
                timer.changeMode(mode);
              }
              break;
            }

            case 'manageTasks': {
              const { action, title, priority, estimatedPomodoros, dueDate, projectName } = call.args;
              if (action === 'create' && title) {
                let targetProjectId: string | undefined;
                if (projectName) {
                  const foundProj = projects.find(
                    (p) => p.title.toLowerCase().includes(projectName.toLowerCase())
                  );
                  if (foundProj) targetProjectId = foundProj.id;
                } else if (activeProject) {
                  targetProjectId = activeProject.id;
                }

                await onCreateSubtask(
                  title,
                  targetProjectId,
                  priority || 'media',
                  estimatedPomodoros || 1,
                  dueDate
                );
                summaries.push(`✅ Tarefa "${title}" criada`);
              } else if (action === 'complete' && title) {
                const targetSubtask = subtasks.find(
                  (s) => !s.is_completed && s.title.toLowerCase().includes(title.toLowerCase())
                );
                if (targetSubtask) {
                  await onToggleSubtaskCompleted(targetSubtask.id);
                  summaries.push(`🎯 Tarefa "${targetSubtask.title}" marcada como concluída`);
                }
              } else if (action === 'delete' && title && onDeleteSubtask) {
                const targetSubtask = subtasks.find(
                  (s) => s.title.toLowerCase().includes(title.toLowerCase())
                );
                if (targetSubtask) {
                  await onDeleteSubtask(targetSubtask.id);
                  summaries.push(`🗑️ Tarefa "${targetSubtask.title}" removida`);
                }
              }
              break;
            }

            case 'manageCalendar': {
              const { action, title, startTime, endTime } = call.args;
              if (action === 'create_event' && title && onAddCalendarEvent) {
                const now = new Date();
                const defaultStart = startTime || new Date(now.getTime() + 15 * 60000).toISOString().slice(0, 16);
                const defaultEnd = endTime || new Date(now.getTime() + 75 * 60000).toISOString().slice(0, 16);

                await onAddCalendarEvent({
                  title,
                  start_time: defaultStart,
                  end_time: defaultEnd,
                });
                summaries.push(`📅 Evento "${title}" adicionado ao calendário`);
              }
              break;
            }

            case 'navigateApp': {
              const { view } = call.args;
              if (view) {
                setCurrentView(view);
                summaries.push(`🧭 Navegado para "${view}"`);
              }
              break;
            }

            case 'createStudyMaterial': {
              const { type, title, content, front, back } = call.args;
              if (type === 'quick_note' && onAddQuickNote) {
                await onAddQuickNote(title || 'Nota por Voz', content || '', activeProject?.id);
                summaries.push(`📝 Nota rápida salva`);
              } else if (type === 'mantra' && onAddMantra && content) {
                onAddMantra(content);
                summaries.push(`✨ Novo mantra adicionado`);
              } else if (type === 'flashcard' && onAddQuickNote) {
                await onAddQuickNote(
                  `Flashcard: ${front || title || 'Conceito'}`,
                  `Frente: ${front || title || ''}\nVerso: ${back || content || ''}`,
                  activeProject?.id
                );
                summaries.push(`🎴 Flashcard registrado`);
              }
              break;
            }

            case 'summarizeProductivity': {
              summaries.push('📊 Resumo de produtividade gerado');
              break;
            }
          }
        } catch (toolError) {
          console.error('[useVoiceAgent] Erro ao executar ferramenta:', toolError);
        }
      }

      return summaries;
    },
    [
      timer,
      projects,
      activeProject,
      subtasks,
      onCreateSubtask,
      onToggleSubtaskCompleted,
      onDeleteSubtask,
      onAddCalendarEvent,
      setCurrentView,
      onAddQuickNote,
      onAddMantra,
    ]
  );

  // Reproduz áudio TTS
  const speakText = useCallback(
    (text: string) => {
      if (isMuted || !speechSynthesisRef.current) return;

      setStatus('speaking');
      speechSynthesisRef.current.speak(text, {
        onStart: () => setStatus('speaking'),
        onEnd: () => setStatus('idle'),
        onError: () => setStatus('idle'),
      });
    },
    [isMuted]
  );

  // Envia mensagem e processa com Gemini
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMessageId = Date.now().toString();
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const newHistory = [
        ...messages,
        {
          id: userMessageId,
          role: 'user' as const,
          content: text.trim(),
          timestamp: timeStr,
        },
      ];

      setMessages(newHistory);
      setTranscript('');
      setStatus('thinking');
      setErrorMessage(null);

      try {
        const effectiveApiKey = apiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY;
        if (!effectiveApiKey) {
          throw new Error('Chave VITE_GEMINI_API_KEY não encontrada.');
        }

        const context = getAppContext();
        const geminiHistory = newHistory.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const result = await processVoiceAgentMessage(text, context, effectiveApiKey, geminiHistory);

        // Executa tools
        const actionSummaries = await executeToolCalls(result.toolCalls);

        const modelMessageId = (Date.now() + 1).toString();
        const replyText = result.speechText || 'Pronto!';

        setMessages((prev) => [
          ...prev,
          {
            id: modelMessageId,
            role: 'model',
            content: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actionSummary: actionSummaries.join(' • '),
          },
        ]);

        speakText(replyText);
      } catch (err: any) {
        console.error('[useVoiceAgent] Erro na resposta:', err);
        const errMsg = err?.message || 'Não consegui processar o comando no momento.';
        setErrorMessage(errMsg);
        setStatus('error');
        toast.error(errMsg, 'Erro no Voice Copilot');
      }
    },
    [apiKey, messages, getAppContext, executeToolCalls, speakText]
  );

  // Microfone e captura de áudio com Web Audio API
  const startListening = useCallback(() => {
    if (!speechRecognitionRef.current) {
      toast.error('Reconhecimento de voz não suportado neste navegador.', 'STT Indisponível');
      return;
    }

    // Interrompe fala anterior se houver
    speechSynthesisRef.current?.stop();
    setErrorMessage(null);
    setTranscript('');

    // Iniciar AudioContext para visualizador de ondas
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          micStreamRef.current = stream;
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateAudioLevel = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(1, avg / 128));
            animFrameRef.current = requestAnimationFrame(updateAudioLevel);
          };
          updateAudioLevel();
        })
        .catch((err) => {
          console.warn('[useVoiceAgent] Microfone não acessível para áudio analyzer:', err);
        });
    }

    speechRecognitionRef.current.start({
      onStart: () => {
        setStatus('listening');
      },
      onInterimResult: (partial) => {
        setTranscript(partial);
      },
      onFinalResult: (final) => {
        setTranscript(final);
        setStatus('thinking');
        sendMessage(final);
      },
      onError: (err) => {
        console.warn('[useVoiceAgent] Erro no STT:', err);
        setStatus('idle');
        setAudioLevel(0);
        if (err.includes('not-allowed') || err.includes('permission')) {
          setErrorMessage('Permissão de microfone negada no navegador.');
          toast.error('Habilite o microfone nas permissões do site.', 'Microfone Bloqueado');
        }
      },
      onEnd: () => {
        setAudioLevel(0);
        if (status === 'listening') {
          setStatus('idle');
        }
      },
    });
  }, [sendMessage, status]);

  const stopListening = useCallback(() => {
    speechRecognitionRef.current?.stop();
    speechSynthesisRef.current?.stop();
    setStatus('idle');
    setAudioLevel(0);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'model',
        content: 'Histórico limpo. Como posso ajudar com seu foco agora?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, []);

  return {
    isOpen,
    setIsOpen,
    status,
    transcript,
    messages,
    isMuted,
    setIsMuted,
    audioLevel,
    isSpeechSupported,
    errorMessage,
    startListening,
    stopListening,
    sendMessage,
    clearHistory,
  };
};
