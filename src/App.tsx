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
import type { SupabaseProfile, UserSettings, TimerMode } from './types';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AppViews } from './components/AppViews';
import { AppModals } from './components/AppModals';

export const App: React.FC = () => {
  // 1. Hooks de Sistema
  const { colorMode, toggleColorMode, theme, setTheme, setIsTimerRunning } = useTheme();

  const { ambient, setAmbient, ambientVolume, setAmbientVolume, playAlarm, playClick } = useAudio();

  const [settings, setSettings] = useState<UserSettings>(() => storageService.getSettings());
  const [userProfile, setUserProfile] = useState<SupabaseProfile | null>(null);

  // 2. Visão Ativa (Foco / Projetos / Calendário)
  const [currentView, setCurrentView] = useState<'timer' | 'projects' | 'calendar'>('timer');

  // Estado da Barra Lateral (Sidebar)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('focusflow_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('focusflow_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // 3. Hooks de Negócio: Projetos, Subtasks e Calendário
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
  } = useCalendar();

  const { activeQuote, getRandomQuote, addMantra, isRotating } = useQuotes();
  const { metrics, addCompletedSession } = useStats();

  // Rastreamento de tempo em tempo real a cada segundo no Pomodoro
  const handleTickSecond = useCallback(
    (mode: TimerMode, elapsedSeconds: number) => {
      if (mode === 'pomodoro' && activeSubtaskId) {
        addTimeSpent(activeSubtaskId, elapsedSeconds);
      }
    },
    [activeSubtaskId, addTimeSpent]
  );

  // Callback de conclusão de ciclo Pomodoro
  const handlePomodoroComplete = useCallback(
    (durationMinutes: number) => {
      const discipline = activeSubtask ? activeSubtask.discipline || 'Geral' : 'Geral';
      addCompletedSession(discipline, durationMinutes);
      if (activeSubtaskId) {
        incrementPomodoro(activeSubtaskId);
      }
    },
    [activeSubtask, activeSubtaskId, addCompletedSession, incrementPomodoro]
  );

  // Hook do Timer com rastreamento ao vivo
  const timer = useTimer({
    settings,
    onPomodoroComplete: handlePomodoroComplete,
    playAlarm,
    setIsTimerRunningTheme: setIsTimerRunning,
    onTickSecond: handleTickSecond,
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'timer' | 'theme' | 'sounds' | 'cloud' | 'backup'>('timer');
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [isZenModeOpen, setIsZenModeOpen] = useState(false);

  // 4. Inscrição na Sessão Supabase
  useEffect(() => {
    const unsubscribe = supabaseService.onAuthChange((profile) => {
      setUserProfile(profile);
    });
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
    if (error) {
      alert(`Erro ao iniciar login Google: ${error.message}`);
    }
  };

  const handleSignOut = async () => {
    playClick();
    await supabaseService.signOut();
  };

  // 5. Atalhos de Teclado Globais
  useKeyboardShortcuts({
    onToggleTimer: () => timer.toggle(),
    onSkipTimer: () => timer.skip(),
    onResetTimer: () => timer.reset(),
    onToggleZenMode: () => setIsZenModeOpen((prev) => !prev),
    onCloseModals: () => {
      setIsZenModeOpen(false);
      setIsSettingsOpen(false);
      setIsStatsOpen(false);
      setIsScratchpadOpen(false);
    },
    playClick,
  });

  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
    if (newSettings.theme !== theme) {
      setTheme(newSettings.theme);
    }
  };

  return (
    <div className="app-shell">
      {/* Barra Lateral (Sidebar Moderna) */}
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
        <div className="app-container">
          <Header
            streakDays={metrics.streak.currentStreak}
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
            currentView={currentView}
            onChangeView={setCurrentView}
            onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          />

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
          />
        </div>
      </div>

      <AppModals
        isScratchpadOpen={isScratchpadOpen}
        onCloseScratchpad={() => setIsScratchpadOpen(false)}
        isStatsOpen={isStatsOpen}
        onCloseStats={() => setIsStatsOpen(false)}
        metrics={metrics}
        isSettingsOpen={isSettingsOpen}
        onCloseSettings={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onPlayAlarm={playAlarm}
        userProfile={userProfile}
        settingsTab={settingsTab}
        isZenModeOpen={isZenModeOpen}
        onCloseZenMode={() => setIsZenModeOpen(false)}
        timer={timer}
        activeSubtask={activeSubtask}
        activeQuote={activeQuote}
        ambient={ambient}
        onToggleAmbient={() => setAmbient(ambient === 'rain' ? 'none' : 'rain')}
      />
    </div>
  );
};
