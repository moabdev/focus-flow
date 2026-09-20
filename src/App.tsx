import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from './hooks/useTheme';
import { useAudio } from './hooks/useAudio';
import { useProjects } from './hooks/useProjects';
import { useCalendar } from './hooks/useCalendar';
import { useQuotes } from './hooks/useQuotes';
import { useStats } from './hooks/useStats';
import { useTimer } from './hooks/useTimer';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { supabaseService } from './services/supabase';
import { storageService } from './services/storage';
import { badgeService } from './services/badgeService';
import { storageGroupsService } from './services/storageGroups';
import { useToast } from './context/ToastContext';
import type { SupabaseProfile, UserSettings, TimerMode, AppViewMode } from './types';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AppViews } from './components/AppViews';
import { AppModals } from './components/AppModals';

export const App: React.FC = () => {
  const { colorMode, toggleColorMode, theme, setTheme, setIsTimerRunning } = useTheme();
  const { ambient, setAmbient, ambientVolume, setAmbientVolume, playAlarm, playClick } = useAudio();
  const [settings, setSettings] = useState<UserSettings>(() => storageService.getSettings());
  const [userProfile, setUserProfile] = useState<SupabaseProfile | null>(null);
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

  // Rastreamento de tempo Pomodoro
  const handleTickSecond = useCallback(
    (mode: TimerMode, elapsedSeconds: number) => {
      if (mode === 'pomodoro' && activeSubtaskId) addTimeSpent(activeSubtaskId, elapsedSeconds);
    },
    [activeSubtaskId, addTimeSpent]
  );

  const handlePomodoroComplete = useCallback(
    (durationMinutes: number) => {
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
    [activeSubtask, activeSubtaskId, addCompletedSession, incrementPomodoro, subtasks, metrics, toast]
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
    const unsubscribe = supabaseService.onAuthChange((profile) => setUserProfile(profile));
    return () => unsubscribe();
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
    onToggleTimer: () => timer.toggle(),
    onSkipTimer: () => timer.skip(),
    onResetTimer: () => timer.reset(),
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

  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
    if (newSettings.theme !== theme) setTheme(newSettings.theme);
  };

  return (
    <div className="app-shell">
      <Sidebar
        currentView={currentView}
        onChangeView={setCurrentView}
        streakDays={metrics.streak.currentStreak}
        projects={projects}
        selectedProjectId={activeProject?.id || 'todos'}
        onSelectProject={(pId) => {
          if (pId !== 'todos') {
            const firstSub = subtasks.find((s) => s.project_id === pId);
            if (firstSub) setActiveSubtaskId(firstSub.id);
          }
        }}
        onOpenProjectDetail={handleOpenProjectDetail}
        onCreateProject={() => setCurrentView('projects')}
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
        onOpenStats={() => setIsStatsOpen(true)}
        onToggleScratchpad={() => setIsScratchpadOpen((prev) => !prev)}
        onEnterZenMode={() => setIsZenModeOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
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
          onOpenStats={() => setIsStatsOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          currentView={currentView}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          isTimerRunning={timer.isRunning}
          timerFormattedTime={timer.formattedTime}
          activeTaskTitle={activeSubtask?.title}
          activeProjectTitle={activeProject?.title}
          onOpenTimerTab={() => setCurrentView('timer')}
        />

        <main className={`app-container view-${currentView}`}>
          <AppViews
            currentView={currentView}
            setCurrentView={setCurrentView}
            activeQuote={activeQuote}
            getRandomQuote={getRandomQuote}
            addMantra={addMantra}
            isRotating={isRotating}
            timer={timer}
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
        isScratchpadOpen={isScratchpadOpen} onCloseScratchpad={() => setIsScratchpadOpen(false)}
        isStatsOpen={isStatsOpen} onCloseStats={() => setIsStatsOpen(false)}
        metrics={metrics}
        isSettingsOpen={isSettingsOpen} onCloseSettings={() => setIsSettingsOpen(false)}
        settings={settings} onUpdateSettings={handleUpdateSettings}
        onPlayAlarm={playAlarm}
        userProfile={userProfile}
        settingsTab={settingsTab}
        isZenModeOpen={isZenModeOpen} onCloseZenMode={() => setIsZenModeOpen(false)}
        timer={timer}
        activeSubtask={activeSubtask}
        activeQuote={activeQuote}
        ambient={ambient} onToggleAmbient={() => setAmbient(ambient === 'rain' ? 'none' : 'rain')}
        isCommandPaletteOpen={isCommandPaletteOpen} onCloseCommandPalette={() => setIsCommandPaletteOpen(false)}
        onNavigate={setCurrentView} onOpenProjectDetail={handleOpenProjectDetail}
        onOpenGroup={() => setCurrentView('groups')} onOpenZenMode={() => setIsZenModeOpen(true)}
        onOpenSettings={handleOpenSettings} onOpenStats={() => setIsStatsOpen(true)}
        onToggleTheme={toggleColorMode} projects={projects} subtasks={subtasks}
      />
    </div>
  );
};
