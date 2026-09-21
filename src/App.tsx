import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '@/features/core/hooks/useTheme';
import { useAudio } from '@/features/timer/hooks/useAudio';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { useCalendar } from '@/features/calendar/hooks/useCalendar';
import { useQuotes } from '@/features/quotes/hooks/useQuotes';
import { useStats } from '@/features/stats/hooks/useStats';
import { useTimer } from '@/features/timer/hooks/useTimer';
import { useKeyboardShortcuts } from '@/features/core/hooks/useKeyboardShortcuts';
import { supabaseService } from '@/features/core/api/supabase';
import { storageService } from '@/features/core/api/storage';
import { badgeService } from '@/features/stats/api/badgeService';
import { storageGroupsService } from '@/features/groups/api/storageGroups';
import { syncService } from '@/features/core/api/syncService';
import { useToast } from '@/features/core/contexts/ToastContext';
import type { SupabaseProfile, UserSettings, TimerMode, AppViewMode, CloudSyncInfo } from '@/features/core/types';

import { Header } from '@/features/core/components/Header';
import { Sidebar } from '@/features/core/components/Sidebar';
import { AppViews } from '@/features/core/components/AppViews';
import { AppModals } from '@/features/core/components/AppModals';

export const App: React.FC = () => {
  const { colorMode, toggleColorMode, theme, setTheme, setIsTimerRunning } = useTheme();
  const { ambient, setAmbient, ambientVolume, setAmbientVolume, playAlarm, playClick } = useAudio();
  const [settings, setSettings] = useState<UserSettings>(() => storageService.getSettings());
  const [userProfile, setUserProfile] = useState<SupabaseProfile | null>(null);
  const [syncInfo, setSyncInfo] = useState<CloudSyncInfo>(() => syncService.getStatus());
  const toast = useToast();

  // Visões e Detalhes de Projeto
  const [currentView, setCurrentView] = useState<AppViewMode>('timer');
  const [selectedProjectDetailId, setSelectedProjectDetailId] = useState<string | null>(null);

  // Estado da Barra Lateral
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('focusflow_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem('focusflow_sidebar_collapsed', String(next)); } catch {}
      return next;
    });
  };

  const handleOpenProjectDetail = (id: string) => {
    setSelectedProjectDetailId(id);
    setCurrentView('project-detail');
  };

  const handleBackFromProjectDetail = () => {
    setSelectedProjectDetailId(null);
    setCurrentView('projects');
  };

  // Hooks de Negócio
  const {
    projects,
    subtasks,
    activeSubtask,
    activeSubtaskId,
    setActiveSubtaskId,
    activeProject,
    createProject,
    updateProject,
    deleteProject,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    toggleSubtaskCompleted,
    addTimeSpent,
    incrementPomodoro,
    clearProjects,
  } = useProjects();

  const {
    events,
    selectedDate,
    setSelectedDate,
    calendarView,
    setCalendarView,
    addEvent,
    updateEvent,
    deleteEvent,
    toggleEventCompleted,
    clearEvents,
  } = useCalendar();

  const { activeQuote, getRandomQuote, addMantra, clearMantras, isRotating } = useQuotes();
  const { metrics, addCompletedSession, clearStats } = useStats();

  // Buffer de tempo em memória para evitar 1 gravação + 1 re-render da árvore inteira a cada 1 segundo
  const pendingTimeRef = React.useRef<{ subtaskId: string; seconds: number } | null>(null);

  const flushPendingTime = useCallback(() => {
    if (pendingTimeRef.current && pendingTimeRef.current.seconds > 0) {
      const { subtaskId, seconds } = pendingTimeRef.current;
      pendingTimeRef.current = null;
      addTimeSpent(subtaskId, seconds);
    }
  }, [addTimeSpent]);

  // Rastreamento de tempo Pomodoro com agregação (flush a cada 15 segundos ou ao pausar/finalizar)
  const handleTickSecond = useCallback(
    (mode: TimerMode, elapsedSeconds: number) => {
      if (mode !== 'pomodoro' || !activeSubtaskId || elapsedSeconds <= 0) return;

      if (!pendingTimeRef.current || pendingTimeRef.current.subtaskId !== activeSubtaskId) {
        flushPendingTime();
        pendingTimeRef.current = { subtaskId: activeSubtaskId, seconds: elapsedSeconds };
      } else {
        pendingTimeRef.current.seconds += elapsedSeconds;
      }

      // Descarrega para o estado/storage a cada 15 segundos de foco contínuo
      if (pendingTimeRef.current.seconds >= 15) {
        flushPendingTime();
      }
    },
    [activeSubtaskId, flushPendingTime]
  );

  // Flush ao trocar subtarefa ativa
  useEffect(() => {
    return () => {
      flushPendingTime();
    };
  }, [activeSubtaskId, flushPendingTime]);

  // Flush em caso de fechamento ou ocultamento da aba
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushPendingTime();
      storageService.flushPendingRemoteSync();
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        flushPendingTime();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      flushPendingTime();
    };
  }, [flushPendingTime]);

  const handlePomodoroComplete = useCallback(
    (durationMinutes: number) => {
      flushPendingTime();
      const discipline = activeSubtask?.discipline || 'Geral';
      addCompletedSession(discipline, durationMinutes);
      if (activeSubtaskId) incrementPomodoro(activeSubtaskId);

      // Verificação de Conquistas Desbloqueadas (Gamificação)
      const completedCount = subtasks.filter((t) => t.is_completed).length;
      setTimeout(() => {
        const newBadges = badgeService.checkAndClaimNewBadges(metrics, completedCount);
        newBadges.forEach((badge) => {
          toast.success(
            `Parabéns! Você desbloqueou "${badge.title}" (${badge.icon})`,
            '🏆 Nova Conquista!'
          );
        });
      }, 500);
    },
    [activeSubtask, activeSubtaskId, addCompletedSession, incrementPomodoro, subtasks, metrics, toast, flushPendingTime]
  );

  const timer = useTimer({
    settings,
    onPomodoroComplete: handlePomodoroComplete,
    playAlarm,
    setIsTimerRunningTheme: setIsTimerRunning,
    onTickSecond: handleTickSecond,
    activeTaskTitle: activeSubtask?.title,
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'timer' | 'theme' | 'sounds' | 'cloud' | 'backup'>('timer');
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [isZenModeOpen, setIsZenModeOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = supabaseService.onAuthChange((profile) => {
      setUserProfile(profile);
      syncService.init(profile);
    });
    const unsubscribeSync = syncService.subscribeStatus((info) => setSyncInfo(info));
    return () => {
      unsubscribeAuth();
      unsubscribeSync();
    };
  }, []);

  const handleOpenSettings = (tab: 'timer' | 'theme' | 'sounds' | 'cloud' | 'backup' = 'timer') => {
    playClick();
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  };

  const handleGoogleLogin = async () => {
    playClick();
    const { error } = await supabaseService.signInWithGoogle();
    if (error) toast.error(`Erro ao iniciar login Google: ${error.message}`, 'Falha de Autenticação');
  };

  const handleSignOut = async () => {
    playClick();
    await supabaseService.signOut();
    syncService.init(null);

    // Limpar armazenamento do navegador (localStorage, sessionStorage, tokens de autenticação)
    storageService.clearAllUserData();
    badgeService.clearBadges();
    storageGroupsService.resetGroupsData();

    // Limpar estados da UI imediatamente
    clearProjects();
    clearEvents();
    clearStats();
    clearMantras();
    setUserProfile(null);
    setSelectedProjectDetailId(null);
    setCurrentView('timer');
    timer.reset();

    // Fechar modais abertos
    setIsSettingsOpen(false);
    setIsStatsOpen(false);
    setIsScratchpadOpen(false);
    setIsZenModeOpen(false);
    setIsCommandPaletteOpen(false);

    toast.info('Sessão encerrada e todos os dados pessoais foram excluídos do navegador.', 'Logout');
  };

  useKeyboardShortcuts({
    onToggleTimer: () => {
      flushPendingTime();
      timer.toggle();
    },
    onSkipTimer: () => {
      flushPendingTime();
      timer.skip();
    },
    onResetTimer: () => {
      flushPendingTime();
      timer.reset();
    },
    onToggleZenMode: () => setIsZenModeOpen((prev) => !prev),
    onToggleCommandPalette: () => setIsCommandPaletteOpen((prev) => !prev),
    onCloseModals: () => {
      setIsZenModeOpen(false);
      setIsSettingsOpen(false);
      setIsStatsOpen(false);
      setIsScratchpadOpen(false);
      setIsCommandPaletteOpen(false);
    },
    playClick,
  });

  const timerWithFlush = useMemo(
    () => ({
      ...timer,
      toggle: () => {
        flushPendingTime();
        timer.toggle();
      },
      skip: () => {
        flushPendingTime();
        timer.skip();
      },
      reset: () => {
        flushPendingTime();
        timer.reset();
      },
      changeMode: (newMode: TimerMode) => {
        flushPendingTime();
        timer.changeMode(newMode);
      },
    }),
    [timer, flushPendingTime]
  );

  const handleUpdateSettings = useCallback(
    (newSettings: UserSettings) => {
      setSettings(newSettings);
      storageService.saveSettings(newSettings);
      if (newSettings.theme !== theme) setTheme(newSettings.theme);
    },
    [theme, setTheme]
  );

  const handleSelectProject = useCallback(
    (pId: string | 'todos') => {
      if (pId !== 'todos') {
        const firstSub = subtasks.find((s) => s.project_id === pId);
        if (firstSub) setActiveSubtaskId(firstSub.id);
      } else {
        setActiveSubtaskId(null);
      }
    },
    [subtasks, setActiveSubtaskId]
  );

  const handleCreateProjectNav = useCallback(() => setCurrentView('projects'), []);
  const handleOpenStatsModal = useCallback(() => setIsStatsOpen(true), []);
  const handleCloseStatsModal = useCallback(() => setIsStatsOpen(false), []);
  const handleToggleScratchpad = useCallback(() => setIsScratchpadOpen((prev) => !prev), []);
  const handleCloseScratchpad = useCallback(() => setIsScratchpadOpen(false), []);
  const handleOpenZenMode = useCallback(() => setIsZenModeOpen(true), []);
  const handleCloseZenMode = useCallback(() => setIsZenModeOpen(false), []);
  const handleCloseSettings = useCallback(() => setIsSettingsOpen(false), []);
  const handleOpenCommandPalette = useCallback(() => setIsCommandPaletteOpen(true), []);
  const handleCloseCommandPalette = useCallback(() => setIsCommandPaletteOpen(false), []);
  const handleOpenMobileSidebar = useCallback(() => setIsMobileSidebarOpen(true), []);
  const handleCloseMobileSidebar = useCallback(() => setIsMobileSidebarOpen(false), []);
  const handleNavigateTimerTab = useCallback(() => setCurrentView('timer'), []);
  const handleNavigateGroups = useCallback(() => setCurrentView('groups'), []);
  const handleToggleAmbient = useCallback(
    () => setAmbient(ambient === 'rain' ? 'none' : 'rain'),
    [ambient, setAmbient]
  );

  const handleManualSync = useCallback(async () => {
    const success = await syncService.syncAll();
    if (success) {
      toast.success('Sincronização com o Supabase concluída com sucesso!', 'Nuvem Atualizada');
    } else {
      toast.error('Não foi possível sincronizar no momento. Verifique a conexão.', 'Falha de Sincronização');
    }
  }, [toast]);

  return (
    <div className="app-shell">
      <Sidebar
        currentView={currentView}
        onChangeView={setCurrentView}
        streakDays={metrics.streak.currentStreak}
        projects={projects}
        selectedProjectId={activeProject?.id || 'todos'}
        onSelectProject={handleSelectProject}
        onOpenProjectDetail={handleOpenProjectDetail}
        onCreateProject={handleCreateProjectNav}
        colorMode={colorMode}
        onToggleColorMode={toggleColorMode}
        ambientSound={ambient}
        ambientVolume={ambientVolume}
        onSelectAmbient={setAmbient}
        onSetAmbientVolume={setAmbientVolume}
        userProfile={userProfile}
        onGoogleLogin={handleGoogleLogin}
        onSignOut={handleSignOut}
        onOpenSettings={handleOpenSettings}
        onOpenStats={handleOpenStatsModal}
        onToggleScratchpad={handleToggleScratchpad}
        onEnterZenMode={handleOpenZenMode}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={handleCloseMobileSidebar}
      />

      <div className={`app-main-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header
          streakDays={metrics.streak.currentStreak}
          colorMode={colorMode}
          onToggleColorMode={toggleColorMode}
          userProfile={userProfile}
          onGoogleLogin={handleGoogleLogin}
          onSignOut={handleSignOut}
          onOpenSettings={handleOpenSettings}
          onOpenStats={handleOpenStatsModal}
          onOpenCommandPalette={handleOpenCommandPalette}
          currentView={currentView}
          onOpenMobileSidebar={handleOpenMobileSidebar}
          isTimerRunning={timer.isRunning}
          timerFormattedTime={timer.formattedTime}
          activeTaskTitle={activeSubtask?.title}
          activeProjectTitle={activeProject?.title}
          onOpenTimerTab={handleNavigateTimerTab}
          syncInfo={syncInfo}
          onManualSync={handleManualSync}
        />

        <main className={`app-container view-${currentView}`}>
          <AppViews
            currentView={currentView}
            setCurrentView={setCurrentView}
            activeQuote={activeQuote}
            getRandomQuote={getRandomQuote}
            addMantra={addMantra}
            isRotating={isRotating}
            timer={timerWithFlush}
            activeSubtask={activeSubtask}
            activeProject={activeProject}
            playClick={playClick}
            projects={projects}
            subtasks={subtasks}
            activeSubtaskId={activeSubtaskId}
            setActiveSubtaskId={setActiveSubtaskId}
            selectedProjectDetailId={selectedProjectDetailId}
            onOpenProjectDetail={handleOpenProjectDetail}
            onBackFromProjectDetail={handleBackFromProjectDetail}
            createProject={createProject}
            updateProject={updateProject}
            deleteProject={deleteProject}
            onCreateSubtask={createSubtask}
            onUpdateSubtask={updateSubtask}
            onDeleteSubtask={deleteSubtask}
            onToggleSubtaskCompleted={toggleSubtaskCompleted}
            events={events}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            calendarView={calendarView}
            setCalendarView={setCalendarView}
            addEvent={addEvent}
            updateEvent={updateEvent}
            deleteEvent={deleteEvent}
            toggleEventCompleted={toggleEventCompleted}
            userProfile={userProfile}
            weekMinutes={metrics.weekMinutes}
          />
        </main>
      </div>

      <AppModals
        isScratchpadOpen={isScratchpadOpen}
        onCloseScratchpad={handleCloseScratchpad}
        isStatsOpen={isStatsOpen}
        onCloseStats={handleCloseStatsModal}
        metrics={metrics}
        isSettingsOpen={isSettingsOpen}
        onCloseSettings={handleCloseSettings}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onPlayAlarm={playAlarm}
        userProfile={userProfile}
        settingsTab={settingsTab}
        isZenModeOpen={isZenModeOpen}
        onCloseZenMode={handleCloseZenMode}
        timer={timerWithFlush}
        activeSubtask={activeSubtask}
        activeQuote={activeQuote}
        ambient={ambient}
        onToggleAmbient={handleToggleAmbient}
        isCommandPaletteOpen={isCommandPaletteOpen}
        onCloseCommandPalette={handleCloseCommandPalette}
        onNavigate={setCurrentView}
        onOpenProjectDetail={handleOpenProjectDetail}
        onOpenGroup={handleNavigateGroups}
        onOpenZenMode={handleOpenZenMode}
        onOpenSettings={handleOpenSettings}
        onOpenStats={handleOpenStatsModal}
        onToggleTheme={toggleColorMode}
        projects={projects}
      />
    </div>
  );
};
