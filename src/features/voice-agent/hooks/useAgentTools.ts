import { useCallback } from 'react';
import { AgentToolCall } from '@/services/ai/voiceAgentService';
import { AppViewMode, PriorityLevel, Project, Subtask, TimerMode, ColorMode, ThemePalette, AmbientSound, CalendarEvent } from '@/features/core/types';

export interface UseAgentToolsProps {
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
  events: CalendarEvent[];
  setCurrentView: (view: AppViewMode) => void;
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
  
  // Novos comandos
  toggleColorMode?: (mode?: ColorMode) => void;
  setTheme?: (theme: ThemePalette) => void;
  setAmbient?: (sound: AmbientSound) => void;
  setAmbientVolume?: (vol: number) => void;
  setIsZenModeOpen?: (isOpen: boolean) => void;
  setIsCommandPaletteOpen?: (isOpen: boolean) => void;
  setIsScratchpadOpen?: (isOpen: boolean) => void;
  setIsSettingsOpen?: (isOpen: boolean) => void;
}

export const useAgentTools = (props: UseAgentToolsProps) => {
  const {
    timer,
    projects,
    activeProject,
    events,
    subtasks,
    onCreateSubtask,
    onToggleSubtaskCompleted,
    onDeleteSubtask,
    onAddCalendarEvent,
    onDeleteCalendarEvent,
    setCurrentView,
    onAddQuickNote,
    onAddMantra,
    toggleColorMode,
    setTheme,
    setAmbient,
    setAmbientVolume,
    setIsZenModeOpen,
    setIsCommandPaletteOpen,
    setIsScratchpadOpen,
    setIsSettingsOpen
  } = props;

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
                  summaries.push(`🎯 Tarefa "${targetSubtask.title}" concluída`);
                }
              } else if (action === 'delete' && title && onDeleteSubtask) {
                const targetSubtask = subtasks.find(
                  (s) => s.title.toLowerCase().includes(title.toLowerCase())
                );
                if (targetSubtask) {
                  await onDeleteSubtask(targetSubtask.id);
                  summaries.push(`🗑️ Tarefa "${targetSubtask.title}" removida`);
                }
              } else if (action === 'list') {
                setCurrentView('projects');
                summaries.push(`📋 Mostrando tarefas`);
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
                summaries.push(`📅 Evento "${title}" adicionado`);
              } else if (action === 'get_events_today') {
                setCurrentView('calendar');
                summaries.push(`📅 Mostrando agenda de hoje`);
              } else if (action === 'delete_event' && title && onDeleteCalendarEvent) {
                const targetEvent = events.find((e) => e.title.toLowerCase().includes(title.toLowerCase()));
                if (targetEvent) {
                  await onDeleteCalendarEvent(targetEvent.id);
                  summaries.push(`🗑️ Evento "${targetEvent.title}" removido da agenda`);
                } else {
                  setCurrentView('calendar');
                  summaries.push(`⚠️ Navegando para o calendário para deletar "${title}" manualmente`);
                }
              }
              break;
            }

            case 'navigateApp': {
              const { view } = call.args;
              if (view) {
                setCurrentView(view);
                summaries.push(`🧭 Navegando para "${view}"`);
              }
              break;
            }

            case 'createStudyMaterial': {
              const { type, title, content, front, back } = call.args;
              if (type === 'quick_note' && onAddQuickNote) {
                await onAddQuickNote(title || 'Nota por Voz', content || '', activeProject?.id);
                summaries.push(`📝 Nota salva`);
              } else if (type === 'mantra' && onAddMantra && content) {
                onAddMantra(content);
                summaries.push(`✨ Mantra adicionado`);
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
              summaries.push('📊 Resumo gerado');
              break;
            }
            
            case 'controlTheme': {
              const { action, palette } = call.args;
              if (action === 'light' || action === 'dark' || action === 'system') {
                toggleColorMode?.(action);
                summaries.push(`🎨 Tema alterado para ${action}`);
              } else if (action === 'palette' && palette && setTheme) {
                setTheme(palette as ThemePalette);
                summaries.push(`🎨 Paleta alterada para ${palette}`);
              }
              break;
            }

            case 'controlAmbientSound': {
              const { action, sound, volume } = call.args;
              if (action === 'play' && sound && setAmbient) {
                setAmbient(sound);
                summaries.push(`🔊 Som ambiente: ${sound}`);
              } else if (action === 'stop' && setAmbient) {
                setAmbient('none');
                summaries.push(`🔇 Som ambiente desligado`);
              }
              if (volume !== undefined && setAmbientVolume) {
                setAmbientVolume(volume);
              }
              break;
            }

            case 'toggleUI': {
              const { panel, action } = call.args;
              const isOpen = action === 'open' || action === 'toggle'; // simplificado para open se for toggle (idealmente leria o estado atual, mas aqui forçamos abrir)
              
              if (panel === 'zenMode') setIsZenModeOpen?.(isOpen);
              else if (panel === 'commandPalette') setIsCommandPaletteOpen?.(isOpen);
              else if (panel === 'scratchpad') setIsScratchpadOpen?.(isOpen);
              else if (panel === 'settings') setIsSettingsOpen?.(isOpen);
              
              summaries.push(`🪟 Painel ${panel} ${action === 'open' ? 'aberto' : 'fechado'}`);
              break;
            }
          }
        } catch (toolError) {
          console.error('[useAgentTools] Erro ao executar ferramenta:', toolError);
        }
      }

      return summaries;
    },
    [
      timer,
      projects,
      events,
      activeProject,
      subtasks,
      onCreateSubtask,
      onToggleSubtaskCompleted,
      onDeleteSubtask,
      onAddCalendarEvent,
      onDeleteCalendarEvent,
      setCurrentView,
      onAddQuickNote,
      onAddMantra,
      toggleColorMode,
      setTheme,
      setAmbient,
      setAmbientVolume,
      setIsZenModeOpen,
      setIsCommandPaletteOpen,
      setIsScratchpadOpen,
      setIsSettingsOpen
    ]
  );

  return { executeToolCalls };
};
