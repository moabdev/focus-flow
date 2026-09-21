import React, { useState, useCallback, useMemo } from 'react';
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
import { Header } from '@/features/core/components/Header';
import { Sidebar } from '@/features/core/components/Sidebar';
import { AppViews } from '@/features/core/components/AppViews';
import { AppModals } from '@/features/core/components/AppModals';
import { useAppNavigation } from '@/features/core/hooks/useAppNavigation';
import { useAppAuthAndSync } from '@/features/core/hooks/useAppAuthAndSync';
import { useAppTimerEvents } from '@/features/core/hooks/useAppTimerEvents';

export const App: React.FC = () => {
  const { colorMode, toggleColorMode, theme, setTheme, setIsTimerRunning } = useTheme();
  const { ambient, setAmbient, ambientVolume, setAmbientVolume, playAlarm, playClick } = useAudio();
  const [settings, setSettings] = useState<UserSettings>(() => storageService.getSettings());

  const nav = useAppNavigation();

  const {
    projects, subtasks, activeSubtask, activeSubtaskId, setActiveSubtaskId, activeProject,
    createProject, updateProject, deleteProject, createSubtask, updateSubtask, deleteSubtask, toggleSubtaskCompleted,
    addTimeSpent, incrementPomodoro, clearProjects,
  } = useProjects();

  const {
    events, selectedDate, setSelectedDate, calendarView, setCalendarView,
    addEvent, updateEvent, deleteEvent, toggleEventCompleted, clearEvents,
    importGoogleEvents, bulkUpdateEvents,
  } = useCalendar();

  const { activeQuote, getRandomQuote, addMantra, clearMantras, isRotating } = useQuotes();
  const { metrics, addCompletedSession, clearStats } = useStats();

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
      nav.setIsStatsOpen(false);
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

  return (
    <div className="app-shell">
      <Sidebar
        currentView={nav.currentView}
        onChangeView={nav.setCurrentView}
        streakDays={metrics.streak.currentStreak}
        projects={projects}
        selectedProjectId={activeProject?.id || 'todos'}
        onSelectProject={handleSelectProject}
        onOpenProjectDetail={nav.handleOpenProjectDetail}
        onCreateProject={() => nav.setCurrentView('projects')}
        colorMode={colorMode}
        onToggleColorMode={toggleColorMode}
        ambientSound={ambient}
        ambientVolume={ambientVolume}
        onSelectAmbient={setAmbient}
        onSetAmbientVolume={setAmbientVolume}
        userProfile={authAndSync.userProfile}
        onGoogleLogin={authAndSync.handleGoogleLogin}
        onSignOut={authAndSync.handleSignOut}
        onOpenSettings={() => nav.handleOpenSettings('timer', playClick)}
        onOpenStats={() => nav.setIsStatsOpen(true)}
        onToggleScratchpad={() => nav.setIsScratchpadOpen((prev) => !prev)}
        onEnterZenMode={() => nav.setIsZenModeOpen(true)}
        isCollapsed={nav.isSidebarCollapsed}
        onToggleCollapse={nav.handleToggleSidebarCollapse}
        isMobileOpen={nav.isMobileSidebarOpen}
        onCloseMobile={() => nav.setIsMobileSidebarOpen(false)}
      />

      <div className={`app-main-layout ${nav.isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header
          streakDays={metrics.streak.currentStreak}
          colorMode={colorMode}
          onToggleColorMode={toggleColorMode}
          userProfile={authAndSync.userProfile}
          onGoogleLogin={authAndSync.handleGoogleLogin}
          onSignOut={authAndSync.handleSignOut}
          onOpenSettings={() => nav.handleOpenSettings('timer', playClick)}
          onOpenStats={() => nav.setIsStatsOpen(true)}
          onOpenCommandPalette={() => nav.setIsCommandPaletteOpen(true)}
          currentView={nav.currentView}
          onOpenMobileSidebar={() => nav.setIsMobileSidebarOpen(true)}
          isTimerRunning={timer.isRunning}
          timerFormattedTime={timer.formattedTime}
          activeTaskTitle={activeSubtask?.title}
          activeProjectTitle={activeProject?.title}
          onOpenTimerTab={() => nav.setCurrentView('timer')}
          syncInfo={authAndSync.syncInfo}
          onManualSync={authAndSync.handleManualSync}
        />

        <main className={`app-container view-${nav.currentView}`}>
          <AppViews
            currentView={nav.currentView}
            setCurrentView={nav.setCurrentView}
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
            selectedProjectDetailId={nav.selectedProjectDetailId}
            onOpenProjectDetail={nav.handleOpenProjectDetail}
            onBackFromProjectDetail={nav.handleBackFromProjectDetail}
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
            importGoogleEvents={importGoogleEvents}
            bulkUpdateEvents={bulkUpdateEvents}
            userProfile={authAndSync.userProfile}
            weekMinutes={metrics.weekMinutes}
          />
        </main>
      </div>

      <AppModals
        isScratchpadOpen={nav.isScratchpadOpen}
        onCloseScratchpad={() => nav.setIsScratchpadOpen(false)}
        isStatsOpen={nav.isStatsOpen}
        onCloseStats={() => nav.setIsStatsOpen(false)}
        metrics={metrics}
        isSettingsOpen={nav.isSettingsOpen}
        onCloseSettings={() => nav.setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onPlayAlarm={playAlarm}
        userProfile={authAndSync.userProfile}
        settingsTab={nav.settingsTab}
        isZenModeOpen={nav.isZenModeOpen}
        onCloseZenMode={() => nav.setIsZenModeOpen(false)}
        timer={timerWithFlush}
        activeSubtask={activeSubtask}
        activeQuote={activeQuote}
        ambient={ambient}
        onToggleAmbient={() => setAmbient(ambient === 'rain' ? 'none' : 'rain')}
        isCommandPaletteOpen={nav.isCommandPaletteOpen}
        onCloseCommandPalette={() => nav.setIsCommandPaletteOpen(false)}
        onNavigate={nav.setCurrentView}
        onOpenProjectDetail={nav.handleOpenProjectDetail}
        onOpenGroup={() => nav.setCurrentView('groups')}
        onOpenZenMode={() => nav.setIsZenModeOpen(true)}
        onOpenSettings={(tab) => nav.handleOpenSettings(tab, playClick)}
        onOpenStats={() => nav.setIsStatsOpen(true)}
        onToggleTheme={toggleColorMode}
        projects={projects}
      />
    </div>
  );
};
