import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from './hooks/useTheme';
import { useAudio } from './hooks/useAudio';
import { useProjects } from './hooks/useProjects';
import { useCalendar } from './hooks/useCalendar';
import { useQuotes } from './hooks/useQuotes';
import { useStats } from './hooks/useStats';
import { useTimer } from './hooks/useTimer';
import { supabaseService } from './services/supabase';
import { storageService } from './services/storage';
import type { SupabaseProfile, UserSettings, TimerMode } from './types';

import { Header } from './components/Header';
import { QuoteBanner } from './components/QuoteBanner';
import { TimerCard } from './components/TimerCard';
import { ProjectManager } from './components/ProjectManager';
import { CalendarView } from './components/CalendarView';
import { Scratchpad } from './components/Scratchpad';
import { SettingsModal } from './components/SettingsModal';
import { StatsModal } from './components/StatsModal';
import { ZenMode } from './components/ZenMode';

export const App: React.FC = () => {
  // 1. Hooks de Sistema
  const {
    colorMode,
    toggleColorMode,
    theme,
    setTheme,
    setIsTimerRunning,
  } = useTheme();

  const {
    ambient,
    setAmbient,
    ambientVolume,
    setAmbientVolume,
    playAlarm,
    playClick,
  } = useAudio();

  const [settings, setSettings] = useState<UserSettings>(() => storageService.getSettings());
  const [userProfile, setUserProfile] = useState<SupabaseProfile | null>(null);

  // 2. Visão Ativa (Foco / Projetos / Calendário)
  const [currentView, setCurrentView] = useState<'timer' | 'projects' | 'calendar'>('timer');

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

  const {
    activeQuote,
    getRandomQuote,
    addMantra,
    isRotating,
  } = useQuotes();

  const {
    metrics,
    addCompletedSession,
  } = useStats();

  // Rastreamento de tempo em tempo real a cada segundo no Pomodoro
  const handleTickSecond = useCallback((mode: TimerMode, elapsedSeconds: number) => {
    if (mode === 'pomodoro' && activeSubtaskId) {
      addTimeSpent(activeSubtaskId, elapsedSeconds);
    }
  }, [activeSubtaskId, addTimeSpent]);

  // Callback de conclusão de ciclo Pomodoro
  const handlePomodoroComplete = useCallback((durationMinutes: number) => {
    const discipline = activeSubtask ? (activeSubtask.discipline || 'Geral') : 'Geral';
    addCompletedSession(discipline, durationMinutes);
    if (activeSubtaskId) {
      incrementPomodoro(activeSubtaskId);
    }
  }, [activeSubtask, activeSubtaskId, addCompletedSession, incrementPomodoro]);

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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        playClick();
        timer.toggle();
      } else if (e.altKey && e.code === 'KeyS') {
        e.preventDefault();
        playClick();
        timer.skip();
      } else if (e.altKey && e.code === 'KeyR') {
        e.preventDefault();
        playClick();
        timer.reset();
      } else if (e.altKey && e.code === 'KeyZ') {
        e.preventDefault();
        playClick();
        setIsZenModeOpen((prev) => !prev);
      } else if (e.code === 'Escape') {
        if (isZenModeOpen) setIsZenModeOpen(false);
        if (isSettingsOpen) setIsSettingsOpen(false);
        if (isStatsOpen) setIsStatsOpen(false);
        if (isScratchpadOpen) setIsScratchpadOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timer, playClick, isZenModeOpen, isSettingsOpen, isStatsOpen, isScratchpadOpen]);

  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
    if (newSettings.theme !== theme) {
      setTheme(newSettings.theme);
    }
  };

  const scrollToTasks = () => {
    setCurrentView('projects');
  };

  return (
    <div className="app-container">
      {/* Barra de Navegação Superior com Abas */}
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
      />

      {/* Visão 1: Timer & Foco */}
      {currentView === 'timer' && (
        <>
          {/* Banner de Citações Inspiradoras */}
          <QuoteBanner
            quote={activeQuote}
            onRefreshQuote={() => {
              playClick();
              getRandomQuote();
            }}
            onAddMantra={addMantra}
            isRotating={isRotating}
          />

          {/* Card Central do Cronômetro Pomodoro */}
          <TimerCard
            mode={timer.mode}
            onChangeMode={(m) => {
              playClick();
              timer.changeMode(m);
            }}
            formattedTime={timer.formattedTime}
            progressPercent={timer.progressPercent}
            isRunning={timer.isRunning}
            cycleCount={timer.cycleCount}
            onToggle={() => {
              playClick();
              timer.toggle();
            }}
            onSkip={() => {
              playClick();
              timer.skip();
            }}
            onReset={() => {
              playClick();
              timer.reset();
            }}
            activeTask={activeSubtask}
            activeProject={activeProject}
            onOpenTasksScroll={scrollToTasks}
          />

          {/* Gerenciador Integrado de Projetos & Tarefas */}
          <ProjectManager
            projects={projects}
            subtasks={subtasks}
            activeSubtaskId={activeSubtaskId}
            onSelectActiveSubtask={setActiveSubtaskId}
            onCreateProject={createProject}
            onUpdateProject={updateProject}
            onDeleteProject={deleteProject}
            onCreateSubtask={createSubtask}
            onUpdateSubtask={updateSubtask}
            onDeleteSubtask={deleteSubtask}
            onToggleSubtaskCompleted={toggleSubtaskCompleted}
            onOpenTimerTab={() => setCurrentView('timer')}
          />
        </>
      )}

      {/* Visão 2: Projetos & Subtasks */}
      {currentView === 'projects' && (
        <ProjectManager
          projects={projects}
          subtasks={subtasks}
          activeSubtaskId={activeSubtaskId}
          onSelectActiveSubtask={setActiveSubtaskId}
          onCreateProject={createProject}
          onUpdateProject={updateProject}
          onDeleteProject={deleteProject}
          onCreateSubtask={createSubtask}
          onUpdateSubtask={updateSubtask}
          onDeleteSubtask={deleteSubtask}
          onToggleSubtaskCompleted={toggleSubtaskCompleted}
          onOpenTimerTab={() => setCurrentView('timer')}
        />
      )}

      {/* Visão 3: Calendário & Time-Blocking */}
      {currentView === 'calendar' && (
        <CalendarView
          events={events}
          projects={projects}
          subtasks={subtasks}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          calendarView={calendarView}
          onChangeView={setCalendarView}
          onAddEvent={addEvent}
          onUpdateEvent={updateEvent}
          onDeleteEvent={deleteEvent}
          onToggleEventCompleted={toggleEventCompleted}
          onSelectSubtaskForFocus={setActiveSubtaskId}
          onOpenTimerTab={() => setCurrentView('timer')}
        />
      )}

      {/* Gaveta Lateral de Anotações (Scratchpad) */}
      <Scratchpad
        isOpen={isScratchpadOpen}
        onClose={() => setIsScratchpadOpen(false)}
      />

      {/* Modal de Estatísticas e Métricas */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        metrics={metrics}
      />

      {/* Modal de Configurações Gerais */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onPlayAlarmPreview={(s) => playAlarm(s)}
        userProfile={userProfile}
        onRefreshTasks={() => window.location.reload()}
        initialTab={settingsTab}
      />

      {/* Modo Zen (Fullscreen) */}
      <ZenMode
        isOpen={isZenModeOpen}
        onExit={() => setIsZenModeOpen(false)}
        formattedTime={timer.formattedTime}
        progressPercent={timer.progressPercent}
        isRunning={timer.isRunning}
        onToggleTimer={timer.toggle}
        activeTask={activeSubtask}
        quoteText={activeQuote.text}
        ambientSound={ambient}
        onToggleAmbient={() => setAmbient(ambient === 'rain' ? 'none' : 'rain')}
      />
    </div>
  );
};
