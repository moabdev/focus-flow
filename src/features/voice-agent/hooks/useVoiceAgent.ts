import { useState, useCallback } from 'react';
import { AppViewMode, CalendarEvent, PriorityLevel, Project, Subtask, TimerMode, ColorMode, ThemePalette, AmbientSound } from '@/features/core/types';
import { processVoiceAgentMessage, AgentAppContext } from '@/services/ai/voiceAgentService';
import { useToast } from '@/features/core/contexts/ToastContext';
import { useSpeechRecognition } from './useSpeechRecognition';
import { useSpeechSynthesis } from './useSpeechSynthesis';
import { useAgentTools } from './useAgentTools';

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
  onDeleteCalendarEvent?: (id: string) => Promise<void>;
  onAddMantra?: (mantra: string) => void;
  onAddQuickNote?: (title: string, content: string, projectId?: string | null) => Promise<void>;
  
  toggleColorMode?: (mode?: ColorMode) => void;
  setTheme?: (theme: ThemePalette) => void;
  setAmbient?: (sound: AmbientSound) => void;
  setAmbientVolume?: (vol: number) => void;
  setIsZenModeOpen?: (isOpen: boolean) => void;
  setIsCommandPaletteOpen?: (isOpen: boolean) => void;
  setIsScratchpadOpen?: (isOpen: boolean) => void;
  setIsSettingsOpen?: (isOpen: boolean) => void;
}

export const useVoiceAgent = (props: UseVoiceAgentProps) => {
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [messages, setMessages] = useState<AgentChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: 'Olá! Sou o Flow, seu assistente de foco. Você pode me pedir para iniciar o Pomodoro, criar tarefas, agendar eventos ou consultar seu dia.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isMuted, setIsMuted] = useState(false);

  const {
    transcript,
    setTranscript,
    errorMessage,
    setErrorMessage,
    audioLevel,
    isSpeechSupported,
    startListening,
    stopListening: stopRecognition
  } = useSpeechRecognition({
    onFinalResult: (final) => {
      setStatus('thinking');
      sendMessage(final);
    },
    onStatusChange: (newStatus) => {
      if (newStatus === 'idle' && status === 'listening') {
        setStatus('idle');
      } else if (newStatus === 'listening') {
        setStatus('listening');
      }
    }
  });

  const { speakText, stopSpeaking } = useSpeechSynthesis({
    isMuted,
    onStatusChange: (newStatus) => {
      if (status !== 'error') {
        setStatus(newStatus);
      }
    }
  });

  const { executeToolCalls } = useAgentTools(props);

  const getAppContext = useCallback((): AgentAppContext => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const todayEvents = props.events.filter((e) => e.start_time.startsWith(todayStr));

    const todayEventsDetails = todayEvents.length > 0 
      ? todayEvents.map(e => `"${e.title}" às ${new Date(e.start_time).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}`).join(', ')
      : 'Nenhum evento agendado';

    return {
      currentTime: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      currentDate: now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }),
      currentView: props.currentView,
      isTimerRunning: props.timer.isRunning,
      timerMode: props.timer.mode,
      timerRemainingFormatted: props.timer.formattedTime,
      activeTaskTitle: props.activeSubtask?.title,
      activeProjectTitle: props.activeProject?.title,
      pendingTasksCount: props.subtasks.filter((s) => !s.is_completed).length,
      completedTasksCount: props.subtasks.filter((s) => s.is_completed).length,
      todayEventsCount: todayEvents.length,
      todayEventsDetails,
      availableProjects: props.projects.map((p) => ({ id: p.id, title: p.title })),
      recentSubtasks: props.subtasks.slice(0, 10).map((s) => ({
        id: s.id,
        title: s.title,
        is_completed: s.is_completed,
        projectName: props.projects.find((p) => p.id === s.project_id)?.title,
      })),
    };
  }, [props.events, props.currentView, props.timer, props.activeSubtask, props.activeProject, props.subtasks, props.projects]);

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
        const effectiveApiKey = props.apiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY;
        if (!effectiveApiKey) {
          throw new Error('Chave VITE_GEMINI_API_KEY não encontrada.');
        }

        const context = getAppContext();
        const geminiHistory = newHistory.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const result = await processVoiceAgentMessage(text, context, effectiveApiKey, geminiHistory);

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
    [props.apiKey, messages, getAppContext, executeToolCalls, speakText, setTranscript, setErrorMessage, toast]
  );

  const startListeningWithStopTTS = useCallback(() => {
    stopSpeaking();
    startListening();
  }, [startListening, stopSpeaking]);

  const stopListeningAndTTS = useCallback(() => {
    stopRecognition();
    stopSpeaking();
  }, [stopRecognition, stopSpeaking]);

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
    startListening: startListeningWithStopTTS,
    stopListening: stopListeningAndTTS,
    sendMessage,
    clearHistory,
  };
};
