import React, { Suspense, lazy } from 'react';
import { UserSettings, SupabaseProfile, Subtask, AmbientSound, StudyMetrics, Quote, AppViewMode, Project, StudyGroup } from '../types';
import { storageGroupsService } from '../services/storageGroups';
import { CommandPalette } from './common/CommandPalette';

// Lazy loading dos modais pesados para que só sejam carregados sob demanda
const Scratchpad = lazy(() => import('./Scratchpad').then((m) => ({ default: m.Scratchpad })));
const StatsModal = lazy(() => import('./StatsModal').then((m) => ({ default: m.StatsModal })));
const SettingsModal = lazy(() => import('./SettingsModal').then((m) => ({ default: m.SettingsModal })));
const ZenMode = lazy(() => import('./ZenMode').then((m) => ({ default: m.ZenMode })));

interface AppModalsProps {
  isScratchpadOpen: boolean;
  onCloseScratchpad: () => void;
  isStatsOpen: boolean;
  onCloseStats: () => void;
  metrics: StudyMetrics;
  isSettingsOpen: boolean;
  onCloseSettings: () => void;
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  onPlayAlarm: (sound: any) => void;
  userProfile: SupabaseProfile | null;
  settingsTab: 'timer' | 'theme' | 'sounds' | 'cloud' | 'backup';
  isZenModeOpen: boolean;
  onCloseZenMode: () => void;
  timer: {
    formattedTime: string;
    progressPercent: number;
    isRunning: boolean;
    toggle: () => void;
    reset: () => void;
    skip: () => void;
  };
  activeSubtask: Subtask | null;
  activeQuote: Quote;
  ambient: AmbientSound;
  onToggleAmbient: () => void;
  isCommandPaletteOpen: boolean;
  onCloseCommandPalette: () => void;
  onNavigate: (view: AppViewMode) => void;
  onOpenProjectDetail: (id: string) => void;
  onOpenGroup: (id: string) => void;
  onOpenZenMode: () => void;
  onOpenSettings: (tab?: any) => void;
  onOpenStats: () => void;
  onToggleTheme: () => void;
  projects: Project[];
  subtasks?: Subtask[];
  groups?: StudyGroup[];
}

export const AppModals: React.FC<AppModalsProps> = React.memo(({
  isScratchpadOpen,
  onCloseScratchpad,
  isStatsOpen,
  onCloseStats,
  metrics,
  isSettingsOpen,
  onCloseSettings,
  settings,
  onUpdateSettings,
  onPlayAlarm,
  userProfile,
  settingsTab,
  isZenModeOpen,
  onCloseZenMode,
  timer,
  activeSubtask,
  activeQuote,
  ambient,
  onToggleAmbient,
  isCommandPaletteOpen,
  onCloseCommandPalette,
  onNavigate,
  onOpenProjectDetail,
  onOpenGroup,
  onOpenZenMode,
  onOpenSettings,
  onOpenStats,
  onToggleTheme,
  projects,
  subtasks = [],
  groups = storageGroupsService.getGroups(),
}) => {
  return (
    <>
      {/* Gaveta Lateral de Anotações (Scratchpad) */}
      {isScratchpadOpen && (
        <Suspense fallback={null}>
          <Scratchpad
            isOpen={isScratchpadOpen}
            onClose={onCloseScratchpad}
            projects={projects}
            subtasks={subtasks}
          />
        </Suspense>
      )}

      {/* Modal de Estatísticas, Conquistas & Exportação de Relatórios */}
      {isStatsOpen && (
        <Suspense fallback={null}>
          <StatsModal
            isOpen={isStatsOpen}
            onClose={onCloseStats}
            metrics={metrics}
            subtasks={subtasks}
            projects={projects}
            userName={userProfile?.full_name}
          />
        </Suspense>
      )}

      {/* Modal de Configurações Gerais */}
      {isSettingsOpen && (
        <Suspense fallback={null}>
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={onCloseSettings}
            settings={settings}
            onUpdateSettings={onUpdateSettings}
            onPlayAlarmPreview={onPlayAlarm}
            userProfile={userProfile}
            onRefreshTasks={() => window.location.reload()}
            initialTab={settingsTab}
          />
        </Suspense>
      )}

      {/* Modo Zen (Fullscreen) */}
      {isZenModeOpen && (
        <Suspense fallback={null}>
          <ZenMode
            isOpen={isZenModeOpen}
            onExit={onCloseZenMode}
            formattedTime={timer.formattedTime}
            progressPercent={timer.progressPercent}
            isRunning={timer.isRunning}
            onToggleTimer={timer.toggle}
            activeTask={activeSubtask}
            quoteText={activeQuote.text}
            ambientSound={ambient}
            onToggleAmbient={onToggleAmbient}
          />
        </Suspense>
      )}

      {/* Paleta Global de Comandos (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={onCloseCommandPalette}
        onNavigate={onNavigate}
        onOpenProjectDetail={onOpenProjectDetail}
        onOpenGroup={onOpenGroup}
        onToggleTimer={timer.toggle}
        onResetTimer={timer.reset}
        onSkipTimer={timer.skip}
        onOpenZenMode={onOpenZenMode}
        onOpenSettings={onOpenSettings}
        onOpenStats={onOpenStats}
        onToggleTheme={onToggleTheme}
        projects={projects}
        groups={groups}
        isTimerRunning={timer.isRunning}
      />
    </>
  );
});
