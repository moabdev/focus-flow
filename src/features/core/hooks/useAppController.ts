import { useState, useCallback, useMemo } from 'react';
import { useTheme } from '@/features/core/hooks/useTheme';
import { useAudio } from '@/features/timer/hooks/useAudio';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { useCalendar } from '@/features/calendar/hooks/useCalendar';
import { useQuotes } from '@/features/quotes/hooks/useQuotes';
import { useStats } from '@/features/stats/hooks/useStats';
import { useTimer } from '@/features/timer/hooks/useTimer';
import { useKeyboardShortcuts } from '@/features/core/hooks/useKeyboardShortcuts';
import { storageService } from '@/features/core/api/storage';
import type { UserSettings, TimerMode } from '@/features/core/types';
import { useAppNavigation } from '@/features/core/hooks/useAppNavigation';
import { useAppAuthAndSync } from '@/features/core/hooks/useAppAuthAndSync';
import { useAppTimerEvents } from '@/features/core/hooks/useAppTimerEvents';
import { useVoiceAgent } from '@/features/voice-agent';

export function useAppController() {
  const { colorMode, toggleColorMode, theme, setTheme, setIsTimerRunning } = useTheme();
  const { ambient, setAmbient, ambientVolume, setAmbientVolume, playAlarm, playClick } = useAudio();
  const [settings, setSettings] = useState<UserSettings>(() => storageService.getSettings());

  const nav = useAppNavigation();

  const projectsHook = useProjects();
  const {
    projects, subtasks, activeSubtask, activeSubtaskId, setActiveSubtaskId, activeProject,
    createSubtask, toggleSubtaskCompleted, deleteSubtask, addTimeSpent, incrementPomodoro, clearProjects
  } = projectsHook;

  const calendarHook = useCalendar();
  const { events, addEvent, deleteEvent, clearEvents } = calendarHook;

  const quotesHook = useQuotes();
  const { activeQuote, addMantra, clearMantras } = quotesHook;
  
  const statsHook = useStats();
  const { metrics, addCompletedSession, clearStats } = statsHook;

  const timerEvents = useAppTimerEvents({
    activeSubtaskId, activeSubtask, subtasks, metrics,
    addTimeSpent, incrementPomodoro, addCompletedSession
  });

  const timer = useTimer({
    settings,
    onPomodoroComplete: timerEvents.handlePomodoroComplete,
    playAlarm,
    setIsTimerRunningTheme: setIsTimerRunning,
    onTickSecond: timerEvents.handleTickSecond,
    activeTaskTitle: activeSubtask?.title,
  });

  const authAndSync = useAppAuthAndSync({
    playClick,
    clearProjects, clearEvents, clearStats, clearMantras,
    resetNavigation: nav.resetNavigation,
    resetTimer: () => timer.reset()
  });

  useKeyboardShortcuts({
    onToggleTimer: () => {
      timerEvents.flushPendingTime();
      timer.toggle();
    },
    onSkipTimer: () => {
      timerEvents.flushPendingTime();
      timer.skip();
    },
    onResetTimer: () => {
      timerEvents.flushPendingTime();
      timer.reset();
    },
    onToggleZenMode: () => nav.setIsZenModeOpen((prev) => !prev),
    onToggleCommandPalette: () => nav.setIsCommandPaletteOpen((prev) => !prev),
    onCloseModals: () => {
      nav.setIsZenModeOpen(false);
      nav.setIsSettingsOpen(false);
      nav.setIsScratchpadOpen(false);
      nav.setIsCommandPaletteOpen(false);
    },
    playClick,
  });

  const timerWithFlush = useMemo(() => ({
    ...timer,
    toggle: () => {
      timerEvents.flushPendingTime();
      timer.toggle();
    },
    skip: () => {
      timerEvents.flushPendingTime();
      timer.skip();
    },
    reset: () => {
      timerEvents.flushPendingTime();
      timer.reset();
    },
    changeMode: (newMode: TimerMode) => {
      timerEvents.flushPendingTime();
      timer.changeMode(newMode);
    },
  }), [timer, timerEvents]);

  const handleUpdateSettings = useCallback((newSettings: UserSettings) => {
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
    if (newSettings.theme !== theme) setTheme(newSettings.theme);
  }, [theme, setTheme]);

  const handleSelectProject = useCallback((pId: string | 'todos') => {
    if (pId !== 'todos') {
      const firstSub = subtasks.find((s) => s.project_id === pId);
      if (firstSub) setActiveSubtaskId(firstSub.id);
    } else {
      setActiveSubtaskId(null);
    }
  }, [subtasks, setActiveSubtaskId]);

  const voiceAgent = useVoiceAgent({
    currentView: nav.currentView,
    setCurrentView: nav.setCurrentView,
    timer: timerWithFlush,
    projects,
    subtasks,
    activeProject,
    activeSubtask,
    events,
    onCreateSubtask: async (title, projectId, priority, estimated, dueDate) => {
      const targetProjId = projectId || activeProject?.id || (projects[0]?.id || 'default');
      return await createSubtask(targetProjId, title, undefined, estimated, priority, undefined, dueDate);
    },
    onToggleSubtaskCompleted: toggleSubtaskCompleted,
    onDeleteSubtask: deleteSubtask,
    onAddCalendarEvent: async (ev) => {
      await addEvent({
        title: ev.title,
        start_time: ev.start_time,
        end_time: ev.end_time,
        description: ev.description,
        project_id: activeProject?.id,
        subtask_id: activeSubtask?.id,
      });
    },
    onDeleteCalendarEvent: deleteEvent,
    onAddMantra: addMantra,
    onAddQuickNote: async (title, content, projectId) => {
      storageService.createQuickNote({
        title,
        content,
        project_id: projectId || null,
        subtask_id: null,
      });
    },
    toggleColorMode,
    setTheme,
    setAmbient,
    setAmbientVolume,
    setIsZenModeOpen: nav.setIsZenModeOpen,
    setIsCommandPaletteOpen: nav.setIsCommandPaletteOpen,
    setIsScratchpadOpen: nav.setIsScratchpadOpen,
    setIsSettingsOpen: nav.setIsSettingsOpen,
  });

  return {
    colorMode, toggleColorMode, theme,
    ambient, setAmbient, ambientVolume, setAmbientVolume, playClick, playAlarm,
    settings, handleUpdateSettings,
    nav, handleSelectProject,
    projectsHook,
    calendarHook,
    quotesHook,
    statsHook,
    timerWithFlush,
    authAndSync,
    voiceAgent
  };
}
